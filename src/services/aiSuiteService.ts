/**
 * Service for fetching and managing AI tools in the ecosystem
 */

export interface AITool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
}

/**
 * Maps remote icon identifiers to standard icon names used in the app
 */
const ICON_MAP: Record<string, string> = {
  'spreadsheet': 'FileSpreadsheet',
  'user': 'User',
  'chart': 'TrendingUp',
  'stars': 'Stars',
  'camera': 'Camera',
  'table': 'Table',
  'mail': 'Mail',
  'map': 'Map',
  'contact': 'Contact'
};

/**
 * Fetches the dynamic list of tools from the central configuration
 */
export const getAITools = async (): Promise<AITool[]> => {
  try {
    const response = await fetch('https://aiwithshyam.com/suite-config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map((tool: any) => ({
        id: tool.id || String(Math.random()),
        name: tool.name,
        description: tool.description,
        url: tool.url,
        color: tool.color,
        // Transform the icon string using the map if available
        icon: ICON_MAP[tool.icon?.toLowerCase()] || tool.icon || 'Sparkles'
      }));
    }
    
    return [];
  } catch (error) {
    console.warn("Could not fetch AI tools from remote source, returning empty array.", error);
    return [];
  }
};
