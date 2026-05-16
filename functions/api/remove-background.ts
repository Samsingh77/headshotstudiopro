export async function onRequest(context: any) {
  const { request, env } = context;

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
    const { image } = await request.json();
    const apiKey = env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Background removal service not configured." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!image) {
      return new Response(JSON.stringify({ error: "Image data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());

    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', blob, 'image.png');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData
    });

    if (response.status !== 200) {
      return new Response(JSON.stringify({ error: "Background removal failed" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Result = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    return new Response(JSON.stringify({ image: `data:image/png;base64,${base64Result}` }), {
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
