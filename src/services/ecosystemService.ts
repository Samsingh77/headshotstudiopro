import { 
  FileSpreadsheet, 
  User, 
  TrendingUp, 
  Stars, 
  Camera, 
  Table, 
  Mail, 
  Map as MapIcon, 
  MapPin, 
  Image as ImageIcon, 
  Maximize2,
  Sparkles,
  LayoutGrid
} from 'lucide-react';

export interface AppEntry {
  id: string;
  title: string;
  description: string;
  url: string;
  icon_name: string;
  accent_color?: string;
}

export const ICON_MAP: Record<string, any> = {
  'filespreadsheet': FileSpreadsheet,
  'spreadsheet': FileSpreadsheet,
  'user': User,
  'trendingup': TrendingUp,
  'chart': TrendingUp,
  'stars': Stars,
  'camera': Camera,
  'table': Table,
  'mail': Mail,
  'map': MapIcon,
  'mappin': MapPin,
  'image': ImageIcon,
  'maximize2': Maximize2,
  'sparkles': Sparkles
};

export const getEcosystemApps = async (): Promise<AppEntry[]> => {
  try {
    // Try to fetch through our own proxy first to avoid CORS and get fallback data
    const response = await fetch('/api/ecosystem-apps');
    
    if (!response.ok) {
      console.warn('Backend proxy /api/ecosystem-apps returned error, using direct fetch or fallback');
    } else {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return data.map((app: any) => ({
            id: app.id || Math.random().toString(36).substr(2, 9),
            title: app.name || app.title,
            description: app.description,
            url: app.url,
            icon_name: app.icon?.toLowerCase() || 'sparkles',
            accent_color: app.color ? `text-[${app.color}]` : undefined
          }));
        }
      } else {
        console.warn('Backend proxy returned non-JSON, likely fallback or error page');
      }
    }

    // Direct fetch attempt (if backend proxy fails or returns non-JSON)
    const directResponse = await fetch('https://aiwithshyam.com/suite-config.json');
    if (directResponse.ok) {
      const contentType = directResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await directResponse.json();
        if (Array.isArray(data)) {
          return data.map((app: any) => ({
            id: app.id || Math.random().toString(36).substr(2, 9),
            title: app.name || app.title,
            description: app.description,
            url: app.url,
            icon_name: app.icon?.toLowerCase() || 'sparkles',
            accent_color: app.color ? `text-[${app.color}]` : undefined
          }));
        }
      }
    }
    
    throw new Error('All fetch attempts failed');
  } catch (error) {
    console.error('Error fetching ecosystem apps:', error);
    // Final fallback data
    return [
      {
        id: 'gts',
        title: 'GraphToSheets',
        description: 'Convert chart images into structured Excel data.',
        url: 'https://graphtosheet.vercel.app',
        icon_name: 'filespreadsheet',
      },
      {
        id: 'hsp',
        title: 'HeadshotStudioPro',
        description: 'Generate studio-quality headshots from any photo.',
        url: 'https://headshotstudiopro.com',
        icon_name: 'user',
        accent_color: 'text-emerald-500'
      },
      {
        id: 'geonex',
        title: 'GeoNex AI',
        description: 'Extract location intelligence from map images.',
        url: 'https://geonex.ai',
        icon_name: 'mappin',
      }
    ];
  }
};

export const ecosystemService = {
  fetchApps: getEcosystemApps,
  fetchPlatformConfig: async () => {
    try {
      const response = await fetch('/api/platform-config');
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn('Failed to fetch platform config, using defaults');
    }
    return { theme: 'emerald', maintenance: false };
  }
};
