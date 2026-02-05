'use client';

import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import useStore from '@/store/useStore';
import { DataSourceNode } from '@/components/nodes/DataSourceNode';
import { IndicatorNode } from '@/components/nodes/IndicatorNode';
import { LogicNode } from '@/components/nodes/LogicNode';
import { EntryExitNode } from '@/components/nodes/EntryExitNode';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ResultChart } from '@/components/ResultChart';
import { StrategyLibrary } from '@/components/StrategyLibrary';
import { Play, Plus, Zap, FilePlus, Bell } from 'lucide-react';
import { AlertsPanel } from '@/components/AlertsPanel';

const nodeTypes = {
  dataSource: DataSourceNode,
  indicator: IndicatorNode,
  logic: LogicNode,
  entryExit: EntryExitNode,
};

function Flow() {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    setNodes,
    optimizationRanges,
    resetGraph
  } = useStore();

  const [result, setResult] = useState<any>(null);
  const [optResults, setOptResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [strategyName, setStrategyName] = useState('My New Strategy');
  const [showAlerts, setShowAlerts] = useState(false);

  const onAddNode = (type: string) => {
    const id = Math.random().toString();
    const newNode = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: type }
    };
    setNodes([...nodes, newNode]);
  };

  const runBacktest = async () => {
    setLoading(true);
    setOptResults([]);
    try {
      const payload = { nodes, edges };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Backtest failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload = { 
        graph: { nodes, edges },
        ranges: optimizationRanges,
        metric: 'sharpe_ratio'
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/backtest/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setOptResults(data);
    } catch (e) {
      console.error(e);
      alert("Optimization failed.");
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async () => {
    try {
      const payload = { 
        name: strategyName, 
        graph_data: { nodes, edges } 
      };
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/strategies/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert("Strategy saved!");
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex">
      {/* Sidebar / Results */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col p-4 shadow-xl z-10 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md"></div>
            Algo Builder
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAlerts(true)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-orange-500 transition-colors"
              title="Alerts"
            >
              <Bell size={18} />
            </button>
            <button
              onClick={resetGraph}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
              title="New Strategy"
            >
              <FilePlus size={18} />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <input 
            type="text" 
            className="w-full border-none bg-gray-50 rounded px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
          />
        </div>

        <div className="mb-6 space-y-2">
           <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tools</p>
           <button onClick={() => onAddNode('dataSource')} className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"><Plus size={16}/> Data Source</button>
           <button onClick={() => onAddNode('indicator')} className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"><Plus size={16}/> Indicator</button>
           <button onClick={() => onAddNode('logic')} className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"><Plus size={16}/> Logic</button>
           <button onClick={() => onAddNode('entryExit')} className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded text-blue-700"><Plus size={16}/> Strategy Output</button>
        </div>

        <StrategyLibrary />

        <div className="flex-1 overflow-auto mt-6">
          {result && (
            <div className="space-y-4">
               <h2 className="font-bold border-b pb-2">Results</h2>
               <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Total Return</div>
                  <div className={result.total_return > 0 ? "text-green-600 font-bold" : "text-red-600"}>
                    {(result.total_return * 100).toFixed(2)}%
                  </div>
                  <div className="text-gray-500">Benchmark (B&H)</div>
                  <div className="text-gray-700 font-medium">
                    {(result.benchmark_return * 100).toFixed(2)}%
                  </div>
                  <div className="text-gray-500">Sharpe</div>
                  <div>{result.sharpe_ratio?.toFixed(2)}</div>
                  <div className="text-gray-500">Win Rate</div>
                  <div>{(result.win_rate * 100).toFixed(2)}%</div>
                  <div className="text-gray-500">Drawdown</div>
                  <div className="text-red-500">{(result.max_drawdown * 100).toFixed(2)}%</div>
               </div>
               
               <div className="mt-4 h-48 bg-white border border-gray-100 rounded-lg p-2 shadow-inner">
                  <ResultChart data={result.equity_curve} dates={result.dates} />
               </div>
            </div>
          )}

          {optResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold border-b pb-2">Optimization Results</h2>
              <div className="space-y-2">
                {optResults.map((res, i) => (
                  <div key={i} className="p-2 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => setResult(res)}>
                    <div className="flex justify-between text-xs font-bold">
                       <span>Run #{i+1}</span>
                       <span className="text-green-600">{(res.total_return * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                       {Object.entries(res.params).map(([k, v]: any) => `${k}: ${v}`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button 
            onClick={saveStrategy}
            className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-bold text-sm"
          >
            Save
          </button>
          
          {optimizationRanges.length > 0 ? (
            <button 
              onClick={runOptimization}
              disabled={loading}
              className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-100"
            >
              {loading ? "Optimizing..." : <><Zap size={16} fill="currentColor" /> Optimize</>}
            </button>
          ) : (
            <button 
              onClick={runBacktest}
              disabled={loading}
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm"
            >
              {loading ? "Running..." : <><Play size={16} fill="currentColor" /> Run Backtest</>}
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <ConfigPanel />
      <AlertsPanel isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}