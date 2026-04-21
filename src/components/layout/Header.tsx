import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, User, Layout, LogOut } from 'lucide-react';
import { AISuiteMenu } from '../AISuiteMenu';

interface HeaderProps {
  onOpenSupport: () => void;
  onOpenShop: () => void;
  onOpenSamples: () => void;
  onOpenProfile: () => void;
  onGoHome: () => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
  profile: any;
  isGuest: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSupport,
  onOpenShop,
  onOpenSamples,
  onOpenProfile,
  onGoHome,
  onLogout,
  onOpenDashboard,
  profile,
  isGuest,
  darkMode,
  onToggleDarkMode
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="px-4 lg:px-12 py-4 flex items-center justify-between bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-100 transition-all">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onGoHome}>
        <div className="bg-studio-emerald w-8 h-8 rounded-lg flex items-center justify-center text-slate-900 shadow-sm group-hover:scale-105 transition-transform">
          <Camera className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 ">
            Headshot<span className="text-studio-emerald">Studio</span>Pro
          </h1>
          <span className="text-[10px] font-semibold text-studio-emerald/50 bg-studio-emerald/5 px-1.5 py-0.5 rounded">v1.0.6-FIXED</span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-8">
        <div className="hidden sm:block">
          <AISuiteMenu />
        </div>
        <div className="flex items-center gap-3 lg:gap-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
              isDropdownOpen
                ? 'bg-studio-emerald text-slate-900 border-studio-emerald shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:text-studio-emerald border-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                  <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
                </div>

                <button
                  onClick={() => { onOpenDashboard(); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <Layout className="w-4 h-4" />
                  Dashboard
                </button>

                <div className="my-2 border-t border-slate-50 " />

                <button
                  onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
