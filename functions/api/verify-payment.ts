import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export async function onRequest(context: any) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, tokensToAdd, amount } = body;

    const secret = env.RAZORPAY_KEY_SECRET || "";
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ status: "failure", message: "Verification failed" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    // Initialize Supabase
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ status: "partial_success", message: "Payment verified but database connection is unavailable." }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Calculate previews based on tokens
    let previewsToAdd = 0;
    if (tokensToAdd === 10) previewsToAdd = 4;
    else if (tokensToAdd === 50) previewsToAdd = 20;
    else if (tokensToAdd === 125) previewsToAdd = 50;

    // 2. Fetch current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tokens, previews_remaining')
      .eq('id', user_id)
      .single();

    if (profileError) throw profileError;

    const newTokens = (profile?.tokens || 0) + (tokensToAdd || 0);
    const newPreviews = (profile?.previews_remaining || 0) + previewsToAdd;

    // 3. Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        tokens: newTokens,
        previews_remaining: newPreviews,
        last_active_app: 'HeadshotStudioPro',
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) throw updateError;

    // 4. Record history
    await supabase.from('purchase_history').insert({
      user_id,
      amount: amount || 0,
      tokens_added: tokensToAdd,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      payment_provider: 'razorpay',
      status: 'completed',
      created_at: new Date().toISOString()
    });

    // 5. Record token history
    await supabase.from('token_history').insert({
      user_id,
      amount: tokensToAdd,
      type: 'purchase',
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ status: "success", newTokens, newPreviews }), {
      headers: { "content-type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ status: "error", error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
