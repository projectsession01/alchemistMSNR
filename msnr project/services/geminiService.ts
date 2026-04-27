import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MSNRSetup {
  pattern: "Classic A/V" | "QML" | "RBS" | "SBR" | "None";
  significance: "High" | "Medium" | "Low";
  description: string;
}

export interface MSNRLevel {
  timeframe: "H4" | "H1" | "D" | "Daily";
  type: string;
  price: string;
}

export interface MarketAnalysis {
  asset: string;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  currentPrice: string;
  msnrDetails: {
    monthlyRange: string;
    sundayRange: string;
    nightlyRange: string;
  };
  setups: MSNRSetup[];
  levels: {
    strategic: MSNRLevel[];
    liquidity: string[];
    resistance: string;
    support: string;
  };
  advice: string;
  confidence: number;
}

export async function analyzeMarket(query: string = "Forex Majors, Gold, and Indices"): Promise<MarketAnalysis[]> {
  const prompt = `
    Conduct a deep research on the current market activity for ${query}.
    Apply the MSNR (Monthly, Sunday, Nightly Range) strategy.
    
    CRITICAL OBJECTIVE: Identify and "Mark" precisely the Classic A/V reversals and liquidity levels as seen in professional charts.
    
    Level Labeling Convention (Output absolute labels like these):
    - "H4 A,V,OCL-O" (H4 Classic A/V with Open Liquidity)
    - "D,H4 V,OCL-O,OCL-C" (Confluence level)
    - "H1 QML" (Quasimodo Level)
    - "D OCL-O" (Daily Open Liquidity)
    
    For each asset, identify:
    1. Current Price and Trend.
    2. Monthly, Sunday, and Nightly ranges (MSNR).
    3. Specific MSNR setups:
       - Classic A/V: Sharp reversals.
       - QML: Technical Quasimodo level (HH/LL shift).
       - OCL-O/OCL-C: Open/Close Liquidity sweeps.
    4. Exact "Price Levels" for these setups, using the Labeling Convention above in the "type" field.
    
    CRITICAL: For the "asset" field, provide only the ticker (e.g., EURUSD, XAUUSD).
 
    Provide concise trading advice.
    Return response strictly as JSON:
    [{
      "asset": string,
      "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
      "currentPrice": string,
      "msnrDetails": { "monthlyRange": string, "sundayRange": string, "nightlyRange": string },
      "setups": [{ "pattern": string, "significance": "High" | "Medium", "description": string }],
      "levels": {
        "strategic": [
          { "timeframe": "H4" | "H1" | "D", "type": string, "price": string }
        ],
        "liquidity": string[],
        "resistance": string,
        "support": string
      },
      "advice": string,
      "confidence": number
    }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] as any,
      },
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return [];
  }
}
