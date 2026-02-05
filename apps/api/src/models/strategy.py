from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.db.session import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)

    # Alert configuration
    symbol = Column(String, nullable=False)
    condition_type = Column(String, nullable=False)  # price_above, price_below, indicator_cross, etc.
    condition_value = Column(Float, nullable=True)
    indicator_config = Column(JSON, nullable=True)  # For indicator-based alerts

    # Notification settings
    webhook_url = Column(String, nullable=True)
    email = Column(String, nullable=True)

    # State
    is_active = Column(Boolean, default=True)
    last_triggered = Column(DateTime(timezone=True), nullable=True)
    trigger_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    
    # Store the React Flow graph as JSON
    graph_data = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # User relationship would go here
    # user_id = Column(Integer, ForeignKey("users.id"))
    # user = relationship("User", back_populates="strategies")

class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"))
    
    # Summary Metrics
    total_return = Column(JSON) # Store dict of metrics
    sharpe_ratio = Column(Integer)
    win_rate = Column(Integer)
    
    # Time Series Data (Equity Curve)
    equity_curve = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())