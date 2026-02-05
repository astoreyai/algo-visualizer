'use client';

import React, { useEffect, useState } from 'react';
import { FolderOpen, FileText, Trash2, Loader2 } from 'lucide-react';
import useStore from '@/store/useStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const StrategyLibrary = () => {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const loadGraph = useStore((state) => state.loadGraph);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/strategies/`);
      const data = await res.json();
      setStrategies(data);
    } catch (e) {
      console.error("Failed to fetch strategies", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleLoad = (strategy: any) => {
    const { nodes, edges } = strategy.graph_data;
    loadGraph(nodes, edges);
  };

  const handleDelete = async (e: React.MouseEvent, strategyId: number) => {
    e.stopPropagation();
    if (!confirm('Delete this strategy?')) return;

    setDeleting(strategyId);
    try {
      await fetch(`${API_URL}/api/v1/strategies/${strategyId}`, {
        method: 'DELETE',
      });
      setStrategies(strategies.filter(s => s.id !== strategyId));
    } catch (e) {
      console.error("Failed to delete strategy", e);
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <FolderOpen size={12} /> My Strategies
        </p>
        <button
          onClick={fetchStrategies}
          className="text-[10px] text-blue-500 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-gray-300" size={20} />
        </div>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {strategies.length === 0 ? (
            <p className="text-[10px] text-gray-400 italic py-2">No saved strategies found.</p>
          ) : (
            strategies.map((s) => (
              <div
                key={s.id}
                onClick={() => handleLoad(s)}
                className="group flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-100 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText size={14} className="text-gray-400 group-hover:text-blue-500" />
                  <span className="text-xs font-medium text-gray-600 truncate">{s.name}</span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  disabled={deleting === s.id}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-all"
                  title="Delete strategy"
                >
                  {deleting === s.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
