import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Stripe (Lazy)
let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Initialize Gemini (Lazy)
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAI;
}

// Middleware
app.use(express.json());

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Stripe Checkout Session
app.post("/api/billing/create-checkout-session", async (req, res) => {
  const { planName, amount, companyName, email, billingCycle } = req.body;
  const s = getStripe();
  if (!s) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const session = await s.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: { name: `ZIEN Subscription - ${companyName}` },
            unit_amount: Math.round(amount * 100), // Stripe expects amounts in cents/fils
            recurring: { interval: billingCycle === 'yearly' ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/onboarding?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/onboarding?canceled=true`,
      customer_email: email,
      metadata: { companyName, planName },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// RARE AI Agent Endpoint
app.post("/api/ai/rare", async (req, res) => {
  const { agentType, prompt, context } = req.body;
  const ai = getGenAI();
  if (!ai) return res.status(500).json({ error: "AI not configured" });

  try {
    const model = "gemini-3-flash-preview";
    const systemInstruction = `You are RARE ${agentType}, a specialized AI agent for the ZIEN platform. 
    Your role is to assist the ${agentType} department of a company. 
    Context: ${JSON.stringify(context)}. 
    Be professional, concise, and helpful. No emojis.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VITE MIDDLEWARE ---
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ZIEN Server running on http://localhost:${PORT}`);
  });
});
