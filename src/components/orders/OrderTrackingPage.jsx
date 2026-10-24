import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  Printer, 
  AlertCircle, 
  HelpCircle, 
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { useOrders, ORDER_STATUSES } from '../../context/OrderContext';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../lib/upi';

export default function OrderTrackingPage({ orderId, onBackToStore, onSelectOrder }) {
  const { orders, getOrderById, cancelOrder } = useOrders();
  const { settings } = useStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Placed by mistake');

  const currentOrder = getOrderById(orderId) || orders[0];

  if (!currentOrder) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">No Order Found</h2>
        <p className="text-xs text-slate-500 mt-2">We could not find details for order #{orderId}.</p>
        <button
          onClick={onBackToStore}
          className="mt-6 px-6 py-2.5 bg-kirana-600 text-white font-bold text-xs rounded-2xl"
        >
          Return to Store
        </button>
      </div>
    );
  }

  // Define steps
  const steps = [
    { key: ORDER_STATUSES.PLACED, label: 'Order Placed', desc: 'Received by store system' },
    { key: 'payment', label: currentOrder.paymentStatus === 'paid' ? 'Payment Confirmed' : 'Payment Pending', desc: currentOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : (currentOrder.paymentRef || 'Awaiting bank confirmation') },
    { key: ORDER_STATUSES.ACCEPTED, label: 'Order Accepted', desc: 'Store confirmed stock' },
    { key: ORDER_STATUSES.PREPARING, label: 'Packing Items', desc: 'Store team bagging items' },
    { key: ORDER_STATUSES.OUT_FOR_DELIVERY, label: 'Out for Delivery', desc: 'Delivery partner on the way' },
    { key: ORDER_STATUSES.DELIVERED, label: 'Delivered', desc: 'Handed over at doorstep' }
  ];

  const getStepStatus = (stepKey, index) => {
    if (currentOrder.orderStatus === ORDER_STATUSES.CANCELLED) {
      return 'cancelled';
    }

    const orderRank = {
      [ORDER_STATUSES.PLACED]: 1,
      [ORDER_STATUSES.ACCEPTED]: 2,
      [ORDER_STATUSES.PREPARING]: 3,
      [ORDER_STATUSES.OUT_FOR_DELIVERY]: 4,
      [ORDER_STATUSES.DELIVERED]: 5
    };

    const currentRank = orderRank[currentOrder.orderStatus] || 1;

    if (stepKey === 'payment') {
      return currentOrder.paymentStatus === 'paid' ? 'completed' : 'current';
    }

    const thisRank = orderRank[stepKey];
    if (!thisRank) return 'pending';

    if (currentRank > thisRank) return 'completed';
    if (currentRank === thisRank) return 'current';
    return 'pending';
  };

  const isCancellable = currentOrder.orderStatus === ORDER_STATUSES.PLACED || 
                        currentOrder.orderStatus === ORDER_STATUSES.ACCEPTED;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      
      {/* Top back & actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToStore}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-kirana-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Order Status Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden mb-6">
        
        {/* Banner Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-kirana-700 via-kirana-600 to-amber-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                Order #{currentOrder.id}
              </span>
              <span className="text-xs text-white/80">
                {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(currentOrder.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {currentOrder.orderStatus === ORDER_STATUSES.DELIVERED
                ? 'Order Delivered Successfully 🎉'
                : currentOrder.orderStatus === ORDER_STATUSES.CANCELLED
                ? 'Order Cancelled'
                : currentOrder.orderStatus === ORDER_STATUSES.OUT_FOR_DELIVERY
                ? 'Out for Delivery ⚡'
                : 'Preparing Your Fresh Groceries 🛍️'}
            </h2>
            <p className="text-xs text-white/90 mt-0.5">
              {currentOrder.orderStatus === ORDER_STATUSES.DELIVERED
                ? `Delivered on ${currentOrder.deliveredAt ? new Date(currentOrder.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'today'}`
                : currentOrder.estimatedDeliveryTime || 'Estimated arrival: 15-25 Mins'}
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-right self-start sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Total Amount</span>
            <span className="text-xl font-black">{formatCurrency(currentOrder.bill?.total)}</span>
            <span className="text-[10px] block font-medium opacity-80 uppercase mt-0.5">
              {currentOrder.paymentMethod === 'upi_qr' ? 'UPI QR Payment' : 'Cash on Delivery'}
            </span>
          </div>
        </div>

        {/* Status Pipeline / Steps */}
        <div className="p-5 sm:p-7 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5">
            Live Order Status
          </h4>

          {currentOrder.orderStatus === ORDER_STATUSES.CANCELLED ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm">Order Cancelled</span>
                <p className="text-xs text-rose-700 mt-0.5">
                  Reason: {currentOrder.cancellationReason || 'Customer requested cancellation'}. Any deducted stock has been restored to inventory.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Stepper Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {steps.map((st, idx) => {
                  const status = getStepStatus(st.key, idx);

                  return (
                    <div key={st.key} className="flex flex-col items-start relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          status === 'completed'
                            ? 'bg-kirana-600 text-white shadow-sm'
                            : status === 'current'
                            ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100 animate-pulse'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                      </div>

                      <p className={`text-xs font-bold ${
                        status === 'completed'
                          ? 'text-kirana-700'
                          : status === 'current'
                          ? 'text-slate-900 font-extrabold'
                          : 'text-slate-400'
                      }`}>
                        {st.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {st.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Note on GPS tracking adherence */}
              <div className="mt-6 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-kirana-600" />
                  Store dispatched order • Verified local rider delivery
                </span>
                <span className="text-[10px] text-slate-400">Status updated by store partner</span>
              </div>
            </div>
          )}
        </div>

        {/* Two-Column Details (Address & Contact + Items Ordered) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Left Column: Delivery Details & Store Support */}
          <div className="p-5 sm:p-7 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-kirana-600" /> Delivery Address
              </h4>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <p className="font-bold text-slate-800">{currentOrder.customer?.name} ({currentOrder.customer?.phone})</p>
                <p className="text-slate-600">{currentOrder.address?.flat}, {currentOrder.address?.street}</p>
                {currentOrder.address?.landmark && (
                  <p className="text-slate-500">Landmark: {currentOrder.address.landmark}</p>
                )}
                <p className="text-slate-700 font-mono font-bold">
                  {currentOrder.address?.city} - {currentOrder.address?.pincode}
                </p>
                {currentOrder.instructions && (
                  <p className="text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-100 text-[11px] mt-2">
                    <strong>Note:</strong> {currentOrder.instructions}
                  </p>
                )}
              </div>
            </div>

            {/* Store Support Hotline */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-kirana-600" /> Need Help with this Order?
              </h4>
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-emerald-950">{settings.storeName} Support</p>
                  <p className="text-[11px] text-emerald-800">Phone & WhatsApp: {settings.phone}</p>
                </div>
                <a
                  href={`tel:${settings.phone}`}
                  className="px-3 py-1.5 bg-kirana-600 text-white rounded-xl font-bold text-xs hover:bg-kirana-700 transition-colors shadow-sm"
                >
                  Call Store
                </a>
              </div>
            </div>

            {/* Cancel Action if eligible */}
            {isCancellable && (
              <div className="pt-2">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline"
                >
                  Cancel this order
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Ordered Items & Bill Breakdown */}
          <div className="p-5 sm:p-7 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-kirana-600" /> Items in this Order ({currentOrder.items?.length})
            </h4>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-50">
              {currentOrder.items?.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-10 h-10 object-cover rounded-xl border border-slate-100 flex-shrink-0" 
                    />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.brand} • {item.size} × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill details */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatCurrency(currentOrder.bill?.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span>{currentOrder.bill?.deliveryFee === 0 ? <strong className="text-kirana-700">FREE</strong> : formatCurrency(currentOrder.bill?.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Handling Fee</span>
                <span>{formatCurrency(currentOrder.bill?.handlingFee)}</span>
              </div>
              {currentOrder.bill?.discount > 0 && (
                <div className="flex justify-between text-kirana-700 font-semibold">
                  <span>Discount</span>
                  <span>-{formatCurrency(currentOrder.bill.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Total Paid / Payable</span>
                <span className="text-base text-kirana-700">{formatCurrency(currentOrder.bill?.total)}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-elevated">
            <h4 className="font-extrabold text-slate-900 text-base">Cancel Order #{currentOrder.id}?</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel? Items will be returned to inventory.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Select Reason:</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Placed by mistake">Placed by mistake</option>
                <option value="Need to change items/address">Need to change items/address</option>
                <option value="Delivery time delay">Delivery time delay</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Keep Order
              </button>
              <button
                onClick={() => {
                  cancelOrder(currentOrder.id, cancelReason);
                  setShowCancelModal(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
