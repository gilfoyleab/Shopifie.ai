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
    system: `You are an expert shopping assistant designed to help users discover and compare products.
    You have access to a search tool that queries live Google Shopping data.
    
    Guidelines:
    1. Always search for products when the user asks for recommendations or wants to buy something.
    2. The UI will automatically render visual product cards for any items returned by your search tool.
    3. ABSOLUTE RULE: NEVER list products, prices, or store names using bullet points or lists in your text response. The user can already see the visual cards.
    4. Keep your text response to exactly 1 or 2 sentences ONLY. Example: "Here are the best options I found for you! The Gadgetbyte one looks like the most affordable deal."
    5. You CAN search internationally or locally! If a user asks for a specific city or country, pass it to the location parameter in the search tool.`,
    messages: modelMessages,
    // In SDK v6, maxSteps is replaced with stopWhen. Default is stepCountIs(1)
    // which would stop after the tool call. We need more steps so the model
    // can process tool results and generate a text response.
    stopWhen: stepCountIs(5),

    tools: {
      search_products: tool({
        description: searchProductsTool.description,
        parameters: searchProductsTool.parameters,
        execute: async (args: { query: string, location?: string }) => {
          console.log("TOOL INVOKED WITH ARGS:", args);
          return searchProductsTool.execute(args);
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
