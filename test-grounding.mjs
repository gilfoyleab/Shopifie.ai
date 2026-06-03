import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  try {
    const res = await generateText({
      model: google("gemini-2.5-flash", { useSearchGrounding: true }),
      prompt: "What is the cheapest price for a MacBook Air M1 in Kathmandu Nepal right now? Provide store names."
    });
    console.log("SUCCESS!", res.text);
  } catch (e) {
    console.log("ERROR 1:", e);
  }
}
run();
