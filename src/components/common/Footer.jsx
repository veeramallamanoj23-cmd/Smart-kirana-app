import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function Footer({ onNavigateAdmin, onOpenPolicy }) {
  const { settings } = useStore();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-3.5 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-kirana-600 to-kirana-700 flex items-center justify-center text-white shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0" stroke="#FBBF24" strokeWidth="2.5"/>
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Smart<span className="text-kirana-400">Kirana</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your authentic neighborhood general store, delivering fresh staples, cool drinks, snacks, dairy, and household essentials right to your doorstep in 15–25 minutes.
            </p>
            <div className="space-y-1 text-[11px] text-slate-400 font-mono pt-1">
              <p>FSSAI Lic No: <span className="text-amber-400 font-bold">11224333000542</span></p>
              <p>GSTIN: <span className="text-slate-300 font-bold">29AABCU9603R1ZM</span></p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Store & Support</h4>
            <div className="flex items-start gap-2.5 text-slate-400">
              <MapPin className="w-4 h-4 text-kirana-400 flex-shrink-0 mt-0.5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.storeAddress || `${settings.storeLat || 12.9352},${settings.storeLng || 77.6245}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-300 transition-colors leading-relaxed group"
                title="Click to view store on Google Maps"
              >
                <span className="group-hover:underline text-slate-300">{settings.storeAddress}</span>
                <span className="block text-[11px] text-amber-400 font-semibold mt-0.5">
                  📍 View on Google Maps ↗
                </span>
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <Phone className="w-4 h-4 text-kirana-400 flex-shrink-0" />
              <a 
                href={`tel:${settings.phone || '+919392398990'}`} 
                className="hover:text-kirana-400 transition-colors font-medium text-slate-300"
                title="Call Store Owner"
              >
                Call: {settings.phone || '+91 9392398990'}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <Mail className="w-4 h-4 text-kirana-400 flex-shrink-0" />
              <a 
                href={`mailto:${settings.email || 'care@smartkirana.store'}`} 
                className="hover:text-kirana-400 transition-colors font-medium text-slate-300"
                title="Send Email to Customer Care"
              >
                {settings.email || 'care@smartkirana.store'}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <Clock className="w-4 h-4 text-kirana-400 flex-shrink-0" />
              <span>Daily: {settings.operatingHours}</span>
            </div>
          </div>

          {/* Delivery & Policies */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Customer Care</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button 
                  type="button" 
                  onClick={() => onOpenPolicy && onOpenPolicy('refund')} 
                  className="hover:text-kirana-400 transition-colors text-left"
                >
                  Instant Refund & Cancellation Policy
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onOpenPolicy && onOpenPolicy('delivery')} 
                  className="hover:text-kirana-400 transition-colors text-left"
                >
                  Express Delivery Guidelines
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onOpenPolicy && onOpenPolicy('privacy')} 
                  className="hover:text-kirana-400 transition-colors text-left"
                >
                  UPI & Payment Security
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onOpenPolicy && onOpenPolicy('terms')} 
                  className="hover:text-kirana-400 transition-colors text-left"
                >
                  Terms & Conditions of Sale
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onOpenPolicy && onOpenPolicy('privacy')} 
                  className="hover:text-kirana-400 transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Secure UPI & Payments */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Supported UPI Payments</h4>
            <p className="text-slate-400 text-xs">
              Fast, contact-free checkout with your favorite UPI apps:
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg">Google Pay</span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg">PhonePe</span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg">Paytm</span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg">BHIM UPI</span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg">CRED</span>
            </div>
            <div className="pt-2 flex items-center gap-2 text-kirana-400 text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Merchant QR Code Checkout</span>
            </div>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Smart Kirana. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateAdmin}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Store Administrator Login
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for Local Indian Retail
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
