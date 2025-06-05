// src/services/googlePlaces.ts - Updated for Supabase Edge Functions
export interface Restaurant {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  photos?: { photo_reference: string }[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity: string;
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
  };
  website?: string;
  formatted_phone_number?: string;
  distance_meters?: number; // Added for distance calculation
}

export interface LocationSearchResult {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface PlacesSearchResponse {
  results: Restaurant[];
  status: string;
  next_page_token?: string;
}

class GooglePlacesService {
  private baseUrl: string;

  constructor() {
    // Use local Supabase for development, production Supabase for deployed app
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (import.meta.env.DEV) {
      // Local development - use local Supabase
      this.baseUrl = "http://localhost:54321/functions/v1/places-proxy";
    } else {
      // Production - use your deployed Supabase
      this.baseUrl = `${supabaseUrl}/functions/v1/places-proxy`;
    }
  }

  private async makeRequest(body: any): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error("Error making request to places API:", error);
      throw error;
    }
  }

  async searchNearbyRestaurants(
    lat: number,
    lng: number,
    radius: number = 2000,
    options?: {
      minPrice?: number;
      maxPrice?: number;
      openNow?: boolean;
      keyword?: string;
    },
  ): Promise<Restaurant[]> {
    const body: any = {
      searchType: "nearby",
      lat,
      lng,
      radius,
    };

    // Add optional filters
    if (options?.minPrice) body.minPrice = options.minPrice;
    if (options?.maxPrice) body.maxPrice = options.maxPrice;
    if (options?.openNow) body.openNow = options.openNow;
    if (options?.keyword) body.keyword = options.keyword;

    const data = await this.makeRequest(body);

    if (data.status === "OK") {
      return data.results;
    } else {
      throw new Error(`Places API error: ${data.status}`);
    }
  }

  async getPlaceDetails(placeId: string): Promise<Restaurant> {
    const data = await this.makeRequest({
      searchType: "details",
      placeId,
    });

    if (data.status === "OK") {
      return data.result;
    } else {
      throw new Error(`Places API error: ${data.status}`);
    }
  }

  async searchPlaces(query: string): Promise<LocationSearchResult[]> {
    const data = await this.makeRequest({
      searchType: "textsearch",
      query,
    });

    if (data.status === "OK") {
      return data.results.map((result: any) => ({
        place_id: result.place_id,
        formatted_address: result.formatted_address,
        name: result.name,
        geometry: {
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
        },
      }));
    } else {
      throw new Error(`Places API error: ${data.status}`);
    }
  }

  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    // Photos still need direct access - consider proxying these too if needed
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return "";

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
  }
}

export const googlePlacesService = new GooglePlacesService();
