// src/services/googlePlaces.ts
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
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/place";

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!this.apiKey) {
      console.warn(
        "Google Places API key not found. Restaurant browser will not work.",
      );
    }
  }

  async searchNearbyRestaurants(
    lat: number,
    lng: number,
    radius: number = 2000, // meters
  ): Promise<Restaurant[]> {
    if (!this.apiKey) {
      throw new Error("Google Places API key not configured");
    }

    const url =
      `${this.baseUrl}/nearbysearch/json?` +
      `location=${lat},${lng}&` +
      `radius=${radius}&` +
      `type=restaurant&` +
      `key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data: PlacesSearchResponse = await response.json();

      if (data.status === "OK") {
        return data.results;
      } else {
        throw new Error(`Places API error: ${data.status}`);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<Restaurant> {
    if (!this.apiKey) {
      throw new Error("Google Places API key not configured");
    }

    const url =
      `${this.baseUrl}/details/json?` +
      `place_id=${placeId}&` +
      `fields=name,formatted_address,formatted_phone_number,website,rating,price_level&` +
      `key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        return data.result;
      } else {
        throw new Error(`Places API error: ${data.status}`);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      throw error;
    }
  }

  async searchPlaces(query: string): Promise<LocationSearchResult[]> {
    if (!this.apiKey) {
      throw new Error("Google Places API key not configured");
    }

    const url =
      `${this.baseUrl}/textsearch/json?` +
      `query=${encodeURIComponent(query)}&` +
      `key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

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
    } catch (error) {
      console.error("Error searching places:", error);
      throw error;
    }
  }

  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    if (!this.apiKey) return "";
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }
}

export const googlePlacesService = new GooglePlacesService();
