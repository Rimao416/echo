import React from 'react';
import { AlertCircle, Info, X } from 'lucide-react';
import { ErrorInfo } from '../types';

interface ErrorAlertProps {
  error: ErrorInfo | null;
  onClose: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose }) => {
  if (!error) return null;

  const getIcon = (type: string) => {
    if (type === 'info') return <Info className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500/10 border-red-500/50 text-red-400';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
      case 'info': return 'bg-blue-500/10 border-blue-500/50 text-blue-400';
      default: return 'bg-red-500/10 border-red-500/50 text-red-400';
    }
  };

  return (
    <div className={`${getColor(error.type)} border rounded-xl p-4 flex items-start justify-between`}>
      <div className="flex gap-3">
        {getIcon(error.type)}
        <div className="flex-1">
          <div className="font-medium mb-1">{error.message}</div>
          {error.details && (
            <div className="text-xs opacity-75 mt-1">{error.details}</div>
          )}
          {error.remainingCredits !== undefined && (
            <div className="mt-2 text-xs">
              <div>Crédits restants: {error.remainingCredits.toLocaleString()}</div>
              <div>Crédits requis: {error.requiredCredits?.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
