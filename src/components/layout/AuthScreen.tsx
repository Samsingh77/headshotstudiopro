import React, { useState } from 'react';
import { Camera, Sparkles, LogIn, UserPlus, ArrowLeft, ShieldCheck, Mail, Lock, User, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  onAuth: (session: any) => void;
  onGuestLogin: () => void;
  onGoHome: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth, onGuestLogin, onGoHome }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.session);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          onAuth(data.session);
        } else {
          setError("Check your email for the confirmation link!");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Side: Brand & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 z-0" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none z-0">
          <div className="grid grid-cols-12 gap-4 p-8">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="relative z-10 space-y-12 max-w-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#16A34A] rounded-[24px] flex items-center justify-center text-slate-900 shadow-2xl shadow-emerald-500/30">
              <Camera className="w-8 h-8" />
            </div>
            <span className="text-4xl font-black tracking-[-0.04em] text-white">
              Headshot<span className="text-[#16A34A]">Studio</span>Pro
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-black tracking-tight text-white leading-[1.1]">
              Elevate Your Professional <span className="text-[#16A34A]">Identity</span>
            </h1>
            <p className="text-xl font-medium text-slate-400 leading-relaxed">
              Join 50,000+ professionals who trust our AI to craft their perfect online presence.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            {[
              "Instant AI Transformation",
              "Studio-Quality Lighting",
              "Professional Attire Options",
              "Privacy-First Processing"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 text-slate-300">
                <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 relative">
        <button onClick={onGoHome} className="absolute top-8 left-8 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 hover:text-slate-700 flex items-center gap-2 font-bold text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {isLogin ? 'Sign in to your studio' : 'Start your professional journey'}
            </p>
          </div>

          <div className="space-y-6">
            <button onClick={handleGoogleLogin} className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-4 hover:border-emerald-500/30 hover:bg-slate-50 transition-all shadow-sm group">
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
              <span className="font-black text-xs uppercase tracking-widest text-slate-700">Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative px-6 bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Or continue with email</span>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 pl-14 pr-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 pl-14 pr-14 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-500">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">{error}</p>
                </motion.div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="btn-primary w-full h-14"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {isLogin ? 'Sign In to Studio' : 'Create Studio Account'}
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors text-center"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <span className="relative px-6 bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Or</span>
              </div>

              <button
                onClick={onGuestLogin}
                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-4 hover:border-amber-500/30 hover:bg-amber-50 transition-all shadow-sm group"
              >
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-amber-500 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-700">Continue as Guest</span>
              </button>
            </div>
          </div>

          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
            <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
              Your security is our priority. We use enterprise-grade encryption and Supabase Auth to protect your account and data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Eye = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOff = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
);
