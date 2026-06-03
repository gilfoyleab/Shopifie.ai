const { getJson } = require("serpapi");
require("dotenv").config({ path: ".env.local" });

async function run() {
  try {
    const res = await getJson({
      engine: "google_shopping",
      q: "macbook air m1",
      api_key: process.env.SERPAPI_API_KEY,
      location: "Kathmandu, Bagmati Province, Nepal",
      gl: "us"
    });
    console.log("SUCCESS!", res.shopping_results ? res.shopping_results.length : 0);
  } catch (e) {
    console.log("ERROR 1:", e);
  }
}
run();
