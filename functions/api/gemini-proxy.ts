export async function onRequest(context: any) {
  const { request, env } = context;

  // Handle CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body: any = await request.json();
    const { model: modelName, contents, config, usePremiumKey } = body;

    const getEnvVar = (name: string, fallback: string = ''): string => {
      const val = env[name] || fallback;
      if (val === 'undefined' || val === 'null' || !val) return fallback;
      return val.trim();
    };

    const isValidKey = (key: string) => key && key.startsWith('AIza') && key.length > 20;

    const myGeminiKey = getEnvVar('MY_GEMINI_KEY');
    const platformKey = getEnvVar('API_KEY');
    const sharedKey = getEnvVar('GEMINI_API_KEY');
    
    let activeKey = '';
    const candidates = [
      { name: 'MY_GEMINI_KEY', val: myGeminiKey },
      { name: 'API_KEY', val: platformKey },
      { name: 'GEMINI_API_KEY', val: sharedKey }
    ];

    if (usePremiumKey) {
      const match = candidates.find(c => isValidKey(c.val));
      if (match) activeKey = match.val;
    } else {
      const match = [candidates[2], candidates[1], candidates[0]].find(c => isValidKey(c.val));
      if (match) activeKey = match.val;
    }

    if (!activeKey) {
       activeKey = sharedKey || platformKey || myGeminiKey;
    }

    if (!activeKey || !isValidKey(activeKey)) {
      return new Response(JSON.stringify({ 
        error: "Gemini API key is invalid or missing.",
        details: { activeKey: activeKey ? "Provided but invalid" : "Missing" }
      }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const model = modelName || 'gemini-3.1-flash-lite';
    const payload: any = {
      contents: Array.isArray(contents) ? contents : [contents]
    };

    if (config) {
      payload.generationConfig = { ...config };
      if (payload.generationConfig.stopSequences && payload.generationConfig.stopSequences.length === 0) {
        delete payload.generationConfig.stopSequences;
      }
    }

    // Attempt multiple API versions
    const versions = ['v1beta', 'v1'];
    let lastError: any = null;

    for (const apiVersion of versions) {
      try {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${activeKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
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
        
        const errData = await response.json().catch(() => ({}));
        lastError = { status: response.status, data: errData };
        
        if (response.status === 405 || response.status === 404) continue;
        break;
      } catch (err: any) {
        lastError = { status: 500, message: err.message };
        break;
      }
    }

    const statusCode = lastError?.status || 500;
    return new Response(JSON.stringify(lastError?.data || { error: lastError?.message || "Failed after multiple attempts" }), {
      status: statusCode,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
