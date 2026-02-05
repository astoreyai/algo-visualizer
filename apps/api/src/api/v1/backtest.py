from fastapi import APIRouter, HTTPException
from src.schemas.strategy import StrategyGraph, OptimizationRequest
from src.engine.compiler import StrategyCompiler

router = APIRouter()

@router.post("/run")
async def run_backtest(graph: StrategyGraph):
    compiler = StrategyCompiler()
    try:
        # Convert Pydantic model to dict for the compiler
        result = await compiler.run(graph.model_dump())
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize")
async def optimize_strategy(req: OptimizationRequest):
    compiler = StrategyCompiler()
    try:
        results = await compiler.optimize(
            req.graph.model_dump(), 
            [r.model_dump() for r in req.ranges],
            req.metric
        )
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
