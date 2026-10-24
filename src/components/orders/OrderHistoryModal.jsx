import React from 'react';
import { Package, X, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import { useOrders, ORDER_STATUSES } from '../../context/OrderContext';
import { formatCurrency } from '../../lib/upi';

export default function OrderHistoryModal({ isOpen, onClose, onSelectOrder }) {
  const { orders } = useOrders();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-elevated border border-slate-100 p-5 sm:p-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-kirana-50 text-kirana-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Your Orders</h3>
              <p className="text-xs text-slate-500">Track and view history of all orders</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders list */}
        <div className="space-y-3 my-4">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No orders placed yet.
            </div>
          ) : (
            orders.map(order => (
              <div
                key={order.id}
                onClick={() => {
                  onSelectOrder(order.id);
                  onClose();
                }}
                className="p-4 rounded-2xl border border-slate-200/80 hover:border-kirana-300 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-slate-900">#{order.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      order.orderStatus === ORDER_STATUSES.DELIVERED
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.orderStatus === ORDER_STATUSES.CANCELLED
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} • {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-black text-slate-900 mt-0.5">
                    {formatCurrency(order.bill?.total)}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-kirana-600 group-hover:translate-x-1 transition-transform">
                  <span>Track</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
