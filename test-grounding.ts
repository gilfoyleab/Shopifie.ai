import { google } from "@ai-sdk/google";
import { generateText } from "ai";

async function run() {
  console.log("Testing Gemini 2.5 Pro with Search Grounding...");
  try {
    const result = await generateText({
      model: google("gemini-2.5-pro", { useSearchGrounding: true }),
      prompt: "What is the cheapest price for a MacBook Air M1 in Kathmandu Nepal right now? Provide store names."
    });
    
    console.log("\n=== MODEL RESPONSE ===\n");
    console.log(result.text);
    console.log("\n======================\n");
  } catch (error) {
    console.error("Error running test:", error);
  }
}

run();
