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

    if (searchType === "nearby") {
      url =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${params.lat},${params.lng}&` +
        `radius=${params.radius}&` +
        `type=restaurant&` +
        `key=${GOOGLE_PLACES_API_KEY}`;
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

    console.log(`Making request to: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
