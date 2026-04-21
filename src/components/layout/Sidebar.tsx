import React from 'react';
import { ChevronDown, Check, Star } from 'lucide-react';

export const SidebarSection: React.FC<{
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
}> = ({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  isCompleted,
  collapsible = true,
  disabled = false,
  selectedValue,
  titleClassName = "",
  isAuto = false,
  onAutoToggle,
  hideAutoBanner = false
}) => (
  <div className={`border-b border-slate-100 last:border-0 transition-all duration-300 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
    <button
      onClick={collapsible ? onToggle : undefined}
      className={`w-full flex items-center justify-between p-5 lg:p-6 hover:bg-slate-50/50 transition-all group ${!collapsible ? 'cursor-default' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-[#16A34A] text-slate-900 shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-500 group-hover:text-[#16A34A]'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className={`text-xs font-black tracking-tight uppercase ${isOpen ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'} ${titleClassName}`}>
            {title}
          </h3>
          {selectedValue && !isOpen && (
            <p className="text-[10px] font-bold text-[#16A34A] mt-0.5 animate-in fade-in slide-in-from-left-2 duration-300 uppercase tracking-tight">
              {selectedValue}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isCompleted && !isOpen && (
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 shadow-sm animate-in zoom-in duration-300">
            <Check className="w-3 h-3" />
          </div>
        )}
        {collapsible && (
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-[#16A34A]' : ''}`} />
        )}
      </div>
    </button>
    {isOpen && (
      <div className="px-6 pb-8 lg:px-8 lg:pb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        {!hideAutoBanner && onAutoToggle && (
          <div className={`mb-6 p-3 rounded-xl border transition-all duration-500 flex items-center justify-between ${isAuto ? 'bg-white border-green-500 shadow-sm shadow-green-500/10' : 'bg-[#f8fafc] border-slate-100'}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded flex items-center justify-center text-slate-900 shadow-sm transition-all duration-300 ${isAuto ? 'bg-green-500' : 'bg-slate-400'}`}>
                <SparklesIcon className="w-2.5 h-2.5" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[9px] font-bold text-slate-900 tracking-tight uppercase leading-none">Smart Auto</p>
                <p className="text-[7px] font-medium text-slate-500 leading-none mt-0.5">Let AI choose best settings</p>
              </div>
            </div>
            <button
              onClick={onAutoToggle}
              className={`w-7 h-4 rounded-full transition-all relative ${isAuto ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-white shadow-sm transition-all ${isAuto ? 'left-[12px]' : 'left-[2px]'}`} />
            </button>
          </div>
        )}
        {children}
      </div>
    )}
  </div>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

export const SectionHeader: React.FC<{ title: string; icon: any }> = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
      <Icon className="w-4 h-4" />
    </div>
    <h3 className="text-xs font-black tracking-tight text-slate-800 uppercase">{title}</h3>
  </div>
);

export const SubHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-1 h-4 bg-[#16A34A] rounded-full" />
    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
  </div>
);

export const OptionButton: React.FC<{ label: string; active: boolean; onClick: () => void; color?: string; showLabel?: boolean; shape?: 'circle' | 'square' }> = ({ label, active, onClick, color, showLabel = true, shape = 'circle' }) => (
  <button
    onClick={onClick}
    className={`group flex flex-col items-center gap-2 transition-all ${active ? 'scale-110' : 'hover:scale-105'}`}
    title={label}
  >
    <div className={`relative w-9 h-9 flex items-center justify-center transition-all duration-300 ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'} ${active ? 'ring-2 ring-[#16A34A] ring-offset-2 ring-offset-white shadow-lg' : 'ring-1 ring-slate-200 hover:ring-slate-300'}`} style={{ background: color === 'rainbow' ? 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' : color }}>
      {active && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#16A34A] rounded-full flex items-center justify-center text-slate-900 shadow-sm border-2 border-white">
          <Check className="w-2 h-2" />
        </div>
      )}
    </div>
    {showLabel && (
      <span className={`text-[9px] font-bold tracking-tight uppercase transition-colors ${active ? 'text-[#16A34A]' : 'text-slate-500 group-hover:text-slate-700'}`}>
        {label}
      </span>
    )}
  </button>
);

export const RichSelect: React.FC<{ options: { value: string; label: string; icon?: any; isRecommended?: boolean }[]; value: string; onChange: (v: string) => void }> = ({ options, value, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {options.map((option) => {
      const isActive = value === option.value;
      return (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all duration-200 outline-none focus:outline-none h-[48px] ${
            isActive
              ? 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A] shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className="font-bold text-[12px]">{option.label}</span>
          {option.isRecommended && (
            <div className="absolute top-1.5 right-1.5">
              <Star className="w-3.5 h-3.5 fill-[#16A34A] text-[#16A34A]" />
            </div>
          )}
        </button>
      );
    })}
  </div>
);

export const BackdropOptionButton: React.FC<{ label: string; active: boolean; onClick: () => void; color?: string }> = ({ label, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`group flex flex-col items-center gap-2 transition-all ${active ? 'scale-110' : 'hover:scale-105'}`}
    title={label}
  >
    <div
      className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'ring-2 ring-[#16A34A] ring-offset-2 ring-offset-white shadow-lg' : 'ring-1 ring-slate-200 hover:ring-slate-300'}`}
      style={{ background: color === 'rainbow' ? 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' : color }}
    >
      {active && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#16A34A] rounded-full flex items-center justify-center text-slate-900 shadow-sm border-2 border-white">
          <Check className="w-3 h-3" />
        </div>
      )}
    </div>
    <span className={`text-[8px] font-bold tracking-tight uppercase transition-colors text-center leading-tight ${active ? 'text-[#16A34A]' : 'text-slate-500 group-hover:text-slate-700'}`}>
      {label.replace(/_/g, ' ')}
    </span>
  </button>
);
