import { GoogleGenAI } from "@google/genai";
import { Sale, Expense, Product } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateBusinessInsights = async (sales: Sale[], expenses: Expense[], products: Product[]) => {
  if (!genAI) return "AI insights are currently unavailable. Please check your API key.";

  const salesSummary = sales.slice(0, 50).map(s => ({
    amount: s.amount,
    product: s.product_name,
    date: s.timestamp
  }));

  const expenseSummary = expenses.slice(0, 20).map(e => ({
    amount: e.amount,
    category: e.category,
    date: e.timestamp
  }));

  const prompt = `
    As a business consultant for "Quench Mart", a beverage store, analyze the following data and provide 3-4 concise, actionable insights.
    
    Sales Data (Last 50 transactions):
    ${JSON.stringify(salesSummary)}
    
    Expense Data (Last 20 transactions):
    ${JSON.stringify(expenseSummary)}
    
    Current Inventory:
    ${products.map(p => `${p.name}: ${p.stock} units`).join(', ')}
    
    Provide insights on:
    1. Sales trends and top performers.
    2. Expense management.
    3. Inventory optimization.
    4. A growth suggestion.
    
    Keep the tone professional yet encouraging. Use markdown for formatting.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI insights. Please try again later.";
  }
};
