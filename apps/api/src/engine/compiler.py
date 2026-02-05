import vectorbt as vbt
import pandas as pd
import numpy as np
import itertools
import hashlib
import pickle
from typing import Dict, List, Any
from graphlib import TopologicalSorter
from src.services.data_fetcher import DataService

class StrategyCompiler:
    def __init__(self):
        self.data_service = DataService()
        self.cache = {} # In-memory cache: hash -> result

    def _get_node_hash(self, node: Dict, input_hashes: Dict[str, str]) -> str:
        """Generates a unique hash for a node based on its type, data, and inputs."""
        content = {
            "type": node['type'],
            "data": node['data'],
            "input_hashes": input_hashes
        }
        return hashlib.sha256(pickle.dumps(content)).hexdigest()

    async def run(self, graph: Dict[str, Any], overrides: Dict[str, Dict[str, Any]] = None):
        """
        graph: { "nodes": [...], "edges": [...] }
        overrides: { "node_id": { "param_name": value } }
        """
        nodes = {n['id']: n for n in graph['nodes']}
        # Apply overrides
        if overrides:
            for n_id, params in overrides.items():
                if n_id in nodes:
                    # Create a copy of the data to avoid mutating the original graph
                    nodes[n_id] = nodes[n_id].copy()
                    nodes[n_id]['data'] = nodes[n_id]['data'].copy()
                    nodes[n_id]['data'].update(params)

        edges = graph['edges']
        deps = {n_id: set() for n_id in nodes}
        node_inputs = {n_id: {} for n_id in nodes}

        for edge in edges:
            source, target = edge['source'], edge['target']
            target_handle = edge.get('targetHandle', 'default')
            deps[target].add(source)
            node_inputs[target][target_handle] = source

        ts = TopologicalSorter(deps)
        execution_order = tuple(ts.static_order())

        context = {}
        context_hashes = {}
        
        for node_id in execution_order:
            node = nodes[node_id]
            
            # 1. Resolve Input Hashes
            input_hashes = {
                handle: context_hashes.get(source_id) 
                for handle, source_id in node_inputs[node_id].items()
            }
            
            # 2. Calculate Node Hash
            current_hash = self._get_node_hash(node, input_hashes)
            context_hashes[node_id] = current_hash
            
            # 3. Check Cache
            if current_hash in self.cache:
                context[node_id] = self.cache[current_hash]
                continue

            # 4. Execute if not cached
            inputs = {
                handle: context.get(source_id)
                for handle, source_id in node_inputs[node_id].items()
            }
            
            result = await self._process_node(node, inputs)
            
            # 5. Store in Cache
            self.cache[current_hash] = result
            context[node_id] = result

        return self._find_result(context)

    async def _process_node(self, node: Dict, inputs: Dict[str, Any]):
        node_type = node['type']
        data = node['data']

        if node_type == 'dataSource':
            symbol = data.get('symbol', 'BTC-USD')
            period = data.get('period', '1y')
            interval = data.get('interval', '1d')
            # Fetch data
            df = await self.data_service.get_data(symbol, period, interval)
            return df

        elif node_type == 'indicator':
            series = self._extract_series(inputs.get('input'))
            if series is None: raise ValueError(f"Indicator {node['id']} missing input")
            
            ind_type = data.get('indicatorType', 'SMA')
            window = int(data.get('window', 14))
            
            if ind_type == 'SMA':
                return vbt.MA.run(series, window=window).ma
            elif ind_type == 'EMA':
                return vbt.MA.run(series, window=window, ewm=True).ma
            elif ind_type == 'RSI':
                return vbt.RSI.run(series, window=window).rsi
            elif ind_type == 'MACD':
                macd = vbt.MACD.run(series, fast_window=12, slow_window=26, signal_window=9)
                return macd.macd
            elif ind_type == 'BBANDS':
                bb = vbt.BBANDS.run(series, window=window)
                return bb.middle
            
        elif node_type == 'logic':
            a = self._extract_series(inputs.get('a'))
            b = self._extract_series(inputs.get('b'))
            op = data.get('operator', '>')
            
            if op == '>': return a > b
            elif op == '<': return a < b
            elif op == 'crossAbove': return a.vbt.crossed_above(b)
            elif op == 'crossBelow': return a.vbt.crossed_below(b)
            elif op == 'AND': return a & b
            elif op == 'OR': return a | b

        elif node_type == 'entryExit':
            price = self._extract_series(inputs.get('price'))
            entries = inputs.get('entries')
            exits = inputs.get('exits')
            
            if price is None: raise ValueError("EntryExit node needs price data")
            
            fees = float(data.get('fees', 0.001))
            slippage = float(data.get('slippage', 0.001))
            init_cash = float(data.get('initialCash', 10000))
            
            pf = vbt.Portfolio.from_signals(
                price, 
                entries=entries if entries is not None else False, 
                exits=exits if exits is not None else False,
                fees=fees,
                slippage=slippage,
                init_cash=init_cash,
                freq='1d'
            )
            return pf

        return None

    def _extract_series(self, data):
        """Helper to get a single series from a DataFrame or Series"""
        if isinstance(data, pd.DataFrame):
            if 'Close' in data.columns: return data['Close']
            return data.iloc[:, 0]
        return data

    def _find_result(self, context: Dict[str, Any]):
        # Look for the last portfolio object created in the provided context
        for key, val in reversed(context.items()):
            if isinstance(val, vbt.portfolio.base.Portfolio):
                # Get trades stats for win rate
                trades = val.trades
                win_rate = 0.0
                if len(trades.records_arr) > 0:
                    win_rate = float((trades.pnl.values > 0).sum() / len(trades.records_arr))

                # Helper to safely convert float values (handle NaN/Inf)
                def safe_float(v, default=0.0):
                    f = float(v)
                    return default if (np.isnan(f) or np.isinf(f)) else f

                return {
                    "total_return": safe_float(val.total_return()),
                    "benchmark_return": safe_float((val.close.iloc[-1] / val.close.iloc[0]) - 1),
                    "sharpe_ratio": safe_float(val.sharpe_ratio()),
                    "max_drawdown": safe_float(val.max_drawdown()),
                    "win_rate": safe_float(win_rate),
                    "equity_curve": [safe_float(x) for x in val.value().to_list()],
                    "dates": val.value().index.strftime('%Y-%m-%d').to_list()
                }
        return {"error": "No Strategy Result Found"}

    async def optimize(self, graph: Dict[str, Any], ranges: List[Dict[str, Any]], metric: str = "sharpe_ratio"):
        param_names = []
        param_values = []
        for r in ranges:
            node_id = r['node_id']
            param = r['parameter']
            vals = np.arange(r['start'], r['end'] + r['step'], r['step']).tolist()
            param_names.append((node_id, param))
            param_values.append(vals)

        combinations = list(itertools.product(*param_values))
        results = []

        for combo in combinations:
            overrides = {}
            combo_desc = {}
            for i, val in enumerate(combo):
                n_id, p_name = param_names[i]
                if n_id not in overrides: overrides[n_id] = {}
                overrides[n_id][p_name] = val
                combo_desc[f"{n_id}_{p_name}"] = val
            
            try:
                res = await self.run(graph, overrides=overrides)
                if "error" not in res:
                    res["params"] = combo_desc
                    results.append(res)
            except Exception as e:
                print(f"Optimization step failed: {e}")

        results.sort(key=lambda x: x.get(metric, -999), reverse=True)
        return results[:20]