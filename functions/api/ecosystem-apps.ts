export async function onRequest(context: any) {
  const { env } = context;

  const getEnvVar = (name: string, fallback: string = ''): string => {
    const val = env[name] || fallback;
    if (val === 'undefined' || val === 'null' || !val) return fallback;
    return val.trim();
  };

  try {
    const configUrl = 'https://aiwithshyam.com/suite-config.json';
    
    // Try to fetch from external config
    try {
      const response = await fetch(configUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HeadshotStudioPro-Cloudflare/1.0'
        },
        cf: {
          cacheTtl: 3600,
          cacheEverything: true
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } catch (e) {
      console.warn("External config fetch failed");
    }

    // Fallback data
    const fallback = [
      {
        id: 'gts',
        name: 'GraphToSheets',
        description: 'Convert chart images into structured Excel data.',
        url: 'https://graphtosheet.vercel.app',
        icon: 'FileSpreadsheet',
      },
      {
        id: 'hsp',
        name: 'HeadshotStudioPro',
        description: 'Generate studio-quality headshots from any photo.',
        url: 'https://headshotstudiopro.com',
        icon: 'User',
        color: '#10b981'
      },
      {
        id: 'geonex',
        name: 'GeoNex AI',
        description: 'Extract location intelligence from map images.',
        url: 'https://geonex.ai',
        icon: 'MapPin',
      }
    ];

    return new Response(JSON.stringify(fallback), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
