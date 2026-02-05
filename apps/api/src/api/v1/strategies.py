from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db.session import get_db
from src.models.strategy import Strategy
from src.schemas.strategy import StrategyGraph # Using the same graph schema for saving
from pydantic import BaseModel
from typing import List

router = APIRouter()

class StrategyCreate(BaseModel):
    name: str
    graph_data: StrategyGraph

class StrategyOut(BaseModel):
    id: int
    name: str
    graph_data: dict

    class Config:
        from_attributes = True

@router.post("/", response_model=StrategyOut)
async def create_strategy(strategy: StrategyCreate, db: AsyncSession = Depends(get_db)):
    db_strategy = Strategy(
        name=strategy.name,
        graph_data=strategy.graph_data.model_dump()
    )
    db.add(db_strategy)
    await db.commit()
    await db.refresh(db_strategy)
    return db_strategy

@router.get("/", response_model=List[StrategyOut])
async def list_strategies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Strategy))
    return result.scalars().all()

@router.get("/{strategy_id}", response_model=StrategyOut)
async def get_strategy(strategy_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Strategy).where(Strategy.id == strategy_id))
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy

@router.delete("/{strategy_id}")
async def delete_strategy(strategy_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Strategy).where(Strategy.id == strategy_id))
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    await db.delete(strategy)
    await db.commit()
    return {"status": "deleted", "id": strategy_id}