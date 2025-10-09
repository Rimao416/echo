// components/SettingsPanel.tsx
import React from 'react';

interface SettingsPanelProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  apiBaseUrl: string;
  pagesPerBatch: number;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  speed,
  onSpeedChange,
  apiBaseUrl,
  pagesPerBatch,
}) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
    <h3 className="font-semibold mb-4">Paramètres</h3>
    
    <div className="space-y-4">
      <div>
        <label className="text-sm text-slate-400 mb-2 block">
          Vitesse: {speed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-violet-600"
        />
      </div>

      <div className="pt-4 border-t border-slate-800/50">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Backend:</span>
            <span className="text-green-400">Express + MongoDB</span>
          </div>
          <div className="flex justify-between">
            <span>API:</span>
            <span className="text-slate-400">{apiBaseUrl}</span>
          </div>
          <div className="flex justify-between">
            <span>Pages par lot:</span>
            <span className="text-green-400">{pagesPerBatch}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);