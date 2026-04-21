import React from 'react';
import { ChevronDown } from 'lucide-react';

interface OptionButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  desc?: string;
  badge?: string;
  disabled?: boolean;
}

export const OptionButton: React.FC<OptionButtonProps> = ({ active, onClick, icon, label, desc, badge, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 p-3 rounded-md border text-left transition-all relative group ${
      active
        ? 'bg-emerald-50 border-emerald-200 shadow-sm'
        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
  >
    {icon && (
      <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
        active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:text-slate-500'
      }`}>
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`text-[11px] font-bold tracking-tight truncate ${active ? 'text-emerald-900' : 'text-slate-700'}`}>
          {label}
        </span>
        {badge && (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-tighter">
            {badge}
          </span>
        )}
      </div>
      {desc && (
        <p className={`text-[9px] font-medium leading-tight truncate ${active ? 'text-emerald-600/80' : 'text-slate-400'}`}>
          {desc}
        </p>
      )}
    </div>
    {active && (
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
    )}
  </button>
);

interface RichSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; desc?: string; icon?: React.ReactNode }[];
  label?: string;
  disabled?: boolean;
}

export const RichSelect: React.FC<RichSelectProps> = ({ value, onChange, options, label, disabled }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      {label && <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">{label}</label>}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-3 rounded-md border bg-white transition-all ${
          isOpen ? 'border-emerald-200 ring-2 ring-emerald-50' : 'border-slate-100 hover:border-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-3 text-left">
          {selected.icon && <div className="text-slate-400">{selected.icon}</div>}
          <div>
            <div className="text-[11px] font-bold text-slate-700">{selected.label}</div>
            {selected.desc && <div className="text-[9px] text-slate-400 font-medium">{selected.desc}</div>}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-md shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                  value === opt.value ? 'bg-emerald-50/50' : ''
                }`}
              >
                {opt.icon && <div className={`text-slate-400 ${value === opt.value ? 'text-emerald-500' : ''}`}>{opt.icon}</div>}
                <div>
                  <div className={`text-[11px] font-bold ${value === opt.value ? 'text-emerald-700' : 'text-slate-700'}`}>{opt.label}</div>
                  {opt.desc && <div className="text-[9px] text-slate-400 font-medium">{opt.desc}</div>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface BackdropOptionButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  img: string;
}

export const BackdropOptionButton: React.FC<BackdropOptionButtonProps> = ({ active, onClick, label, img }) => (
  <button
    onClick={onClick}
    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all group ${
      active ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-100 hover:border-slate-200'
    }`}
  >
    <img src={img} className={`w-full h-full object-cover transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-105'}`} alt={label} referrerPolicy="no-referrer" />
    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
    <span className={`absolute bottom-2 left-2 right-2 text-[9px] font-black text-white uppercase tracking-tighter truncate transition-transform ${active ? 'translate-y-0' : 'translate-y-1 group-hover:translate-y-0'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute top-2 right-2 w-4 h-4 rounded-md bg-emerald-500 flex items-center justify-center shadow-lg">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      </div>
    )}
  </button>
);

export const SidebarSection: React.FC<{ title: string; children: React.ReactNode; isOpen?: boolean; onToggle?: () => void }> = ({ title, children, isOpen = true, onToggle }) => (
  <div className="border-b border-slate-100/80 last:border-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group"
    >
      <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">{title}</span>
      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} group-hover:text-slate-600`} />
    </button>
    {isOpen && (
      <div className="px-4 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
        {children}
      </div>
    )}
  </div>
);

export const SectionHeader: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div className="mb-4">
    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight mb-0.5">{title}</h3>
    {desc && <p className="text-[9px] text-slate-400 font-medium leading-tight">{desc}</p>}
  </div>
);

export const SubHeader: React.FC<{ title: string }> = ({ title }) => (
  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">{title}</h4>
);
