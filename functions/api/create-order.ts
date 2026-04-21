import Razorpay from "razorpay";

export async function onRequest(context: any) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { amount, user_id, tokens } = body;

    if (!amount) {
      return new Response(JSON.stringify({ error: "Amount is required" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: "Razorpay not initialized. Check environment variables." }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        user_id: user_id || 'unknown',
        tokens: tokens?.toString() || '0'
      }
    };

    const order = await razorpay.orders.create(options);
    return new Response(JSON.stringify({ orderId: order.id }), {
      headers: { "content-type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
