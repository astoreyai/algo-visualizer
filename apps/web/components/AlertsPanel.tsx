'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Plus, Trash2, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Alert {
  id: number;
  name: string;
  symbol: string;
  condition_type: string;
  condition_value: number | null;
  webhook_url: string | null;
  email: string | null;
  is_active: boolean;
  last_triggered: string | null;
  trigger_count: number;
}

interface CheckResult {
  alert_id: number;
  alert_name: string;
  symbol: string;
  triggered: boolean;
  current_value: number;
  condition: string;
  message: string;
}

const CONDITION_TYPES = [
  { value: 'price_above', label: 'Price Above' },
  { value: 'price_below', label: 'Price Below' },
  { value: 'rsi_oversold', label: 'RSI Oversold (<30)' },
  { value: 'rsi_overbought', label: 'RSI Overbought (>70)' },
  { value: 'sma_cross_above', label: 'SMA Cross Above' },
  { value: 'sma_cross_below', label: 'SMA Cross Below' },
];

export const AlertsPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    symbol: 'AAPL',
    condition_type: 'price_above',
    condition_value: 0,
    webhook_url: '',
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/alerts/`);
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      console.error('Failed to fetch alerts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAlerts();
  }, [isOpen]);

  const createAlert = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/alerts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          condition_value: formData.condition_value || null,
          webhook_url: formData.webhook_url || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', symbol: 'AAPL', condition_type: 'price_above', condition_value: 0, webhook_url: '' });
        fetchAlerts();
      }
    } catch (e) {
      console.error('Failed to create alert', e);
    }
  };

  const deleteAlert = async (id: number) => {
    if (!confirm('Delete this alert?')) return;
    try {
      await fetch(`${API_URL}/api/v1/alerts/${id}`, { method: 'DELETE' });
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Failed to delete alert', e);
    }
  };

  const toggleAlert = async (alert: Alert) => {
    try {
      await fetch(`${API_URL}/api/v1/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !alert.is_active }),
      });
      setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, is_active: !a.is_active } : a)));
    } catch (e) {
      console.error('Failed to toggle alert', e);
    }
  };

  const checkAllAlerts = async () => {
    setChecking(true);
    setCheckResults([]);
    try {
      const res = await fetch(`${API_URL}/api/v1/alerts/check`, { method: 'POST' });
      const data = await res.json();
      setCheckResults(data);
      fetchAlerts(); // Refresh to get updated trigger counts
    } catch (e) {
      console.error('Failed to check alerts', e);
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-blue-600" />
            <h2 className="font-bold text-lg">Price Alerts</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkAllAlerts}
              disabled={checking}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Check Now
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={14} /> New Alert
            </button>
          </div>
        </div>

        {/* New Alert Form */}
        {showForm && (
          <div className="p-4 border-b bg-blue-50">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Alert Name"
                className="px-3 py-2 border rounded text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Symbol (e.g., AAPL)"
                className="px-3 py-2 border rounded text-sm"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              />
              <select
                className="px-3 py-2 border rounded text-sm"
                value={formData.condition_type}
                onChange={(e) => setFormData({ ...formData, condition_type: e.target.value })}
              >
                {CONDITION_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Value (e.g., 150.00)"
                className="px-3 py-2 border rounded text-sm"
                value={formData.condition_value || ''}
                onChange={(e) => setFormData({ ...formData, condition_value: parseFloat(e.target.value) || 0 })}
              />
              <input
                type="text"
                placeholder="Webhook URL (optional)"
                className="px-3 py-2 border rounded text-sm col-span-2"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                Cancel
              </button>
              <button
                onClick={createAlert}
                disabled={!formData.name || !formData.symbol}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Alert
              </button>
            </div>
          </div>
        )}

        {/* Check Results */}
        {checkResults.length > 0 && (
          <div className="p-3 border-b bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Check Results</p>
            <div className="space-y-1">
              {checkResults.map((r) => (
                <div
                  key={r.alert_id}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    r.triggered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {r.triggered ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  <span className="font-medium">{r.alert_name}</span>
                  <span className="text-xs">{r.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="p-4 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No alerts configured. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{alert.name}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{alert.symbol}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {CONDITION_TYPES.find((c) => c.value === alert.condition_type)?.label || alert.condition_type}
                      {alert.condition_value ? ` @ ${alert.condition_value}` : ''}
                    </p>
                    {alert.trigger_count > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Triggered {alert.trigger_count}x
                        {alert.last_triggered && ` • Last: ${new Date(alert.last_triggered).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert)}
                      className={`p-2 rounded-full ${
                        alert.is_active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={alert.is_active ? 'Disable' : 'Enable'}
                    >
                      {alert.is_active ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 text-center">
          <button onClick={onClose} className="px-6 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
