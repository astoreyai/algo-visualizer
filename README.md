# Open Source Algo Visualizer

A node-based drag-and-drop trading strategy builder powered by **React Flow** and **VectorBT**.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Visual Strategy Builder** - Drag-and-drop nodes to create trading strategies
- **Vectorized Backtesting** - Fast backtests powered by VectorBT
- **Technical Indicators** - SMA, EMA, RSI, MACD, Bollinger Bands
- **Logic Operations** - Greater than, less than, crossovers, AND/OR
- **Performance Metrics** - Sharpe ratio, max drawdown, win rate, equity curves
- **Parameter Optimization** - Grid search to find optimal indicator settings
- **Price Alerts** - Webhook notifications for price and indicator conditions
- **Strategy Persistence** - Save and load strategies from PostgreSQL

## Architecture

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React Flow, Zustand, TailwindCSS, Recharts |
| **Backend** | FastAPI, Python 3.11, VectorBT, SQLAlchemy |
| **Data** | YFinance (Stocks), CCXT (Crypto) |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 |
| **Infrastructure** | Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |

## How to Build a Strategy

1. **Add Nodes** - Use the sidebar to add Data Source, Indicator, Logic, and Strategy Output nodes
2. **Connect** - Wire nodes together:
   - Data Source → Indicator (feeds price data)
   - Indicator → Logic (compare values)
   - Logic → Strategy Output (entry/exit signals)
3. **Configure** - Click nodes to adjust parameters (symbol, indicator window, etc.)
4. **Run** - Click "Run Backtest" to execute and view results

### Example: SMA Crossover

```
[Data: AAPL] → [SMA 20] ─┬→ [CrossAbove] → [Entries]
                         │                      ↓
[Data: AAPL] → [SMA 50] ─┴→ [CrossBelow] → [Strategy Output]
                                               ↑
[Data: AAPL] ─────────────────────────────→ [Price]
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/backtest/run` | POST | Run a backtest |
| `/api/v1/backtest/optimize` | POST | Optimize parameters |
| `/api/v1/strategies/` | GET/POST | List/create strategies |
| `/api/v1/strategies/{id}` | GET/DELETE | Get/delete strategy |
| `/api/v1/alerts/` | GET/POST | List/create alerts |
| `/api/v1/alerts/check` | POST | Check all active alerts |

## Project Structure

```
.
├── apps/
│   ├── api/                 # FastAPI backend
│   │   ├── src/
│   │   │   ├── api/v1/      # API routes
│   │   │   ├── engine/      # Strategy compiler
│   │   │   ├── models/      # SQLAlchemy models
│   │   │   ├── schemas/     # Pydantic schemas
│   │   │   └── services/    # Data fetching, caching
│   │   └── Dockerfile
│   └── web/                 # Next.js frontend
│       ├── app/             # Pages
│       ├── components/      # React components
│       ├── store/           # Zustand state
│       └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Development

### Backend

```bash
cd apps/api
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

## Roadmap

- [ ] User authentication
- [ ] Live/paper trading integration
- [ ] More indicators (ATR, Stochastic, etc.)
- [ ] Multi-asset portfolios
- [ ] Walk-forward optimization

## License

MIT
