// supabase/functions/places-proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { searchType, ...params } = await req.json();
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("Google Places API key not configured");
    }

    let url = "";
    let allResults: any[] = [];

    if (searchType === "nearby") {
      // Build base URL
      url =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${params.lat},${params.lng}&` +
        `radius=${params.radius}&` +
        `type=restaurant&` +
        `key=${GOOGLE_PLACES_API_KEY}`;

      // Add optional filters
      if (params.minPrice) url += `&minprice=${params.minPrice}`;
      if (params.maxPrice) url += `&maxprice=${params.maxPrice}`;
      if (params.openNow) url += `&opennow=true`;
      if (params.keyword)
        url += `&keyword=${encodeURIComponent(params.keyword)}`;

      console.log(`Making initial request to: ${url}`);

      // Get first page
      let response = await fetch(url);
      let data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Places API error: ${data.status}`);
      }

      allResults = [...data.results];
      console.log(`Got ${data.results.length} results from first page`);

      // Get additional pages if available (up to 3 pages total = ~60 results)
      let pageToken = data.next_page_token;
      let pageCount = 1;
      const maxPages = 3;

      while (pageToken && pageCount < maxPages) {
        console.log(`Fetching page ${pageCount + 1} with token: ${pageToken}`);

        // Wait 2 seconds before next page request (Google requirement)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const nextPageUrl =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
          `pagetoken=${pageToken}&` +
          `key=${GOOGLE_PLACES_API_KEY}`;

        response = await fetch(nextPageUrl);
        data = await response.json();

        if (data.status === "OK") {
          allResults = [...allResults, ...data.results];
          console.log(
            `Got ${data.results.length} more results from page ${pageCount + 1}`,
          );
          pageToken = data.next_page_token;
          pageCount++;
        } else {
          console.warn(
            `Page ${pageCount + 1} failed with status: ${data.status}`,
          );
          break;
        }
      }

      console.log(`Total results collected: ${allResults.length}`);

      // Calculate distances and sort by distance
      const resultsWithDistance = allResults.map((result) => {
        const distance = calculateDistance(
          params.lat,
          params.lng,
          result.geometry.location.lat,
          result.geometry.location.lng,
        );
        return {
          ...result,
          distance_meters: Math.round(distance),
        };
      });

      // Sort by distance (closest first)
      resultsWithDistance.sort((a, b) => a.distance_meters - b.distance_meters);

      console.log(
        `Closest restaurant: ${resultsWithDistance[0]?.name} at ${resultsWithDistance[0]?.distance_meters}m`,
      );

      return new Response(
        JSON.stringify({
          results: resultsWithDistance,
          status: "OK",
          total_results: resultsWithDistance.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } else if (searchType === "textsearch") {
      url =
        `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=${encodeURIComponent(params.query)}&` +
        `key=${GOOGLE_PLACES_API_KEY}`;
    } else if (searchType === "details") {
      url =
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${params.placeId}&` +
        `fields=name,formatted_address,formatted_phone_number,website,rating,price_level&` +
        `key=${GOOGLE_PLACES_API_KEY}`;
    } else {
      throw new Error(`Unknown search type: ${searchType}`);
    }

    // For non-nearby searches, use single request
    if (searchType !== "nearby") {
      console.log(`Making request to: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in places-proxy function:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
        status: "ERROR",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Haversine formula to calculate distance between two lat/lng points
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
