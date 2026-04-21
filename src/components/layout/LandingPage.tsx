import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Sparkles, ArrowRight, Zap, ShieldCheck, Briefcase, Upload, Download, CheckCircle2 } from 'lucide-react';
import { AISuiteMenu } from '../AISuiteMenu';
import { PrivacyModal } from '../modals/PrivacyModal';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenFAQ: (tab?: 'how' | 'faq' | 'support') => void;
  formatPrice: (usd: number) => string;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  setCurrency: (c: 'USD' | 'INR' | 'EUR' | 'GBP') => void;
  setIsSamplesOpen: (open: boolean) => void;
  setView: (view: 'landing' | 'auth' | 'app') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenFAQ,
  formatPrice,
  currency,
  setCurrency,
  setIsSamplesOpen,
  setView
}) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-studio-text-primary font-sans selection:bg-studio-emerald/10 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-studio-border px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setView('landing')}>
            <div className="bg-studio-emerald w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-studio-emerald/20 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-studio-text-primary font-display">
              Headshot<span className="text-studio-emerald">Studio</span>Pro
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            <button onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-semibold text-studio-text-secondary hover:text-studio-emerald transition-colors">Examples</button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-semibold text-studio-text-secondary hover:text-studio-emerald transition-colors">Process</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-semibold text-studio-text-secondary hover:text-studio-emerald transition-colors">Pricing</button>
          </nav>
          
          <div className="hidden sm:block">
            <AISuiteMenu />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setView('auth')} className="text-sm font-semibold text-studio-text-secondary hover:text-studio-emerald transition-colors hidden sm:block">Sign In</button>
            <button onClick={onGetStarted} className="btn-primary" >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-24 lg:pt-52 lg:pb-40 section-container">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-10 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-studio-emerald-light border border-studio-emerald/10 text-studio-emerald text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> The Future of Professional Portraits
            </div>
            <h1 className="heading-xl">
              Premium <span className="text-studio-emerald">AI Headshots</span> for Modern Leaders
            </h1>
            <p className="text-premium max-w-xl mx-auto lg:mx-0">
              Get studio-quality executive portraits in minutes. Perfect for LinkedIn, resumes, and personal branding — no photoshoot required.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button onClick={onGetStarted} className="btn-primary px-8 py-4 text-base" >
                Generate Your Portrait <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary px-8 py-4 text-base" >
                View Showcase
              </button>
            </div>
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-sm font-semibold text-studio-text-muted">
              <div className="flex items-center gap-2.5"><Zap className="w-4 h-4 text-amber-400" /> Instant Results</div>
              <div className="flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-studio-emerald" /> Secure & Private</div>
              <div className="flex items-center gap-2.5"><Briefcase className="w-4 h-4 text-blue-400" /> Enterprise Ready</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-studio-emerald/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -z-10"></div>
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="rounded-3xl overflow-hidden shadow-premium border border-studio-border aspect-[3/4]">
                  <img src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/happy1.png" className="w-full h-full object-cover" alt="AI Headshot" />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-premium border border-studio-border aspect-[3/4]">
                  <img src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/happy2.png" className="w-full h-full object-cover" alt="AI Headshot" />
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                className="space-y-6 mt-12"
              >
                <div className="rounded-3xl overflow-hidden shadow-premium border border-studio-border aspect-[3/4]">
                  <img src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/hero1.png" className="w-full h-full object-cover" alt="AI Headshot" />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-premium border border-studio-border aspect-[3/4]">
                  <img src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/after.png" className="w-full h-full object-cover" alt="AI Headshot" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section id="examples" className="py-32 bg-studio-surface border-y border-studio-border">
        <div className="section-container">
          <div className="text-center mb-20">
            <h2 className="heading-lg mb-6">Unmatched Realism</h2>
            <p className="text-premium max-w-2xl mx-auto">Our advanced AI preserves your unique features while applying professional studio techniques.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="relative group rounded-[2rem] overflow-hidden shadow-premium border border-studio-border bg-white p-2">
                <img src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/before.png" className="w-full aspect-[3/4] object-cover rounded-[1.5rem] grayscale group-hover:grayscale-0 transition-all duration-700" alt="Before" />
                <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-xs font-bold text-studio-text-primary shadow-sm">Original Photo</div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="relative group rounded-[2rem] overflow-hidden shadow-premium border-2 border-studio-emerald/30 bg-white p-2">
                <img src="https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/after.png" className="w-full aspect-[3/4] object-cover rounded-[1.5rem] group-hover:scale-[1.02] transition-all duration-700" alt="After" />
                <div className="absolute top-6 left-6 px-4 py-2 bg-studio-emerald rounded-xl text-xs font-bold text-white shadow-lg">AI Masterpiece</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="how-it-works" className="py-32">
        <div className="section-container">
          <div className="text-center mb-20">
            <h2 className="heading-lg mb-6">The Studio Experience, Simplified</h2>
            <p className="text-premium max-w-2xl mx-auto">Three steps to your new professional identity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-studio-border to-transparent"></div>
            {[
              { step: '01', title: 'Upload & Analyze', desc: 'Upload a single selfie. Our AI analyzes your facial structure and lighting.', icon: Upload },
              { step: '02', title: 'Style Selection', desc: 'Choose from dozens of curated professional styles, attire, and backgrounds.', icon: Sparkles },
              { step: '03', title: 'Instant Generation', desc: 'Receive high-resolution, photorealistic portraits ready for immediate use.', icon: Download }
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col items-center text-center space-y-6 group" >
                <div className="w-32 h-32 rounded-[2.5rem] bg-white border border-studio-border flex items-center justify-center relative z-10 shadow-premium group-hover:shadow-premium-hover group-hover:-translate-y-1 transition-all duration-500">
                  <item.icon className="w-12 h-12 text-studio-emerald" />
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-studio-emerald rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-studio-text-primary">{item.title}</h3>
                <p className="text-studio-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-studio-surface border-y border-studio-border">
        <div className="section-container">
          <div className="text-center mb-20">
            <h2 className="heading-lg mb-6">Simple, Fair Pricing</h2>
            <p className="text-premium max-w-2xl mx-auto">Professional headshots at a fraction of the traditional cost. No subscriptions.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free Trial */}
            <div className="p-8 rounded-[2rem] bg-white border border-studio-border shadow-premium flex flex-col">
              <h3 className="text-xl font-bold text-studio-text-primary mb-2">Free Trial</h3>
              <div className="text-4xl font-bold text-studio-text-primary mb-6">Free</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> 1 AI Credit</li>
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> 2 Preview Headshots</li>
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> Standard AI Model</li>
              </ul>
              <button onClick={onGetStarted} className="btn-secondary w-full py-3 text-sm" >
                Try Now
              </button>
            </div>

            {/* Micro Pack */}
            <div className="p-8 rounded-[2rem] bg-white border border-studio-border shadow-premium flex flex-col">
              <h3 className="text-xl font-bold text-studio-text-primary mb-2">Micro Pack</h3>
              <div className="text-4xl font-bold text-studio-text-primary mb-6">{formatPrice(199)}</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> 10 AI Credits</li>
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> 2 HD Headshots</li>
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> 4 Preview Headshots</li>
              </ul>
              <button onClick={onGetStarted} className="btn-secondary w-full py-3 text-sm" >
                Buy Credits
              </button>
            </div>

            {/* Standard Suite */}
            <div className="p-8 rounded-[2rem] bg-white border-2 border-studio-emerald shadow-premium-hover flex flex-col relative z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-studio-emerald text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                Best Value
              </div>
              <h3 className="text-xl font-bold text-studio-text-primary mb-2">Standard Suite</h3>
              <div className="text-4xl font-bold text-studio-text-primary mb-6">{formatPrice(699)}</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-studio-text-primary text-sm font-semibold"><CheckCircle2 className="w-4 h-4 text-studio-emerald" /> 50 AI Credits</li>
                <li className="flex items-center gap-3 text-studio-text-primary text-sm font-semibold"><CheckCircle2 className="w-4 h-4 text-studio-emerald" /> 10 HD Headshots</li>
                <li className="flex items-center gap-3 text-studio-text-primary text-sm font-semibold"><CheckCircle2 className="w-4 h-4 text-studio-emerald" /> 25 Preview Headshots</li>
              </ul>
              <button onClick={onGetStarted} className="btn-primary w-full py-3 text-sm shadow-lg shadow-studio-emerald/20" >
                Get Started
              </button>
            </div>

            {/* Power Enterprise */}
            <div className="p-8 rounded-[2rem] bg-white border border-studio-border shadow-premium flex flex-col">
              <h3 className="text-xl font-bold text-studio-text-primary mb-2">Power Enterprise</h3>
              <div className="text-4xl font-bold text-studio-text-primary mb-6">{formatPrice(1299)}</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> 125 AI Credits</li>
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> 25 HD Headshots</li>
                <li className="flex items-center gap-3 text-studio-text-secondary text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-studio-emerald/40" /> 75 Preview Headshots</li>
              </ul>
              <button onClick={onGetStarted} className="btn-secondary w-full py-3 text-sm" >
                Go Pro
              </button>
            </div>
          </div>
          <div className="mt-20 flex justify-center">
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-studio-border shadow-sm">
              {(['USD', 'INR', 'EUR', 'GBP'] as const).map((curr) => (
                <button key={curr} onClick={() => setCurrency(curr)} className={`px-5 py-2 rounded-xl text-xs font-bold tracking-widest transition-all ${ currency === curr ? 'bg-studio-emerald text-white shadow-md' : 'text-studio-text-secondary hover:text-studio-text-primary' }`} >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-studio-border bg-white">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('landing')}>
              <div className="bg-studio-emerald w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-studio-text-primary font-display">
                Headshot<span className="text-studio-emerald">Studio</span>Pro
              </span>
            </div>
            <div className="flex gap-10 text-sm font-semibold text-studio-text-secondary">
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-studio-emerald transition-colors">Privacy</button>
              <button onClick={() => onOpenFAQ('support')} className="hover:text-studio-emerald transition-colors">Support</button>
              <a href="mailto:headshotstudiopro@gmail.com" className="hover:text-studio-emerald transition-colors">Contact</a>
            </div>
            <p className="text-sm text-studio-text-muted font-medium">© 2026 HeadshotStudioPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};
