import React from 'react';
import { X, ShieldCheck, FileText, RefreshCw, Truck, Lock } from 'lucide-react';

export default function PolicyModal({ isOpen, onClose, initialPolicy = 'terms' }) {
  const [activePolicy, setActivePolicy] = React.useState(initialPolicy);

  React.useEffect(() => {
    if (initialPolicy) setActivePolicy(initialPolicy);
  }, [initialPolicy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-elevated border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-kirana-100 text-kirana-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Store Policies & Customer Protection</h3>
              <p className="text-xs text-slate-500">Official terms governing orders, delivery, and refunds</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-2 gap-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'refund', label: 'Refund & Returns', icon: RefreshCw },
            { id: 'delivery', label: 'Express Delivery', icon: Truck },
            { id: 'privacy', label: 'Privacy & Security', icon: Lock },
            { id: 'terms', label: 'Terms of Service', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePolicy(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                  activePolicy === tab.id
                    ? 'bg-white text-kirana-800 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Policy Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          {activePolicy === 'refund' && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900">Return & Instant Refund Policy</h4>
              <p>
                At <strong>Smart Kirana</strong>, customer satisfaction is our highest priority. Because we deal with fresh food and daily household staples, our return policy is straightforward:
              </p>
              <div className="p-3 bg-kirana-50 border border-kirana-200 rounded-2xl space-y-1.5 text-kirana-950 font-medium">
                <p><strong>1. Fresh Produce & Dairy:</strong> Report any quality issue within <strong>24 hours</strong> of delivery for an instant replacement or full refund to your original payment method.</p>
                <p><strong>2. Packaged Groceries & Household:</strong> Report damaged packaging, seal issues, or incorrect items within <strong>48 hours</strong>.</p>
                <p><strong>3. Missing Items:</strong> If any item from your bill is missing in the delivery bag, we immediately dispatch it or refund the item amount without delay.</p>
              </div>
              <p>
                Refunds for UPI payments are credited back within 2-4 hours. Cash on Delivery refunds are processed via instant UPI transfer or store credit.
              </p>
            </div>
          )}

          {activePolicy === 'delivery' && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900">Express Delivery Guidelines</h4>
              <p>
                We operate from local fulfillment hubs within our active service radius (up to 10.0 km).
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Delivery Timeline:</strong> Standard express orders are delivered within <strong>15–25 minutes</strong> during normal operating hours (7:00 AM – 11:00 PM).</li>
                <li><strong>Radius Verification:</strong> Deliveries are strictly limited to verified addresses within 10 km to guarantee freshness of perishables and rapid fulfillment.</li>
                <li><strong>Free Delivery:</strong> Orders exceeding the free delivery threshold (default ₹199) enjoy zero delivery charges.</li>
                <li><strong>No Contact Delivery:</strong> Available upon request via the delivery instructions field at checkout.</li>
              </ul>
            </div>
          )}

          {activePolicy === 'privacy' && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900">Customer Privacy & Security Policy</h4>
              <p>
                Compliant with India's Digital Personal Data Protection Act (DPDP) and industry security standards:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Zero Data Selling:</strong> We never sell, rent, or trade your phone number, name, or address with third-party advertisers.</li>
                <li><strong>Payment Safety:</strong> We do not store your UPI PIN, card CVV, or bank credentials. All transactions execute over encrypted NPCI UPI channels.</li>
                <li><strong>Data Minimization:</strong> We only collect information strictly required to pack and deliver your order to your doorstep.</li>
                <li><strong>Audit Logging:</strong> All security events are logged with masked phone numbers for customer protection.</li>
              </ul>
            </div>
          )}

          {activePolicy === 'terms' && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900">Terms of Service & Retail Agreement</h4>
              <p>
                By placing an order with Smart Kirana, you agree to these retail terms:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Pricing & MRP:</strong> All products are sold at or below the Maximum Retail Price (MRP) printed on packaging, inclusive of all applicable GST.</li>
                <li><strong>Availability:</strong> All items are subject to live stock availability at our local store hub. If an item runs out during packing, we notify you before dispatch.</li>
                <li><strong>FSSAI Compliance:</strong> All food items stored and sold comply with Food Safety and Standards Authority of India (FSSAI) guidelines.</li>
                <li><strong>Customer Support:</strong> Reach our helpdesk directly via WhatsApp, call, or email anytime between 7:00 AM and 11:00 PM daily.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Smart Kirana Retail Private Limited</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            I Understand & Accept
          </button>
        </div>

      </div>
    </div>
  );
}
