import { GoogleGenAI, Chat } from "@google/genai";
import { UserPortfolio, AssetAllocation, Holding } from "../types";
import { ASSET_LABELS } from "../constants";

const formatAllocation = (alloc: AssetAllocation) => {
  return Object.entries(alloc)
    .map(([key, value]) => `- ${ASSET_LABELS[key as keyof AssetAllocation]}: ${value}%`)
    .join('\n');
};

const formatHoldings = (holdings: Holding[]) => {
  if (holdings.length === 0) return 'None specified';
  return holdings.map(h => `${h.ticker} (${h.percentage}%)`).join(', ');
};

export const generatePortfolioAnalysis = async (portfolio: UserPortfolio): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Combine watchlist and specific holdings for the data gathering list
  const allTickers = [
    ...portfolio.watchlist.split(',').map(s => s.trim()).filter(s => s.length > 0),
    ...portfolio.etfHoldings.map(h => h.ticker),
    ...portfolio.stockHoldings.map(h => h.ticker)
  ].join(', ');

  const prompt = `
    You are an Expert Financial Analyst & Portfolio Manager named "Harmonia Finance". 
    Your focus is Capital Preservation, Diversification, and Systematic Capital Deployment.
    
    User Profile:
    - Total Investable Assets: $${portfolio.totalAssetValue.toLocaleString()}
    - Risk Tolerance: ${portfolio.riskTolerance}
    - Primary Strategy: ${portfolio.strategy}
    - Investment Horizon: ${portfolio.horizon}
    
    Current Portfolio Allocation:
    ${formatAllocation(portfolio.currentAllocation)}
    
    Target/Desired Allocation:
    ${formatAllocation(portfolio.desiredAllocation)}
    
    Specific Holdings Provided (with % of total portfolio):
    - Mutual Funds / ETFs: ${formatHoldings(portfolio.etfHoldings)}
    - Individual Stocks: ${formatHoldings(portfolio.stockHoldings)}
    
    User's Watchlist / Tickers of Interest:
    ${portfolio.watchlist}

    MANDATORY ANALYZE FRAMEWORK:
    Analyze all decisions using a mandatory synthesis of three pillars:
    1. Technical Analysis (Price action, RSI, Support/Resistance, Moving Averages).
    2. Macro Analysis (Interest rates, CPI/Inflation, Geopolitics, Real Yield, Fed Policy).
    3. Human Psychology (Fear & Greed Index, VIX, Sentiment).

    DATA MANDATE:
    Use the 'googleSearch' tool to find REAL-TIME data for:
    1. Current Price, % Change, and RSI (14-day) for ALL tickers mentioned (Holdings + Watchlist): [${allTickers}].
       *IMPORTANT: Verify the ticker symbols are valid. If a user provided an invalid ticker, note it.*
    2. Current 3-Month and 10-Year Treasury Yields vs latest CPI (to calculate Real Yield).
    3. Current CNN Fear and Greed Index value.
    4. Current VIX level.
    5. Latest significant financial news affecting this specific portfolio profile.

    OUTPUT FORMAT:
    You MUST output the response in strictly formatted Markdown. 
    
    # Daily Market Snapshot
    *Present this section STRICTLY as a Markdown table with the following columns: Metric, Current Status, and Verdict/Context. Use emojis where appropriate.*
    
    | Metric | Current Status | Verdict/Context |
    | :--- | :--- | :--- |
    | 🧠 Market Mood | [Fear/Greed Value] | [Brief Interpretation] |
    | 📉 Volatility (VIX) | [Level] | [Brief Interpretation] |
    | 🏦 Macro (Yields/CPI) | [Key Rates] | [Key Implication] |
    | 💰 Cash Verdict | [Deploy/Hold] | [One sentence advice] |

    # Portfolio Holdings Analysis
    *Analyze the specific ETFs and Stocks provided by the user, considering their weighting.*
    *For each ticker found in the holdings:*
    ## [Ticker Symbol] (Weight: X%)
    - **Type:** (ETF / Stock)
    - **Action:** (Accumulate / Hold / Trim / Sell)
    - **Technical Status:** (RSI, Trend, key levels)
    - **Verdict:** (Brief synthesis of fit for their ${portfolio.strategy} strategy. If weight is high, comment on concentration risk).

    # Watchlist Analysis
    *For items in the watchlist not covered above:*
    ## [Ticker Symbol]
    - **Action:** (Buy / Hold / Sell / Wait for Dip)
    - **Analysis:** (Synthesize Technical + Macro + Psych)
    - **Specific Check:** (e.g., "Watch support at $XYZ")

    # The "Smart Move" Suggestion
    *Specific Capital Deployment Advice based on their ${portfolio.strategy} strategy and the gap between current vs desired allocation.*
    - Analyze the rebalancing needs.
    - Provide concrete steps (e.g., "Shift 5% from Cash to Fixed Income via T-Bills...").

    # Disclaimer
    *Brief AI disclaimer.*
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to fetch analysis. Please try again.");
  }
};

export const createFinancialChatSession = (portfolio: UserPortfolio, analysisContext: string): Chat => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are "Harmonia Finance", an expert financial analyst. 
    You are having a conversation with a user about their portfolio.
    
    Context:
    - User Profile: Risk=${portfolio.riskTolerance}, Strategy=${portfolio.strategy}, Horizon=${portfolio.horizon}.
    - Total Assets: $${portfolio.totalAssetValue.toLocaleString()}
    - Holdings: ${[
      ...portfolio.etfHoldings.map(h => `${h.ticker} (${h.percentage}%)`), 
      ...portfolio.stockHoldings.map(h => `${h.ticker} (${h.percentage}%)`)
    ].join(', ')}
    - Watchlist: ${portfolio.watchlist}
    
    You have already provided this analysis:
    ---
    ${analysisContext}
    ---
    
    Goal: Answer the user's follow-up questions.
    - Be concise and direct.
    - Maintain the persona of a sophisticated, data-driven analyst.
    - Use Markdown for formatting (bold, lists).
    - If asked about real-time data not in the analysis, explain you are working with the context provided but can offer general principles or use your knowledge base.
    - Disclaimer: You are an AI, not a financial advisor.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
  });
};