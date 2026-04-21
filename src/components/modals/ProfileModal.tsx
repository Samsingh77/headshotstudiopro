import React from 'react';
import { X, User, Phone, CheckCircle2, History, CreditCard, Sparkles, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  history: any[];
  onUpdate: (e: React.FormEvent) => void;
  onOpenShop: () => void;
  isSaving: boolean;
  formFields: {
    name: string;
    setName: (s: string) => void;
    phone: string;
    setPhone: (s: string) => void;
  };
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  history,
  onUpdate,
  onOpenShop,
  isSaving,
  formFields,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-white/90 backdrop-blur-md">
      <div className="bg-white rounded-md shadow-2xl max-w-md w-full overflow-hidden relative border border-slate-200 ">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all z-50">
          <X className="w-4 h-4" />
        </button>
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-1">Your Profile</h2>
            <p className="text-slate-500 font-medium text-[9px] tracking-wider uppercase">Manage your account settings</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-md border border-slate-100">
              <div className="w-12 h-12 rounded-md bg-[#16A34A] text-slate-900 flex items-center justify-center text-lg font-black shadow-lg shadow-emerald-500/20">
                {(profile?.full_name?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{profile?.full_name || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-medium">{profile?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-3 h-3 text-[#16A34A]" />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-slate-800">{profile?.tokens || 0}</span>
                  <button onClick={onOpenShop} className="text-[8px] font-black text-[#16A34A] uppercase hover:underline">Get More</button>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <History className="w-3 h-3 text-[#16A34A]" />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">History</span>
                </div>
                <span className="text-lg font-black text-slate-800">{history.length}</span>
              </div>
            </div>
            <form onSubmit={onUpdate} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={formFields.name} onChange={e => formFields.setName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-md pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#16A34A] transition-all" placeholder="John Doe" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="tel" value={formFields.phone} onChange={e => formFields.setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-md pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#16A34A] transition-all" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="btn-primary w-full disabled:opacity-50 mt-2">
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>Save Changes</span></>}
              </button>
            </form>
            <div className="pt-4 border-t border-slate-100">
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-red-500 hover:bg-red-50 text-xs font-bold uppercase tracking-wider transition-all">
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

