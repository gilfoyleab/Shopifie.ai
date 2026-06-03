import { searchProductsTool } from "./src/lib/tools/search.ts";
process.env.SERPAPI_API_KEY = "aaf8c158612ec4035dc62b6142fafa1dba29b299e7e2a69f72aec3463dbd2c67";
async function run() {
  const r: any = await searchProductsTool.execute({ query: "MacBook Air M1", location: "Kathmandu, Nepal" });
  console.log("Engine:", r.engine, "| Products:", r.products?.length);
  for (const p of r.products?.slice(0, 4) || []) {
    console.log(`  Title: ${p.title?.substring(0, 50)}`);
    console.log(`  Price: ${p.price}`);
    console.log(`  Source: ${p.source}`);
    console.log(`  Desc: ${p.description?.substring(0, 60) || "none"}`);
    console.log(`  Img: ${p.thumbnail ? "YES" : "NO"}`);
    console.log("");
  }
}
run();
