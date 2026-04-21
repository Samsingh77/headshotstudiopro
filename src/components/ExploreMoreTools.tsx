import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, 
  Contact, 
  Stars, 
  Table, 
  Camera, 
  Sparkles, 
  User, 
  TrendingUp, 
  Mail, 
  Map,
  ArrowRight,
  MapPin,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { getAITools, AITool } from '../services/aiSuiteService';

const getIcon = (iconName: string, color: string) => {
  const props = { 
    className: "w-7 h-7",
    style: { color: color }
  };
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

const FALLBACK_TOOLS: AITool[] = [
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
    icon: "image",
    color: "#ec4899"
  }
];

export const ExploreMoreTools: React.FC = () => {
  const [tools, setTools] = useState<AITool[]>(FALLBACK_TOOLS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTools = async () => {
      // We don't need a full-screen loading for these as we have fallbacks
      try {
        const allTools = await getAITools();
        if (allTools && allTools.length > 0) {
          setTools(allTools);
        }
      } catch (error) {
        console.error("Failed to load tools for exploration", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, []);

  if (tools.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {tools.map((tool, idx) => (
        <motion.a
          key={tool.id || idx}
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
          whileHover={{ y: -8 }}
          className="group block bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-8">
              <div 
                className="w-16 h-16 rounded-[20px] flex items-center justify-center transition-transform group-hover:scale-110 duration-500"
                style={{ backgroundColor: `${tool.color}10` }}
              >
                {getIcon(tool.icon, tool.color)}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3 group-hover:text-studio-emerald transition-colors">
                {tool.name}
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10 line-clamp-2">
                {tool.description}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
                ECOSYSTEM
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-black text-[#00b87c] uppercase tracking-widest group-hover:gap-2.5 transition-all">
                Live <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
};
