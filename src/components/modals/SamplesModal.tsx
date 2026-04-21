import React from 'react';
import { X, Sparkles, Star, ShieldCheck, Camera, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudioSamples } from '../StudioSamples';

interface SamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SamplesModal: React.FC<SamplesModalProps> = ({ isOpen, onClose }) => {
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
            className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-slate-100"
          >
            <div className="p-8 lg:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[#16A34A]">
                    <Star className="w-8 h-8" />
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Portrait Gallery</h2>
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Explore Professional Portraits Crafted by AI</p>
                </div>
                <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-12">
                <StudioSamples />

                <div className="p-10 bg-emerald-50 rounded-[40px] border border-emerald-100 flex flex-col md:flex-row items-center gap-10">
                  <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-slate-900 shadow-xl shadow-emerald-500/20 flex-shrink-0">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <div className="space-y-4 text-center md:text-left">
                    <h3 className="text-2xl font-black tracking-tight text-emerald-900">Ready to transform your profile?</h3>
                    <p className="text-sm font-bold text-emerald-800/70 max-w-xl leading-relaxed">
                      Join thousands of professionals who have upgraded their online presence with HeadshotStudioPro. Get your professional portrait in minutes.
                    </p>
                  </div>
                  <button onClick={onClose} className="btn-primary px-10 whitespace-nowrap">
                    Get Started Now
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
