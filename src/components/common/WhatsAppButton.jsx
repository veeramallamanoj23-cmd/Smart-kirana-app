import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function WhatsAppButton() {
  const { settings } = useStore();
  const rawPhone = settings.whatsapp || settings.phone || '919876543210';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const message = encodeURIComponent('Hello Smart Kirana! I would like to inquire about products and delivery.');
  const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with store on WhatsApp"
      className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="relative">
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
        </span>
      </div>
      <span className="text-xs font-bold hidden sm:inline-block pr-1 tracking-wide">
        Need Help? Chat on WhatsApp
      </span>
    </a>
  );
}
