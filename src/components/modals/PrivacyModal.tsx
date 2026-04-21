import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Trash2, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100"
          >
            <div className="p-8 lg:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[#16A34A]">
                    <ShieldCheck className="w-8 h-8" />
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Privacy Policy</h2>
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Last Updated: March 2026</p>
                </div>
                <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-10">
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-slate-800">Our Privacy Commitment</h3>
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    At HeadshotStudioPro, we believe your face is your most private asset. Our entire platform is built around the principle of "Privacy by Design." We only process the data necessary to create your professional portraits and ensure they are deleted as soon as they are no longer needed.
                  </p>
                </section>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <EyeOff className="w-5 h-5" />
                      <h4 className="font-black text-sm uppercase tracking-tight">No Permanent Storage</h4>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                      We do not store your original uploaded photos. They are processed in memory and immediately discarded.
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <Trash2 className="w-5 h-5" />
                      <h4 className="font-black text-sm uppercase tracking-tight">Automatic Deletion</h4>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                      Preview Headshots are kept for 5 days. HD Portraits are kept for 15 days. After this, they are permanently purged from our servers.
                    </p>
                  </div>
                </div>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-slate-800">Data Retention Schedule</h3>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Data Type</th>
                          <th className="px-6 py-4">Retention Period</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr>
                          <td className="px-6 py-4 font-bold text-slate-700">Source Photos</td>
                          <td className="px-6 py-4 text-slate-500">0 Seconds</td>
                          <td className="px-6 py-4 text-red-500 font-black text-[10px] uppercase">Instant Purge</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-slate-700">Preview Headshots</td>
                          <td className="px-6 py-4 text-slate-500">5 Days</td>
                          <td className="px-6 py-4 text-amber-500 font-black text-[10px] uppercase">Auto-Delete</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-slate-700">HD Portraits</td>
                          <td className="px-6 py-4 text-slate-500">15 Days</td>
                          <td className="px-6 py-4 text-amber-500 font-black text-[10px] uppercase">Auto-Delete</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
                  <Info className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                    <strong>GDPR & CCPA Compliance:</strong> You have the right to request a full export of your data or immediate deletion of your account and all associated portraits at any time through the Support Hub.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-center">
                  <button onClick={onClose} className="btn-primary px-12">
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
