export async function onRequest() {
  return new Response("pong cloudflare-v1", {
    headers: { "content-type": "text/plain" }
  });
}
