import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#16803D] flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-[#FF9F43] flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
  };

  const borderColors = {
    success: 'border-[#16803D]/20 bg-[#DDF7E5]/95 text-[#16532B]',
    warning: 'border-[#FF9F43]/30 bg-[#FFF7ED]/95 text-[#9A3412]',
    error: 'border-rose-200 bg-rose-50/95 text-rose-950',
    info: 'border-blue-200 bg-blue-50/95 text-blue-950'
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 max-w-sm w-full pointer-events-none">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border shadow-elevated backdrop-blur-md ${borderColors[notification.type] || borderColors.info}`}
      >
        <div className="flex items-center gap-3">
          {icons[notification.type] || icons.info}
          <p className="text-xs sm:text-sm font-bold">{notification.message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4 opacity-60" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
