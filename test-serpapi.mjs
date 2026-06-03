import { getJson } from "serpapi";

async function run() {
  try {
    const res = await getJson({
      engine: "google_shopping",
      q: "macbook air m1",
      api_key: "aaf8c158612ec4035dc62b6142fafa1dba29b299e7e2a69f72aec3463dbd2c67",
      location: "Kathmandu, Bagmati Province, Nepal",
      gl: "us"
    });
    console.log("SUCCESS!", res.shopping_results ? res.shopping_results.length : 0);
  } catch (e) {
    console.log("ERROR 1:", e);
  }
}
run();
