import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Grid, Sparkles, Table, Map, Mail, ArrowRight, ExternalLink, Globe, ChevronDown, Camera, FileSpreadsheet, Contact, Stars, User, TrendingUp, MapPin, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { getAITools, AITool } from '../services/aiSuiteService';

const FALLBACK_APPS: AITool[] = [
  {
    id: "gts",
    name: "GraphToSheets",
    description: "Convert any chart or graph image into structured Excel data instantly.",
    url: "https://graphtosheet.vercel.app",
    icon: "FileSpreadsheet",
    color: "#00b87c"
  },
  {
    id: "hsp",
    name: "HeadshotStudioPro",
    description: "Generate professional studio-quality headshots from your casual photos.",
    url: "https://headshotstudiopro.com",
    icon: "User",
    color: "#2563eb"
  },
  {
    id: "geonex",
    name: "GeoNex AI",
    description: "Extract location intelligence and spatial data from maps and satellite imagery.",
    url: "https://geonex.ai",
    icon: "MapPin",
    color: "#8b5cf6"
  },
  {
    id: "sharper",
    name: "Image Sharper",
    description: "Crystal clear enhancement and 4K upscaling for low-resolution images.",
    url: "https://imagesharper.ai",
    icon: "Image",
    color: "#ec4899"
  }
];

export const AISuiteMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState<AITool[]>(FALLBACK_APPS);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await getAITools();
        if (data && data.length > 0) {
          setApps(data);
        }
      } catch (error) {
        console.warn("Failed to fetch ecosystem apps", error);
      }
    };
    fetchApps();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (iconName: string) => {
    const props = { className: "w-5 h-5 text-white" };
    switch (iconName.toLowerCase()) {
      case 'filespreadsheet': return <FileSpreadsheet {...props} />;
      case 'contact': return <Contact {...props} />;
      case 'user': return <User {...props} />;
      case 'trendingup': return <TrendingUp {...props} />;
      case 'stars': return <Stars {...props} />;
      case 'table': return <Table {...props} />;
      case 'camera': return <Camera {...props} />;
      case 'mail': return <Mail {...props} />;
      case 'map': return <Map {...props} />;
      case 'mappin': return <MapPin {...props} />;
      case 'image': return <ImageIcon {...props} />;
      case 'maximize2': return <Maximize2 {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all ${
          isOpen 
            ? 'bg-white border-slate-200 shadow-md ring-4 ring-slate-100' 
            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
        }`}
      >
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
          <Grid className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-slate-700 tracking-tight">
          My AI Suite
        </span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute left-0 lg:left-auto lg:right-0 top-full mt-3 w-80 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-[#f1f5f9] overflow-hidden z-[200]"
          >
            <div className="bg-white px-6 py-5 border-b border-[#f1f5f9]">
              <span className="text-[12px] font-black text-[#94a3b8] uppercase tracking-[0.1em]">Switch Application</span>
            </div>

            <div className="p-2.5">
              <div className="grid grid-cols-1 gap-1">
                {apps.map((app, idx) => {
                  const isActive = app.name.toLowerCase().replace(/\s/g, '').includes("headshotstudiopro") || 
                                 app.url.toLowerCase().includes("headshotstudiopro.com");
                  return (
                    <a
                      key={idx}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group relative flex items-center gap-4 p-3 rounded-[20px] transition-all duration-300 ${
                        isActive 
                          ? 'bg-[#f0fdf4] border border-[#dcfce7]' 
                          : 'bg-white border border-transparent hover:bg-[#f8fafc] hover:border-[#f1f5f9]'
                      }`}
                    >
                      <div 
                        className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shadow-sm transition-transform group-hover:scale-[1.02]"
                        style={{ backgroundColor: app.color }}
                      >
                        {getIcon(app.icon)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[15px] font-bold tracking-tight transition-colors ${
                            isActive ? 'text-[#064e3b]' : 'text-[#334155] group-hover:text-[#0f172a]'
                          }`}>
                            {app.name}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-[#00b87c] text-white text-[9px] font-black uppercase tracking-[0.05em] shadow-sm">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-[12px] font-medium leading-tight mt-0.5 transition-colors ${
                          isActive ? 'text-[#059669]/70' : 'text-[#64748b] group-hover:text-[#475569]'
                        }`}>
                          {app.description}
                        </p>
                      </div>

                      {!isActive && (
                        <ExternalLink className="w-3.5 h-3.5 text-[#cbd5e1] group-hover:text-[#94a3b8] transition-colors" />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#f8fafc] px-6 py-4 border-t border-[#f1f5f9]">
              <a 
                href="https://aiwithshyam.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-black text-[#64748b] uppercase tracking-[0.1em] text-center block hover:text-[#334155] transition-colors"
              >
                View all tools at aiwithshyam.com
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
