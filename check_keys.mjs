import { getJson } from "serpapi";
async function run() {
  const result = await getJson({
    engine: "google_shopping",
    q: "MacBook Air M1",
    api_key: "aaf8c158612ec4035dc62b6142fafa1dba29b299e7e2a69f72aec3463dbd2c67",
    num: 1,
    hl: "en",
    gl: "us"
  });
  console.log(Object.keys(result.shopping_results[0]));
}
run();
