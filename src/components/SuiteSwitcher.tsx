import React, { useState } from 'react';
import { ChevronDown, LayoutGrid, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ICON_MAP, AppEntry } from '../services/ecosystemService';

interface SuiteSwitcherProps {
  currentApp?: string;
  dynamicApps?: AppEntry[];
}

export const SuiteSwitcher: React.FC<SuiteSwitcherProps> = ({ 
  currentApp = 'hsp', 
  dynamicApps = [] 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const apps = dynamicApps.map(app => ({
    ...app,
    icon: ICON_MAP[app.icon_name] || LayoutGrid
  }));

  return (
    <div className="relative z-50 font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-[#0a0a0a] hover:bg-black border border-white/20 rounded-full transition-all group h-9"
      >
        <div className="p-1 rounded-full bg-white/10 text-white">
          <LayoutGrid size={13} strokeWidth={2.5} />
        </div>
        <div className="text-left hidden lg:block">
          {/* AI Suite text removed per user request */}
        </div>
        <ChevronDown size={14} className={cn("text-gray-400 transition-transform duration-300 ml-1", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-3 w-72 bg-[#0a0a0a] border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-3 border-b border-white/10 bg-white/5">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Connected Hub</p>
              </div>
              <div className="p-2 grid gap-1">
                {apps.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                     <p className="text-[11px] text-white/30 font-medium tracking-tight">Updating Hub configuration...</p>
                  </div>
                ) : apps.map((app) => (
                  <a key={app.id} href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group">
                    <div className={cn("p-2 rounded-xl bg-white/10 border border-white/5 transition-all")}>
                      <app.icon size={16} strokeWidth={2} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[11px] font-bold text-white mb-0.5 group-hover:text-emerald-400 transition-colors tracking-tight uppercase leading-none">{app.title}</p>
                      <p className="text-[10px] text-white/40 leading-snug line-clamp-1">{app.description}</p>
                    </div>
                    <ExternalLink size={12} className="text-white/10 group-hover:text-white/30 transition-colors" />
                  </a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
