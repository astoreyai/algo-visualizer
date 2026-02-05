from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import httpx

from src.db.session import get_db
from src.models.strategy import Alert
from src.schemas.strategy import AlertCreate, AlertUpdate, AlertOut, AlertCheckResult
from src.services.data_fetcher import DataService
import vectorbt as vbt
import numpy as np

def safe_float(v, default=0.0):
    """Convert to float, handling NaN/Inf."""
    f = float(v)
    return default if (np.isnan(f) or np.isinf(f)) else f

router = APIRouter()

@router.post("/", response_model=AlertOut)
async def create_alert(alert: AlertCreate, db: AsyncSession = Depends(get_db)):
    db_alert = Alert(
        name=alert.name,
        symbol=alert.symbol,
        condition_type=alert.condition_type,
        condition_value=alert.condition_value,
        indicator_config=alert.indicator_config,
        webhook_url=alert.webhook_url,
        email=alert.email,
        strategy_id=alert.strategy_id,
    )
    db.add(db_alert)
    await db.commit()
    await db.refresh(db_alert)
    return db_alert

@router.get("/", response_model=List[AlertOut])
async def list_alerts(active_only: bool = False, db: AsyncSession = Depends(get_db)):
    query = select(Alert)
    if active_only:
        query = query.where(Alert.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{alert_id}", response_model=AlertOut)
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(alert_id: int, update: AlertUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(alert, key, value)

    await db.commit()
    await db.refresh(alert)
    return alert

@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)
    await db.commit()
    return {"status": "deleted", "id": alert_id}

@router.post("/check", response_model=List[AlertCheckResult])
async def check_alerts(db: AsyncSession = Depends(get_db)):
    """Check all active alerts and return which ones are triggered."""
    result = await db.execute(select(Alert).where(Alert.is_active == True))
    alerts = result.scalars().all()

    data_service = DataService()
    results = []

    for alert in alerts:
        try:
            check_result = await _check_single_alert(alert, data_service)
            results.append(check_result)

            if check_result.triggered:
                # Update alert state
                alert.last_triggered = datetime.utcnow()
                alert.trigger_count += 1
                await db.commit()

                # Send notifications
                await _send_notifications(alert, check_result)

        except Exception as e:
            results.append(AlertCheckResult(
                alert_id=alert.id,
                alert_name=alert.name,
                symbol=alert.symbol,
                triggered=False,
                current_value=0.0,
                condition=alert.condition_type,
                message=f"Error checking alert: {str(e)}"
            ))

    return results

@router.post("/check/{alert_id}", response_model=AlertCheckResult)
async def check_single_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Check a specific alert."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    data_service = DataService()
    check_result = await _check_single_alert(alert, data_service)

    if check_result.triggered:
        alert.last_triggered = datetime.utcnow()
        alert.trigger_count += 1
        await db.commit()
        await _send_notifications(alert, check_result)

    return check_result


async def _check_single_alert(alert: Alert, data_service: DataService) -> AlertCheckResult:
    """Evaluate a single alert condition."""
    # Fetch recent data (enough for indicators)
    df = await data_service.get_data(alert.symbol, period="3mo", interval="1d")
    current_price = float(df['Close'].iloc[-1])

    triggered = False
    current_value = current_price
    message = ""

    if alert.condition_type == "price_above":
        triggered = current_price > alert.condition_value
        message = f"Price ${current_price:.2f} {'>' if triggered else '<='} ${alert.condition_value:.2f}"

    elif alert.condition_type == "price_below":
        triggered = current_price < alert.condition_value
        message = f"Price ${current_price:.2f} {'<' if triggered else '>='} ${alert.condition_value:.2f}"

    elif alert.condition_type == "sma_cross_above":
        config = alert.indicator_config or {}
        fast_window = config.get("fast_window", 20)
        slow_window = config.get("slow_window", 50)

        close = df['Close']
        fast_sma = vbt.MA.run(close, window=fast_window).ma
        slow_sma = vbt.MA.run(close, window=slow_window).ma

        # Check if fast crossed above slow in the last bar
        crossed = close.vbt.crossed_above(slow_sma)
        triggered = bool(crossed.iloc[-1]) if len(crossed) > 0 else False
        current_value = float(fast_sma.iloc[-1])
        message = f"SMA({fast_window})={current_value:.2f} {'crossed above' if triggered else 'below'} SMA({slow_window})={float(slow_sma.iloc[-1]):.2f}"

    elif alert.condition_type == "sma_cross_below":
        config = alert.indicator_config or {}
        fast_window = config.get("fast_window", 20)
        slow_window = config.get("slow_window", 50)

        close = df['Close']
        fast_sma = vbt.MA.run(close, window=fast_window).ma
        slow_sma = vbt.MA.run(close, window=slow_window).ma

        crossed = close.vbt.crossed_below(slow_sma)
        triggered = bool(crossed.iloc[-1]) if len(crossed) > 0 else False
        current_value = float(fast_sma.iloc[-1])
        message = f"SMA({fast_window})={current_value:.2f} {'crossed below' if triggered else 'above'} SMA({slow_window})={float(slow_sma.iloc[-1]):.2f}"

    elif alert.condition_type == "rsi_oversold":
        config = alert.indicator_config or {}
        window = config.get("window", 14)
        threshold = alert.condition_value or 30

        rsi = vbt.RSI.run(df['Close'], window=window).rsi
        current_rsi = float(rsi.iloc[-1])
        triggered = current_rsi < threshold
        current_value = current_rsi
        message = f"RSI({window})={current_rsi:.1f} {'<' if triggered else '>='} {threshold} (oversold)"

    elif alert.condition_type == "rsi_overbought":
        config = alert.indicator_config or {}
        window = config.get("window", 14)
        threshold = alert.condition_value or 70

        rsi = vbt.RSI.run(df['Close'], window=window).rsi
        current_rsi = float(rsi.iloc[-1])
        triggered = current_rsi > threshold
        current_value = current_rsi
        message = f"RSI({window})={current_rsi:.1f} {'>' if triggered else '<='} {threshold} (overbought)"

    else:
        message = f"Unknown condition type: {alert.condition_type}"

    return AlertCheckResult(
        alert_id=alert.id,
        alert_name=alert.name,
        symbol=alert.symbol,
        triggered=triggered,
        current_value=safe_float(current_value),
        condition=alert.condition_type,
        message=message
    )


async def _send_notifications(alert: Alert, result: AlertCheckResult):
    """Send webhook and/or email notifications for triggered alert."""
    if alert.webhook_url:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    alert.webhook_url,
                    json={
                        "alert_id": alert.id,
                        "alert_name": alert.name,
                        "symbol": alert.symbol,
                        "condition": alert.condition_type,
                        "triggered": result.triggered,
                        "current_value": result.current_value,
                        "message": result.message,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    timeout=10.0
                )
        except Exception as e:
            print(f"Webhook notification failed for alert {alert.id}: {e}")

    # Email notification would go here (requires SMTP config)
    # For now, just log it
    if alert.email:
        print(f"[EMAIL] Alert '{alert.name}' triggered for {alert.symbol}: {result.message}")
