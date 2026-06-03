import { searchProductsTool } from "./src/lib/tools/search.ts";

process.env.SERPAPI_API_KEY = "aaf8c158612ec4035dc62b6142fafa1dba29b299e7e2a69f72aec3463dbd2c67";

interface TestResult {
  name: string;
  passed: boolean;
  engine?: string;
  productCount: number;
  hasImages: boolean;
  hasRealPrices: boolean;
  hasRealLinks: boolean;
  sampleProducts: string[];
  errors: string[];
  timeTaken: number;
}

async function runTest(name: string, query: string, location?: string): Promise<TestResult> {
  const start = Date.now();
  const errors: string[] = [];

  try {
    const result: any = await searchProductsTool.execute({ query, location });
    const timeTaken = Date.now() - start;

    if (!result.success) {
      return { name, passed: false, productCount: 0, hasImages: false, hasRealPrices: false, hasRealLinks: false, sampleProducts: [], errors: [result.message || "Failed"], timeTaken };
    }

    const products = result.products || [];
    const hasImages = products.some((p: any) => p.thumbnail && p.thumbnail.startsWith("http"));
    const hasRealPrices = products.some((p: any) => {
      const price = String(p.price || "");
      return price.match(/[\$₹Rs\.NPR€£¥]|[0-9,]+/);
    });
    const hasRealLinks = products.some((p: any) => p.link && p.link.startsWith("http"));

    // Validate that links are real URLs, not "#" or empty
    const brokenLinks = products.filter((p: any) => !p.link || p.link === "#" || !p.link.startsWith("http"));
    if (brokenLinks.length > 0) {
      errors.push(`${brokenLinks.length} products have broken/missing links`);
    }

    // Validate that titles are not empty
    const emptyTitles = products.filter((p: any) => !p.title || p.title.trim() === "");
    if (emptyTitles.length > 0) {
      errors.push(`${emptyTitles.length} products have empty titles`);
    }

    const sampleProducts = products.slice(0, 3).map((p: any) => 
      `"${(p.title || "NO TITLE").substring(0, 50)}" | ${String(p.price || "NO PRICE").substring(0, 25)} | ${p.source || "NO SOURCE"} | img:${p.thumbnail ? "✅" : "❌"} | link:${p.link && p.link.startsWith("http") ? "✅" : "❌"}`
    );

    return {
      name,
      passed: products.length > 0 && hasRealLinks,
      engine: result.engine,
      productCount: products.length,
      hasImages,
      hasRealPrices,
      hasRealLinks,
      sampleProducts,
      errors,
      timeTaken,
    };
  } catch (error: any) {
    return { name, passed: false, productCount: 0, hasImages: false, hasRealPrices: false, hasRealLinks: false, sampleProducts: [], errors: [error.message], timeTaken: Date.now() - start };
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        SHOPPING AGENT - END TO END TEST SUITE               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const tests = [
    // ===== BASIC SEARCHES =====
    { name: "1. US - MacBook Air M1 (no location)", query: "MacBook Air M1" },
    { name: "2. US - iPhone 15 (no location)", query: "iPhone 15" },
    
    // ===== NEPAL SEARCHES =====
    { name: "3. Nepal - MacBook in Kathmandu, Nepal", query: "MacBook Air M1", location: "Kathmandu, Nepal" },
    { name: "4. Nepal - just 'kathmandu' (city only)", query: "mobile phone", location: "kathmandu" },
    { name: "5. Nepal - Pokhara (smaller city)", query: "laptop", location: "pokhara" },
    { name: "6. Nepal - Biratnagar", query: "Samsung phone", location: "Biratnagar, Nepal" },
    
    // ===== INDIA SEARCHES =====
    { name: "7. India - Mumbai", query: "MacBook Air M1", location: "Mumbai, India" },
    { name: "8. India - just 'delhi' (city only)", query: "iPhone 15", location: "delhi" },
    
    // ===== EDGE CASES =====
    { name: "9. Empty query (should fallback)", query: "", location: "Kathmandu, Nepal" },
    { name: "10. Very specific product", query: "Sony WH-1000XM5 headphones", location: "Kathmandu, Nepal" },
    { name: "11. Generic search - 'cheap phone'", query: "cheap phone under 20000", location: "Kathmandu, Nepal" },
    { name: "12. Unknown location - 'mars'", query: "laptop", location: "mars" },
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    console.log(`⏳ Running: ${test.name}...`);
    const result = await runTest(test.name, test.query, test.location);
    results.push(result);
    console.log(`   ${result.passed ? "✅ PASS" : "❌ FAIL"} | ${result.productCount} products | ${result.timeTaken}ms | engine: ${result.engine || "N/A"}`);
    if (result.sampleProducts.length > 0) {
      for (const s of result.sampleProducts) {
        console.log(`      → ${s}`);
      }
    }
    if (result.errors.length > 0) {
      for (const e of result.errors) {
        console.log(`      ⚠️  ${e}`);
      }
    }
    console.log("");
  }

  // ===== SUMMARY =====
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                     TEST SUMMARY                            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const r of results) {
    const status = r.passed ? "✅" : "❌";
    console.log(`${status} ${r.name}`);
    console.log(`   Products: ${r.productCount} | Images: ${r.hasImages ? "✅" : "❌"} | Prices: ${r.hasRealPrices ? "✅" : "❌"} | Links: ${r.hasRealLinks ? "✅" : "❌"} | Time: ${r.timeTaken}ms | Engine: ${r.engine || "N/A"}`);
    if (r.errors.length > 0) console.log(`   Errors: ${r.errors.join(", ")}`);
    console.log("");
  }

  console.log(`\n🏁 FINAL: ${passed}/${results.length} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log("❌ SOME TESTS FAILED! Check the errors above.");
    process.exit(1);
  } else {
    console.log("🎉 ALL TESTS PASSED! The shopping agent is working end-to-end.");
  }
}

main();
