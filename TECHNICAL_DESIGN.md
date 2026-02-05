# Technical Design: Visual Strategy Backtesting Tool

This document defines the base classes, interfaces, and data structures for the tool.

## 1. Backend Architecture (Python/FastAPI/VectorBT)

### Core Base Classes

#### `BaseDataProvider` (Abstract)
- **Purpose**: Interface for all data sources (YFinance, Binance, CSV).
- **Methods**:
    - `fetch_historical(symbol, interval, start, end) -> pd.DataFrame`
    - `get_live_price(symbol) -> float`

#### `NodeExecutor` (Abstract)
- **Purpose**: Base class for node logic in the compiler.
- **Methods**:
    - `execute(inputs, params) -> Any`

#### `StrategyCompiler`
- **Methods**:
    - `topological_sort(graph) -> List[Node]`
    - `resolve_inputs(node_id, context) -> Dict`
    - `run(graph) -> BacktestResult`

### Data Integration
- **OHLCV Schema**: Standardized Pandas DataFrame with `Open`, `High`, `Low`, `Close`, `Volume`.
- **Signal Schema**: Boolean Series indexed by Timestamp.
- **Portfolio Schema**: `vectorbt.Portfolio` object serialization to JSON.

## 2. Frontend Architecture (React/React Flow/Zustand)

### Base Components

#### `BaseNode`
- **Props**: `title`, `children`, `handles`, `selected`.
- **Logic**: Handles selection state and basic styling.

#### `ConfigurationPanel`
- **Logic**: Subscribes to `selectedNode` in Zustand. Renders dynamic forms based on node `type`.

### State Management (`RFState`)
- `nodes: Node[]`
- `edges: Edge[]`
- `selectedNodeId: string | null`
- `backtestResult: Result | null`
- `isLoading: boolean`

## 3. Data Flow
1. **Frontend**: User connects `DataSource` -> `Indicator` -> `Logic` -> `EntryExit`.
2. **Frontend**: Hits `/api/v1/backtest/run` with the graph JSON.
3. **Backend**: `Compiler` sorts nodes.
4. **Backend**: `DataService` fetches data (checks cache first).
5. **Backend**: `VectorBT` executes logic and returns metrics/equity curve.
6. **Frontend**: `backtestResult` state is updated; Recharts renders the equity curve.
