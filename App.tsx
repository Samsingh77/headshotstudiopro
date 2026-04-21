
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Mail, Lock, Eye, EyeOff, Chrome, User, Camera, ArrowRight, ArrowLeft, CheckCircle2, HelpCircle, Coins, LogOut, Sun, Moon, X, Trash2, Star, Send, History, IdCard, ShieldCheck, Clock, Settings, MessageSquare, Sparkles, UploadCloud, Shirt, Layout, Cpu, Download, Info, ChevronLeft, ChevronDown, CreditCard, Share2, Twitter, Linkedin, Facebook, Copy, Lightbulb, RotateCcw, Contrast, Palette, Coffee, Maximize2, Wand2, Instagram, Github, Building2, Users, Award, Briefcase, AlertCircle, Check, Zap, Image, Save, Upload, Grid, Crop as CropIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { HeroBackground, FloatingElement } from './src/components/HeroAnimation';
import { AppStyle, BackgroundStyle, ClothingChoice, ClothingStyle, GenerationSettings, TieColor, BodyPose, LightingOption, PersonType, PoseAngle, Wardrobe, Expression, DoctorCoatColor, StethoscopePosition } from './types';
import { safeFetch } from './utils/fetch';
import { GeminiService } from './services/geminiService';
import { supabase, uploadToSupabaseStorage, deleteFromSupabaseStorage, cleanupOldGenerations, logActivity, getUserProfile, addPaymentRecord } from './lib/supabase';
import { compressImage, generateThumbnail } from './utils/image';
import { HeroSection } from '@/src/components/ui/feature-carousel';
import { StudioSamples } from './src/components/StudioSamples';

import { AISuiteMenu } from './src/components/AISuiteMenu';
import { ExploreMoreTools } from './src/components/ExploreMoreTools';

// Razorpay integration
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Constants for credit consumption mapping
const CREDIT_COST_HD = 5;
const CREDIT_COST_PREVIEW = 1; // Based on user example: 9 credits = 1 HD (5) + 4 Previews (4)

interface UserProfile {
  id: string;
  email: string;
  tokens: number;
  previews_remaining?: number;
  full_name?: string;
  phone_no?: string;
  plan?: string;
  feedback?: string;
}

interface TokenHistoryItem {
  id: string;
  amount: number;
  created_at: string;
}

interface GenerationRecord {
  id: string | number;
  image_data: string;
  is_unlocked: boolean;
  settings: GenerationSettings;
  created_at: string;
  seed?: number;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const formatErrorMessage = (err: any, defaultMsg: string) => {
  const msg = err?.message || String(err || '');
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network error') || msg.toLowerCase().includes('load failed')) {
    return "Network error: Please check your internet connection or VPN and try again.";
  }
  if (msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('timeout')) {
    return "Request timed out. Please try again with a better connection.";
  }
  return err?.message || defaultMsg;
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-md shadow-2xl animate-in slide-in-from-right-10 duration-300 ${
      type === 'success' ? 'bg-[#10b981] text-white' : 
      type === 'info' ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
       type === 'info' ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <HelpCircle className="w-4 h-4" />}
      <span className="font-bold text-xs tracking-tight">{message}</span>
      <button onClick={onClose} className="ml-3 opacity-50 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
};

const StyleSamplesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 lg:p-6 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-6xl md:w-fit bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[95vh]"
      >
        <div className="p-4 md:p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-0.5">Professional Style Samples</h3>
              <p className="text-[9px] font-bold text-studio-emerald uppercase tracking-widest">Reference Catalog</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-center max-h-[65vh]">
              <img 
                src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/Professional.png" 
                alt="Professional Style Samples"
                referrerPolicy="no-referrer"
                className="max-w-full h-auto object-contain"
              />
            </div>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg">
              <div className="flex gap-2.5 items-center">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-800 dark:text-amber-200 font-medium leading-tight">
                  <span className="font-bold uppercase tracking-tighter mr-1">Note:</span> 
                  Sample references for lighting/clothing style. Results are unique to your features and may vary slightly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BackgroundSamplesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 lg:p-6 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-6xl md:w-fit bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[95vh]"
      >
        <div className="p-4 md:p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-0.5">Background Style Samples</h3>
              <p className="text-[9px] font-bold text-studio-emerald uppercase tracking-widest">Reference Catalog</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-center max-h-[65vh]">
              <img 
                src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/background.png" 
                alt="Background Style Samples"
                referrerPolicy="no-referrer"
                className="max-w-full h-auto object-contain"
              />
            </div>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg">
              <div className="flex gap-2.5 items-center">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-800 dark:text-amber-200 font-medium leading-tight">
                  <span className="font-bold uppercase tracking-tighter mr-1">Note:</span> 
                  Sample references for lighting/clothing style. Results are unique to your features and may vary slightly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PrivacyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 lg:p-6 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 lg:p-12 overflow-y-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-2">Privacy Policy</h3>
              <p className="text-xs font-bold text-studio-emerald uppercase tracking-widest">Your Data, Your Control</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-studio-emerald" />
                Data Protection
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                We take your privacy seriously. Your uploaded source photos are used strictly for the generation process and are never stored permanently on our servers.
              </p>
            </section>

            <section className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-studio-emerald" />
                Retention Policy
              </h4>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-studio-emerald mt-1.5 flex-shrink-0" />
                  <span><strong>Source Photos:</strong> Immediately deleted after the AI model training/generation is complete.</span>
                </li>
                <li className="flex gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-studio-emerald mt-1.5 flex-shrink-0" />
                  <span><strong>Free Previews:</strong> Retained for 5 days for your convenience.</span>
                </li>
                <li className="flex gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-studio-emerald mt-1.5 flex-shrink-0" />
                  <span><strong>HD Portraits:</strong> Retained for 15 days to allow you to download them.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-studio-emerald" />
                AI Disclaimer
              </h4>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  * AI Disclaimer: Portraits are AI-generated. We aim for high realism, but results may differ from actual appearance. We use advanced artificial intelligence to generate these portraits. While we strive for maximum realism, please expect some differences between the actual subject and the generated results.
                </p>
              </div>
            </section>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-studio-emerald text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-studio-emerald-dark transition-all shadow-xl shadow-emerald-500/20"
              >
                I UNDERSTAND
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const HowItWorksModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-md shadow-2xl max-w-4xl w-full overflow-hidden relative border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-studio-emerald transition-all z-50 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 lg:p-8 overflow-y-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">How it <span className="text-studio-emerald">Works</span></h2>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium mx-auto">
              Professional results in four simple steps. No physical photoshoot required.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                step: '01', 
                title: 'CAPTURE', 
                desc: 'Take a quick selfie. No professional equipment required.',
                img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step1.jpg?v=5'
              },
              { 
                step: '02', 
                title: 'UPLOAD', 
                desc: 'Upload your photos to our secure platform.',
                img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step2.jpg?v=5'
              },
              { 
                step: '03', 
                title: 'REFINE', 
                desc: 'Choose your clothing, background, and style.',
                img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step3.jpg?v=5'
              },
              { 
                step: '04', 
                title: 'GENERATE', 
                desc: 'Our AI delivers photorealistic portraits in minutes.',
                img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step4.jpg?v=5'
              }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-4 group">
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800">
                  <img 
                    src={item.img} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    referrerPolicy="no-referrer" 
                    alt={item.title}
                  />
                  <div className="absolute bottom-4 left-4 w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center border-2 border-white/10 shadow-lg">
                    <span className="text-white text-[9px] font-black">{item.step}</span>
                  </div>
                </div>
                <div className="space-y-1 px-1">
                  <h3 className="text-lg font-black text-[#10b981] uppercase">{item.title}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SamplesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-md shadow-2xl max-w-3xl w-full overflow-hidden relative border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-[#10b981] transition-all z-50 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 lg:p-8 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-1">Studio Quality Samples</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[9px] tracking-wider uppercase">Enterprise Showcase</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5].map((imgIndex, idx) => (
              <div key={idx} className="aspect-[3/4] rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 overflow-hidden group relative">
                <img 
                  src={`https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/sample${imgIndex}.png`} 
                  className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  alt={`Sample ${imgIndex}`}
                  onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SupportHubModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  initialTab?: 'how' | 'faq' | 'support';
  hideTabs?: boolean;
}> = ({ isOpen, onClose, userEmail, onSuccess, onError, initialTab = 'how', hideTabs = false }) => {
  const [activeTab, setActiveTab] = useState<'how' | 'faq' | 'support'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail || '',
    phone: '',
    cc: '',
    category: 'General',
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (userEmail) setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [isOpen, initialTab, userEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      onError("Please fill in all required fields (Name, Email, Message).");
      return;
    }

    setLoading(true);
    try {
      const response = await safeFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess("Feedback sent! We will reach out to you within 2 working days.");
        onClose();
        setFormData({ name: '', email: userEmail || '', phone: '', cc: '', category: 'General', message: '' });
      } else {
        const data = await response.json();
        onError(data.error || "Failed to send feedback. Please try again later.");
      }
    } catch (err) {
      console.error("Feedback error:", err);
      onError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (hideTabs) {
      if (activeTab === 'faq') return 'Frequently Asked Questions';
      if (activeTab === 'support') return 'Feedback & Support';
    }
    return 'Support Hub';
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-md shadow-2xl max-w-4xl w-full overflow-hidden relative border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 lg:p-6 pr-14 lg:pr-16 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-1">
              {getTitle()}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[9px] tracking-wider uppercase">
              {hideTabs ? (
                activeTab === 'faq' ? 'Find answers to common questions' : 'We value your input'
              ) : (
                'Everything you need in one place'
              )}
            </p>
          </div>
          {!hideTabs && (
            <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
              <button 
                onClick={() => setActiveTab('how')}
                className={`px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${activeTab === 'how' ? 'bg-white dark:bg-slate-700 text-[#10b981] shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                How it Works
              </button>
              <button 
                onClick={() => setActiveTab('faq')}
                className={`px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${activeTab === 'faq' ? 'bg-white dark:bg-slate-700 text-[#10b981] shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                FAQs
              </button>
              <button 
                onClick={() => setActiveTab('support')}
                className={`px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${activeTab === 'support' ? 'bg-white dark:bg-slate-700 text-[#10b981] shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Feedback & Support
              </button>
            </div>
          )}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-[#10b981] transition-all z-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          {activeTab === 'how' && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-6">
                {/* Steps with subtle background */}
                {[
                  { num: '1', title: 'Take Selfie', desc: 'Take a quick selfie. No professional equipment required.', color: 'bg-[#10b981] text-white', img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step1.jpg?v=1' },
                  { num: '2', title: 'Upload Selfies', desc: 'Upload your photos to our platform. We’ll guide you on the best ones to use.', color: 'bg-emerald-100 text-[#10b981]', img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step2.jpg?v=1' },
                  { num: '3', title: 'Customize Style', desc: 'Choose your preferred clothing, background, and professional style.', color: 'bg-emerald-100 text-[#10b981]', img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/hero1.png' },
                  { num: '4', title: 'Get Your Photos', desc: 'Our AI generates photorealistic portraits in under 2 hours.', color: 'bg-emerald-50 text-emerald-400', img: 'https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/step3.jpg?v=1' }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-5 items-start relative p-4 rounded-md bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
                    <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${step.color} z-10`}>{step.num}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{step.title}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">{step.desc}</p>
                      <div className="rounded-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 max-w-[200px]">
                        <img src={step.img} className="w-full h-auto object-contain max-h-[100px]" referrerPolicy="no-referrer" alt={step.title} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {[
                { q: "What is HeadshotStudioPro?", a: "HeadshotStudioPro is an AI-powered platform that delivers pro-grade executive portraits at a fraction of the cost. Built for CEOs and leaders who demand excellence." },
                { q: "How many photos do I need to upload?", a: "You only need to upload one clear, well-lit photo. Our AI is trained to understand your facial structure from a single image, though high-quality originals yield the best results." },
                { q: "How long does it take to get my photos?", a: "Preview generations are near-instant. Once you choose a style for an HD Portrait, our platform processes it live, taking approximately 2 to 4 minutes depending on your internet speed." },
                { q: "Can I use these for LinkedIn and professional profiles?", a: "Absolutely. Our portraits are specifically curated by art directors to meet the highest professional standards for lighting, attire, and composition." },
                { q: "Is my data and photo secure?", a: "Yes. We take privacy seriously. Your uploaded photos are used only for generation and are protected by industry-standard security protocols." },
                { q: "What is the difference between a Preview and an HD Portrait?", a: "Free Previews allow you to test different styles and settings quickly. HD Portraits are the final, polished assets optimized for large-scale use and printing." },
                { q: "Do I need a subscription?", a: "No. We believe in a transparent pay-as-you-go model. You only buy the credits you need, with no recurring monthly fees." },
                { q: "Can I change the attire or background?", a: "Yes! You can choose from various professional styles (Corporate, Creative, Formal), attire options (Suit & Tie, Shirt), and professional backdrops." },
                { q: "What if I'm not happy with the result?", a: "We provide tips and pro-settings to help you get the best result. If you still have issues, our support team is ready to assist you." },
                { q: "How do I get more credits?", a: "You can purchase credits directly at aiwithshyam.com. We offer various packages to suit your needs." },
                { q: "Is there a guest mode?", a: "Yes, you can sign in as a guest to explore the platform and see how it works before committing to a full account." },
                { q: "How can I contact support?", a: "You can reach us directly through the Feedback tab in this Support Hub for any technical or billing inquiries." }
              ].map((item, idx) => (
                <details key={idx} className="group bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <summary className="flex items-center justify-between p-4 lg:p-5 cursor-pointer list-none">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{item.q}</span>
                    <span className="transition-transform duration-300 group-open:rotate-180"><ChevronDown className="w-4 h-4 text-slate-400" /></span>
                  </summary>
                  <div className="px-4 lg:px-5 pb-4 lg:pb-5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-6 text-center">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Need Help?</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Send us a message and our team will get back to you within 48 hours.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#10b981] transition-all" placeholder="Your Name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Email *</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#10b981] transition-all" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Phone</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#10b981] transition-all" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#10b981] transition-all">
                      <option>General</option>
                      <option>Bug Report</option>
                      <option>Feature Request</option>
                      <option>Question</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">CC (Comma separated emails)</label>
                  <input type="text" value={formData.cc} onChange={e => setFormData({...formData, cc: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#10b981] transition-all" placeholder="colleague@email.com, boss@email.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Message *</label>
                  <textarea required rows={3} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2.5 text-xs focus:outline-none focus:border-[#10b981] transition-all resize-none" placeholder="How can we help you?" />
                </div>
                <button disabled={loading} className="w-full bg-[#10b981] text-white py-3 rounded-md font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-[#2d8a60] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><MessageSquare className="w-3.5 h-3.5" /><span>Send Feedback</span></>}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ShopModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (tokens: number) => void;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  setCurrency: (c: 'USD' | 'INR' | 'EUR' | 'GBP') => void;
  formatPrice: (inr: number) => string;
}> = ({ isOpen, onClose, onPurchase, currency, setCurrency, formatPrice }) => {
  if (!isOpen) return null;

  const packages = [
    { 
      id: 'micro', 
      name: 'Micro Pack', 
      tokens: 10, 
      priceInr: 199, 
      badge: 'STARTER',
      features: ['2 HD Headshots', '4 Preview Headshots', 'No watermarks', 'Priority processing']
    },
    { 
      id: 'standard', 
      name: 'Standard Suite', 
      tokens: 50, 
      priceInr: 699, 
      isPopular: true,
      badge: 'BEST VALUE',
      features: ['10 HD Headshots', '20 Preview Headshots', 'Priority processing', 'All premium styles', 'Commercial usage rights']
    },
    { 
      id: 'enterprise', 
      name: 'Power Enterprise', 
      tokens: 125, 
      priceInr: 1299, 
      badge: 'ULTIMATE',
      features: ['25 HD Headshots', '50 Preview Headshots', 'Custom Brand Guidelines', 'Dedicated Support', 'Priority AI Rendering Queue']
    },
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-md shadow-2xl max-w-3xl w-full overflow-hidden relative border border-white dark:border-slate-800">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-all z-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <div className="p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-1">Shared AI Wallet</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[9px] tracking-wider uppercase">Credits are shared across all AI Suite ecosystem tools</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col p-5 rounded-md border-2 transition-all hover:shadow-xl group ${
                    pkg.isPopular ? 'border-[#10b981] shadow-emerald-500/5' : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {pkg.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${pkg.isPopular ? 'bg-[#10b981]' : 'bg-amber-500'} text-white px-3 py-1 rounded-md text-[8px] font-black tracking-tight shadow-lg`}>
                      {pkg.badge}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <p className="text-xs font-black text-[#10b981] mb-0.5">{pkg.name}</p>
                    <p className="text-slate-800 dark:text-white font-black text-xs tracking-tight">{pkg.tokens} {pkg.tokens === 1 ? 'Credit' : 'Credits'}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{formatPrice(pkg.priceInr)}</span>
                    <span className="text-slate-400 font-bold text-[9px]">/once</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {pkg.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                        <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => onPurchase(pkg.tokens)}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all mt-auto ${
                    pkg.isPopular ? 'bg-[#10b981] text-white shadow-sm hover:bg-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                    Buy Credits
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-md w-fit mx-auto border border-slate-100 dark:border-slate-700 mb-6">
              {(['USD', 'INR', 'EUR', 'GBP'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1.5 rounded-md text-xs font-black tracking-tight transition-all ${
                    currency === curr ? 'bg-white dark:bg-slate-700 text-[#10b981] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <div className="text-center pb-2">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                <span className="text-[#10b981] mr-1">★</span> 
                <span className="underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2">For group or corporate bookings, please reach out through our Support Hub</span> or email us at <a href="mailto:headshotstudiopro@gmail.com" className="text-[#10b981] hover:underline">headshotstudiopro@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<{ 
  onGetStarted: () => void; 
  onOpenFAQ: (tab?: 'how' | 'faq' | 'support') => void; 
  onOpenShop: (tokens: number) => void;
  formatPrice: (usd: number) => string;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  setCurrency: (c: 'USD' | 'INR' | 'EUR' | 'GBP') => void;
  setIsSamplesOpen: (open: boolean) => void;
  setView: (view: 'landing' | 'auth' | 'app' | 'dashboard') => void;
  profile: UserProfile | null;
  isGuest?: boolean;
  session: any;
}> = ({ onGetStarted, onOpenFAQ, onOpenShop, formatPrice, currency, setCurrency, setIsSamplesOpen, setView, profile, isGuest, session }) => {
  console.log("LandingPage rendering...");
  const isVerified = (profile?.full_name || profile?.email) && session;
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const heroTitle = (
    <div className="flex flex-col items-center text-center">
      <span className="text-slate-900 dark:text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none">
        Professional Headshots
      </span>
      <span className="text-studio-emerald text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mt-2 leading-none">
        Made Instant.
      </span>
    </div>
  );

  return (
    <div className="relative w-full max-w-full bg-white dark:bg-black transition-colors font-sans overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-black/[0.05] dark:border-white/[0.05] px-4 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => setView('landing')}>
              <div className="bg-gradient-to-br from-studio-emerald to-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
                <Camera className="w-5 h-5" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                  Headshot<span className="text-studio-emerald">Studio</span>Pro
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Premium AI Portraits</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-4 lg:gap-8">
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden md:block">
              <AISuiteMenu />
            </div>
            {isVerified && !isGuest && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#ecfdf5] border border-[#059669]/10 rounded-full text-[10px] font-black text-[#059669] tracking-widest uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified User
              </div>
            )}
            <button 
              onClick={onGetStarted} 
              className="px-4 sm:px-5 py-2 bg-studio-emerald text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-studio-emerald-dark transition-all active:scale-[0.98] whitespace-nowrap"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* New Hero Section with Carousel */}
      <div className="relative overflow-hidden bg-white dark:bg-black">
        <HeroSection
          title={heroTitle}
          subtitle="Upload a simple selfie and let our AI generate premium, photorealistic headshots for your LinkedIn, CV, or company website."
          className="pt-28 pb-10 sm:pt-32"
          actions={
            <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4">
              <button 
                onClick={onGetStarted} 
                className="w-full sm:w-auto px-10 py-4 bg-studio-emerald text-white rounded-xl text-base font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                Get 2 Free Previews <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Trusted by 1000+ professionals
                </span>
              </div>
            </div>
          }
        />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="pb-24 pt-4 w-full max-w-full overflow-hidden"
        >
          <StudioSamples />
        </motion.div>
      </div>

      {/* Social Recognition Bar */}
      <section className="py-12 border-y border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-8">Professionals from top companies use our AI</p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-12 lg:gap-20 opacity-40 grayscale dark:invert">
            {/* Generic industry icons to represent trust */}
            <div className="flex items-center gap-2.5 font-bold text-base"><Building2 className="w-5 h-5"/> Tech Executives</div>
            <div className="flex items-center gap-2.5 font-bold text-base"><Briefcase className="w-5 h-5"/> Founders</div>
            <div className="flex items-center gap-2.5 font-bold text-base"><Users className="w-5 h-5"/> Realtors</div>
            <div className="flex items-center gap-2.5 font-bold text-base"><IdCard className="w-5 h-5"/> Job Seekers</div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-24 lg:py-32 px-6 bg-white dark:bg-black scroll-mt-20 overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-tight uppercase">How it <span className="text-studio-emerald">Works</span></h2>
            <p className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Professional results in three simple steps. No physical photoshoot required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-5xl mx-auto">
            {[
              { 
                step: '01', 
                icon: <Camera className="w-7 h-7" />,
                title: 'Upload a Selfie', 
                desc: 'Snap a quick photo against any background. No professional equipment required.'
              },
              { 
                step: '02', 
                icon: <Palette className="w-7 h-7" />,
                title: 'Choose Your Style', 
                desc: 'Select your attire, background, and lighting to match your personal brand.'
              },
              { 
                step: '03', 
                icon: <Download className="w-7 h-7" />,
                title: 'Download Results', 
                desc: 'Get studio-quality HD Portraits in seconds, ready for LinkedIn or your CV.'
              }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-6 group">
                <div className="w-20 h-20 rounded-3xl bg-studio-emerald/10 text-studio-emerald flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500 shadow-sm">
                  {item.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center text-sm font-black shadow-lg">
                    {item.step}
                  </div>
                </div>
                <div className="space-y-3 px-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
                  <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Comparison Section */}
      <section className="py-24 lg:py-32 px-4 lg:px-6 bg-slate-50 dark:bg-slate-900/20 overflow-hidden max-w-full">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 uppercase">Why pay for an expensive studio photoshoot?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 opacity-70">
              <h3 className="text-xl font-bold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-tight"><X className="w-6 h-6 text-red-500" /> Traditional Photoshoot</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currency === 'INR' ? '₹5,000 - ₹10,000+' : '$300 - $1,000+'}
                  </span> cost
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">Takes <span className="font-semibold text-slate-900 dark:text-white">1-2 weeks</span> to book & edit</li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">Travel to a studio required</li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">Awkward posing</li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">Limited to one outfit/background</li>
              </ul>
            </div>

            {/* AI Studio */}
            <div className="bg-studio-emerald p-8 rounded-2xl text-white shadow-lg shadow-emerald-500/20 scale-105 relative">
              <div className="absolute -top-4 right-8 bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">The Smart Choice</div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-2 tracking-tighter"><CheckCircle2 className="w-7 h-7" /> HeadshotStudioPro</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3"><span className="font-bold text-xl">Less than a cup of coffee</span></li>
                <li className="flex items-center gap-3">Ready in <span className="font-bold">seconds</span></li>
                <li className="flex items-center gap-3">Do it from your couch</li>
                <li className="flex items-center gap-3">No posing required</li>
                <li className="flex items-center gap-3">Infinite styles, outfits, and backgrounds</li>
              </ul>
              <button onClick={onGetStarted} className="mt-8 w-full py-4 bg-white text-studio-emerald rounded-xl font-bold hover:bg-slate-50 transition-colors">
                Try it for Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Before & After Section */}
      <section className="py-24 lg:py-32 px-4 lg:px-6 bg-white dark:bg-black overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-studio-emerald/10 text-studio-emerald text-[13px] font-black tracking-tighter uppercase">
                <Check className="w-4 h-4" /> Professional Transformation
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] uppercase">
                From Casual Selfie to <br />
                <span className="text-studio-emerald">Executive Portrait</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg">
                Our AI doesn't just filter your photos—it reconstructs them with professional lighting, backgrounds, and optics while preserving your unique facial features.
              </p>
              <ul className="space-y-5">
                {[
                  'Professional Lighting',
                  'High-End Camera Optics (85mm f/1.8)',
                  'Curated Professional Attire',
                  'Natural Skin Texture Preservation'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-[17px] font-semibold text-slate-900 dark:text-white">
                    <div className="w-6 h-6 rounded-full bg-studio-emerald/10 flex items-center justify-center text-studio-emerald">
                      <Check className="w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative grid grid-cols-2 gap-4 lg:gap-8 items-stretch"
            >
              {/* Before Card */}
              <div className="group relative rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                <img 
                  src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/before.png"
                  className="w-full h-full object-cover aspect-[3/4] group-hover:scale-110 transition-transform duration-1000"
                  alt="Original Selfie"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[10px] lg:text-xs font-black text-white tracking-widest uppercase">
                  Original Selfie
                </div>
              </div>

              {/* After Card */}
              <div className="group relative rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.2)] border-4 border-studio-emerald/30 bg-slate-100 dark:bg-slate-900 transform lg:translate-y-12 transition-transform duration-700">
                <img 
                  src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/after.png"
                  className="w-full h-full object-cover aspect-[3/4] group-hover:scale-110 transition-transform duration-1000"
                  alt="AI Enhanced Headshot"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 left-6 px-4 py-2 bg-studio-emerald shadow-lg rounded-full text-[10px] lg:text-xs font-black text-white tracking-widest uppercase">
                  AI Enhanced
                </div>
                {/* Sparkle effect */}
                <div className="absolute top-4 right-4 text-white">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-emerald-500/5 rounded-full blur-[100px]"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 lg:py-16 px-4 lg:px-6 bg-white dark:bg-slate-950 overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-tight uppercase">Social <span className="text-studio-emerald">Recognition</span></h2>
            <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
              See why professionals are switching to <span className="font-bold text-slate-900 dark:text-white">HeadshotStudioPro</span> for their personal branding.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                name: "Suraj Singh",
                role: "Business Executive",
                text: "The lighting and skin texture are so natural. We used this for our entire leadership team's press kit and it looks 10x more professional now.",
                avatar: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/happy1.png"
              },
              {
                name: "Biju Pullaykkodi",
                role: "Lead Analyst",
                text: "I was skeptical at first, but the results are incredible. It saved me $100 and a whole afternoon with a photographer.",
                avatar: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/happy2.png"
              },
              {
                name: "Elena Rodriguez",
                role: "Real Estate Agent",
                text: "Fast, easy, and high quality. I needed a new headshot for a listing and got it in minutes.",
                avatar: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/happy3.png"
              }
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-studio-emerald text-studio-emerald" />)}
                </div>
                <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8 italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" alt={t.name} referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs font-medium text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 px-4 lg:px-6 bg-slate-50 dark:bg-slate-900/50 scroll-mt-20 overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 uppercase">SIMPLE <span className="text-studio-emerald">CREDIT</span> ECONOMY</h2>
            <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              One unified wallet for all Shyam Singh AI tools. Credits never expire and work across the entire ecosystem.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl w-fit mx-auto border border-slate-200 dark:border-slate-700 mb-12 shadow-sm">
            {(['INR', 'USD', 'EUR', 'GBP'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`px-6 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${
                  currency === curr ? 'bg-studio-emerald text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-16 relative mt-12">
            <div className="overflow-x-auto rounded-3xl pt-8 pb-4">
              <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50">
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[20%]">Plan Details</th>
                    <th className="p-4 text-center w-[20%]">
                      <div className="text-[10px] font-black text-studio-emerald uppercase tracking-widest mb-1">Free Trial</div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white mb-0.5">{formatPrice(0)}</div>
                    </th>
                    <th className="p-4 text-center w-[20%]">
                      <div className="text-[10px] font-black text-studio-emerald uppercase tracking-widest mb-1">Micro Pack</div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white mb-0.5">{formatPrice(199)}</div>
                    </th>
                    <th className="p-4 text-center w-[20%] relative bg-slate-50/50 dark:bg-slate-900/40 border-x-2 border-studio-emerald/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-studio-emerald text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl z-20">
                        Best Value
                      </div>
                      <div className="text-[10px] font-black text-studio-emerald uppercase tracking-widest mb-1 mt-1">Standard Suite</div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white mb-0.5">{formatPrice(699)}</div>
                    </th>
                    <th className="p-4 text-center w-[20%]">
                      <div className="text-[10px] font-black text-studio-emerald uppercase tracking-widest mb-1">Power Enterprise</div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white mb-0.5">{formatPrice(1299)}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-studio-emerald" />
                      </div>
                      <span className="text-xs">AI Credits</span>
                    </td>
                    <td className="p-4 text-center text-lg font-black text-studio-emerald">1</td>
                    <td className="p-4 text-center text-lg font-black text-studio-emerald">10</td>
                    <td className="p-4 text-center text-lg font-black text-studio-emerald bg-slate-50/50 dark:bg-slate-900/40 border-x-2 border-studio-emerald/30">50</td>
                    <td className="p-4 text-center text-lg font-black text-studio-emerald">125</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-purple-500" />
                      </div>
                      <span className="text-xs">Studio Headshots</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">2 PREVIEW HEADSHOTS</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-black text-slate-900 dark:text-white text-xs">2 HD Headshots</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">4 PREVIEW HEADSHOTS</div>
                    </td>
                    <td className="p-4 text-center bg-slate-50/50 dark:bg-slate-900/40 border-x-2 border-studio-emerald/30">
                      <div className="font-black text-slate-900 dark:text-white text-xs">10 HD Headshots</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">20 PREVIEW HEADSHOTS</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-black text-slate-900 dark:text-white text-xs">25 HD Headshots</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">50 PREVIEW HEADSHOTS</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <span className="text-xs">Watermarks</span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400 text-xs">Watermarked</td>
                    <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-300 text-xs">No Watermarks</td>
                    <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-300 text-xs bg-slate-50/50 dark:bg-slate-900/40 border-x-2 border-studio-emerald/30">No Watermarks</td>
                    <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-300 text-xs">No Watermarks</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <span className="text-xs">Processing Speed</span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400 text-xs">Standard</td>
                    <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-300 text-xs">Priority</td>
                    <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-300 text-xs bg-slate-50/50 dark:bg-slate-900/40 border-x-2 border-studio-emerald/30">Priority</td>
                    <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-300 text-xs">Priority Queue</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</td>
                    <td className="p-4 text-center">
                      {/* Removed as requested */}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => onOpenShop(10)} className="w-full py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        BUY CREDITS
                      </button>
                    </td>
                    <td className="p-4 text-center bg-slate-50/50 dark:bg-slate-900/40 border-x-2 border-studio-emerald/30">
                      <button onClick={() => onOpenShop(50)} className="w-full py-4 rounded-xl bg-studio-emerald text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                        GET STARTED
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => onOpenShop(125)} className="w-full py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        GO PRO
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              <span className="text-studio-emerald mr-1 font-black">★</span> 
              <span className="underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 font-bold">For group or corporate bookings, please reach out through our Support Hub</span> or email us at <a href="mailto:headshotstudiopro@gmail.com" className="text-studio-emerald hover:underline font-bold">headshotstudiopro@gmail.com</a>
            </p>
          </div>
        </div>
      </section>

      {/* Explore More Ecosystem Section */}
      <section className="py-24 bg-white dark:bg-black/20 border-y border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col items-start mb-16 text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Explore More AI Tools
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
              Discover other powerful AI utilities by Shyam Kishore Singh
            </p>
          </div>
          
          <ExploreMoreTools />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 transition-colors mt-12 lg:mt-24 overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-4">
            {/* Logo & Description */}
            <div className="space-y-3 md:col-span-12 lg:col-span-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center text-white">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-3xl font-black tracking-tighter text-white">
                  Headshot<span className="text-studio-emerald">Studio</span>Pro
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                The world's most advanced AI headshot generator. Professional portraits for everyone, everywhere.
              </p>
            </div>

            {/* Product Column */}
            <div className="space-y-3 md:col-span-4 lg:col-span-2 lg:col-start-7">
              <h4 className="text-sm font-bold text-white">Product</h4>
              <ul className="space-y-2">
                <li><button onClick={() => { setView('landing'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Pricing</button></li>
                <li><button onClick={() => { setView('landing'); setTimeout(() => document.getElementById('samples')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Samples</button></li>
                <li><button onClick={() => { setView('landing'); setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">How it Works</button></li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="space-y-3 md:col-span-4 lg:col-span-2">
              <h4 className="text-sm font-bold text-white">Support</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onOpenFAQ('faq')} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Support</button></li>
                <li><button onClick={() => onOpenFAQ('support')} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Feedback</button></li>
                <li><button onClick={() => setIsPrivacyOpen(true)} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Privacy Policy</button></li>
              </ul>
            </div>

            {/* Connect Column */}
            <div className="space-y-3 md:col-span-4 lg:col-span-2">
              <h4 className="text-sm font-bold text-white">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#10b981] hover:border-[#10b981] transition-all">
                  <Linkedin className="w-4 h-4" />
                </a>
                <button onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'HeadshotStudioPro',
                      text: 'Check out the world\'s most advanced AI headshot generator!',
                      url: window.location.href,
                    }).catch(console.error);
                  }
                }} className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#10b981] hover:border-[#10b981] transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Background */}
        <div className="bg-slate-950 border-t border-slate-800 py-3 px-4 lg:px-6">
          <div className="max-w-7xl mx-auto flex justify-center items-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
              © 2026 HeadshotStudioPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Privacy Modal */}
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};

const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const applyFiltersToImage = (base64: string, filters: any): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation - (filters.vintage * 0.3)}%) grayscale(${filters.grayscale}%) sepia(${filters.vintage * 0.6}%) hue-rotate(${filters.hue - (filters.vintage * 0.2)}deg)`;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      console.error("Filter application failed: image load error");
      resolve(base64);
    };
    img.src = base64;
  });
};

const applyWatermark = (base64: string, isTransparent: boolean = false): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const fontSize = Math.floor(canvas.width / 50); 
      ctx.font = `800 ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(160, 160, 160, 0.22)'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = 'HEADSHOT STUDIO';
      const rows = 6;
      const cols = 4;
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          ctx.save();
          const x = (canvas.width / (cols + 1)) * c + (r % 2 === 0 ? fontSize * 2 : 0);
          const y = (canvas.height / (rows + 1)) * r;
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 12);
          ctx.fillText(text, 0, 0);
          ctx.font = `700 ${fontSize * 0.6}px Inter, sans-serif`;
          ctx.fillText('PREVIEW ONLY', 0, fontSize * 0.8);
          ctx.restore();
        }
      }
      resolve(canvas.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', isTransparent ? undefined : 0.85));
    };
    img.onerror = () => {
      console.error("Watermark application failed: image load error");
      resolve(base64); // Fallback to original image if watermarking fails
    };
    img.src = base64;
  });
};

const CameraModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64: string) => void;
  onError: (msg: string) => void;
}> = ({ isOpen, onClose, onCapture, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera access error: getUserMedia not supported");
        onError("Camera access is not supported in this environment or browser.");
        onClose();
        return;
      }

      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(s => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera access error:", err);
          onError("Could not access camera. Please check permissions.");
          onClose();
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        onCapture(canvasRef.current.toDataURL('image/jpeg'));
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 lg:p-6 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-md shadow-2xl max-w-2xl w-full overflow-hidden p-6 lg:p-8 relative border border-white dark:border-slate-800">
        <button onClick={onClose} className="absolute top-4 right-4 lg:top-6 lg:right-6 w-8 h-8 lg:w-10 lg:h-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all z-10">
          <X className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-1">Source Portrait</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] tracking-wider uppercase">Capture your photo for AI transformation</p>
        </div>
        <div className="relative rounded-md overflow-hidden bg-slate-900 aspect-video mb-8 border-4 border-slate-50 dark:border-slate-800 shadow-inner">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover -scale-x-100" />
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <button onClick={capture} className="w-full py-5 rounded-md bg-[#10b981] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#2d8a60] transition-all shadow-lg shadow-emerald-500/20">
          <Camera className="w-4 h-4" /> Capture Portrait
        </button>
      </div>
    </div>
  );
};



const OptionButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  isRecommended?: boolean;
  showLabel?: boolean;
  shape?: 'circle' | 'square';
  description?: string;
}> = ({ label, active, onClick, color, isRecommended, showLabel = true, shape = 'circle', description }) => (
  <button
    onClick={onClick}
    title={showLabel ? (isRecommended ? "Recommended" : undefined) : label}
    className={`transition-all flex flex-col items-start gap-1 relative outline-none focus:outline-none ${
      showLabel 
        ? `px-4 py-2.5 rounded-2xl border ${
            active 
              ? 'bg-[#10b981] text-white border-[#10b981] shadow-md shadow-[#10b981]/20' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-[#10b981]/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`
        : `p-0 ${shape === 'square' ? 'rounded-lg' : 'rounded-full'} border-0 bg-transparent hover:bg-transparent transition-none ${
            active ? 'z-10' : ''
          }`
    } tracking-tight group active:scale-95`}
  >
    <div className="flex items-center gap-2.5 w-full">
      {isRecommended && showLabel && (
        <div className={`absolute -top-2 -right-1 px-1.5 py-1 rounded-full text-[8px] font-bold shadow-sm ${active ? 'bg-white text-[#10b981]' : 'bg-[#10b981] text-white'}`}>
          <Star className="w-2.5 h-2.5 fill-current" />
        </div>
      )}
      {color && (
        <motion.span 
          initial={false}
          animate={{ 
            scale: active ? 1.15 : 1,
            boxShadow: active ? '0 4px 15px rgba(0, 184, 124, 0.4), 0 0 0 4px rgba(16, 185, 129, 0.15)' : 'inset 0 1px 2px rgba(0,0,0,0.05)'
          }}
          whileHover={{ scale: 1.2 }}
          className={`${showLabel ? 'w-3.5 h-3.5 border border-white/20' : 'w-[28px] h-[28px]'} ${shape === 'square' ? 'rounded-md' : 'rounded-full'} flex-shrink-0 ${
            active 
              ? 'ring-2 ring-white dark:ring-slate-900 ring-offset-2 ring-offset-studio-emerald transition-all' 
              : 'ring-1 ring-slate-200 dark:ring-slate-700'
          }`} 
          style={{ 
            background: color === 'rainbow' 
              ? 'conic-gradient(from 0deg, #ff0000, #ffa500, #ffff00, #008000, #0000ff, #4b0082, #ee82ee, #ff0000)' 
              : color 
          }}
        >
          {active && !showLabel && (
            <div className="w-full h-full flex items-center justify-center text-white scale-75 animate-in zoom-in-50 duration-200">
               <Check className="w-5 h-5 stroke-[4px]" />
            </div>
          )}
        </motion.span>
      )}
      {showLabel && <span className={`leading-tight font-bold text-[11px] ${active ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{label}</span>}
    </div>
    {showLabel && description && (
      <span className={`text-[9px] leading-tight text-left ${active ? 'text-emerald-50/80' : 'text-slate-500 dark:text-slate-500'}`}>
        {description}
      </span>
    )}
  </button>
);

const RichSelect: React.FC<{
  options: { value: any; label: string; description?: string; isRecommended?: boolean }[];
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}> = ({ options, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all outline-none focus:outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#10b981]/50'
        } ${
          isOpen ? 'border-[#10b981] ring-2 ring-[#10b981]/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {selectedOption.label}
            </span>
            {selectedOption.isRecommended && (
              <Star className="w-3 h-3 fill-[#00b87c] text-[#00b87c]" />
            )}
          </div>
          {selectedOption.description && (
            <span className="text-[10px] text-slate-500 dark:text-slate-500 leading-tight">
              {selectedOption.description}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute z-[300] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-[300px] overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex flex-col items-start gap-1 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                  value === option.value ? 'bg-[#10b981]/10 dark:bg-[#10b981]/10' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-bold leading-tight ${
                      value === option.value ? 'text-[#10b981] dark:text-[#10b981]' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {option.label}
                    </span>
                    {option.isRecommended && (
                      <Star className="w-3 h-3 fill-[#00b87c] text-[#00b87c]" />
                    )}
                  </div>
                  {value === option.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  )}
                </div>
                {option.description && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 leading-tight text-left">
                    {option.description}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BackdropOptionButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}> = ({ label, active, onClick, color }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative group flex items-center justify-center overflow-hidden rounded-lg border-2 transition-all outline-none focus:outline-none aspect-square ${
        active 
          ? 'border-studio-emerald ring-4 ring-studio-emerald/20 shadow-lg scale-105' 
          : 'border-slate-200 dark:border-slate-800 hover:border-studio-emerald/40 hover:scale-105'
      } w-full`}
    >
      <div 
        className="w-full h-full"
        style={{ 
          background: color === 'rainbow' 
            ? 'conic-gradient(from 0deg, #ff0000, #ffa500, #ffff00, #008000, #0000ff, #4b0082, #ee82ee, #ff0000)' 
            : color 
        }}
      />
      {active && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 animate-in zoom-in-50 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-emerald-500/20">
            <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" />
          </div>
        </div>
      )}
    </button>
  );
};

const SidebarSection: React.FC<{
  title: string;
  icon: any;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isCompleted?: boolean;
  collapsible?: boolean;
  disabled?: boolean;
  selectedValue?: string;
  titleClassName?: string;
  isAuto?: boolean;
  onAutoToggle?: () => void;
  hideAutoBanner?: boolean;
}> = ({ title, icon: Icon, isOpen, onToggle, children, isCompleted, collapsible = true, disabled = false, selectedValue, titleClassName, isAuto, onAutoToggle, hideAutoBanner = false }) => {
  const isExpanded = !collapsible || (isOpen && !disabled);
  
  return (
    <div className={`transition-all duration-300 ${disabled ? 'opacity-40 grayscale pointer-events-none' : ''} ${isExpanded ? 'bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700' : 'bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-xl'}`}>
      <div 
        className={`w-full px-4 py-2.5 flex items-center justify-between group ${collapsible && !disabled ? 'cursor-pointer' : ''}`}
        onClick={collapsible && !disabled ? onToggle : undefined}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-studio-emerald text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-studio-emerald group-hover:bg-studio-emerald/10'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-left flex flex-col">
            <h3 className={`${titleClassName || 'text-sm'} font-medium tracking-tight transition-colors ${isExpanded ? 'text-slate-900 dark:text-white' : 'text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white'}`}>{title}</h3>
            {isAuto && !isExpanded && (
              <span className="text-xs font-medium text-studio-emerald tracking-tight flex items-center gap-1 mt-0.5">
                <Wand2 className="w-3 h-3" /> AI Auto Mode
              </span>
            )}
            {/* Manual selections are now hidden when section is collapsed per user feedback v1.1.15 */}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onAutoToggle && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium uppercase tracking-wider ${isAuto ? 'text-studio-emerald' : 'text-slate-500 dark:text-slate-400'}`}>Auto</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAutoToggle();
                }}
                className={`w-9 h-5 rounded-full transition-all relative ${isAuto ? 'bg-[#10b981]' : 'bg-[#cbd5e1] dark:bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isAuto ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>
          )}
          
          {collapsible && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-slate-100 dark:bg-slate-800' : 'group-hover:bg-slate-200 dark:group-hover:bg-slate-800'}`}>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-500 ${isOpen ? 'rotate-180 text-emerald-500' : 'group-hover:text-slate-400'}`} />
            </div>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className={`px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-500 ${isAuto ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          {isAuto && !hideAutoBanner && (
            <div className="mb-4 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">AI Auto Mode Active</p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 font-medium">AI will select the best options for you.</p>
              </div>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ icon: any; title: string }> = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-6">
    <Icon className="w-4 h-4 text-studio-emerald" />
    <h2 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">{title}</h2>
  </div>
);

const SubHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-2 mt-3">
    <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
  </div>
);



const ProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  history: TokenHistoryItem[];
  onUpdate: (e: React.FormEvent) => void;
  onOpenShop: () => void;
  formFields: {
    name: string; setName: (v: string) => void;
    phone: string; setPhone: (v: string) => void;
  };
  isSaving: boolean;
}> = ({ isOpen, onClose, profile, history, onUpdate, onOpenShop, formFields, isSaving }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  if (!isOpen) return null;

  const handleOpenShop = () => {
    onClose();
    onOpenShop();
  };

  const isGuest = profile?.id === 'guest' || profile?.email === 'Guest User';
  const displayName = isGuest ? 'Guest' : (profile?.full_name || (profile?.email ? profile.email.split('@')[0] : 'User'));

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-6 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl lg:rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-white/20 dark:border-slate-800 p-5 lg:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="absolute top-4 right-4 lg:top-6 lg:right-6 flex items-center gap-2">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-studio-emerald hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-studio-emerald text-[10px] font-black tracking-tight mb-3">
            <User className="w-3 h-3" /> Account Profile
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                Hello, <span className="text-studio-emerald">{displayName}</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px] tracking-tight">Welcome back to your professional workspace</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-studio-emerald text-white px-3 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                <Coins className="w-3.5 h-3.5" />
                <span>{profile?.tokens ?? 0} Credits</span>
              </div>
              <button 
                onClick={handleOpenShop}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-studio-emerald dark:text-emerald-400 rounded-md text-xs font-semibold hover:bg-studio-emerald hover:text-white transition-all border border-slate-200 dark:border-slate-700"
              >
                {isGuest ? 'Get Credits' : 'Add Credits'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!isGuest && (
            <>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 tracking-tight flex items-center gap-2 uppercase">
                  <IdCard className="w-3.5 h-3.5 text-studio-emerald" /> Account Details
                </h3>
                <form onSubmit={onUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 tracking-tight ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter your name" 
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent outline-none font-bold text-[11px] text-slate-700 dark:text-slate-200 focus:border-studio-emerald focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm" 
                        value={formFields.name} 
                        onChange={e => formFields.setName(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 tracking-tight ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="Enter phone" 
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent outline-none font-bold text-[11px] text-slate-700 dark:text-slate-200 focus:border-studio-emerald focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm" 
                        value={formFields.phone} 
                        onChange={e => formFields.setPhone(e.target.value)} 
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full py-3.5 rounded-xl bg-studio-emerald text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10 hover:bg-studio-emerald-dark transition-all">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Save & Close'}
                  </button>
                </form>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-studio-emerald transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-studio-emerald" />
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Transaction History</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isHistoryOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden mt-2">
                        {history.length > 0 ? (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 w-full">
                            {history.map((item) => (
                              <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-500"><Coins className="w-4 h-4" /></div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">+{item.amount} Credits Pack</p>
                                    <p className="text-[9px] text-slate-400 font-bold tracking-tight mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50">SUCCESS</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 px-4">
                            <p className="text-[10px] font-black text-slate-400 tracking-tight">No transactions recorded</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const Header: React.FC<{ 
  onOpenSupport: (tab: 'how' | 'faq' | 'support') => void; 
  onOpenShop: (tokens?: number) => void; 
  onOpenSamples: () => void;
  onOpenProfile: () => void; 
  onGoHome: () => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
  profile: UserProfile | null; 
  isGuest?: boolean;
  session: any;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}> = ({ onOpenSupport, onOpenShop, onOpenSamples, onOpenProfile, onGoHome, onLogout, onOpenDashboard, profile, isGuest, session, darkMode, onToggleDarkMode }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isVerified = (profile?.full_name || profile?.email) && session;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="px-4 lg:px-12 py-4 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-100 dark:border-white/[0.05] transition-all gap-4">
      <div className="flex items-center gap-6 lg:gap-10">
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={onGoHome}>
          <div className="bg-gradient-to-br from-studio-emerald to-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
            <Camera className="w-5 h-5" />
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
              Headshot<span className="text-studio-emerald">Studio</span>Pro
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Premium AI Portraits</span>
              <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 animate-pulse">v1.1.14</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 shrink-0">
        <div className="hidden md:block">
          <AISuiteMenu />
        </div>
        {isVerified && !isGuest && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#ecfdf5] border border-[#059669]/10 rounded-full text-[10px] font-black text-[#059669] tracking-widest uppercase animate-pulse-slow">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified User
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
          <div className="md:hidden">
            <AISuiteMenu />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
              className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all border ${isDropdownOpen ? 'bg-studio-emerald/5 border-studio-emerald/20 shadow-sm' : 'hover:bg-slate-50 border-transparent'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDropdownOpen ? 'bg-studio-emerald text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                <User className="w-4 h-4" />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-0 z-50 overflow-hidden"
                >
                  <div className="px-5 py-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-50 dark:border-white/[0.05]">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-left">Logged in as</p>
                    <p className="text-[13px] font-black text-slate-800 dark:text-white truncate text-left">{profile?.email || 'Guest User'}</p>
                  </div>
                  
                  <div className="p-2">
                    <button 
                      onClick={() => { onOpenShop(); setIsDropdownOpen(false); }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Credits: {profile?.tokens || 0}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-studio-emerald uppercase group-hover:underline">Upgrade</span>
                    </button>

                    <button 
                      onClick={() => { onOpenDashboard(); setIsDropdownOpen(false); }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <Grid className="w-4 h-4 text-slate-400" />
                      <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Dashboard</p>
                    </button>

                    <div className="my-1 border-t border-slate-50 dark:border-white/[0.05]" />

                    <button 
                      onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex items-center gap-3 text-red-500 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <p className="text-[13px] font-black">Sign Out</p>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

const AuthScreen: React.FC<{ onAuth: (session: any) => void; onGuestLogin: () => void; onGoHome: () => void }> = ({ onAuth, onGuestLogin, onGoHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(formatErrorMessage(err, "Google login failed. Please try again."));
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null); setSuccessMsg(null);
    try {
      if (isSignUp) { 
        const { error } = await supabase.auth.signUp({ email, password }); 
        if (error) throw error; 
        setSuccessMsg('Verification email sent! Please check your inbox.'); 
      } else { 
        const { data, error } = await supabase.auth.signInWithPassword({ email, password }); 
        if (error) throw error; 
        onAuth(data.session); 
      }
    } catch (err: any) { 
      setError(formatErrorMessage(err, "Authentication failed.")); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex flex-col transition-colors font-sans">
      <header className="px-4 lg:px-12 py-4 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-black/[0.05] dark:border-white/[0.05] sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onGoHome}>
          <div className="bg-studio-emerald w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black tracking-[-0.06em] text-slate-900 dark:text-white">
            Headshot<span className="text-studio-emerald">Studio</span>Pro
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Visual/Marketing */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 dark:bg-black relative overflow-hidden items-center justify-center p-12">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-studio-emerald/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-studio-emerald/10 border border-studio-emerald/20 text-studio-emerald text-[10px] font-black tracking-widest uppercase mb-6">
                AI-Powered Excellence
              </div>
              <h2 className="text-5xl xl:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-8">
                Professional <br />
                <span className="text-studio-emerald">Headshots</span> <br />
                Made Instant.
              </h2>
              
              <div className="space-y-6">
                {[
                  { title: "Studio Quality", desc: "Get high-end results without the studio cost." },
                  { title: "Lightning Fast", desc: "Generate your professional profile in seconds." },
                  { title: "Unlimited Styles", desc: "Choose from dozens of professional looks." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-studio-emerald" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-12 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                        <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Trusted by <span className="text-white">1,000+</span> professionals
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-slate-950 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[400px] space-y-8"
          >
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="bg-studio-emerald w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Camera className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                  Headshot<span className="text-studio-emerald">Studio</span>Pro
                </h1>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-500 text-[15px] font-medium">
                {isSignUp ? 'Start your professional journey today.' : 'Sign in to access your studio.'}
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Continue with Google
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-100 dark:border-white/[0.05]"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[11px] font-black uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-100 dark:border-white/[0.05]"></div>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-studio-emerald transition-colors" />
                    <input 
                      type="email" 
                      required 
                      placeholder="name@example.com" 
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-studio-emerald focus:bg-white dark:focus:bg-white/10 outline-none text-[14px] transition-all font-medium"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    {!isSignUp && (
                      <button type="button" className="text-[11px] font-black text-studio-emerald hover:underline uppercase tracking-wider">Forgot?</button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-studio-emerald transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="••••••••" 
                      className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-studio-emerald focus:bg-white dark:focus:bg-white/10 outline-none text-[14px] transition-all font-medium"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-studio-emerald transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400 text-[13px] font-medium"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 flex items-center gap-3 text-green-600 dark:text-green-400 text-[13px] font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    {successMsg}
                  </motion.div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-studio-emerald text-white font-semibold text-sm shadow-sm hover:bg-studio-emerald-dark transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              <div className="pt-6 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-studio-emerald font-semibold hover:underline text-sm ml-1"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>

              <div className="pt-6 flex items-center justify-center border-t border-slate-100 dark:border-white/[0.05] mt-6">
                <button 
                  onClick={onGuestLogin}
                  className="text-sm font-semibold text-slate-500 hover:text-studio-emerald transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

const Dashboard: React.FC<{
  profile: UserProfile | null;
  history: TokenHistoryItem[];
  onUpdate: (e: React.FormEvent) => void;
  onOpenShop: () => void;
  onOpenSupport: (tab: 'how' | 'faq' | 'support') => void;
  onOpenGallery: () => void;
  formFields: {
    name: string; setName: (v: string) => void;
    phone: string; setPhone: (v: string) => void;
  };
  isSaving: boolean;
  onBack: () => void;
  previewsUsed: number;
  MAX_FREE_PREVIEWS: number;
}> = ({ profile, history, onUpdate, onOpenShop, onOpenSupport, onOpenGallery, formFields, isSaving, onBack, previewsUsed, MAX_FREE_PREVIEWS }) => {
  const isGuest = profile?.id === 'guest' || profile?.email === 'Guest User';
  const displayName = isGuest ? 'Guest' : (profile?.full_name || (profile?.email ? profile.email.split('@')[0] : 'User'));

  const handleOpenShop = () => {
    onOpenShop();
  };

  return (
    <div className="flex-grow bg-[#fbfbfd] dark:bg-slate-950 p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-studio-emerald text-[10px] font-black tracking-tight mb-3 uppercase">
              Studio Workspace
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              Welcome back, <span className="text-studio-emerald">{displayName}</span>.
            </h1>
          </div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:border-studio-emerald hover:text-studio-emerald transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Studio
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Profile Card - Moved to top */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-studio-emerald">
                  <IdCard className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Account Profile</h3>
              </div>

              <form onSubmit={onUpdate} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Enter your name" 
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent outline-none font-bold text-sm text-slate-700 dark:text-slate-200 focus:border-studio-emerald focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm" 
                      value={formFields.name} 
                      onChange={e => formFields.setName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      disabled
                      className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-transparent outline-none font-bold text-sm text-slate-400 cursor-not-allowed" 
                      value={profile?.email || ''} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="Enter phone" 
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent outline-none font-bold text-sm text-slate-700 dark:text-slate-200 focus:border-studio-emerald focus:bg-white dark:focus:bg-slate-700 transition-all shadow-sm" 
                      value={formFields.phone} 
                      onChange={e => formFields.setPhone(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="px-6 py-2.5 rounded-lg bg-studio-emerald text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-studio-emerald-dark transition-all active:scale-[0.98]"
                  >
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* My Gallery Card - Moved below Profile */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                  <Image className="w-5 h-5" />
                </div>
                <button onClick={onOpenGallery} className="text-xs font-semibold text-studio-emerald hover:underline">View All</button>
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight mb-2">My Gallery</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">Access all your generated professional headshots in one place.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Your Balance Card */}
            <div className="bg-[#1e293b] dark:bg-slate-900 rounded-xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/20 transition-all" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <Coins className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Active Balance</p>
                    <p className="text-3xl font-black tracking-tighter">{profile?.tokens ?? 0} <span className="text-xs font-medium text-slate-400">Credits</span></p>
                  </div>
                </div>
                
                {(() => {
                  const tokens = profile?.tokens ?? 0;
                  const freeLeft = Math.max(0, MAX_FREE_PREVIEWS - previewsUsed);
                  
                  // Logic for "Full Capacity" without decimals
                  const hdCapacity = Math.floor(tokens / CREDIT_COST_HD);
                  const previewCapacity = freeLeft + (profile?.previews_remaining ?? 0) + tokens;
                  
                  // Mixed capacity example from user: 9 credits = 1 HD (5) + 4 Previews (4)
                  const mixedHD = hdCapacity;
                  const mixedPre = (profile?.previews_remaining ?? 0) + (tokens % CREDIT_COST_HD);
                  
                  return (
                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Max Utilization</p>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                             <span>{previewCapacity} <span className="text-[10px] font-medium text-slate-400 uppercase">Previews</span></span>
                             <span className="text-slate-600 text-xs">— OR —</span>
                             <span>{hdCapacity} <span className="text-[10px] font-medium text-slate-400 uppercase">HD Portraits</span></span>
                          </p>
                        </div>
                        <div className={`h-2 w-2 rounded-full animate-pulse ${(previewCapacity + hdCapacity) > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </div>

                      {tokens > 0 && (
                        <div className="p-3 bg-studio-emerald/10 border border-studio-emerald/20 rounded-lg">
                          <p className="text-[9px] font-black text-studio-emerald uppercase tracking-tighter mb-1.5 flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Smart Credit Usage
                          </p>
                          <p className="text-[11px] font-medium text-slate-300 leading-tight">
                            {mixedPre > 0 
                              ? `You can generate ${mixedHD > 0 ? `${mixedHD} HD ${mixedHD === 1 ? 'portrait' : 'portraits'} AND ` : ''}${mixedPre} additional ${mixedPre === 1 ? 'preview' : 'previews'}.`
                              : `Your balance allows for ${mixedHD} HD ${mixedHD === 1 ? 'portrait' : 'portraits'}. (Each HD uses 5 credits).`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">Use your credits to generate high-resolution professional headshots with our advanced AI models.</p>
                <button 
                  onClick={handleOpenShop}
                  className="w-full py-2.5 rounded-lg bg-studio-emerald text-white text-sm font-semibold shadow-sm hover:bg-studio-emerald-dark transition-all active:scale-[0.98]"
                >
                  Add Credits
                </button>
              </div>
            </div>

            {/* Need Assistance Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-6">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight mb-2">Need assistance?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">Our support team is here to help you with any questions or technical issues.</p>
              <button 
                onClick={() => onOpenSupport('support')}
                className="w-full py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Default settings for image generation
const DEFAULT_SETTINGS: GenerationSettings = { 
  personType: PersonType.AUTO,
  pose: PoseAngle.FULL_FRONT,
  wardrobe: Wardrobe.CORPORATE,
  expression: Expression.PROFESSIONAL,
  enableSmile: false,
  style: AppStyle.CORPORATE_EXECUTIVE, 
  background: BackgroundStyle.PURE_WHITE, 
  clothingChoice: ClothingChoice.SUIT_AND_TIE, 
  clothingStyle: ClothingStyle.NAVY_BLUE, 
  useCustomTieColor: false, 
  tieColor: TieColor.MAROON,
  customTieHex: '#800000',
  useCustomSuitColor: false,
  customSuitHex: '#000080',
  beautyFilter: 45,
  smoothing: 40,
  faceLeftLighting: 75,
  faceRightLighting: 75,
  bodyPose: BodyPose.FULL_FRONT,
  eyeEnhancement: true,
  enableFairness: false,
  enableFaceSmoothing: false,
  enableBeautification: false,
  enableAdditionalSettings: true,
  lighting: LightingOption.BUTTERFLY,
  doctorCoatColor: DoctorCoatColor.WHITE,
  stethoscopePosition: StethoscopePosition.NONE,
  enableBlackCoat: true,
  enableNeckBand: true,
  useCustomBackgroundColor: false,
  customBackgroundHex: '#ffffff'
};

const StepHeader: React.FC<{
  step: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  summary?: string;
}> = ({ step, title, isActive, isCompleted, onClick, summary }) => {
  const getStepColor = () => {
    if (isActive) return 'bg-studio-emerald shadow-emerald-500/20';
    if (isCompleted) return 'bg-slate-800 dark:bg-slate-700';
    return 'bg-slate-200 dark:bg-slate-800 text-slate-500';
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${isActive ? 'bg-white dark:bg-slate-900 border-studio-emerald shadow-sm shadow-emerald-500/5' : 'bg-slate-50/30 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm transition-all ${getStepColor()} ${isActive ? 'ring-2 ring-studio-emerald/20 scale-110' : 'scale-100'}`}>
          {step}
        </div>
        <div className="text-left">
          <p className={`text-[12px] font-bold tracking-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{title}</p>
          {summary && !isActive && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] leading-none mt-0.5">{summary}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isCompleted && !isActive && <Check className="w-3.5 h-3.5 text-studio-emerald" />}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}`} />
      </div>
    </button>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'auth' | 'app' | 'dashboard'>('landing');
  const [session, setSession] = useState<any>(null);
  const [isSupportHubOpen, setIsSupportHubOpen] = useState(false);
  const [supportHubInitialTab, setSupportHubInitialTab] = useState<'how' | 'faq' | 'support'>('how');
  const [supportHubHideTabs, setSupportHubHideTabs] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<TokenHistoryItem[]>([]);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  const hasFetchedGenerations = useRef(false);
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [activeGen, setActiveGen] = useState<GenerationRecord | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  // Log originalImage changes
  useEffect(() => {
    console.log("originalImage state changed:", { 
      hasValue: !!originalImage, 
      length: originalImage?.length,
      preview: originalImage ? originalImage.substring(0, 50) + "..." : "null"
    });
  }, [originalImage]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Analyzing facial structure...",
    "Refining portrait lighting...",
    "Applying professional attire...",
    "Enhancing skin texture...",
    "Optimizing background bokeh...",
    "Finalizing high-res details...",
    "AI is under high demand, prioritizing your request...",
    "Almost there, perfecting the final touches...",
    "Still working, our AI is ensuring the best quality..."
  ];

  useEffect(() => {
    let interval: any;
    if (isGenerating || isUnlocking) {
      interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating, isUnlocking]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isSamplesOpen, setIsSamplesOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isStyleSamplesOpen, setIsStyleSamplesOpen] = useState(false);
  const [isBackgroundSamplesOpen, setIsBackgroundSamplesOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('studio_dark_mode');
    return stored === 'true';
  });
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onCropClick = () => {
    if (displayUrl) {
      setIsCropModalOpen(true);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const getCroppedImg = async () => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    const base64Image = canvas.toDataURL('image/jpeg');
    setDisplayUrl(base64Image);
    
    // Update the generation in state if it's the active one
    if (activeGen) {
      setGenerations(prev => prev.map(g => 
        g.id === activeGen.id ? { ...g, image_data: base64Image } : g
      ));
      setActiveGen(prev => prev ? { ...prev, image_data: base64Image } : null);
    }
    
    setIsCropModalOpen(false);
    setToast({ message: 'Image cropped successfully', type: 'success' });
  };

  const [currency, setCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>('INR');
  
  const [previewsUsed, setPreviewsUsed] = useState<number>(() => {
    const stored = localStorage.getItem('studio_previews_used');
    return stored ? parseInt(stored, 10) : 0;
  });

  const [consecutivePreviews, setConsecutivePreviews] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('studio_previews_used', previewsUsed.toString());
  }, [previewsUsed]);

  const MAX_FREE_PREVIEWS = 2;
  
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showProfessionalStyles, setShowProfessionalStyles] = useState(false);
  const [openSidebarSection, setOpenSidebarSection] = useState<string | null>(null);
  const [imageFilters, setImageFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    hue: 0,
    vintage: 0,
  });
  const [isZoomed, setIsZoomed] = useState(false);
  const [isConfirmingUnlock, setIsConfirmingUnlock] = useState(false);
  const [isConfirmingDirectHD, setIsConfirmingDirectHD] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Auto-advance steps
  useEffect(() => {
    if (originalImage && currentStep === 1) {
      setCurrentStep(2);
    } else if (!originalImage && currentStep !== 1) {
      setCurrentStep(1);
    }
  }, [originalImage]);
  
  const onOpenSupport = (tab: 'how' | 'faq' | 'support' = 'how', hideTabs: boolean = false) => {
    setSupportHubInitialTab(tab);
    setSupportHubHideTabs(hideTabs);
    setIsSupportHubOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (session?.user?.id) {
      cleanupOldGenerations(session.user.id);
    }
  }, [session?.user?.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setToast({ message: "File is too large. Max 10MB.", type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        // Compress source image to save bandwidth and storage
        const compressed = await compressImage(result, 1200, 0.8);
        setOriginalImage(compressed);
        setIsVerified(false);
        setActiveGen(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const [sessionStartTime] = useState<string>(() => {
    const stored = sessionStorage.getItem('studio_session_start');
    if (stored) return stored;
    const now = new Date().toISOString();
    sessionStorage.setItem('studio_session_start', now);
    return now;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('studio_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('studio_previews_used', String(previewsUsed));
  }, [previewsUsed]);

  const cleanupGenerations = async (userId: string) => {
    try {
      // Retention Policy: Previews (5 days), HD (15 days)
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      // Fetch expired previews to delete from storage
      const { data: expiredPreviews } = await supabase
        .from('generations')
        .select('image_data')
        .eq('user_id', userId)
        .eq('is_unlocked', false)
        .lt('created_at', fiveDaysAgo.toISOString());

      if (expiredPreviews && expiredPreviews.length > 0) {
        for (const gen of expiredPreviews) {
          if (gen.image_data) await deleteFromSupabaseStorage(gen.image_data);
        }
      }

      // Delete expired previews from DB
      await supabase
        .from('generations')
        .delete()
        .eq('user_id', userId)
        .eq('is_unlocked', false)
        .lt('created_at', fiveDaysAgo.toISOString());

      // Fetch expired HD images to delete from storage
      const { data: expiredHD } = await supabase
        .from('generations')
        .select('image_data')
        .eq('user_id', userId)
        .eq('is_unlocked', true)
        .lt('created_at', fifteenDaysAgo.toISOString());

      if (expiredHD && expiredHD.length > 0) {
        for (const gen of expiredHD) {
          if (gen.image_data) await deleteFromSupabaseStorage(gen.image_data);
        }
      }

      // Delete expired HD images from DB
      await supabase
        .from('generations')
        .delete()
        .eq('user_id', userId)
        .eq('is_unlocked', true)
        .lt('created_at', fifteenDaysAgo.toISOString());

      console.log("Privacy cleanup completed.");
    } catch (e) {
      console.warn("Cleanup error:", e);
    }
  };

  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log("Diagnostic: APP_URL check:", { 
          envAppUrl: process.env.APP_URL, 
          locationOrigin: window.location.origin 
        });
        console.log("Diagnostic: Checking backend health at /api/health...");
        const res = await safeFetch('/api/health', {}, 5, 2000); 
        if (res.ok) {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            console.log("Diagnostic: Backend Health Check Response:", data);
            if (!data.supabase) {
              console.warn("Diagnostic: Backend reports Supabase is NOT initialized.");
              setToast({
                message: "Server-side Supabase connection is missing. Check environment variables.",
                type: 'warning'
              });
            }
          } catch (parseErr) {
            console.error("Diagnostic: Backend health check returned non-JSON response:", text.substring(0, 500));
            throw new Error(`Invalid response format from backend. Expected JSON, got: ${text.substring(0, 50).replace(/<[^>]*>/g, '')}...`);
          }
        } else {
          const text = await res.text();
          console.error(`Diagnostic: Backend health check failed (Status: ${res.status}):`, text);
          setToast({
            message: `Backend health check failed (Status: ${res.status}).`,
            type: 'error'
          });
        }
      } catch (err: any) {
        console.error("Diagnostic: Backend health check fetch error:", err);
        const isFailedToFetch = (err.message || String(err)).toLowerCase().includes('failed to fetch');
        setToast({
          message: isFailedToFetch 
            ? "Backend unreachable: The server might be starting up or blocked by a firewall/VPN."
            : `Backend error: ${err.message || 'Unknown error'}`,
          type: 'error'
        });
      }
    };

    const checkSupabase = async () => {
      try {
        // Helper to get env var safely
        const getEnv = (name: string, fallback: string = ''): string => {
          const val = import.meta.env[name] || (process.env as any)[name] || fallback;
          if (val === 'undefined' || val === 'null' || !val) return fallback;
          return val.trim();
        };

        // Check if keys are even present
        let url = getEnv('VITE_SUPABASE_URL', 'https://auqwezpczravciclsemz.supabase.co');
        if (url && !url.startsWith('http')) {
          url = `https://${url}.supabase.co`;
        }
        const key = getEnv('VITE_SUPABASE_ANON_KEY', '');
        
        console.log("Diagnostic: Supabase Config Check:", { url, hasKey: !!key });

        if (!key) {
          console.error("Supabase Anon Key is missing in frontend environment.");
          setToast({
            message: "Supabase configuration missing: VITE_SUPABASE_ANON_KEY is not set.",
            type: 'error'
          });
          return;
        }

        const isFallback = url.includes('auqwezpczravciclsemz');

        // Retry logic for Supabase check
        let supabaseResult: any = null;
        let retries = 3;
        while (retries > 0) {
          supabaseResult = await supabase.from('profiles').select('count', { count: 'exact', head: true });
          if (!supabaseResult.error) break;
          if (!supabaseResult.error.message?.toLowerCase().includes('fetch')) break;
          
          console.warn(`Supabase check failed (fetch error). Retrying... (${retries - 1} left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        }

        const { data, error } = supabaseResult;
        if (error) {
          const errorMsg = error.message || '';
          if (errorMsg.toLowerCase().includes('refresh token not found') || errorMsg.toLowerCase().includes('invalid refresh token')) {
            console.log("Diagnostic: Ignored invalid refresh token error during health check.");
          } else {
            console.error("Supabase Connection Error (from client):", error);
            if (errorMsg.toLowerCase().includes('failed to fetch')) {
              if (isFallback) {
                setToast({
                  message: "Default Supabase project is inactive. Please configure your own SUPABASE_URL and SUPABASE_ANON_KEY in AI Studio Settings.",
                  type: 'error'
                });
              } else {
                setToast({
                  message: "Supabase API is unreachable (Failed to fetch). Check your internet connection or if the Supabase project is active.",
                  type: 'error'
                });
              }
            } else {
              setToast({
                message: `Supabase Error: ${error.message}`,
                type: 'error'
              });
            }
          }
        } else {
          console.log("Supabase Connection: OK");
        }
      } catch (err: any) {
        console.error("Supabase Health Check Exception:", err);
        const getEnv = (name: string, fallback: string = ''): string => {
          const val = import.meta.env[name] || (process.env as any)[name] || fallback;
          if (val === 'undefined' || val === 'null' || !val) return fallback;
          return val.trim();
        };
        const currentUrl = getEnv('VITE_SUPABASE_URL', 'https://auqwezpczravciclsemz.supabase.co');
        const isFallback = currentUrl.includes('auqwezpczravciclsemz');
        if (err.message?.toLowerCase().includes('fetch')) {
          if (isFallback) {
            setToast({
              message: "Default Supabase project is inactive. Please configure your own SUPABASE_URL and SUPABASE_ANON_KEY in AI Studio Settings.",
              type: 'error'
            });
          } else {
            setToast({
              message: "Supabase connection failed (Failed to fetch). Check your network or Supabase URL.",
              type: 'error'
            });
          }
        }
      }
    };

    const checkGemini = () => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("Diagnostic: Gemini API Key is missing. Image generation will fail. Please associate a key in the Secrets/Publish tab.");
      } else {
        console.log("Diagnostic: Gemini API Key: FOUND");
      }
    };

    checkGemini();
    checkBackend().catch(err => console.warn("checkBackend unhandled rejection:", err));
    checkSupabase().catch(err => console.warn("checkSupabase unhandled rejection:", err));

    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const reason = event.reason;
      const message = (reason?.message || reason?.error_description || String(reason || '')).toLowerCase();
      
      // Categorize and handle common unhandled rejections
      if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('load failed') || message.includes('aborterror')) {
        setToast({ 
          message: "Network error: Could not reach the server. Please check your internet connection or VPN.", 
          type: 'error' 
        });
      } else if (message.includes('refresh token not found') || message.includes('invalid refresh token') || message.includes('session_not_found')) {
        console.log("Diagnostic: Ignored auth rejection, clearing local storage.");
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
      } else if (message.includes('apikey') || message.includes('api key') || message.includes('api_key')) {
        setToast({
          message: "Configuration error: Missing or invalid API key. Please check your settings.",
          type: 'error'
        });
      } else if (message.includes('permission denied') || message.includes('insufficient permissions')) {
        setToast({
          message: "Access denied. Please ensure you are logged in correctly.",
          type: 'error'
        });
      } else if (message.includes('Quota exceeded') || message.includes('429')) {
        setToast({
          message: "Rate limit exceeded. Please wait a moment and try again.",
          type: 'error'
        });
      } else if (message.includes('Safety') || message.includes('SAFETY')) {
        setToast({
          message: "The content was blocked by safety filters. Please try a different image or settings.",
          type: 'error'
        });
      } else if (message.includes('timeout') || message.includes('timed out')) {
        setToast({
          message: "The request timed out. Please try again with a better connection.",
          type: 'error'
        });
      } else if (message.includes('refresh token not found') || message.includes('invalid refresh token')) {
        console.log("Diagnostic: Ignored invalid refresh token unhandled rejection, clearing local storage.");
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
      } else if (message.includes('websocket closed without opened') || message.includes('failed to connect to websocket')) {
        // Ignore benign Vite HMR websocket errors
        console.log("Diagnostic: Ignored benign websocket unhandled rejection.");
      } else {
        // Fallback for other unhandled rejections
        setToast({
          message: `An unexpected error occurred: ${message.slice(0, 100)}${message.length > 100 ? '...' : ''}`,
          type: 'error'
        });
      }
    };
    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.error("Diagnostic: Supabase client is null. Check environment variables.");
      setIsInitialCheckDone(true);
      return;
    }

    const initSession = async () => {
      try {
        console.log("Diagnostic: Initializing Supabase session...");
        
        // Check localStorage availability
        try {
          localStorage.setItem('studio_test', 'test');
          localStorage.removeItem('studio_test');
          console.log("Diagnostic: localStorage is available");
        } catch (e) {
          console.warn("Diagnostic: localStorage is NOT available. Supabase auth might fail or be limited.", e);
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('refresh token not found') || errMsg.includes('invalid refresh token') || errMsg.includes('session_not_found')) {
            console.log("Diagnostic: Invalid session state, performing cleanup.");
            // Manually clear all potentially stale auth keys
            Object.keys(localStorage).forEach(key => {
              if (key.includes('auth-token')) {
                localStorage.removeItem(key);
              }
            });
            await supabase.auth.signOut().catch(() => {});
            setSession(null);
          } else {
            console.error("Diagnostic: Supabase getSession error object:", JSON.stringify(error, null, 2));
            if (error.message?.toLowerCase().includes('fetch')) {
              setToast({
                message: "Auth connection failed (Failed to fetch). This often means the Supabase URL is blocked or incorrect.",
                type: 'error'
              });
            }
            throw error;
          }
        } else {
          console.log("Diagnostic: Supabase session result:", session ? `User: ${session.user.email}` : "No session");
          setSession(session); 
        }
        
        setIsInitialCheckDone(true);
        if (session?.user?.id) {
          if (!sessionStorage.getItem('studio_session_start')) {
            cleanupGenerations(session.user.id).catch(e => console.warn("Initial cleanup failed", e));
          }
        }
      } catch (err: any) {
        const msg = (err.message || err.error_description || String(err)).toLowerCase();
        if (msg.includes('refresh token not found') || msg.includes('invalid refresh token') || msg.includes('session_not_found')) {
          console.log("Diagnostic: Auth initialization error caught and handled.");
          Object.keys(localStorage).forEach(key => {
            if (key.includes('auth-token')) {
              localStorage.removeItem(key);
            }
          });
          await supabase.auth.signOut().catch(() => {});
          setSession(null);
        } else {
          console.error("Diagnostic: Critical Auth Initialization Error:", err);
          if (msg.toLowerCase().includes('fetch')) {
            setToast({
              message: "Auth service unreachable (Failed to fetch). Check your connection or Supabase URL.",
              type: 'error'
            });
          }
        }
        setIsInitialCheckDone(true);
      }
    };

    initSession();

    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { 
      setSession(session); 
      if (session) {
        setIsGuest(false);
        if (!sessionStorage.getItem('studio_session_start')) {
          cleanupGenerations(session.user.id).catch(e => console.warn("Auth change cleanup failed", e));
        }
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => { 
    if (session?.user) { 
      if (lastFetchedUserId.current !== session.user.id) {
        hasFetchedGenerations.current = false;
        lastFetchedUserId.current = session.user.id;
      }
      
      const loadData = async () => {
        try {
          await Promise.all([
            fetchProfile(),
            fetchHistory(),
            fetchGenerations()
          ]);
        } catch (err) {
          console.error("Error loading user data:", err);
          // We don't toast here to avoid spamming on initial load/network blips
        }
      };
      
      loadData().catch(err => console.warn("loadData unhandled rejection:", err)); 

      const channel = supabase
        .channel(`profile-updates-${session.user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
          (payload) => {
            setProfile(prev => prev ? { ...prev, ...payload.new } : (payload.new as UserProfile));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } 
    else if (!isGuest) { 
      setProfile(null); 
      setHistory([]); 
      setGenerations([]); 
    } 
  }, [session, isGuest]);

  const handleProfileUpdate = async () => {
    if (!session?.user?.id) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: formName, 
          phone_no: formPhone 
        })
        .eq('id', session.user.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, full_name: formName, phone_no: formPhone } : null);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: formatErrorMessage(err, 'Failed to update profile'), type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const data = await getUserProfile(session.user.id, session.user.email || undefined);
      if (data) { 
        setProfile({ ...data, email: session.user.email }); 
        setFormName(data.full_name || ''); 
        setFormPhone(data.phone_no || '');

        // Shared Wallet: Explicit balance check for transparency
        if ((data.tokens ?? 0) < 5) {
          console.log("Shared Wallet balance low: ", data.tokens);
        }
      }
    } catch (e: any) {
      console.error("Fetch shared profile failed", e);
      // Fallback to basic session info if fetch fails
      if (session?.user) {
        setProfile({ id: session.user.id, email: session.user.email || 'User', tokens: 0 });
      }
    }
  };

  const fetchHistory = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from('token_history').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('not found') || error.status === 404) {
          console.warn("token_history table does not exist. Returning empty list.");
          setHistory([]);
        } else {
          console.error('Error fetching token history:', error);
          setHistory([]);
        }
      } else {
        if (data) setHistory(data);
      }
    } catch (e) {
      console.error("Fetch history failed", e);
    }
  };

  const fetchGenerations = async (force = false) => {
    if (!session?.user?.id || (hasFetchedGenerations.current && !force)) return;
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setGenerations(data);
        hasFetchedGenerations.current = true;
      }
    } catch (e) {
      console.error("Fetch generations failed", e);
    }
  };

  const deleteGeneration = async (genId: string | number) => {
    try {
      // Optimistic update
      const originalGenerations = [...generations];
      setGenerations(prev => prev.filter(g => String(g.id) !== String(genId)));
      
      if (activeGen && String(activeGen.id) === String(genId)) {
        setActiveGen(null);
        setDisplayUrl(null);
      }

      if (session?.user?.id) {
        // Find the generation to get its image URL before deleting
        const genToDelete = originalGenerations.find(g => String(g.id) === String(genId));

        // Use .select() to verify that a row was actually deleted
        const { data, error } = await supabase
          .from('generations')
          .delete()
          .eq('id', genId)
          .eq('user_id', session.user.id)
          .select();
        
        if (error) throw error;
        
        // If no data was returned, it means no rows matched the criteria (e.g. RLS or wrong ID)
        // This can happen for local-only images (guest mode or failed saves)
        if (!data || data.length === 0) {
          console.warn("Delete call completed but no rows were affected in the database. This is expected for local-only or already deleted images.");
        } else if (genToDelete) {
          // Successfully deleted from DB, now delete from Storage
          if (genToDelete.image_data) await deleteFromSupabaseStorage(genToDelete.image_data);
          if (genToDelete.thumbnail_url) await deleteFromSupabaseStorage(genToDelete.thumbnail_url);
        }
      }
      setToast({ message: "Portrait deleted successfully", type: 'success' });
    } catch (err: any) {
      console.error("Delete failed", err);
      setToast({ message: formatErrorMessage(err, "Failed to delete portrait"), type: 'error' });
      // Restore state on failure
      fetchGenerations(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!session?.user?.id) return;
    setIsSavingProfile(true);
    
    try {
      const updates = { 
        id: session.user.id, 
        full_name: formName,
        phone_no: formPhone
      };
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' });

      if (!upsertError) { 
        await fetchProfile(); 
        setIsProfileModalOpen(false); 
        setToast({message: "Account Profile updated!", type: 'success'});
      } else {
        console.error("Update error:", upsertError);
        setToast({message: `Failed: ${upsertError.message}`, type: 'error'});
      }
    } catch (err: any) {
      console.error("Profile update exception:", err);
      setToast({ message: formatErrorMessage(err, "Failed to update profile"), type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Removed handleOpenShop from here

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePurchase = async (tokensToAdd: number) => {
    if (!session?.user?.id) {
      setView('auth');
      return;
    }

    // Production pricing logic (Syncing with GraphToSheets tiers)
    let amount = 199;
    if (tokensToAdd === 50) amount = 699;
    if (tokensToAdd === 125) amount = 1299;
    
    // For specific pricing needs:
    if (tokensToAdd === 1) amount = 99;

    setToast({ message: "Initiating payment gateway...", type: 'info' });

    try {
      // 1. Create order on backend (Passing notes for webhook reliability)
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount,
          user_id: session.user.id,
          tokens: tokensToAdd
        }),
      });
      const orderData = await orderRes.json();
      
      if (!orderData.orderId) throw new Error("Could not create Razorpay order");

      // 2. Open Razorpay Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: "INR",
        name: "AI Suite",
        description: `Top up ${tokensToAdd} Shared AI Credits`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            setToast({ message: "Verifying payment...", type: 'info' });
            
            // 3. Verify on backend (Updating to pass user context)
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: session.user.id,
                tokensToAdd: tokensToAdd,
                amount: amount
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.status === "success") {
              setToast({ message: "Success! Credits added to your wallet.", type: 'success' });
              await fetchProfile();
              setIsShopOpen(false);
            } else if (verifyData.status === "partial_success") {
              setToast({ message: "Payment verified but credit update is pending. Please refresh.", type: 'info' });
              await fetchProfile();
            } else {
              setToast({ message: "Payment verification failed. Please contact support.", type: 'error' });
            }
          } catch (err) {
            console.error("Verification error:", err);
            setToast({ message: "Verification error occurred.", type: 'error' });
          }
        },
        prefill: {
          name: profile?.full_name || "",
          email: session.user.email || "",
          contact: profile?.phone_no || "",
        },
        theme: {
          color: "#10b981", // Emerald Green
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error("Purchase error:", err);
      setToast({ message: "Payment initialization failed.", type: 'error' });
    }
  };

  const handleOpenShop = (tokens?: any) => {
    if (typeof tokens === 'number') {
      handlePurchase(tokens);
    } else {
      setIsShopOpen(true);
    }
  };

  const autoDownloadImage = async (url: string) => {
    try {
      const filteredUrl = await applyFiltersToImage(url, imageFilters);
      const link = document.createElement('a');
      link.href = filteredUrl;
      link.download = "headshot-hd.png";
      link.click();
    } catch (err) {
      console.error("Auto-download error:", err);
    }
  };

  const handleUnlock = async () => {
    console.log("handleUnlock triggered", { 
      activeGenId: activeGen?.id, 
      activeGenIsUnlocked: activeGen?.is_unlocked,
      profileTokens: profile?.tokens, 
      hasOriginalImage: !!originalImage, 
      originalImageLength: originalImage?.length,
      hasSession: !!session,
      isGuest: isGuest
    });
    
    if (!activeGen) {
      console.error("handleUnlock: No activeGen selected.");
      setToast({ message: "No portrait selected to unlock.", type: 'error' });
      return;
    }
    if (!profile || !session?.user) {
      if (isGuest) {
        console.log("handleUnlock: Proceeding as guest.");
      } else {
        console.error("handleUnlock: User not logged in.");
        setToast({ message: "Please log in to unlock portraits.", type: 'error' });
        return;
      }
    }
    if (!originalImage) {
      console.error("handleUnlock: originalImage is missing. activeGen:", activeGen);
      setToast({ 
        message: "Source photo missing. Please re-upload your original photo to unlock the high-resolution version.", 
        type: 'error' 
      });
      return;
    }
    
    const currentImage = originalImage;
    
    const hasTokens = (profile?.tokens ?? 0) >= 5;

    if (!hasTokens) { 
      console.warn("handleUnlock: Insufficient credits.", { tokens: profile?.tokens });
      setToast({ message: "To deliver the highest studio quality, HD Generation requires 5 paid credits from your account.", type: 'error' });
      handleOpenShop(); 
      setIsConfirmingUnlock(false);
      return; 
    }
    
    if (isUnlocking) return;
    setIsConfirmingUnlock(false);
    setIsUnlocking(true);
    setGenerationProgress(0);
    setError(null);
    
    console.log("Starting HD generation process for activeGen:", activeGen.id);
    
    // Progress simulation for HD generation (usually takes longer)
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 98) return prev;
        if (prev >= 90) return prev + 0.2; // Slightly faster crawl
        if (prev >= 60) return prev + 1.2;
        return prev + (prev < 30 ? 3 : 2);
      });
    }, 800);

    try {
      console.log("Checking for API key...");
      // Check for API Key for premium model inside try-catch
      // Add guard for window.aistudio
      const hasKey = (window as any).aistudio ? await (window as any).aistudio.hasSelectedApiKey() : true;
      console.log("Has API Key:", hasKey);
      if (!hasKey && (window as any).aistudio) {
        setToast({ message: "HD Generation requires a paid Gemini API key. Please select your key.", type: 'error' });
        await (window as any).aistudio.openSelectKey();
        // Assume success after dialog closes as per guidelines
      }

      console.log("Calling GeminiService.transformImage with highRes=true...", { 
        settings: activeGen.settings, 
        seed: activeGen.seed 
      });
      
      const highResResult = await GeminiService.transformImage(currentImage!, activeGen.settings, true, activeGen.seed);
      console.log("HD Result received, length:", highResResult?.length);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (isGuest) {
        console.log("Processing guest unlock...");
        setProfile(p => p ? { ...p, tokens: p.tokens - 5 } : p);
        const updatedGen = { ...activeGen, image_data: highResResult, is_unlocked: true };
        setActiveGen(updatedGen);
        setGenerations(prev => [updatedGen, ...prev.filter(g => String(g.id) !== String(activeGen.id))]);
        setDisplayUrl(highResResult);
        setToast({message: "HD Portrait unlocked using free credits!", type: 'success'});
        setIsUnlocking(false);
        setTimeout(() => autoDownloadImage(highResResult), 500);
        return;
      }

      console.log("Deducting tokens from Supabase...");
      const updateData = { tokens: (profile?.tokens ?? 0) - 5 };
      
      const { error: deductionError } = await supabase.from('profiles').update(updateData).eq('id', session.user.id);
      
      if (!deductionError) {
        console.log("Deduction successful. Uploading to storage...");
        // Compress HD image before upload
        const compressedHD = await compressImage(highResResult, 2048, 0.85);
        const thumbData = await generateThumbnail(highResResult);

        // Upload HD image to Supabase Storage
        const storageUrl = await uploadToSupabaseStorage(compressedHD, session.user.id, true);
        const thumbUrl = await uploadToSupabaseStorage(thumbData, session.user.id, false, true);
        
        console.log("Storage upload complete:", { storageUrl, thumbUrl });

        // Universal Logging: Every time a user generates a headshot, log that activity to the app_activity table
        await logActivity(session.user.id, 5, storageUrl);

        console.log("Inserting new generation record...");
        const { data: newGen, error: genError } = await supabase.from('generations').insert({ 
          user_id: session.user.id, 
          image_data: storageUrl, 
          thumbnail_url: thumbUrl,
          is_unlocked: true, 
          settings: activeGen.settings,
          seed: activeGen.seed
        }).select().single();

        if (!genError && newGen) { 
          console.log("Generation record created:", newGen.id);
          setGenerations(p => [newGen, ...p.filter(g => String(g.id) !== String(activeGen.id))]); 
          handleSelectGen(newGen); 
          await fetchProfile(); 
          setToast({message: "HD Portrait unlocked!", type: 'success'});
          setTimeout(() => autoDownloadImage(storageUrl), 500);
        } else {
          console.warn("Generation record creation failed, using local result:", genError);
          const updatedGen = { ...activeGen, image_data: highResResult, is_unlocked: true };
          setActiveGen(updatedGen);
          setGenerations(prev => [updatedGen, ...prev.filter(g => String(g.id) !== String(activeGen.id))]);
          setDisplayUrl(highResResult);
          await fetchProfile(); 
          setToast({message: "Successfully unlocked HD Portrait!", type: 'success'});
          setTimeout(() => autoDownloadImage(highResResult), 500);
        }
      } else {
        console.error("Token deduction failed:", deductionError);
        throw new Error("Failed to process tokens.");
      }
      setIsUnlocking(false);
    } catch (err: any) {
      console.error("Unlock error:", err);
      clearInterval(progressInterval);
      
      const errMsg = err?.message || String(err || '');
      if (errMsg.includes("Requested entity was not found") || errMsg.includes("permission denied") || errMsg.includes("not found")) {
        setToast({ message: "HD requires a paid Gemini key. Please select a key from a paid project.", type: 'error' });
        try {
          if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
          }
        } catch (e) {
          console.warn("Failed to open key selector", e);
        }
      } else if (errMsg.includes("exhausted") || errMsg.includes("429")) {
        const msg = "API limit reached. Please wait a moment or check your spend cap.";
        setToast({ message: msg, type: 'error' });
        setError(msg);
      } else if (errMsg.includes("demand") || errMsg.includes("503")) {
        const isPremium = (profile?.tokens ?? 0) > 0 || !!profile?.plan;
        const msg = isPremium 
          ? "Our AI is currently experiencing exceptionally high demand. We've prioritized your request, but the server is still busy. Please wait a minute and try again - your tokens are safe."
          : "The AI is currently under high load. Retrying usually helps, or please try again in a few minutes.";
        setToast({ message: msg, type: 'error' });
        setError(msg);
      } else if (errMsg.toLowerCase().includes('timeout') || errMsg.toLowerCase().includes('timed out')) {
        const msg = "The request timed out. High-quality generation can take longer - we've increased our limits, please try again.";
        setToast({ message: msg, type: 'error' });
        setError(msg);
      } else {
        const msg = formatErrorMessage(err, "Failed to generate HD version. Please try again.");
        setToast({ message: msg, type: 'error' });
        setError(msg);
      }
    } finally {
      clearInterval(progressInterval);
      setIsUnlocking(false);
    }
  };

  const handleSelectGen = async (gen: GenerationRecord) => { 
    setActiveGen(gen); 
    setDisplayUrl(gen.image_data); 
    // If we have a source photo, mark it as verified for this gen
    if (originalImage) {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  };

  const generateHeadshot = async (forceHD: boolean | React.MouseEvent = false) => {
    if (isGenerating) return;
    let isForceHD = forceHD === true;
    
    if (!originalImage) {
      setToast({ message: "Please upload a photo first.", type: 'error' });
      return;
    }

    // Free Preview Logic
    const previewsRemaining = profile?.previews_remaining ?? 0;
    const hasTokensForHD = (profile?.tokens ?? 0) >= 5;

    // Consecutive Preview Utilization Nudge Logic
    if (!isForceHD) {
      if (consecutivePreviews >= 5) {
        isForceHD = true;
        setToast({ 
          message: "To maintain studio-grade quality after multiple previews, we are generating your next portrait in stunning HD.", 
          type: 'info' 
        });
      } else if (consecutivePreviews === 4) {
        setToast({ 
          message: "Great selection! To better utilize your credits, we recommend generating an HD version of your next favorite pose.", 
          type: 'info' 
        });
      }
    }

    if (!isForceHD) {
      if (previewsRemaining <= 0) {
        if (hasTokensForHD) {
          // Automatically switch to HD if previews are exhausted but user has tokens
          isForceHD = true;
          setToast({ 
            message: "You've used all your free previews. Generating an HD portrait directly.", 
            type: 'success' 
          });
        } else {
          setToast({ 
            message: "You've reached your free preview limit. Please purchase credits to continue.", 
            type: 'error' 
          });
          handleOpenShop();
          return;
        }
      }
    } else {
      // If manually requesting HD, check tokens
      if (!hasTokensForHD && !isGuest) {
        setToast({ message: "To deliver the highest studio quality, HD generation requires paid credits from your account. Please top up your credits to continue.", type: 'error' });
        handleOpenShop();
        return;
      }
    }

    setIsGenerating(true); 
    setGenerationProgress(0);
    setError(null);
    setDisplayUrl(null);
    setActiveGen(null);

    // Progress simulation for generation
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 98) return prev;
        if (prev >= 90) return prev + (isForceHD ? 0.3 : 0.4); 
        if (prev >= 70) return prev + (isForceHD ? 1.5 : 2.0);
        return prev + (prev < 40 ? (isForceHD ? 4 : 5) : (isForceHD ? 2 : 3));
      });
    }, isForceHD ? 700 : 400);

    try {
      const hasKey = (window as any).aistudio ? await (window as any).aistudio.hasSelectedApiKey() : true;
      if (!hasKey && (window as any).aistudio) {
        setToast({ message: `${isForceHD ? 'HD Portrait' : 'Portrait'} generation requires a paid Gemini API key. Please select your key.`, type: 'error' });
        await (window as any).aistudio.openSelectKey();
      }

      if (!isVerified) {
        const count = await GeminiService.verifyHumanCount(originalImage);
        if (count !== 'ONE') throw new Error("Image must contain exactly one person.");
        setIsVerified(true);
      }
      
      const seed = Math.floor(Math.random() * 1000000);
      const generationSettings = settings;
      const result = await GeminiService.transformImage(originalImage, generationSettings, isForceHD, seed, !isForceHD);
      const finalResult = isForceHD ? result : await applyWatermark(result, generationSettings.background === BackgroundStyle.TRANSPARENT);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (isForceHD) {
        setConsecutivePreviews(0);
        if (isGuest) {
          setProfile(p => p ? { ...p, tokens: p.tokens - 5 } : p);
          const newGen = { id: Date.now(), user_id: 'guest', image_data: finalResult, is_unlocked: true, settings: generationSettings, seed, created_at: new Date().toISOString() };
          setGenerations(prev => [newGen, ...prev]);
          handleSelectGen(newGen);
          setToast({message: "HD Portrait generated using free credits!", type: 'success'});
          setTimeout(() => autoDownloadImage(finalResult), 500);
          return;
        }

        const updateData = { tokens: (profile?.tokens ?? 0) - 5 };

        const { error: deductionError } = await supabase.from('profiles').update(updateData).eq('id', session?.user?.id);
        
        if (!deductionError) {
          const compressedHD = await compressImage(finalResult, 2048, 0.85);
          const thumbData = await generateThumbnail(finalResult);

          const storageUrl = await uploadToSupabaseStorage(compressedHD, session!.user.id, true);
          const thumbUrl = await uploadToSupabaseStorage(thumbData, session!.user.id, false, true);

          await logActivity(session!.user.id, 5, storageUrl);

          const { data: newGen, error: genError } = await supabase.from('generations').insert({ 
            user_id: session!.user.id, 
            image_data: storageUrl, 
            thumbnail_url: thumbUrl,
            is_unlocked: true, 
            settings: generationSettings,
            seed
          }).select().single();

          if (!genError && newGen) { 
            setGenerations(p => [newGen, ...p]); 
            handleSelectGen(newGen); 
            await fetchProfile(); 
            setToast({message: "HD Portrait generated!", type: 'success'});
            setTimeout(() => autoDownloadImage(storageUrl), 500);
          } else {
            const fallbackGen = { id: Date.now(), user_id: session!.user.id, image_data: finalResult, is_unlocked: true, settings: generationSettings, seed, created_at: new Date().toISOString() };
            setGenerations(prev => [fallbackGen, ...prev]);
            handleSelectGen(fallbackGen);
            await fetchProfile(); 
            setToast({message: "Successfully generated HD Portrait!", type: 'success'});
            setTimeout(() => autoDownloadImage(finalResult), 500);
          }
        }
        return;
      }

      // Decrement previews_remaining in Supabase
      if (session?.user?.id && !isGuest) {
        setConsecutivePreviews(prev => prev + 1);
        const { error: previewError } = await supabase
          .from('profiles')
          .update({ previews_remaining: Math.max(0, previewsRemaining - 1) })
          .eq('id', session.user.id);
        
        if (previewError) console.warn("Failed to update preview count:", previewError);
      }

      setPreviewsUsed(prev => prev + 1);

      const newGenData = { 
        user_id: session?.user?.id || 'guest',
        image_data: finalResult, 
        is_unlocked: false, 
        settings: generationSettings, 
        seed 
      };

      if (session?.user?.id && !isGuest) {
        // Compress preview image
        const compressedPreview = await compressImage(finalResult, 1024, 0.75);
        const thumbData = await generateThumbnail(finalResult);

        // Upload preview image to Supabase Storage
        const storageUrl = await uploadToSupabaseStorage(compressedPreview, session.user.id, false);
        const thumbUrl = await uploadToSupabaseStorage(thumbData, session.user.id, false, true);
        
        newGenData.image_data = storageUrl;
        (newGenData as any).thumbnail_url = thumbUrl;

        const { data: savedGen, error: saveError } = await supabase
          .from('generations')
          .insert(newGenData)
          .select()
          .single();
        
        if (!saveError && savedGen) {
          // Universal Logging for Previews (cost 0)
          await logActivity(session.user.id, 0, storageUrl);
          setGenerations(prev => [savedGen, ...prev]);
          handleSelectGen(savedGen);
        } else {
          const fallbackGen = { ...newGenData, id: Date.now(), created_at: new Date().toISOString() };
          setGenerations(prev => [fallbackGen, ...prev]);
          handleSelectGen(fallbackGen);
        }
      } else {
        const guestGen = { ...newGenData, id: Date.now(), created_at: new Date().toISOString() };
        setGenerations(prev => [guestGen, ...prev]);
        handleSelectGen(guestGen);
      }
    } catch (err: any) { 
      clearInterval(progressInterval);
      const status = err?.status || err?.code;
      const errMsg = err?.message || String(err || '');
      let userMessage = formatErrorMessage(err, "An unexpected error occurred during generation.");
      
      if (status === 429 || errMsg.includes('exhausted')) {
        userMessage = "API limit reached. Please wait a moment or check your spend cap.";
      } else if (status === 503 || errMsg.includes('demand')) {
        const isPremium = (profile?.tokens ?? 0) > 0 || !!profile?.plan;
        userMessage = isPremium 
          ? "Our AI is currently experiencing exceptionally high demand. We've prioritized your request, but the server is still busy. Please wait a minute and try again - your tokens are safe."
          : "The AI is currently under high load. Retrying usually helps, or please try again in a few minutes.";
      } else if (status === 500) {
        userMessage = "The AI encountered an internal error. Please try a different photo or try again later.";
      } else if (status === 403 || errMsg.includes('permission denied') || errMsg.includes('Requested entity was not found') || errMsg.includes('not found')) {
        userMessage = "This feature requires a paid Gemini API key. Please select a key from a paid project.";
        // Trigger key selector as per instructions for 'not found'
        try {
          (window as any).aistudio.openSelectKey();
        } catch (e) {
          console.warn("Failed to open key selector", e);
        }
      } else if (errMsg.toLowerCase().includes('timeout') || errMsg.toLowerCase().includes('timed out')) {
        userMessage = "The request timed out. High-quality generation can take longer - we've increased our limits, please try again.";
      }
      
      setError(userMessage); 
      setToast({ message: userMessage, type: 'error' });
    } finally { 
      clearInterval(progressInterval);
      setIsGenerating(false); 
    }
  };

  const handleLogout = async () => {
    try {
      if (session?.user?.id) {
        await cleanupGenerations(session.user.id);
      }
      sessionStorage.removeItem('studio_session_start');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      }
      setIsGuest(false);
      setSession(null);
      setGenerations([]);
      setHistory([]);
      setOriginalImage(null);
      setActiveGen(null);
      setDisplayUrl(null);
      setProfile(null);
      setView('landing');
      setIsProfileModalOpen(false);
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
        setIsGuest(false);
        setSession(null);
        setGenerations([]);
        setHistory([]);
        setProfile(null);
        setView('landing');
        setIsProfileModalOpen(false);
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Final signout attempt failed:", e);
      }
    }
  };

  const formatPrice = (inrAmount: number) => {
    const conversionRates = { INR: 1, USD: 1 / 84.0, EUR: 0.94 / 84.0, GBP: 0.81 / 84.0 };
    
    if (currency === 'INR') {
      const inrPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency', 
        currency: 'INR', 
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(inrAmount);

      return inrPrice;
    }

    const converted = inrAmount * conversionRates[currency];
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: currency === 'INR' ? 0 : 2,
      minimumFractionDigits: currency === 'INR' ? 0 : 2
    }).format(converted);
  };

  const tieColorMap: Partial<Record<TieColor, string>> & { [TieColor.CUSTOM]: string } = {
    [TieColor.AUTO]: 'transparent',
    [TieColor.MAROON]: '#800000',
    [TieColor.NAVY_BLUE]: '#000080',
    [TieColor.ROYAL_GOLD]: '#E5B80B',
    [TieColor.SILVER_SILK]: '#C0C0C0',
    [TieColor.SOLID_BLACK]: '#000000',
    [TieColor.SKY_BLUE]: '#87CEEB',
    [TieColor.HUNTER_GREEN]: '#355E3B',
    [TieColor.CUSTOM]: 'rainbow'
  };

  const clothingStyleColorMap: Partial<Record<ClothingStyle, string>> & { [ClothingStyle.CUSTOM]: string } = {
    [ClothingStyle.AUTO]: 'transparent',
    [ClothingStyle.NAVY_BLUE]: '#000080',
    [ClothingStyle.CHARCOAL_GRAY]: '#333f48',
    [ClothingStyle.BLACK]: '#000000',
    [ClothingStyle.LIGHT_GRAY]: '#d1d5db',
    [ClothingStyle.BURGUNDY]: '#800020',
    [ClothingStyle.OLIVE_GREEN]: '#556b2f',
    [ClothingStyle.TAN_BEIGE]: '#D2B48C',
    [ClothingStyle.CUSTOM]: 'rainbow'
  };

  const backdropColorMap: Partial<Record<BackgroundStyle, string>> = {
    [BackgroundStyle.AUTO]: 'transparent',
    [BackgroundStyle.CHARCOAL_TEXTURED]: '#333333',
    [BackgroundStyle.PURE_WHITE]: '#ffffff',
    [BackgroundStyle.SOFT_GREY]: '#e5e7eb',
    [BackgroundStyle.SLATE_GRAY]: '#708090',
    [BackgroundStyle.OFFICE_BLUR]: '#4e81ad',
    [BackgroundStyle.WARM_SPOTLIGHT]: '#c2b280',
    [BackgroundStyle.WARM_ABSTRACT]: '#a68a64',
    [BackgroundStyle.TRANSPARENT]: 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 10px 10px',
    [BackgroundStyle.DEEP_BLUE]: '#1a365d',
    [BackgroundStyle.NATURE]: '#228B22',
    [BackgroundStyle.HOSPITAL]: '#e0f2fe',
    [BackgroundStyle.NAVY_BLUE]: '#000080',
    [BackgroundStyle.ORIGINAL]: 'conic-gradient(#3b82f6 0.25turn, #ef4444 0.25turn 0.5turn, #10b981 0.5turn 0.75turn, #f59e0b 0.75turn)', // Multicolor box for original
    [BackgroundStyle.CUSTOM]: 'rainbow',
    [BackgroundStyle.ALL]: 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)'
  };

  if (!isInitialCheckDone) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-[#10b981]/30 border-t-[#10b981] rounded-full animate-spin"></div></div>;
  
  const renderView = () => {
    if (view === 'landing') return (
      <LandingPage 
        onGetStarted={() => setView(session || isGuest ? 'app' : 'auth')} 
        onOpenFAQ={(tab) => onOpenSupport(tab)} 
        onOpenShop={handleOpenShop}
        formatPrice={formatPrice}
        currency={currency}
        setCurrency={setCurrency}
        setIsSamplesOpen={setIsSamplesOpen}
        setView={setView}
        profile={profile}
        isGuest={isGuest}
        session={session}
      />
    );
    
    if (!session && !isGuest) return <AuthScreen onAuth={(s) => { setSession(s); setIsGuest(false); }} onGuestLogin={() => { setIsGuest(true); setProfile({ id: 'guest', email: 'Guest User', tokens: 0 }); setView('app'); }} onGoHome={() => setView('landing')} />;

    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfd] dark:bg-slate-950 transition-colors selection:bg-[#10b981]/30">
        <Header 
          onOpenSupport={onOpenSupport} 
          onOpenShop={handleOpenShop} 
          onOpenSamples={() => setIsSamplesOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)} 
          onGoHome={() => setView('landing')}
          onLogout={() => setShowLogoutConfirm(true)}
          onOpenDashboard={() => setView('dashboard')}
          profile={profile} 
          isGuest={isGuest}
          session={session}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
        
        {view === 'dashboard' ? (
          <Dashboard 
            profile={profile}
            history={history}
            onUpdate={handleProfileUpdate}
            onOpenShop={handleOpenShop}
            onOpenSupport={onOpenSupport}
            onOpenGallery={() => setIsGalleryExpanded(true)}
            formFields={{
              name: formName, setName: setFormName,
              phone: formPhone, setPhone: setFormPhone
            }}
            isSaving={isSavingProfile}
            onBack={() => setView('app')}
            previewsUsed={previewsUsed}
            MAX_FREE_PREVIEWS={MAX_FREE_PREVIEWS}
          />
        ) : (
          <main className="flex-grow grid lg:grid-cols-[28%_72%] items-start max-w-[1800px] mx-auto w-full">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <aside className="flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 h-full lg:sticky lg:top-16 lg:max-h-[calc(100vh-64px)] bg-white dark:bg-slate-950">
              <div className="p-4 lg:p-6 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
                <div className="space-y-4">
                  {/* Step 1: Photo Source */}
                  <div className="space-y-3">
                    <StepHeader 
                      step={1} 
                      title="Photo Source" 
                      isActive={currentStep === 1} 
                      isCompleted={!!originalImage}
                      onClick={() => setCurrentStep(1)}
                      summary={originalImage ? "Photo uploaded" : "Upload or take selfie"}
                    />
                    <AnimatePresence>
                      {currentStep === 1 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="relative rounded-3xl border border-solid border-slate-100 dark:border-slate-800 p-3 min-h-[180px] h-auto flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden transition-all hover:border-studio-emerald/30">
                      <div className="w-full flex-1 flex flex-col items-center justify-center">
                        {originalImage ? (
                          <div className="relative group w-full h-[170px] flex flex-col items-center justify-center">
                            <div className="relative rounded-lg overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-800 h-full w-full flex items-center justify-center">
                              <img 
                                src={originalImage} 
                                alt="Source" 
                                className="max-w-full max-h-full object-contain" 
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button 
                                  onClick={() => setIsCameraOpen(true)}
                                  className="p-2 bg-white hover:bg-slate-50 rounded-full text-slate-700 shadow-lg transition-all transform hover:scale-110"
                                  title="Retake Photo"
                                >
                                  <Camera className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="p-2 bg-white hover:bg-slate-50 rounded-full text-slate-700 shadow-lg transition-all transform hover:scale-110"
                                  title="Upload New"
                                >
                                  <Upload className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setOriginalImage(null)}
                                  className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-all transform hover:scale-110"
                                  title="Delete Photo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full space-y-4">
                            <div className="flex gap-4 justify-center">
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-[95px] h-[95px] flex flex-col items-center justify-center gap-2 p-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-studio-emerald hover:bg-studio-emerald/5 transition-all group bg-white dark:bg-slate-900 shadow-sm"
                              >
                                <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-studio-emerald group-hover:bg-studio-emerald/10 transition-all">
                                  <Upload className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-studio-emerald">Upload</span>
                              </button>
                              
                              <button 
                                onClick={() => setIsCameraOpen(true)}
                                className="w-[95px] h-[95px] flex flex-col items-center justify-center gap-2 p-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-studio-emerald hover:bg-studio-emerald/5 transition-all group bg-white dark:bg-slate-900 shadow-sm"
                              >
                                <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-studio-emerald group-hover:bg-studio-emerald/10 transition-all">
                                  <Camera className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-studio-emerald">Take Selfie</span>
                              </button>
                            </div>
                            
                            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 max-w-[250px] mx-auto leading-relaxed font-medium">
                              Use a well-lit, high-quality photo for best results.<br/>
                              <span className="font-bold text-slate-500 dark:text-slate-400">Max file size: 10MB</span>
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {originalImage && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setCurrentStep(2)}
                          className="w-full mt-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] border border-slate-700 dark:border-slate-200"
                        >
                          Next Step: Customize Style
                          <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

                  {/* Step 2: Customize Style */}
                  <div className="space-y-3">
                    <StepHeader 
                      step={2} 
                      title="Customize Style" 
                      isActive={currentStep === 2} 
                      isCompleted={currentStep > 2}
                      onClick={() => originalImage && setCurrentStep(2)}
                      summary={isAutoMode ? "Smart Auto enabled" : "Custom styles selected"}
                    />
                    <AnimatePresence>
                      {currentStep === 2 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          {/* Smart Auto Section */}
                          <div className={`w-full p-2.5 rounded-3xl border transition-all duration-500 flex items-center justify-between ${isAutoMode ? 'bg-white dark:bg-slate-900 border-[#10b981] shadow-sm shadow-[#10b981]/10' : 'bg-[#f8fafc] dark:bg-slate-900/40 border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm transition-all duration-300 ${isAutoMode ? 'bg-[#10b981]' : 'bg-[#94a3b8]'}`}>
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="text-[12px] font-bold text-[#0f172a] dark:text-white tracking-tight uppercase leading-none">Smart Auto</p>
                                <p className="text-[10px] font-medium text-[#64748b] dark:text-slate-400 leading-none mt-1">Best settings applied</p>
                              </div>
                            </div>
                            <button 
                              disabled={!originalImage}
                              onClick={() => {
                                const newAutoMode = !isAutoMode;
                                setIsAutoMode(newAutoMode);
                                if (newAutoMode) {
                                  setSettings({
                                    ...settings,
                                    bodyPose: BodyPose.AUTO,
                                    clothingChoice: ClothingChoice.AUTO,
                                    background: BackgroundStyle.PURE_WHITE,
                                    lighting: LightingOption.AUTO,
                                    style: AppStyle.AUTO,
                                    wardrobe: Wardrobe.AUTO
                                  });
                                } else {
                                  setSettings(DEFAULT_SETTINGS);
                                }
                              }}
                              className={`w-9 h-5 rounded-full transition-all relative ${!originalImage ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed' : isAutoMode ? 'bg-[#10b981]' : 'bg-[#cbd5e1] dark:bg-slate-700'}`}
                            >
                              <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isAutoMode ? 'left-[18px]' : 'left-[2px]'}`} />
                            </button>
                          </div>

                          <SidebarSection 
                            title="Pose & Angle" 
                            disabled={!originalImage}
                            isAuto={settings.bodyPose === BodyPose.AUTO}
                            selectedValue={settings.bodyPose !== BodyPose.AUTO ? settings.bodyPose : undefined}
                            onAutoToggle={() => setSettings({
                              ...settings, 
                              bodyPose: settings.bodyPose === BodyPose.AUTO ? DEFAULT_SETTINGS.bodyPose : BodyPose.AUTO
                            })}
                            icon={Camera} 
                            isOpen={openSidebarSection === 'pose'} 
                            onToggle={() => setOpenSidebarSection(openSidebarSection === 'pose' ? null : 'pose')}
                          >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: BodyPose.FULL_FRONT, label: "Full Front", isRecommended: true, img: "front.png" },
                    { value: BodyPose.SIDE_FRONT, label: "Side Front", img: "side.png" },
                    { value: BodyPose.ZOOM_VIEW, label: "Zoom View", img: "zoom.png" },
                    { value: BodyPose.THREE_QUARTER, label: "3-Quarter", img: "quarter.png" }
                  ].map((option) => {
                    const isActive = settings.bodyPose === option.value;
                    const imageUrl = `https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/${option.img}`;
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSettings({...settings, bodyPose: option.value})}
                        className={`relative flex flex-col items-center justify-start overflow-hidden rounded-[2px] border-2 transition-all duration-300 outline-none focus:outline-none w-[120px] h-[154px] mx-auto group ${
                          isActive 
                            ? 'border-studio-emerald ring-2 ring-studio-emerald/10 shadow-lg z-10' 
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-studio-emerald/40'
                        }`}
                      >
                        {/* Image Container - Full Size */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={option.label}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover object-top transition-transform duration-700 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}
                          />
                        </div>

                        {/* Top Indicators */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start z-10">
                          {isActive ? (
                            <div className="bg-studio-emerald text-white p-0.5 rounded-full shadow-md animate-in zoom-in-50 duration-300">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          ) : <div />}
                          
                          {option.isRecommended && (
                            <div 
                              title="Top Pick"
                              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-1 rounded-sm shadow-sm border border-amber-200/30 flex items-center justify-center transition-all"
                            >
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            </div>
                          )}
                        </div>

                        {/* Floating Refined Label - Narrower, More Rounded, High Visibility */}
                        <div className="absolute bottom-1.5 left-0 right-0 z-10 flex justify-center px-1.5">
                          <div className={`w-[90%] h-[24px] flex items-center justify-center rounded-md transition-all duration-300 backdrop-blur-md border shadow-md ${
                            isActive 
                              ? 'bg-studio-emerald border-studio-emerald/50' 
                              : 'bg-slate-950/40 border-white/10 dark:bg-slate-900/60'
                          }`}>
                            <span className={`text-[9px] font-black uppercase tracking-widest leading-none text-white shadow-sm`}>
                              {option.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SidebarSection>

              <SidebarSection 
                title="Professional Style" 
                disabled={!originalImage}
                isAuto={settings.wardrobe === Wardrobe.AUTO}
                selectedValue={settings.wardrobe !== Wardrobe.AUTO ? settings.wardrobe : undefined}
                onAutoToggle={() => setSettings({
                  ...settings,
                  wardrobe: settings.wardrobe === Wardrobe.AUTO ? DEFAULT_SETTINGS.wardrobe : Wardrobe.AUTO
                })}
                icon={Briefcase} 
                isOpen={openSidebarSection === 'professional'} 
                onToggle={() => setOpenSidebarSection(openSidebarSection === 'professional' ? null : 'professional')}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: Wardrobe.CORPORATE, label: "Corporate", isRecommended: true },
                    { value: Wardrobe.LINKEDIN, label: "LinkedIn" },
                    { value: Wardrobe.CREATIVE, label: "Creative" },
                    { value: Wardrobe.DOCTOR, label: "Doctor" },
                    { value: Wardrobe.LAWYER, label: "Lawyers" },
                    { value: Wardrobe.ORIGINAL, label: "Original" }
                  ].map((option) => {
                    const isActive = settings.wardrobe === option.value;
                    return (
                      <button
                        key={option.value}
                        disabled={!originalImage}
                        onClick={() => {
                          let newSettings = { ...settings, wardrobe: option.value };
                          if (option.value === Wardrobe.DOCTOR) {
                            newSettings = {
                              ...newSettings,
                              doctorCoatColor: DoctorCoatColor.WHITE,
                              stethoscopePosition: StethoscopePosition.NECK
                            };
                          } else if (option.value === Wardrobe.LAWYER) {
                            newSettings = {
                              ...newSettings,
                              enableBlackCoat: true,
                              enableNeckBand: true
                            };
                          } else if (option.value === Wardrobe.CORPORATE) {
                            newSettings = {
                              ...newSettings,
                              clothingChoice: ClothingChoice.SUIT_AND_TIE
                            };
                          }
                          setSettings(newSettings);
                        }}
                        className={`relative flex flex-col items-center justify-center gap-1 p-1 rounded-xl border transition-all duration-200 outline-none focus:outline-none h-[44px] ${
                          !originalImage ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          isActive 
                            ? 'bg-[#00b87c]/10 border-[#00b87c]/30 text-[#00b87c] shadow-sm' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-bold text-[10px] whitespace-nowrap">{option.label}</span>
                        {option.isRecommended && (
                          <div className="absolute top-1 right-1">
                            <Star className="w-2.5 h-2.5 fill-[#00b87c] text-[#00b87c]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-3 flex justify-center">
                  <button 
                    onClick={() => setIsStyleSamplesOpen(true)}
                    className="text-[11px] font-bold text-studio-emerald hover:text-studio-emerald-dark flex items-center gap-1.5 underline underline-offset-4 decoration-studio-emerald/30"
                  >
                    <Image className="w-3.5 h-3.5" />
                    View Professional Style Samples
                  </button>
                </div>
              </SidebarSection>

              {(settings.wardrobe === Wardrobe.CORPORATE || settings.wardrobe === Wardrobe.LINKEDIN || settings.wardrobe === Wardrobe.CREATIVE || settings.wardrobe === Wardrobe.DOCTOR || settings.wardrobe === Wardrobe.LAWYER) && (
                <SidebarSection 
                  title="Wardrobe" 
                  disabled={!originalImage}
                  isAuto={settings.clothingChoice === ClothingChoice.AUTO}
                  selectedValue={settings.clothingChoice !== ClothingChoice.AUTO ? settings.clothingChoice : undefined}
                  onAutoToggle={() => setSettings({
                    ...settings, 
                    clothingChoice: settings.clothingChoice === ClothingChoice.AUTO ? DEFAULT_SETTINGS.clothingChoice : ClothingChoice.AUTO
                  })}
                  icon={Shirt} 
                  isOpen={openSidebarSection === 'clothing'} 
                  onToggle={() => setOpenSidebarSection(openSidebarSection === 'clothing' ? null : 'clothing')}
                >
                  
                  {(settings.wardrobe === Wardrobe.CORPORATE || settings.wardrobe === Wardrobe.LINKEDIN) && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                      <SubHeader title="Attire Selection" />
                      <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: ClothingChoice.SUIT_AND_TIE, label: "Suit & Tie" },
                        { value: ClothingChoice.SUIT_ONLY, label: "Suit Only" },
                        ...((settings.wardrobe === Wardrobe.LINKEDIN || settings.wardrobe === Wardrobe.CORPORATE) ? [{ value: ClothingChoice.SHIRT_ONLY, label: "Shirt Only" }] : []),
                        { value: ClothingChoice.ORIGINAL, label: "Original" }
                      ].map((option) => {
                        const isActive = settings.clothingChoice === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setSettings({...settings, clothingChoice: option.value})}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all duration-200 outline-none focus:outline-none h-[48px] ${
                              isActive 
                                ? 'bg-[#00b87c]/10 border-[#00b87c]/30 text-[#00b87c] shadow-sm' 
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-bold text-[12px]">{option.label}</span>
                          </button>
                        );
                      })}
                      </div>
                    </div>
                )}
                
                {settings.wardrobe === Wardrobe.DOCTOR && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <SubHeader title="Doctor Options" />
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 tracking-tight">Coat Color</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: DoctorCoatColor.WHITE, label: "White" },
                            { value: DoctorCoatColor.GREEN, label: "Green Uniform" }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSettings({...settings, doctorCoatColor: option.value})}
                              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all duration-200 outline-none focus:outline-none h-[48px] ${
                                settings.doctorCoatColor === option.value 
                                  ? 'bg-[#00b87c]/10 border-[#00b87c]/30 text-[#00b87c] shadow-sm' 
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="font-bold text-[12px]">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 tracking-tight">Stethoscope</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: StethoscopePosition.NECK, label: "Neck" },
                            { value: StethoscopePosition.HAND, label: "Hand" }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSettings({...settings, stethoscopePosition: option.value})}
                              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all duration-200 outline-none focus:outline-none h-[48px] ${
                                settings.stethoscopePosition === option.value 
                                  ? 'bg-[#00b87c]/10 border-[#00b87c]/30 text-[#00b87c] shadow-sm' 
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="font-bold text-[12px]">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settings.wardrobe === Wardrobe.LAWYER && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <SubHeader title="Lawyer Options" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Black Coat</span>
                        <button 
                          onClick={() => setSettings({...settings, enableBlackCoat: !settings.enableBlackCoat})}
                          className={`w-10 h-5 rounded-full transition-all relative ${settings.enableBlackCoat ? 'bg-[#10b981]' : 'bg-[#cbd5e1] dark:bg-slate-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.enableBlackCoat ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Neck Band</span>
                        <button 
                          onClick={() => setSettings({...settings, enableNeckBand: !settings.enableNeckBand})}
                          className={`w-10 h-5 rounded-full transition-all relative ${settings.enableNeckBand ? 'bg-[#10b981]' : 'bg-[#cbd5e1] dark:bg-slate-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.enableNeckBand ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {(settings.wardrobe === Wardrobe.CORPORATE || settings.wardrobe === Wardrobe.LINKEDIN) && settings.clothingChoice === ClothingChoice.SUIT_AND_TIE && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <SubHeader title="Tie Color" />
                    <div className="grid grid-cols-8 gap-3">
                      {(Object.keys(tieColorMap) as (keyof typeof tieColorMap)[]).filter(color => color !== TieColor.AUTO).map((color) => (
                        <OptionButton 
                          key={color} 
                          label={color} 
                          active={settings.tieColor === color} 
                          onClick={() => {
                            if (color === TieColor.CUSTOM) {
                              setSettings({...settings, tieColor: color, useCustomTieColor: true});
                            } else {
                              setSettings({...settings, tieColor: color, useCustomTieColor: false});
                            }
                          }} 
                          color={tieColorMap[color]} 
                          showLabel={false}
                        />
                      ))}
                    </div>
                    
                    {settings.tieColor === TieColor.CUSTOM && (
                      <div className="mt-4 animate-in zoom-in-95 duration-300">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 tracking-tight">Custom Tie Color</p>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-emerald-500/30 ring-1 ring-emerald-500/10 transition-all">
                          <div className="flex items-center gap-2">
                            <div 
                              className="relative w-9 h-9 rounded-lg overflow-hidden border border-emerald-500/30 flex-shrink-0 transition-all"
                            >
                              <input 
                                type="color" 
                                value={settings.customTieHex}
                                onChange={(e) => setSettings({...settings, tieColor: TieColor.CUSTOM, customTieHex: e.target.value, useCustomTieColor: true})}
                                className="absolute inset-0 w-full h-full scale-150 cursor-pointer border-none bg-transparent"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={settings.customTieHex}
                              onChange={(e) => setSettings({...settings, tieColor: TieColor.CUSTOM, customTieHex: e.target.value, useCustomTieColor: true})}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[11px] font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all uppercase"
                              placeholder="#HEXCODE"
                            />
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(settings.wardrobe === Wardrobe.CORPORATE || settings.wardrobe === Wardrobe.LINKEDIN) && settings.clothingChoice === ClothingChoice.SUIT_AND_TIE && settings.clothingChoice !== ClothingChoice.ORIGINAL && (
                  <div className="my-5 border-t border-slate-100 dark:border-slate-800" />
                )}

                {(((settings.wardrobe === Wardrobe.CORPORATE || settings.wardrobe === Wardrobe.LINKEDIN) && settings.clothingChoice !== ClothingChoice.ORIGINAL) || settings.wardrobe === Wardrobe.CREATIVE) && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <SubHeader title="Fabric Color" />
                    <div className="grid grid-cols-8 gap-3">
                      {(Object.keys(clothingStyleColorMap) as (keyof typeof clothingStyleColorMap)[]).filter(style => style !== ClothingStyle.AUTO).map((style) => (
                        <OptionButton 
                          key={style} 
                          label={style} 
                          active={settings.clothingStyle === style} 
                          onClick={() => {
                            if (style === ClothingStyle.CUSTOM) {
                              setSettings({...settings, clothingStyle: style, useCustomSuitColor: true});
                            } else {
                              setSettings({...settings, clothingStyle: style, useCustomSuitColor: false});
                            }
                          }} 
                          color={clothingStyleColorMap[style]} 
                          showLabel={false}
                          shape="square"
                        />
                      ))}
                    </div>

                    {settings.clothingStyle === ClothingStyle.CUSTOM && (
                      <div className="mt-4 animate-in zoom-in-95 duration-300">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 tracking-tight">Custom Fabric Color</p>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-emerald-500/30 ring-1 ring-emerald-500/10 transition-all">
                          <div className="flex items-center gap-2">
                            <div 
                              className="relative w-9 h-9 rounded-lg overflow-hidden border border-emerald-500/30 flex-shrink-0 transition-all"
                            >
                              <input 
                                type="color" 
                                value={settings.customSuitHex}
                                onChange={(e) => setSettings({...settings, clothingStyle: ClothingStyle.CUSTOM, customSuitHex: e.target.value, useCustomSuitColor: true})}
                                className="absolute inset-0 w-full h-full scale-150 cursor-pointer border-none bg-transparent"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={settings.customSuitHex}
                              onChange={(e) => setSettings({...settings, clothingStyle: ClothingStyle.CUSTOM, customSuitHex: e.target.value, useCustomSuitColor: true})}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[11px] font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all uppercase"
                              placeholder="#HEXCODE"
                            />
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </SidebarSection>
              )}



              <SidebarSection 
                title="Background" 
                disabled={!originalImage}
                isAuto={settings.background === BackgroundStyle.AUTO || (isAutoMode && settings.background === BackgroundStyle.PURE_WHITE)}
                selectedValue={settings.background !== BackgroundStyle.AUTO ? settings.background : undefined}
                onAutoToggle={() => setSettings({
                  ...settings, 
                  background: settings.background === BackgroundStyle.AUTO ? DEFAULT_SETTINGS.background : BackgroundStyle.AUTO
                })}
                icon={Layout} 
                isOpen={openSidebarSection === 'background'} 
                onToggle={() => setOpenSidebarSection(openSidebarSection === 'background' ? null : 'background')}
              >
                <div className="grid grid-cols-5 gap-3">
                  {(Object.keys(backdropColorMap) as (keyof typeof backdropColorMap)[]).filter(style => style !== BackgroundStyle.AUTO && style !== BackgroundStyle.ALL && style !== BackgroundStyle.TRANSPARENT).map((style) => (
                    <BackdropOptionButton
                      key={style}
                      label={style}
                      active={settings.background === style}
                      onClick={() => {
                        if (style === BackgroundStyle.CUSTOM) {
                          setSettings({...settings, background: style, useCustomBackgroundColor: true});
                        } else {
                          setSettings({...settings, background: style, useCustomBackgroundColor: false});
                        }
                      }}
                      color={backdropColorMap[style]}
                    />
                  ))}
                </div>

                {settings.background === BackgroundStyle.CUSTOM && (
                  <div className="mt-4 animate-in zoom-in-95 duration-300">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 tracking-tight">Custom Background Color</p>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-emerald-500/30 ring-1 ring-emerald-500/10 transition-all">
                      <div className="flex items-center gap-2">
                        <div 
                          className="relative w-9 h-9 rounded-lg overflow-hidden border border-emerald-500/30 flex-shrink-0 transition-all"
                        >
                          <input 
                            type="color" 
                            value={settings.customBackgroundHex}
                            onChange={(e) => setSettings({...settings, background: BackgroundStyle.CUSTOM, customBackgroundHex: e.target.value, useCustomBackgroundColor: true})}
                            className="absolute inset-0 w-full h-full scale-150 cursor-pointer border-none bg-transparent"
                          />
                        </div>
                        <input 
                          type="text" 
                          value={settings.customBackgroundHex}
                          onChange={(e) => setSettings({...settings, background: BackgroundStyle.CUSTOM, customBackgroundHex: e.target.value, useCustomBackgroundColor: true})}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[11px] font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all uppercase"
                          placeholder="#HEXCODE"
                        />
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={() => setIsBackgroundSamplesOpen(true)}
                    className="text-[11px] font-bold text-studio-emerald hover:text-studio-emerald-dark flex items-center gap-1.5 underline underline-offset-4 decoration-studio-emerald/30"
                  >
                    <Image className="w-3.5 h-3.5" />
                    View Background Samples
                  </button>
                </div>
              </SidebarSection>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] border border-slate-700 dark:border-slate-200"
                >
                  Next Step: Finalize & Generate
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 3: Finalize & Generate */}
      <div className="space-y-3">
        <StepHeader 
          step={3} 
          title="Finalize & Generate" 
          isActive={currentStep === 3} 
          isCompleted={false}
          onClick={() => originalImage && setCurrentStep(3)}
        />
        <AnimatePresence>
          {currentStep === 3 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="py-2 space-y-4 px-1">
                <SidebarSection 
                  title="Enhancements" 
                  disabled={!originalImage}
                  selectedValue={settings.enableSmile ? settings.expression : undefined}
                  icon={Sparkles} 
                  isOpen={openSidebarSection === 'enhancements'} 
                  onToggle={() => setOpenSidebarSection(openSidebarSection === 'enhancements' ? null : 'enhancements')}
                >
                  <div className="space-y-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <SubHeader title="Smile" />
                        <label className="flex items-center cursor-pointer">
                          <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableSmile ? 'bg-[#10b981]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${settings.enableSmile ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={settings.enableSmile} 
                            onChange={(e) => setSettings({...settings, enableSmile: e.target.checked})} 
                          />
                        </label>
                      </div>
                      {settings.enableSmile && (
                        <div className="mt-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <button
                            onClick={() => setSettings({...settings, expression: Expression.PROFESSIONAL})}
                            className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all duration-200 outline-none focus:outline-none h-[48px] ${
                              settings.expression === Expression.PROFESSIONAL
                                ? 'bg-[#00b87c]/10 border-[#00b87c]/30 text-[#00b87c] shadow-sm' 
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-bold text-[12px]">Professional</span>
                            {settings.expression === Expression.PROFESSIONAL && (
                              <div className="absolute top-1.5 right-1.5">
                                <Star className="w-3.5 h-3.5 text-[#00b87c] fill-[#00b87c]" />
                              </div>
                            )}
                          </button>
                          <button
                            onClick={() => setSettings({...settings, expression: Expression.WARM_SMILE})}
                            className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all duration-200 outline-none focus:outline-none h-[48px] ${
                              settings.expression === Expression.WARM_SMILE
                                ? 'bg-[#00b87c]/10 border-[#00b87c]/30 text-[#00b87c] shadow-sm' 
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-bold text-[12px]">Warm Smile</span>
                            {settings.expression === Expression.WARM_SMILE && (
                              <div className="absolute top-1.5 right-1.5">
                                <Star className="w-3.5 h-3.5 text-[#00b87c] fill-[#00b87c]" />
                              </div>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <SubHeader title="Retouching" />
                      <div className="space-y-2 mt-3">
                        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-emerald-500/30 transition-all">
                          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Skin Brightening</span>
                          <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableFairness ? 'bg-[#10b981]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${settings.enableFairness ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={settings.enableFairness} onChange={(e) => setSettings({...settings, enableFairness: e.target.checked})} />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-emerald-500/30 transition-all">
                          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Face Smoothing</span>
                          <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableFaceSmoothing ? 'bg-[#10b981]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${settings.enableFaceSmoothing ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={settings.enableFaceSmoothing} onChange={(e) => setSettings({...settings, enableFaceSmoothing: e.target.checked})} />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-emerald-500/30 transition-all">
                          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Auto-Beautify</span>
                          <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableBeautification ? 'bg-[#10b981]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${settings.enableBeautification ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={settings.enableBeautification} onChange={(e) => setSettings({...settings, enableBeautification: e.target.checked})} />
                        </label>
                      </div>
                    </div>
                  </div>
                </SidebarSection>

                <div className="px-3">
                  <button 
                    disabled={isGenerating || !originalImage} 
                    onClick={generateHeadshot} 
                    className="w-full h-12 rounded-lg bg-studio-emerald text-white font-semibold text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-sm hover:bg-studio-emerald-dark hover:shadow-md active:scale-[0.98]"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="animate-pulse">Creating Magic...</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Portrait</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy & Disclaimer Section - Always Visible */}
      <div className="mt-auto pt-6 space-y-4 px-2">
        <div className="bg-amber-50/40 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20 p-4 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-amber-400/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-tight">Privacy First</h4>
          </div>
          <p className="text-[10px] font-medium text-amber-700/70 dark:text-amber-400/60 leading-relaxed">
            Your privacy is our priority. We do not store your uploaded source photos. Preview Headshots are kept for 5 days and HD Portraits for 15 days, after which they are permanently deleted.
          </p>
        </div>

        <div className="px-1">
          <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed italic opacity-70">
            * AI Disclaimer: Portraits are AI-generated. We aim for high realism, but results may differ from actual appearance.
          </p>
        </div>
      </div>
    </div>
  </div>
</aside>

        <div className="p-6 lg:p-10 overflow-y-auto bg-[#fbfbfd] dark:bg-slate-950">
          <div className="max-w-full mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[45fr_25fr] gap-12 items-start">
              {/* Left Side: Preview or Placeholder */}
              <div className="space-y-8 w-full">
                {displayUrl ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative group shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800">
                    <div className={`aspect-square relative ${settings.background === BackgroundStyle.TRANSPARENT ? 'checkerboard' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                      <img 
                        src={displayUrl} 
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" 
                        style={{ 
                          filter: `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturation - (imageFilters.vintage * 0.3)}%) grayscale(${imageFilters.grayscale}%) sepia(${imageFilters.vintage * 0.6}%) hue-rotate(${imageFilters.hue - (imageFilters.vintage * 0.2)}deg)` 
                        }}
                        referrerPolicy="no-referrer" 
                      />
                      
                      {!activeGen?.is_unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                          <div className="opacity-[0.02] dark:opacity-[0.04] text-5xl lg:text-8xl font-black text-slate-900 dark:text-white rotate-[-25deg] tracking-[0.4em] whitespace-nowrap uppercase">
                            Preview • Preview • Preview • Preview
                          </div>
                        </div>
                      )}
                      {!activeGen?.is_unlocked && (
                        <div className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] ${isUnlocking || isConfirmingUnlock ? 'flex' : 'hidden group-hover:flex'} items-center justify-center transition-all duration-500 z-10`}>
                          {isUnlocking ? (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-white px-10 py-8 rounded-2xl font-black text-xs shadow-2xl tracking-tight flex flex-col items-center gap-6 border border-slate-200 dark:border-slate-800">
                              <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                  <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900/30 rounded-full"></div>
                                  <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <div className="text-center space-y-1">
                                  <p className="text-sm font-black tracking-tight animate-pulse">{loadingMessages[loadingMessageIndex]}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing HD Portrait</p>
                                </div>
                                <div className="w-48 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${generationProgress}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                                {generationProgress > 90 && (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse mt-2 uppercase tracking-widest">Finalizing details...</span>
                                )}
                              </div>
                            </div>
                          ) : isConfirmingUnlock ? (
                            <motion.div 
                              initial={{ scale: 0.9, opacity: 0, y: 20 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              className="flex flex-col items-center gap-6 bg-white/80 dark:bg-slate-900/80 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mx-4 max-w-[320px] backdrop-blur-xl"
                            >
                              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner">
                                <ShieldCheck className="w-8 h-8" />
                              </div>
                              <div className="text-center space-y-2">
                                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Unlock HD Portrait</h3>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed">
                                  Experience your portrait in stunning high definition. This will use <span className="text-emerald-500 font-black">5 credits</span>.
                                </p>
                                {!originalImage && (
                                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest animate-pulse">Source Photo Required</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-3 w-full">
                                <button 
                                  type="button"
                                  onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    if (!originalImage) {
                                      fileInputRef.current?.click();
                                      return;
                                    }
                                    handleUnlock(); 
                                  }}
                                  className={`w-full h-12 ${!originalImage ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#10b981] hover:bg-[#36a372]'} text-white rounded-xl font-semibold text-sm shadow-sm transition-all active:scale-[0.98]`}
                                >
                                  {!originalImage ? 'Upload Source' : 'Confirm Unlock'}
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsConfirmingUnlock(false);
                                  }}
                                  className="w-full h-10 text-slate-400 dark:text-slate-500 font-semibold text-xs hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                  Maybe Later
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <button 
                              disabled={isUnlocking}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (!originalImage) {
                                  setToast({ message: "Please re-upload your source photo to unlock this portrait.", type: 'error' });
                                  fileInputRef.current?.click();
                                } else {
                                  setIsConfirmingUnlock(true); 
                                }
                              }} 
                              className={`${!originalImage ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#10b981] hover:bg-[#2d8a60]'} text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm shadow-sm tracking-tight disabled:opacity-70 flex items-center gap-2`}
                            >
                              {!originalImage ? (
                                <>
                                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Re-upload Source to Unlock
                                </>
                              ) : (
                                'Unlock Master Portrait (5 Credits)'
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Zoom Trigger - Higher Z-Index to be clickable over overlay */}
                      <button 
                        onClick={() => setIsZoomed(true)}
                        className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-slate-900/90 rounded-full shadow-xl text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
                        title="Zoom Preview"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                          <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{activeGen?.is_unlocked ? 'HD Portrait' : 'Preview Headshot'}</h3>
                          <p className="text-slate-400 font-black text-[10px] tracking-tight mt-1">{activeGen?.is_unlocked ? 'High resolution unlocked' : 'Watermarked preview'}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          {!activeGen?.is_unlocked && (
                            <button 
                              onClick={() => {
                                if (!originalImage) {
                                  setToast({ message: "Please re-upload your source photo to unlock this portrait.", type: 'error' });
                                  fileInputRef.current?.click();
                                } else {
                                  setIsConfirmingUnlock(true); 
                                }
                              }}
                              className="flex-1 sm:flex-none bg-[#10b981] text-white px-4 h-9 rounded-md font-semibold text-xs flex items-center justify-center transition-all hover:bg-[#2d8a60]"
                            >
                              Unlock HD Portrait
                            </button>
                          )}
                          
                          <button 
                            onClick={async () => {
                              try {
                                if (!displayUrl) return;
                                const filteredUrl = await applyFiltersToImage(displayUrl, imageFilters);
                                const link = document.createElement('a');
                                link.href = filteredUrl;
                                link.download = "headshot.png";
                                link.click();
                              } catch (err) {
                                console.error("Download error:", err);
                                setToast({ message: "Failed to download image", type: 'error' });
                              }
                            }}
                            className="w-9 h-9 bg-[#10b981] text-white rounded-md flex items-center justify-center transition-all hover:bg-[#2d8a60] shadow-sm flex-shrink-0"
                            title="Download HD Image"
                          >
                            <Download className="w-5 h-5" />
                          </button>

                          <button 
                            onClick={async () => {
                              if (!displayUrl) return;
                              try {
                                const filteredUrl = await applyFiltersToImage(displayUrl, imageFilters);
                                const file = base64ToFile(filteredUrl, 'portrait.png');
                                
                                const shareData = {
                                  title: 'My Professional Portrait',
                                  text: 'Check out my professional portrait generated with AI!',
                                  files: [file]
                                };
                                
                                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                  await navigator.share(shareData);
                                } else if (navigator.share) {
                                  await navigator.share({
                                    title: shareData.title,
                                    text: shareData.text,
                                    url: window.location.href
                                  });
                                } else {
                                  await navigator.clipboard.writeText(window.location.href);
                                  setToast({ message: "Portrait link copied to clipboard!", type: 'success' });
                                }
                              } catch (err) {
                                if ((err as Error).name !== 'AbortError') {
                                  console.error("Share error:", err);
                                  setToast({ message: "Failed to share portrait", type: 'error' });
                                }
                              }
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Share Portrait"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-center shadow-sm min-h-[500px]">
                    {isGenerating ? (
                      <div className="flex flex-col items-center w-full max-w-md px-8">
                        <div className="relative mb-12">
                          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                            <Star className="w-10 h-10 animate-bounce" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-6">Crafting Your Portrait</h3>
                        
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4 shadow-inner">
                          <motion.div 
                            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${generationProgress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        
                        <div className="flex justify-between w-full mb-8">
                          <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{loadingMessages[loadingMessageIndex]}</span>
                          <span className="text-[10px] font-black text-emerald-500 tracking-widest">{Math.floor(generationProgress)}%</span>
                        </div>
 
                        <p className="text-slate-400 dark:text-slate-500 font-bold text-xs tracking-tight text-center leading-relaxed">
                          {generationProgress > 90 ? "Taking longer than expected... Our AI is perfecting the details." : "Estimated time: 30-45 seconds"}
                        </p>
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center w-full max-w-md px-8">
                        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 mb-8 shadow-inner">
                          <AlertCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-red-500 mb-4">Generation Failed</h3>
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 text-center mb-10 leading-relaxed">{error}</p>
                        <button 
                          onClick={() => {
                            if (error.includes("HD") || error.includes("Master")) {
                              handleUnlock();
                            } else {
                              generateHeadshot();
                            }
                          }}
                          className="w-full h-12 rounded-xl bg-[#10b981] hover:bg-[#2d8a60] text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                          <RotateCcw className="w-4 h-4" /> Try Again
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-md">
                        <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-10 mx-auto shadow-inner">
                          <div className="w-12 h-12 border-4 border-emerald-500 rounded-2xl relative">
                            <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-white dark:bg-slate-900 rounded-full border-4 border-emerald-500 shadow-lg"></div>
                          </div>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Waiting for Generation</h3>
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 leading-relaxed">Once you hit generate, our AI will craft your professional portrait in less than 60 seconds.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Finishing Tools & Generation Settings */}
              <div className={`space-y-6 lg:sticky lg:top-0 transition-all duration-300 ${!displayUrl ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="card-base p-4 lg:p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Settings className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-black tracking-tight text-slate-800 dark:text-white">Finishing Tools</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setImageFilters({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, hue: 0, vintage: 0 });
                        setSettings(prev => ({ ...prev, beautyFilter: 0, smoothing: 0, faceLeftLighting: 50, faceRightLighting: 50, bodyPose: BodyPose.FULL_FRONT }));
                      }}
                      className="p-1.5 text-slate-400 hover:text-[#10b981] transition-colors"
                      title="Reset All"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Standard Filters */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        <button 
                          onClick={onCropClick}
                          className="py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold tracking-tight rounded-lg hover:border-[#10b981] hover:text-[#10b981] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CropIcon className="w-3 h-3" /> Crop Image
                        </button>
                      </div>

                      {[
                        { label: 'Brightness', key: 'brightness', min: 50, max: 150, icon: Sun },
                        { label: 'Contrast', key: 'contrast', min: 50, max: 150, icon: Contrast },
                        { label: 'Grayscale', key: 'grayscale', min: 0, max: 100, icon: Moon },
                        { label: 'Vintage', key: 'vintage', min: 0, max: 100, icon: History },
                      ].map((filter) => (
                        <div key={filter.key} className="space-y-2 group">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <filter.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#10b981] transition-colors" />
                              <label className="text-xs font-bold text-slate-500 tracking-tight group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">{filter.label}</label>
                            </div>
                            <span className="text-[10px] font-bold text-[#10b981]">{(imageFilters as any)[filter.key]}%</span>
                          </div>
                          <input 
                            type="range" 
                            min={filter.min} 
                            max={filter.max} 
                            value={(imageFilters as any)[filter.key]} 
                            onChange={(e) => setImageFilters(prev => ({ ...prev, [filter.key]: parseInt(e.target.value) }))}
                            className="w-full h-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#10b981]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Crop Modal */}
            <AnimatePresence>
              {isCropModalOpen && displayUrl && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                >
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-studio-emerald/10 rounded-lg flex items-center justify-center text-studio-emerald">
                          <CropIcon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white">Crop Portrait</h3>
                      </div>
                      <button 
                        onClick={() => setIsCropModalOpen(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 min-h-0">
                      <div className="relative max-w-full max-h-full flex items-center justify-center">
                        <ReactCrop
                          crop={crop}
                          onChange={(c) => setCrop(c)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={1}
                          circularCrop={false}
                        >
                          <img
                            ref={imgRef}
                            src={displayUrl}
                            alt="Crop me"
                            onLoad={onImageLoad}
                            className="max-w-full max-h-[70vh] w-auto h-auto object-contain block mx-auto"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                        </ReactCrop>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setIsCropModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={getCroppedImg}
                        className="px-6 py-2 bg-studio-emerald hover:bg-studio-emerald-dark text-white rounded-lg font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
                      >
                        Apply Crop
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Zoom Modal */}
            <AnimatePresence>
              {isZoomed && displayUrl && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-12"
                  onClick={() => setIsZoomed(false)}
                >
                  <button 
                    className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                    onClick={() => setIsZoomed(false)}
                  >
                    <X className="w-8 h-8" />
                  </button>
                  <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    src={displayUrl} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                    style={{ 
                      filter: `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturation - (imageFilters.vintage * 0.3)}%) grayscale(${imageFilters.grayscale}%) sepia(${imageFilters.vintage * 0.6}%) hue-rotate(${imageFilters.hue - (imageFilters.vintage * 0.2)}deg)` 
                    }}
                    referrerPolicy="no-referrer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-800 dark:text-white tracking-tight text-xs flex items-center gap-3">
                    <History className="w-4 h-4 text-[#10b981]" /> Recent Portraits
                  </h3>
                  <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-[#10b981]" /> 
                    Privacy: Previews kept for 5 days, HD Portraits for 15 days. Source photos are never saved.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-y-auto max-h-[850px] pr-2 custom-scrollbar">
                {generations.slice(0, showAllRecent ? undefined : 4).map(gen => (
                  <div 
                    key={gen.id} 
                    onClick={() => handleSelectGen(gen)} 
                    className={`relative group aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 shadow-sm ${activeGen?.id === gen.id ? 'border-[#10b981]' : 'border-white dark:border-slate-800'}`}
                  >
                    <img src={gen.thumbnail_url || gen.image_data} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteGeneration(gen.id); }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                      title="Delete Portrait"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {generations.length > 4 && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowAllRecent(!showAllRecent)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    {showAllRecent ? 'Show Less' : `View All (${generations.length})`}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllRecent ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
              
              {generations.length === 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <Camera className="w-8 h-8" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        )}

        {/* Footer */}
        <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 transition-colors mt-12 lg:mt-24 overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-4">
            {/* Logo & Description */}
            <div className="space-y-3 md:col-span-12 lg:col-span-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center text-white">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-3xl font-black tracking-tighter text-white">
                  Headshot<span className="text-studio-emerald">Studio</span>Pro
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                The world's most advanced AI headshot generator. Professional portraits for everyone, everywhere.
              </p>
            </div>

            {/* Product Column */}
            <div className="space-y-3 md:col-span-4 lg:col-span-2 lg:col-start-7">
              <h4 className="text-sm font-bold text-white">Product</h4>
              <ul className="space-y-2">
                <li><button onClick={handleOpenShop} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Pricing</button></li>
                <li><button onClick={() => setIsSamplesOpen(true)} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Samples</button></li>
                <li><button onClick={() => setIsHowItWorksOpen(true)} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">How it Works</button></li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="space-y-3 md:col-span-4 lg:col-span-2">
              <h4 className="text-sm font-bold text-white">Support</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onOpenSupport('faq')} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Support</button></li>
                <li><button onClick={() => onOpenSupport('support')} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Feedback</button></li>
                <li><button onClick={() => setIsPrivacyOpen(true)} className="text-sm font-medium text-slate-400 hover:text-[#10b981] transition-colors">Privacy Policy</button></li>
              </ul>
            </div>

            {/* Connect Column */}
            <div className="space-y-3 md:col-span-4 lg:col-span-2">
              <h4 className="text-sm font-bold text-white">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#10b981] hover:border-[#10b981] transition-all">
                  <Linkedin className="w-4 h-4" />
                </a>
                <button onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'HeadshotStudioPro',
                      text: 'Check out the world\'s most advanced AI headshot generator!',
                      url: window.location.href,
                    }).catch(console.error);
                  }
                }} className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#10b981] hover:border-[#10b981] transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Background */}
        <div className="bg-slate-950 border-t border-slate-800 py-3 px-4 lg:px-6">
          <div className="max-w-7xl mx-auto flex justify-center items-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
              © 2026 HeadshotStudioPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
    );
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {renderView()}
      
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <StyleSamplesModal isOpen={isStyleSamplesOpen} onClose={() => setIsStyleSamplesOpen(false)} />
      <BackgroundSamplesModal isOpen={isBackgroundSamplesOpen} onClose={() => setIsBackgroundSamplesOpen(false)} />
      <SamplesModal isOpen={isSamplesOpen} onClose={() => setIsSamplesOpen(false)} />
      <SupportHubModal 
        isOpen={isSupportHubOpen} 
        onClose={() => setIsSupportHubOpen(false)} 
        initialTab={supportHubInitialTab}
        hideTabs={supportHubHideTabs}
        userEmail={profile?.email}
        onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />
      
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        profile={profile} 
        history={history} 
        onUpdate={handleUpdateProfile} 
        onOpenShop={() => { setIsProfileModalOpen(false); handleOpenShop(); }} 
        isSaving={isSavingProfile} 
        formFields={{ name: formName, setName: setFormName, phone: formPhone, setPhone: setFormPhone }} 
      />

      {/* Global Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-lg border border-slate-100 dark:border-slate-800"
            >
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-4">Confirm Sign Out</h3>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                  Are you sure you want to sign out? For your privacy, all uploaded images are deleted immediately. Preview images are retained for 5 days, and HD Portraits are kept for 15 days before being automatically removed.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 shadow-sm transition-all"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConfirmingDirectHD && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsConfirmingDirectHD(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg w-full max-w-sm p-6 sm:p-8 border border-slate-100 dark:border-slate-800"
            >
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500 mb-6 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-4">Out of Free Previews</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-center">
                  You have used all your free previews. To deliver the highest studio quality, would you like to use <strong className="text-[#10b981]">5 Credits</strong> to generate an HD Portrait directly?
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsConfirmingDirectHD(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsConfirmingDirectHD(false);
                    generateHeadshot(true);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-studio-emerald text-white font-semibold text-sm hover:bg-studio-emerald-dark shadow-sm transition-all"
                >
                  Generate HD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShopModal 
        isOpen={isShopOpen} 
        onClose={() => setIsShopOpen(false)} 
        onPurchase={handlePurchase}
        currency={currency}
        setCurrency={setCurrency}
        formatPrice={formatPrice}
      />
      
      <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={(img) => { setIsVerified(false); setActiveGen(null); setOriginalImage(img); }} onError={(msg) => setToast({ message: msg, type: 'error' })} />
    </>
  );
};

export default App;
