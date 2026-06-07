import { getJson } from "serpapi";
import { z } from "zod";

// Map of country keywords to their Google domain and country code
const COUNTRY_MAP: Record<string, { domain: string; gl: string }> = {
  nepal: { domain: "google.com.np", gl: "np" },
  india: { domain: "google.co.in", gl: "in" },
  uk: { domain: "google.co.uk", gl: "uk" },
  australia: { domain: "google.com.au", gl: "au" },
  canada: { domain: "google.ca", gl: "ca" },
  germany: { domain: "google.de", gl: "de" },
  france: { domain: "google.fr", gl: "fr" },
  japan: { domain: "google.co.jp", gl: "jp" },
  brazil: { domain: "google.com.br", gl: "br" },
};

// Map well-known city names to their country
const CITY_TO_COUNTRY: Record<string, string> = {
  // Nepal
  kathmandu: "nepal", pokhara: "nepal", biratnagar: "nepal", lalitpur: "nepal",
  bhaktapur: "nepal", birgunj: "nepal", dharan: "nepal", butwal: "nepal",
  hetauda: "nepal", janakpur: "nepal", nepalgunj: "nepal",
  // India
  mumbai: "india", delhi: "india", bangalore: "india", kolkata: "india",
  chennai: "india", hyderabad: "india", pune: "india", ahmedabad: "india",
  jaipur: "india", lucknow: "india", noida: "india", gurgaon: "india",
  // UK
  london: "uk", manchester: "uk", birmingham: "uk", liverpool: "uk",
  // Australia
  sydney: "australia", melbourne: "australia", brisbane: "australia",
  // Canada
  toronto: "canada", vancouver: "canada", montreal: "canada",
  // Japan
  tokyo: "japan", osaka: "japan", kyoto: "japan",
  // Germany
  berlin: "germany", munich: "germany", frankfurt: "germany",
  // France
  paris: "france", lyon: "france", marseille: "france",
  // Brazil
  "sao paulo": "brazil", rio: "brazil",
};

function detectCountry(location: string): { domain: string; gl: string } | null {
  const loc = location.toLowerCase();

  // 1. Direct country name match
  for (const [keyword, config] of Object.entries(COUNTRY_MAP)) {
    if (loc.includes(keyword)) return config;
  }

  // 2. City name match → resolve to country
  for (const [city, country] of Object.entries(CITY_TO_COUNTRY)) {
    if (loc.includes(city)) return COUNTRY_MAP[country];
  }

  return null;
}

// List of countries supported by SerpAPI's google_shopping engine
const SHOPPING_SUPPORTED_GL = new Set([
  "us", "uk", "in", "au", "ca", "de", "fr", "jp", "br",
  "it", "es", "nl", "se", "no", "dk", "fi", "be", "at",
  "ch", "pl", "pt", "ie", "nz", "sg", "mx", "ar", "cl",
  "co", "za", "kr", "tw", "hk", "ph", "th", "my", "id",
  "vn", "tr", "il", "ae", "sa", "eg", "ng", "ke",
]);

export const searchProductsTool = {
  description: "Search for products based on a user's query. You can optionally specify a location to find local prices. Works worldwide including Nepal, India, and all countries.",
  parameters: z.object({
    query: z.string().describe("The search query for the product (e.g. 'MacBook Air M1 price')"),
    location: z.string().optional().describe("The location to search from (e.g. 'Kathmandu, Nepal', 'Biratnagar, Nepal', 'New York, USA'). Always pass this when the user mentions a location."),
  }),
  execute: async ({ query, location }: { query: string; location?: string }) => {
    try {
      const q = query && query.trim() !== "" ? query : "macbook air m1";
      console.log("SerpAPI Query:", q, "| Location:", location || "none");

      const countryConfig = location ? detectCountry(location) : null;
      const gl = countryConfig?.gl || "us";
      const canUseShoppingEngine = SHOPPING_SUPPORTED_GL.has(gl);

      // =====================================================
      // STRATEGY:
      // 1. If the country supports google_shopping → use it (structured product cards with images)
      // 2. If NOT (e.g. Nepal) → use regular "google" engine with local domain
      //    This still returns structured JSON with organic results, local shops, images, etc.
      // =====================================================

      if (canUseShoppingEngine) {
        // --- Google Shopping Engine (structured product data with thumbnails) ---
        console.log("Using google_shopping engine (gl:", gl, ")");
        const params: any = {
          engine: "google_shopping",
          q: q,
          api_key: process.env.SERPAPI_API_KEY,
          num: 10,
          hl: "en",
          gl: gl,
        };
        if (location) params.location = location;

        const result = await getJson(params);

        if (!result.shopping_results || result.shopping_results.length === 0) {
          return { success: false, message: "No products found for this query." };
        }

        const products = result.shopping_results.map((item: any) => ({
          id: item.product_id,
          title: item.title,
          source: item.source,
          price: item.price,
          extracted_price: item.extracted_price,
          link: item.product_link || item.link,
          thumbnail: item.thumbnail,
          rating: item.rating,
          reviews: item.reviews,
          delivery: item.delivery,
        }));

        // Sort by price — cheapest first so "Best Pick" badge = best deal
        products.sort((a: any, b: any) => {
          const pa = a.extracted_price ?? Infinity;
          const pb = b.extracted_price ?? Infinity;
          return pa - pb;
        });

        return { success: true, engine: "google_shopping", products };
      } else {
        // --- Regular Google Search Engine (works EVERYWHERE including Nepal) ---
        console.log("Using google engine with domain:", countryConfig?.domain || "google.com", "| location:", location);
        const params: any = {
          engine: "google",
          q: q + " price",
          api_key: process.env.SERPAPI_API_KEY,
          num: 10,
          hl: "en",
          gl: gl,
        };
        if (countryConfig?.domain) params.google_domain = countryConfig.domain;
        if (location) params.location = location;

        let result;
        try {
          result = await getJson(params);
        } catch (err: any) {
          // If the specific city location is unsupported, retry without location
          // but keep the country domain and gl for localized results
          console.log("Location unsupported, retrying without location param but keeping domain...");
          delete params.location;
          // Also add the location text into the query itself for context
          params.q = q + " price in " + location;
          result = await getJson(params);
        }

        // Extract products from organic results, local results, and inline shopping
        const products: any[] = [];

        // 1. Inline shopping results (if available — these have images and prices!)
        if (result.inline_shopping_results) {
          for (const item of result.inline_shopping_results) {
            products.push({
              id: item.product_id || item.position,
              title: item.title,
              source: item.source,
              price: item.price || item.extracted_price,
              extracted_price: item.extracted_price,
              link: item.link,
              thumbnail: item.thumbnail,
              rating: item.rating,
              reviews: item.reviews,
            });
          }
        }

        // 2. Local business results (stores in the area)
        if (result.local_results?.places) {
          for (const place of result.local_results.places) {
            products.push({
              id: place.data_cid || place.position,
              title: place.title,
              source: place.address || "Local Store",
              price: place.price || "Check store",
              link: place.links?.website || place.gps_coordinates ? `https://maps.google.com/?q=${place.gps_coordinates?.latitude},${place.gps_coordinates?.longitude}` : "#",
              thumbnail: place.thumbnail,
              rating: place.rating,
              reviews: place.reviews,
            });
          }
        }

        // 3. Organic search results (website listings with snippets)
        if (result.organic_results) {
          for (const item of result.organic_results.slice(0, 6)) {
            // Try to extract a real price from the snippet (e.g. "Rs. 105,900" or "NPR 118,000")
            const snippet = item.snippet || "";
            const priceMatch = snippet.match(/(?:Rs\.?|NPR|₹|Price[:\s]*(?:Rs\.?|NPR)?)\s*[\d,]+(?:\.\d+)?/i);
            const extractedPrice = priceMatch ? priceMatch[0].trim() : null;
            
            // Clean up source: "https://www.gadgetbytenepal.com › MacBook" → "gadgetbytenepal.com"
            let cleanSource = item.displayed_link || item.source || "";
            try {
              const urlMatch = cleanSource.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s›]+)/);
              if (urlMatch) cleanSource = urlMatch[1];
            } catch {}

            products.push({
              id: item.position,
              title: item.title,
              source: cleanSource,
              price: extractedPrice || "View price",
              description: snippet.substring(0, 120),
              link: item.link,
              thumbnail: item.thumbnail || item.favicon,
              rating: item.rich_snippet?.top?.detected_extensions?.rating,
              reviews: item.rich_snippet?.top?.detected_extensions?.reviews,
            });
          }
        }

        if (products.length === 0) {
          return { success: false, message: "No products found for this query in " + (location || "your area") + "." };
        }

        // Sort by extracted price — cheapest first so "Best Pick" = best deal
        products.sort((a: any, b: any) => {
          const parsePrice = (p: any) => {
            if (p.extracted_price && typeof p.extracted_price === 'number') return p.extracted_price;
            const priceStr = String(p.price || '');
            const nums = priceStr.replace(/[^\d.]/g, '');
            const val = parseFloat(nums);
            return isNaN(val) ? Infinity : val;
          };
          return parsePrice(a) - parsePrice(b);
        });

        return { success: true, engine: "google", location: location, products };
      }
    } catch (error: any) {
      console.error("Error fetching from SerpAPI:", error);
      return { success: false, message: error?.message || "Failed to search for products." };
    }
  },
};
