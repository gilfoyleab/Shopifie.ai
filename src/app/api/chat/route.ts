import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { searchProductsTool } from "@/lib/tools/search";

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response("No messages provided", { status: 400 });
  }

  // convertToModelMessages converts UIMessage[] (parts-based, from useChat)
  // into ModelMessage[] (content-based, for streamText)
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `You are Buybird — an expert AI shopping agent that finds the BEST DEALS for users.
    You have access to a search tool that queries live Google Shopping data.
    
    Your Core Job:
    - When a user wants to buy something, search for it immediately.
    - ANALYZE the search results carefully: compare prices, ratings, seller reputation, and value.
    - The UI will automatically render product cards. The FIRST product shown gets the "Best Pick" badge.
    
    Guidelines:
    1. Always search for products when the user asks for recommendations or wants to buy something.
    2. ABSOLUTE RULE: NEVER list products, prices, or store names using bullet points or lists in your text. The cards are already visible.
    3. Keep your text to 2-3 short sentences MAX. Focus on DEAL INSIGHTS:
       - Which one is the best value and WHY
       - Price comparisons ("The first one saves you NPR 30,000 compared to the others")
       - Warnings about suspiciously low prices or missing info
       Example: "I found some great MacBook options! The Gadgetbyte listing at NPR 169,999 is the best deal — it's the lowest price from a trusted Nepali retailer. The itti.com.np listing doesn't show a clear price, so I'd go with Gadgetbyte."
    4. You CAN search internationally or locally! If a user asks for a specific city or country, pass it to the location parameter.
    5. Be honest — if the results don't look great, say so. Don't oversell bad results.`,
    messages: modelMessages,
    // In SDK v6, maxSteps is replaced with stopWhen. Default is stepCountIs(1)
    // which would stop after the tool call. We need more steps so the model
    // can process tool results and generate a text response.
    stopWhen: stepCountIs(5),

    tools: {
      search_products: tool({
        description: searchProductsTool.description,
        inputSchema: searchProductsTool.parameters,
        execute: async (args: { query: string, location?: string }) => {
          console.log("TOOL INVOKED WITH ARGS:", args);
          return searchProductsTool.execute(args);
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
