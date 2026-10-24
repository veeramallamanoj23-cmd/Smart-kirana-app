import React, { useState } from 'react';
import { 
  Package, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  CreditCard 
} from 'lucide-react';
import { useOrders, ORDER_STATUSES } from '../../context/OrderContext';
import { formatCurrency } from '../../lib/upi';

export default function AdminOrdersTab() {
  const { orders, updateOrderStatus, verifyPayment, cancelOrder } = useOrders();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') {
      return o.orderStatus !== ORDER_STATUSES.DELIVERED && o.orderStatus !== ORDER_STATUSES.CANCELLED;
    }
    return o.orderStatus === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case ORDER_STATUSES.DELIVERED:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case ORDER_STATUSES.OUT_FOR_DELIVERY:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case ORDER_STATUSES.PREPARING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ORDER_STATUSES.ACCEPTED:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case ORDER_STATUSES.CANCELLED:
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
        {[
          { key: 'ALL', label: `All Orders (${orders.length})` },
          { key: 'ACTIVE', label: `Active In-Progress (${orders.filter(o => o.orderStatus !== ORDER_STATUSES.DELIVERED && o.orderStatus !== ORDER_STATUSES.CANCELLED).length})` },
          { key: ORDER_STATUSES.PLACED, label: 'New Placed' },
          { key: ORDER_STATUSES.PREPARING, label: 'Preparing' },
          { key: ORDER_STATUSES.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
          { key: ORDER_STATUSES.DELIVERED, label: 'Delivered' },
          { key: ORDER_STATUSES.CANCELLED, label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all ${
              filterStatus === tab.key
                ? 'bg-kirana-600 text-white border-kirana-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-12 bg-white rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
            No orders found under this filter.
          </div>
        ) : (
          filteredOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Header row */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">#{order.id}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(order.orderStatus)}`}>
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'Paid ✓' : 'Payment Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.customer?.name} ({order.customer?.phone}) • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="font-black text-base text-slate-900">{formatCurrency(order.bill?.total)}</span>
                      <span className="text-[10px] text-slate-400 block">{order.items?.length} items • {order.paymentMethod === 'upi_qr' ? 'UPI' : 'COD'}</span>
                    </div>
                    <div className="p-1 rounded-lg bg-slate-100 text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expandable details and action controls */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 space-y-4">
                    
                    {/* Items List */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Order Items:</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items?.map(it => (
                          <div key={it.id} className="p-2 bg-white rounded-xl border border-slate-100 flex items-center gap-2.5 text-xs">
                            <img src={it.image} alt={it.name} className="w-9 h-9 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 truncate">
                              <p className="font-semibold text-slate-800 truncate">{it.name}</p>
                              <p className="text-[10px] text-slate-400">{it.quantity} × {formatCurrency(it.price)}</p>
                            </div>
                            <span className="font-bold">{formatCurrency(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address & Instructions */}
                    <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs">
                      <span className="font-bold text-slate-800">Delivery Address: </span>
                      <span className="text-slate-600">
                        {order.address?.flat}, {order.address?.street}, {order.address?.landmark ? `(${order.address.landmark}), ` : ''} 
                        {order.address?.city} - {order.address?.pincode}
                      </span>
                      {order.instructions && (
                        <p className="mt-1 text-amber-800 font-medium">Customer Note: {order.instructions}</p>
                      )}
                    </div>

                    {/* Store Admin Workflow Actions */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                      
                      {/* Payment Verification Controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Payment:</span>
                        {order.paymentStatus !== 'paid' ? (
                          <button
                            onClick={() => verifyPayment(order.id, true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                          >
                            Mark Payment Verified
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Verified ({order.paymentRef || 'Paid'})
                          </span>
                        )}
                      </div>

                      {/* Status Stepping Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.orderStatus === ORDER_STATUSES.PLACED && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, ORDER_STATUSES.ACCEPTED)}
                              className="px-3.5 py-1.5 bg-kirana-600 hover:bg-kirana-700 text-white text-xs font-bold rounded-xl shadow-sm"
                            >
                              Accept Order
                            </button>
                            <button
                              onClick={() => cancelOrder(order.id, 'Rejected by store')}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {order.orderStatus === ORDER_STATUSES.ACCEPTED && (
                          <button
                            onClick={() => updateOrderStatus(order.id, ORDER_STATUSES.PREPARING)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                          >
                            Start Packing & Preparing
                          </button>
                        )}

                        {order.orderStatus === ORDER_STATUSES.PREPARING && (
                          <button
                            onClick={() => updateOrderStatus(order.id, ORDER_STATUSES.OUT_FOR_DELIVERY)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-sm"
                          >
                            Dispatch (Out for Delivery)
                          </button>
                        )}

                        {order.orderStatus === ORDER_STATUSES.OUT_FOR_DELIVERY && (
                          <button
                            onClick={() => updateOrderStatus(order.id, ORDER_STATUSES.DELIVERED)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                          >
                            Mark as Delivered
                          </button>
                        )}

                        {order.orderStatus !== ORDER_STATUSES.DELIVERED && order.orderStatus !== ORDER_STATUSES.CANCELLED && (
                          <button
                            onClick={() => cancelOrder(order.id, 'Cancelled by Admin')}
                            className="text-xs text-rose-600 font-semibold hover:underline px-2"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
