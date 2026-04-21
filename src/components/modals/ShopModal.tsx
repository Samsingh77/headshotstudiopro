import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (tokens: number) => void;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  setCurrency: (c: 'USD' | 'INR' | 'EUR' | 'GBP') => void;
  formatPrice: (inr: number) => string;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  currency,
  setCurrency,
  formatPrice
}) => {
  if (!isOpen) return null;

  const packages = [
    { 
      id: 'micro', 
      name: 'Micro Pack', 
      tokens: 10, 
      priceInr: 199, 
      features: ['2 HD Headshots', '4 Preview Headshots', 'No watermarks', 'Priority processing'] 
    },
    { 
      id: 'standard', 
      name: 'Standard Suite', 
      tokens: 50, 
      priceInr: 699, 
      isPopular: true, 
      features: ['10 HD Headshots', '25 Preview Headshots', 'Priority processing', 'All premium styles', 'Commercial usage rights'] 
    },
    { 
      id: 'enterprise', 
      name: 'Power Enterprise', 
      tokens: 125, 
      priceInr: 1299, 
      features: ['25 HD Headshots', '75 Preview Headshots', 'Custom Brand Guidelines', 'Dedicated Support', 'Priority AI Rendering Queue'] 
    },
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-white/90 backdrop-blur-md">
      <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full overflow-hidden relative border border-white ">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all z-50" >
          <X className="w-4 h-4" />
        </button>
        {/* Modal Content */}
        <div className="p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-1">Get Credits</h2>
              <p className="text-slate-500 font-medium text-[9px] tracking-wider uppercase">Choose the package that fits your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {packages.map((pkg) => (
                <div key={pkg.id} className={`relative flex flex-col p-5 rounded-md border-2 transition-all hover:shadow-xl group ${ pkg.isPopular ? 'border-[#16A34A] shadow-emerald-500/5' : 'border-slate-100 ' }`} >
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#16A34A] text-slate-900 px-3 py-1 rounded-md text-[8px] font-black tracking-tight shadow-lg">
                      Popular
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-xs font-black text-[#16A34A] mb-0.5">{pkg.name}</p>
                    <p className="text-slate-800 font-black text-xs tracking-tight">{pkg.tokens} Credits</p>
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black text-slate-800 ">{formatPrice(pkg.priceInr)}</span>
                    <span className="text-slate-500 font-bold text-[9px]">/once</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    {pkg.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                        <span className="text-[9px] font-semibold text-slate-600 leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => onPurchase(pkg.tokens)} className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all mt-auto ${ pkg.isPopular ? 'bg-[#16A34A] text-slate-900 shadow-sm hover:bg-emerald-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100' }`}>
                    Select
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 bg-slate-50 p-1 rounded-md w-fit mx-auto border border-slate-100 mb-6">
              {(['USD', 'INR', 'EUR', 'GBP'] as const).map((curr) => (
                <button key={curr} onClick={() => setCurrency(curr)} className={`px-3 py-1.5 rounded-md text-xs font-black tracking-tight transition-all ${ currency === curr ? 'bg-white text-[#16A34A] shadow-sm' : 'text-slate-500 hover:text-slate-600' }`} >
                  {curr}
                </button>
              ))}
            </div>
            <div className="text-center pb-2">
              <p className="text-[10px] font-bold text-slate-500 tracking-wide">
                <span className="text-[#16A34A] mr-1">★</span>
                <span className="underline decoration-slate-300 underline-offset-2">For group or corporate bookings, please reach out through our Support Hub</span> or email us at <a href="mailto:headshotstudiopro@gmail.com" className="text-[#16A34A] hover:underline">headshotstudiopro@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
