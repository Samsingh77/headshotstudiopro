export async function onRequest(context: any) {
  const { request, env } = context;
  
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return new Response(JSON.stringify({
    status: "ok",
    version: "1.2.0-cloudflare",
    timestamp: new Date().toISOString(),
    env: "cloudflare-pages",
    supabase: !!env.VITE_SUPABASE_URL,
    razorpay: !!env.RAZORPAY_KEY_ID,
    config: {
      hasAppUrl: !!env.APP_URL,
      hasSupabaseUrl: !!env.VITE_SUPABASE_URL,
      hasServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY
    }
  }), {
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
