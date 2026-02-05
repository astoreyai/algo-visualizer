# Development Plan: Visual Strategy Backtesting Tool

This document outlines the 10-phase development plan for the Visual Strategy Backtesting Tool.

## Current Status (as of Feb 4, 2026)
- **Phase 1:** Core Backend and Frontend setup is complete.
- **Phase 2:** Basic Node types are implemented.
- **Phase 3:** Initial Strategy Compiler with `vectorbt` integration is functional.

---

## Phase 1: Project Foundation & Core Architecture (COMPLETED)
- [x] **Subphase 1.1: Backend Setup**
    - [x] Finalize FastAPI application structure.
    - [x] Define Pydantic models for API schemas (`Node`, `Edge`, `StrategyGraph`).
    - [x] Implement `DataService` for fetching historical market data (`yfinance`).
- [x] **Subphase 1.2: Frontend Setup**
    - [x] Configure Next.js project.
    - [x] Integrate Tailwind CSS and Shadcn UI.
    - [x] Set up Zustand state management (`useStore.ts`).

## Phase 2: Visual Strategy Editor - Core Components (COMPLETED)
- [x] **Subphase 2.1: Node Canvas Implementation**
    - [x] Integrate React Flow.
    - [x] Implement core canvas functionalities (add/move/connect).
    - [x] Sync canvas state with Zustand.
- [x] **Subphase 2.2: Core Node Types & Configuration**
    - [x] Develop components: `DataSourceNode`, `IndicatorNode`, `LogicNode`, `EntryExitNode`.
    - [x] Implement side panel for node parameter configuration.
    - [x] Add visual validation for connections.

## Phase 3: Backend Strategy Compilation & Execution (COMPLETED)
- [x] **Subphase 3.1: Graph Parsing & Dependency Management**
    - [x] Implement topological sort in `StrategyCompiler`.
    - [x] Implement input resolution logic.
- [x] **Subphase 3.2: Node Execution Logic (V1)**
    - [x] Implement `dataSource` (Pandas).
    - [x] Implement `indicator` (vectorbt: SMA, RSI, EMA, MACD, BBands).
    - [x] Implement `logic` (vectorbt: >, <, crosses, AND, OR).
    - [x] Implement `entryExit` (vectorbt Portfolio with fees/slippage).

## Phase 4: Data Handling & Infrastructure (COMPLETED)
- [x] **Subphase 4.1: Data Source Expansion & Caching**
    - [x] Implement `BaseDataProvider` abstract class in Python.
    - [x] Implement Redis-based caching layer for OHLCV data.
- [x] **Subphase 4.2: Database Integration**
    - [x] Set up PostgreSQL with SQLAlchemy.
    - [x] Schema: `Strategy`, `BacktestResult`.

## Phase 5: Technical Indicator Library Expansion (COMPLETED)
- [x] **Subphase 5.1: Add More Indicators**
    - [x] Add MACD, Bollinger Bands, EMA.
- [x] **Subphase 5.2: Dynamic Configuration UI**
    - [x] Build dynamic forms for indicator parameters in ConfigPanel.

## Phase 7: Analytics & Visualization (COMPLETED)
- [x] **Subphase 7.1: Performance Metrics Engine**
    - [x] Calculate: CAGR, Sharpe, Max Drawdown, Win Rate.
- [x] **Subphase 7.2: Interactive Charting (Recharts)**
    - [x] `EquityCurve`: Interactive line chart with zoom.

## Phase 9: User Management & Strategy Persistence (IN PROGRESS)
- [ ] **Subphase 9.1: Auth Integration**
- [x] **Subphase 9.2: Strategy Management**
    - [x] Save/Load strategies from Database.

## Phase 10: Deployment & Live Trading (IN PROGRESS)
- [x] **Subphase 10.1: Dockerization & CI/CD**
    - [x] Dockerfiles for API and Web.
    - [x] Docker-compose for full stack.
