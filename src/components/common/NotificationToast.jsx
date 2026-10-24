import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-kirana-600 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
  };

  const borderColors = {
    success: 'border-kirana-200 bg-kirana-50/95 text-kirana-950',
    warning: 'border-amber-200 bg-amber-50/95 text-amber-950',
    error: 'border-rose-200 bg-rose-50/95 text-rose-950',
    info: 'border-blue-200 bg-blue-50/95 text-blue-950'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-elevated backdrop-blur-md ${borderColors[notification.type] || borderColors.info}`}>
        <div className="flex items-center gap-3">
          {icons[notification.type] || icons.info}
          <p className="text-xs sm:text-sm font-semibold">{notification.message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4 opacity-60" />
          </button>
        )}
      </div>
    </div>
  );
}
