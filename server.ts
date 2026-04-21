import express from "express";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import axios from "axios";
import FormData from "form-data";

console.log(">>> server.ts starting up... Timestamp:", new Date().toISOString());

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Export app for Vercel
export default app;

const getEnvVar = (name: string, fallback: string = ''): string => {
  const val = process.env[name] || fallback;
  if (val === 'undefined' || val === 'null' || !val) return fallback;
  return val.trim();
};

let razorpay: any;
let supabase: any = null;
let resend: Resend | null = null;

// Initialize Supabase variables early for health check
let supabaseUrl = getEnvVar('SUPABASE_URL', getEnvVar('VITE_SUPABASE_URL', ''));
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', getEnvVar('SUPABASE_ANON_KEY', getEnvVar('VITE_SUPABASE_ANON_KEY', '')));

// Global Error Handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://headshotstudiopro.com",
      "https://www.headshotstudiopro.com",
      process.env.APP_URL,
      process.env.SHARED_APP_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin) || origin.endsWith('.run.app')) {
      callback(null, true);
    } else {
      console.warn(`>>> CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health Check
app.get("/api/health", (req, res) => {
  console.log(">>> Health check request received from:", req.ip);
  res.json({ 
    status: "ok", 
    version: "1.1.14",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    supabase: !!supabase,
    razorpay: !!razorpay,
    distExists: fs.existsSync(path.join(process.cwd(), 'dist')),
    config: {
      hasAppUrl: !!process.env.APP_URL,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    }
  });
});

app.get("/api/ping", (req, res) => {
  res.send("pong v1.0.9-FIX");
});

// Initialize Resend
const resendKey = getEnvVar('RESEND_API_KEY');
if (resendKey) {
  resend = new Resend(resendKey);
  console.log(">>> Resend initialized.");
} else {
  console.warn(">>> RESEND_API_KEY missing. Feedback emails will not be sent.");
}

// Initialize Supabase client
console.log(">>> Supabase Init Attempt:", { 
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "MISSING", 
  hasKey: !!supabaseServiceKey,
  keyPrefix: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 10)}...` : "N/A"
});

if (supabaseUrl && supabaseServiceKey) {
  try {
    console.log(">>> Calling createClient...");
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    if (supabase) {
      console.log(">>> Supabase client created successfully. Type:", typeof supabase);
    } else {
      console.error(">>> createClient returned null or undefined.");
    }
  } catch (err) {
    console.error(">>> Supabase client creation failed:", err);
  }
} else {
  console.warn(">>> Supabase initialization skipped: Missing URL or Key.");
}


// API Routes
app.post("/api/payment/order", async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    if (!razorpay) {
      console.error("Razorpay SDK not initialized. Check your environment variables.");
      return res.status(500).json({ error: "Payment gateway not initialized. Please contact support." });
    }

    console.log("Creating Razorpay order for amount:", amount);
    const options = {
      amount: Math.round(amount * 100), // Ensure it's an integer (paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    try {
      console.log("Razorpay options:", options);
      const order = await razorpay.orders.create(options);
      console.log("Razorpay order created successfully:", order.id);
      res.json(order);
    } catch (rzpError: any) {
      console.error("Razorpay SDK Error:", rzpError);
      res.status(500).json({ 
        error: "Razorpay order creation failed", 
        details: rzpError.description || rzpError.message 
      });
    }
  } catch (error: any) {
    console.error("General Order Route Error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.post("/api/payment/verify", async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      user_id,
      tokensToAdd,
      previewsToAdd
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required for verification" });
    }

    if (!razorpay) {
      console.error("Razorpay SDK not initialized. Check your environment variables.");
      return res.status(500).json({ error: "Payment gateway not initialized. Please contact support." });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      console.log(`Payment verified for user ${user_id}. Updating Supabase...`);
      
      if (!supabase) {
        console.error("Supabase client not initialized. Cannot update tokens.");
        return res.status(500).json({ 
          status: "partial_success", 
          message: "Payment verified but database connection is missing. Please contact support." 
        });
      }

      try {
        // 1. Get current profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('tokens, previews_remaining')
          .eq('id', user_id)
          .single();

        if (profileError) throw profileError;

        const newTokens = (profile?.tokens || 0) + (tokensToAdd || 0);
        const newPreviews = (profile?.previews_remaining || 0) + (previewsToAdd || 0);

        // 2. Update profile tokens and previews
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            tokens: newTokens,
            previews_remaining: newPreviews 
          })
          .eq('id', user_id);

        if (updateError) throw updateError;

        // 3. Record in purchase_history
        const { error: historyError } = await supabase
          .from('purchase_history')
          .insert({
            user_id: user_id,
            amount: tokensToAdd,
            status: 'completed',
            payment_provider: 'razorpay',
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id
          });

        if (historyError) console.error("History recording error:", historyError);

        // 4. Record in token_history
        const { error: tokenHistoryError } = await supabase
          .from('token_history')
          .insert({
            user_id: user_id,
            amount: tokensToAdd,
            type: 'purchase'
          });

        if (tokenHistoryError) console.error("Token history recording error:", tokenHistoryError);

        return res.json({ 
          status: "success", 
          message: "Payment verified and tokens updated successfully",
          newTokens,
          newPreviews
        });
      } catch (dbError: any) {
        console.error("Supabase Update Error:", dbError);
        return res.status(500).json({ 
          status: "partial_success", 
          message: "Payment verified but database update failed",
          error: dbError.message 
        });
      }
    } else {
      return res.status(400).json({ status: "failure", message: "Invalid signature" });
    }
  } catch (error: any) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// New simplified Razorpay routes as requested
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, user_id, tokens } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });
    if (!razorpay) return res.status(500).json({ error: "Razorpay not initialized" });

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
    res.json({ orderId: order.id });
  } catch (err: any) {
    console.error("create-order error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, tokensToAdd, amount } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      console.log(`>>> Payment verified for user ${user_id}. Proceeding with DB update...`);

      if (!supabase) {
        console.error(">>> Supabase not initialized");
        return res.status(500).json({ status: "partial_success", message: "Payment verified but database connection is unavailable." });
      }

      try {
        // 1. Calculate previews based on tokens (Syncing with pricing tiers)
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
          amount: amount || 0, // This is the INR amount
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

        console.log(`>>> Credits updated for user ${user_id}. New balance: ${newTokens}`);
        return res.json({ status: "success", newTokens, newPreviews });
      } catch (dbError: any) {
        console.error(">>> DB Update Error:", dbError);
        return res.status(500).json({ status: "partial_success", error: dbError.message });
      }
    } else {
      console.error(">>> Verification failed: Signature mismatch");
      res.status(400).json({ status: "failure", message: "Verification failed" });
    }
  } catch (err: any) {
    console.error("verify-payment path error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, phone, cc, category, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    if (!resend) {
      console.error("Resend not initialized. Cannot send feedback email.");
      return res.status(500).json({ error: "Email service not configured. Please contact support." });
    }

    const ccEmails = cc ? cc.split(',').map((e: string) => e.trim()).filter((e: string) => e) : [];

    const { data, error } = await resend.emails.send({
      from: 'HeadshotStudioPro <support@headshotstudiopro.com>',
      to: ['headshotstudiopro@gmail.com'],
      cc: ccEmails,
      subject: `New Feedback: [${category || 'General'}] from ${name}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Category:</strong> ${category || 'General'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      console.error("Resend Email Error:", error);
      return res.status(500).json({ error: "Failed to send email", details: error.message });
    }

    res.json({ status: "success", message: "Feedback sent successfully" });
  } catch (error: any) {
    console.error("Feedback Route Error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.post("/api/remove-background", async (req, res) => {
  try {
    const { image } = req.body; // base64 image
    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      console.warn(">>> REMOVE_BG_API_KEY missing. Skipping background removal.");
      return res.status(400).json({ error: "Background removal service not configured. Please provide an API key in the settings." });
    }

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Remove data:image/xxx;base64, prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', buffer, { filename: 'image.png' });

    console.log(">>> Calling remove.bg API...");
    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': apiKey,
      },
      responseType: 'arraybuffer'
    });

    if (response.status !== 200) {
      console.error(">>> remove.bg API error:", response.status, response.statusText);
      return res.status(response.status).json({ error: "Background removal failed" });
    }

    const resultBase64 = Buffer.from(response.data, 'binary').toString('base64');
    res.json({ image: `data:image/png;base64,${resultBase64}` });
  } catch (error: any) {
    console.error(">>> Background Removal Route Error:", error.response?.data?.toString() || error.message);
    res.status(500).json({ 
      error: "Internal server error during background removal", 
      details: error.response?.data?.toString() || error.message 
    });
  }
});

app.post("/api/payment/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!secret || !signature) {
      console.error(">>> Webhook verification failed: Missing secret or signature");
      return res.status(400).send("Invalid webhook");
    }

    // Use raw body for signature verification if possible, 
    // but since we use express.json(), we'll use the body object
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    // Note: Razorpay signature verification can be sensitive to whitespace in JSON.
    // If this fails, we might need a raw body middleware.
    if (signature !== expectedSignature) {
      console.warn(">>> Webhook signature mismatch. Check your RAZORPAY_WEBHOOK_SECRET.");
      // For now, we'll log it but proceed if in dev, or return error in prod
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).send("Invalid signature");
      }
    }

    const event = req.body.event;
    console.log(`>>> Received Razorpay Webhook Event: ${event}`);

    if (event === "order.paid" || event === "payment.captured") {
      const payload = req.body.payload;
      const payment = payload.payment?.entity;
      const order = payload.order?.entity || payment;
      const notes = order.notes || payment?.notes;
      
      if (!notes || !notes.user_id) {
        console.error(">>> Webhook Error: Missing notes or user_id in payload");
        return res.status(400).send("Missing metadata");
      }

      const userId = notes.user_id;
      const tokensToAdd = parseInt(notes.tokens || "0");
      let previewsToAdd = parseInt(notes.previews || "0");
      
      // If previewsToAdd is not provided in notes, calculate it based on tokensToAdd (matching image pricing)
      if (previewsToAdd === 0) {
        if (tokensToAdd === 10) previewsToAdd = 4;
        else if (tokensToAdd === 50) previewsToAdd = 25;
        else if (tokensToAdd === 125) previewsToAdd = 75;
        else if (tokensToAdd === 1) previewsToAdd = 2;
      }

      const paymentId = payment?.id;
      const orderId = order?.id;

      if (!supabase) {
        console.error(">>> Webhook Error: Supabase client not initialized");
        return res.status(500).send("Database error");
      }

      // Idempotency check: Has this payment already been processed?
      const { data: existingHistory } = await supabase
        .from('purchase_history')
        .select('id')
        .eq('payment_id', paymentId)
        .maybeSingle();

      if (existingHistory) {
        console.log(`>>> Payment ${paymentId} already processed. Skipping.`);
        return res.json({ status: "already_processed" });
      }

      console.log(`>>> Webhook processing payment for user ${userId}: +${tokensToAdd} tokens`);

      // 1. Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tokens, previews_remaining')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const newTokens = (profile?.tokens || 0) + tokensToAdd;
      const newPreviews = (profile?.previews_remaining || 0) + previewsToAdd;

      // 2. Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          tokens: newTokens,
          previews_remaining: newPreviews 
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 3. Record in purchase_history
      await supabase.from('purchase_history').insert({
        user_id: userId,
        amount: tokensToAdd,
        status: 'completed',
        payment_provider: 'razorpay',
        payment_id: paymentId,
        order_id: orderId
      });

      // 4. Record in token_history
      await supabase.from('token_history').insert({
        user_id: userId,
        amount: tokensToAdd,
        type: 'purchase'
      });

      console.log(`>>> Webhook: Successfully updated tokens for user ${userId}`);
    }

    res.json({ status: "ok" });
  } catch (error: any) {
    console.error(">>> Webhook Route Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Vite middleware for development
async function startServer() {
  console.log(">>> Starting server initialization sequence...");
  
  // Initialize Razorpay
  try {
    const keyId = getEnvVar('RAZORPAY_KEY_ID', getEnvVar('VITE_RAZORPAY_KEY_ID', ''));
    const keySecret = getEnvVar('RAZORPAY_KEY_SECRET', '');

    if (keyId && keySecret) {
      razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      console.log(">>> Razorpay initialized.");
    } else {
      console.warn(">>> Razorpay credentials missing. Payment orders will fail.");
    }
  } catch (err) {
    console.error(">>> Failed to initialize Razorpay:", err);
  }

  try {
    const distPath = path.join(process.cwd(), 'dist');
    const isProduction = process.env.NODE_ENV === "production";
    
    if (isProduction) {
      console.log(`>>> Serving static files from dist (Production Mode)...`);
      console.log(`>>> distPath: ${distPath}`);
      
      if (!fs.existsSync(distPath)) {
        console.error(`>>> ERROR: dist directory not found at ${distPath}.`);
      }

      // Logging middleware for production
      app.use((req, res, next) => {
        if (req.url.startsWith('/assets/')) {
          const filePath = path.join(distPath, req.url);
          if (!fs.existsSync(filePath)) {
            console.warn(`>>> 404: Asset not found: ${filePath}`);
          }
        }
        next();
      });

      app.use(express.static(distPath));
      
      // SPA fallback - MUST be after express.static
      app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.url.startsWith('/api/')) return next();
        
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Frontend build not found. Please click "Publish" again in AI Studio.');
        }
      });
    } else {
      console.log(">>> Initializing Vite in middleware mode (Development Mode)...");
      try {
        console.log(">>> Calling createViteServer...");
        const vite = await createViteServer({
          server: { 
            middlewareMode: true,
            host: '0.0.0.0',
            port: 3000
          },
          appType: "spa",
        });
        console.log(">>> Vite initialized successfully.");
        app.use(vite.middlewares);
        console.log(">>> Vite middlewares attached to Express.");
      } catch (viteErr) {
        console.error(">>> CRITICAL: Vite failed to initialize:", viteErr);
        throw viteErr;
      }
    }
  } catch (err) {
    console.error(">>> Failed to initialize Vite/Static serving:", err);
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // Start listening after all middleware is set up
  if (!process.env.VERCEL) {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`>>> Server process ${process.pid} listening on port ${PORT}`);
      console.log(`>>> Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`>>> App URL: ${process.env.APP_URL || 'Not set'}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`>>> Port ${PORT} is already in use. This might happen during hot reloads.`);
      } else {
        console.error(">>> Server listener error:", err);
      }
    });
  } else {
    console.log(">>> Running in Vercel environment. Skipping app.listen().");
  }

  // Safe environment logging
  console.log(">>> Environment Variables Check:");
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    SUPABASE_URL: process.env.SUPABASE_URL ? "Set" : "Missing",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "Set" : "Missing",
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? "Set" : "Missing",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "Set" : "Missing",
  };
  console.log(JSON.stringify(safeEnv, null, 2));
}

startServer().catch(err => {
  console.error(">>> Critical error during server startup:", err);
  process.exit(1);
});
