'use client';

import React from 'react';
import useStore from '@/store/useStore';
import { X } from 'lucide-react';

export const ConfigPanel = () => {
  const { 
    nodes, 
    selectedNodeId, 
    updateNodeData, 
    setSelectedNodeId,
    optimizationRanges,
    setOptimizationRange,
    removeOptimizationRange
  } = useStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) return null;

  const { type, data } = selectedNode;

  const OptimizationSettings = ({ parameter, label }: { parameter: string, label: string }) => {
    const range = optimizationRanges.find(r => r.node_id === selectedNode.id && r.parameter === parameter);
    const isOptimizing = !!range;

    return (
      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
        <div className="flex items-center justify-between mb-2">
           <label className="text-[10px] font-bold text-blue-700 uppercase">Optimize {label}</label>
           <input 
            type="checkbox" 
            checked={isOptimizing}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            onChange={(e) => {
              if (e.target.checked) {
                setOptimizationRange({ node_id: selectedNode.id, parameter, start: data[parameter] || 10, end: (data[parameter] || 10) * 2, step: 10 });
              } else {
                removeOptimizationRange(selectedNode.id, parameter);
              }
            }}
           />
        </div>
        {isOptimizing && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] text-gray-500">Start</label>
              <input 
                type="number" 
                className="w-full text-xs p-1 border rounded" 
                value={range.start} 
                onChange={(e) => setOptimizationRange({...range, start: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-500">End</label>
              <input 
                type="number" 
                className="w-full text-xs p-1 border rounded" 
                value={range.end}
                onChange={(e) => setOptimizationRange({...range, end: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-500">Step</label>
              <input 
                type="number" 
                className="w-full text-xs p-1 border rounded" 
                value={range.step}
                onChange={(e) => setOptimizationRange({...range, step: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFields = () => {
    switch (type) {
      case 'dataSource':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Symbol</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.symbol || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { symbol: e.target.value })}
                placeholder="e.g., BTC-USD"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Interval</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.interval || '1d'}
                onChange={(e) => updateNodeData(selectedNode.id, { interval: e.target.value })}
              >
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="1h">1 hour</option>
                <option value="1d">1 day</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Period</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.period || '1y'}
                onChange={(e) => updateNodeData(selectedNode.id, { period: e.target.value })}
              >
                <option value="1mo">1 month</option>
                <option value="6mo">6 months</option>
                <option value="1y">1 year</option>
                <option value="2y">2 years</option>
                <option value="5y">5 years</option>
                <option value="max">Max</option>
              </select>
            </div>
          </div>
        );
      case 'indicator':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Indicator Type</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.indicatorType || 'SMA'}
                onChange={(e) => updateNodeData(selectedNode.id, { indicatorType: e.target.value })}
              >
                <option value="SMA">Simple Moving Average (SMA)</option>
                <option value="EMA">Exponential Moving Average (EMA)</option>
                <option value="RSI">Relative Strength Index (RSI)</option>
                <option value="MACD">MACD</option>
                <option value="BBANDS">Bollinger Bands</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Window Period</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.window || 14}
                onChange={(e) => updateNodeData(selectedNode.id, { window: parseInt(e.target.value) })}
              />
              <OptimizationSettings parameter="window" label="Window" />
            </div>
          </div>
        );
      case 'logic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Operator</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.operator || '>'}
                onChange={(e) => updateNodeData(selectedNode.id, { operator: e.target.value })}
              >
                <option value=">">Greater Than (&gt;)</option>
                <option value="<">Less Than (&lt;)</option>
                <option value="crossAbove">Crosses Above</option>
                <option value="crossBelow">Crosses Below</option>
                <option value="AND">Logical AND</option>
                <option value="OR">Logical OR</option>
              </select>
            </div>
          </div>
        );
      case 'entryExit':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Initial Cash</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.initialCash || 10000}
                onChange={(e) => updateNodeData(selectedNode.id, { initialCash: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Fees (e.g., 0.001 = 0.1%)</label>
              <input
                type="number"
                step="0.0001"
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.fees || 0.001}
                onChange={(e) => updateNodeData(selectedNode.id, { fees: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Slippage (e.g., 0.001 = 0.1%)</label>
              <input
                type="number"
                step="0.0001"
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.slippage || 0.001}
                onChange={(e) => updateNodeData(selectedNode.id, { slippage: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        );
      default:
        return <p className="text-sm text-gray-400">No configuration available for this node.</p>;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div>
          <h2 className="font-bold text-gray-800">Node Settings</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{selectedNode.id} | {type}</p>
        </div>
        <button 
          onClick={() => setSelectedNodeId(null)}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {renderFields()}
      </div>
    </div>
  );
};