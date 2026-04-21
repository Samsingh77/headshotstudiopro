import React from 'react';
import { X, Sparkles, Upload, Wand2, ShieldCheck, Camera, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  const steps = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Upload Your Photo",
      description: "Start by uploading a clear, well-lit photo of yourself. A simple selfie or a casual portrait works best.",
      color: "bg-blue-500",
      lightColor: "bg-blue-50"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Choose Your Style",
      description: "Select from our range of professional styles, backgrounds, and attire. Our AI will handle the rest.",
      color: "bg-purple-500",
      lightColor: "bg-purple-50"
    },
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "AI Transformation",
      description: "Our advanced AI models analyze your features and apply professional lighting and attire seamlessly.",
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50"
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Download & Share",
      description: "Preview your portrait, unlock the high-resolution version, and download it for your professional profiles.",
      color: "bg-amber-500",
      lightColor: "bg-amber-50"
    }
  ];

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
            className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-100"
          >
            <div className="p-8 lg:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[#16A34A]">
                    <Sparkles className="w-8 h-8" />
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">How It Works</h2>
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Professional Portraits in 4 Simple Steps</p>
                </div>
                <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {steps.map((step, index) => (
                  <div key={index} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6 relative group transition-all hover:bg-white hover:shadow-xl hover:border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 ${step.lightColor} rounded-2xl flex items-center justify-center text-slate-900 shadow-inner group-hover:scale-110 transition-transform`}>
                        {step.icon}
                      </div>
                      <span className="text-4xl font-black text-slate-200 group-hover:text-emerald-100 transition-colors">0{index + 1}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black tracking-tight text-slate-800">{step.title}</h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-emerald-900">Best Results Checklist</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Good lighting (natural light is best)",
                    "Clear, high-resolution photo",
                    "Look directly at the camera",
                    "Neutral background if possible",
                    "No sunglasses or hats",
                    "Single person in the photo"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 flex justify-center">
                <button onClick={onClose} className="btn-primary px-12">
                  Got It, Let's Start
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
