from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

# Alert schemas
class AlertCreate(BaseModel):
    name: str
    symbol: str
    condition_type: str  # price_above, price_below, sma_cross_above, sma_cross_below, rsi_oversold, rsi_overbought
    condition_value: Optional[float] = None
    indicator_config: Optional[Dict[str, Any]] = None
    webhook_url: Optional[str] = None
    email: Optional[str] = None
    strategy_id: Optional[int] = None

class AlertUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    condition_value: Optional[float] = None
    webhook_url: Optional[str] = None
    email: Optional[str] = None

class AlertOut(BaseModel):
    id: int
    name: str
    symbol: str
    condition_type: str
    condition_value: Optional[float]
    indicator_config: Optional[Dict[str, Any]]
    webhook_url: Optional[str]
    email: Optional[str]
    is_active: bool
    last_triggered: Optional[datetime]
    trigger_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class AlertCheckResult(BaseModel):
    alert_id: int
    alert_name: str
    symbol: str
    triggered: bool
    current_value: float
    condition: str
    message: str

# Strategy graph schemas
class Node(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Optional[Dict[str, float]] = None

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class StrategyGraph(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class ParameterRange(BaseModel):
    node_id: str
    parameter: str
    start: float
    end: float
    step: float

class OptimizationRequest(BaseModel):
    graph: StrategyGraph
    ranges: List[ParameterRange]
    metric: str = "sharpe_ratio"
