# Open Source Algo Visualizer

A node-based drag-and-drop trading strategy builder powered by **React Flow** and **VectorBT**.

## Architecture

*   **Frontend:** Next.js, React Flow, Zustand, TailwindCSS.
*   **Backend:** FastAPI, Python 3.10.
*   **Engine:** VectorBT (Vectorized Backtesting).
*   **Data:** YFinance (Stocks), CCXT (Crypto).
*   **Infrastructure:** Docker Compose.

## Prerequisites

*   Docker & Docker Compose

## Quick Start

1.  Start the stack:
    ```bash
    docker-compose up --build
    ```

2.  Open the frontend:
    [http://localhost:3000](http://localhost:3000)

3.  Open the API docs:
    [http://localhost:8000/docs](http://localhost:8000/docs)

## How to Build a Strategy

1.  **Add Nodes:** Use the sidebar to add a `Data Source`, `Indicator`, `Logic`, and `Strategy Output`.
2.  **Connect:**
    *   Connect `Data Source` output to `Indicator` input.
    *   Connect `Indicator` and `Data Source` (Price) to `Logic` nodes.
    *   Connect `Logic` outputs (Boolean signals) to the `Strategy Output` (Entries/Exits).
3.  **Run:** Click "Run Backtest" to compile the graph and see the results (Sharpe Ratio, Return, Drawdown).

## Development

*   **Frontend:** `apps/web`
*   **Backend:** `apps/api`

## License
MIT
