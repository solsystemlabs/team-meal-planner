// src/components/RestaurantBrowser.tsx - Enhanced with Filters
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Star,
  DollarSign,
  Clock,
  ExternalLink,
  Plus,
  Search,
  Loader,
  Settings,
  Filter,
} from "lucide-react";
import { googlePlacesService, Restaurant } from "../services/googlePlaces";

interface OfficeLocation {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface RestaurantBrowserProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  isOpen: boolean;
  onClose: () => void;
  officeLocation?: OfficeLocation;
}

interface SearchFilters {
  cuisineTypes: string[];
  priceRange: number[];
  minRating: number;
  openNow: boolean;
}

// Default office location fallback
const DEFAULT_OFFICE_LOCATION: OfficeLocation = {
  lat: 34.8021, // Greenville, SC coordinates
  lng: -82.394,
  address: "Greenville, SC",
};

// Cuisine type options
const CUISINE_TYPES = [
  { value: "american", label: "American" },
  { value: "italian", label: "Italian" },
  { value: "mexican", label: "Mexican" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "thai", label: "Thai" },
  { value: "indian", label: "Indian" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "french", label: "French" },
  { value: "greek", label: "Greek" },
  { value: "korean", label: "Korean" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "pizza", label: "Pizza" },
  { value: "seafood", label: "Seafood" },
  { value: "steakhouse", label: "Steakhouse" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "fast_food", label: "Fast Food" },
  { value: "cafe", label: "Cafe" },
  { value: "bakery", label: "Bakery" },
];

export const RestaurantBrowser: React.FC<RestaurantBrowserProps> = ({
  onSelectRestaurant,
  isOpen,
  onClose,
  officeLocation,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(2000); // meters
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Use passed office location or fall back to default
  const currentOfficeLocation = officeLocation || DEFAULT_OFFICE_LOCATION;

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    cuisineTypes: [],
    priceRange: [1, 2, 3, 4], // Include all price levels by default
    minRating: 0,
    openNow: false,
  });

  // Apply filters whenever restaurants or filters change
  useEffect(() => {
    if (!restaurants.length) {
      setFilteredRestaurants([]);
      return;
    }

    const filtered = restaurants.filter((restaurant) => {
      // Price filter
      if (
        restaurant.price_level &&
        !filters.priceRange.includes(restaurant.price_level)
      ) {
        return false;
      }

      // Rating filter
      if (restaurant.rating && restaurant.rating < filters.minRating) {
        return false;
      }

      // Open now filter
      if (
        filters.openNow &&
        restaurant.opening_hours &&
        !restaurant.opening_hours.open_now
      ) {
        return false;
      }

      // Cuisine filter - this is approximate based on restaurant name/type
      if (filters.cuisineTypes.length > 0) {
        const restaurantName = restaurant.name.toLowerCase();
        const hasMatchingCuisine = filters.cuisineTypes.some((cuisine) => {
          // Simple keyword matching - could be enhanced with more sophisticated logic
          switch (cuisine) {
            case "pizza":
              return restaurantName.includes("pizza");
            case "chinese":
              return (
                restaurantName.includes("chinese") ||
                restaurantName.includes("china")
              );
            case "mexican":
              return (
                restaurantName.includes("mexican") ||
                restaurantName.includes("taco") ||
                restaurantName.includes("burrito")
              );
            case "italian":
              return (
                restaurantName.includes("italian") ||
                restaurantName.includes("pasta")
              );
            case "japanese":
              return (
                restaurantName.includes("japanese") ||
                restaurantName.includes("sushi") ||
                restaurantName.includes("ramen")
              );
            case "thai":
              return restaurantName.includes("thai");
            case "indian":
              return (
                restaurantName.includes("indian") ||
                restaurantName.includes("curry")
              );
            case "american":
              return (
                restaurantName.includes("american") ||
                restaurantName.includes("grill") ||
                restaurantName.includes("burger")
              );
            case "fast_food":
              return (
                restaurantName.includes("mcdonald") ||
                restaurantName.includes("burger king") ||
                restaurantName.includes("subway") ||
                restaurantName.includes("kfc")
              );
            case "cafe":
              return (
                restaurantName.includes("cafe") ||
                restaurantName.includes("coffee") ||
                restaurantName.includes("starbucks")
              );
            default:
              return restaurantName.includes(cuisine);
          }
        });

        if (!hasMatchingCuisine) return false;
      }

      return true;
    });

    // Sort by rating (highest first), then by distance
    filtered.sort((a, b) => {
      if (a.rating && b.rating) {
        return b.rating - a.rating;
      }
      if (a.rating) return -1;
      if (b.rating) return 1;
      return 0;
    });

    setFilteredRestaurants(filtered);
  }, [restaurants, filters]);

  const searchRestaurants = async () => {
    setLoading(true);
    setError(null);
    setSearchInitiated(true);

    try {
      const results = await googlePlacesService.searchNearbyRestaurants(
        currentOfficeLocation.lat,
        currentOfficeLocation.lng,
        radius,
      );
      setRestaurants(results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load restaurants",
      );
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    try {
      // Get detailed info for the selected restaurant
      const details = await googlePlacesService.getPlaceDetails(
        restaurant.place_id,
      );
      onSelectRestaurant({ ...restaurant, ...details });
      onClose();
    } catch (err) {
      // If details fetch fails, use basic info
      onSelectRestaurant(restaurant);
      onClose();
    }
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      cuisineTypes: [],
      priceRange: [1, 2, 3, 4],
      minRating: 0,
      openNow: false,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.cuisineTypes.length > 0) count++;
    if (filters.priceRange.length < 4) count++;
    if (filters.minRating > 0) count++;
    if (filters.openNow) count++;
    return count;
  };

  const getPriceLevel = (level?: number): string => {
    if (!level) return "Price not available";
    return "$".repeat(level);
  };

  const getDistanceText = (radius: number): string => {
    if (radius >= 1000) {
      return `${(radius / 1000).toFixed(1)} km`;
    }
    return `${radius}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-slate-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Browse Nearby Restaurants</h2>
              <p className="text-blue-100 mt-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Near{" "}
                {currentOfficeLocation.name
                  ? `${currentOfficeLocation.name}, `
                  : ""}
                {currentOfficeLocation.address}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onClose();
                  const event = new CustomEvent("openOfficeSettings");
                  window.dispatchEvent(event);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
                title="Configure Office Location"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Search Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={500}>500m (0.3 miles)</option>
                <option value={1000}>1km (0.6 miles)</option>
                <option value={2000}>2km (1.2 miles)</option>
                <option value={5000}>5km (3.1 miles)</option>
              </select>
            </div>
            <div className="flex-1">
              <button
                onClick={searchRestaurants}
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-slate-700 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-slate-800 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{loading ? "Searching..." : "Search Restaurants"}</span>
              </button>
            </div>
            <div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all border ${
                  showFilters || getActiveFilterCount() > 0
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {getActiveFilterCount() > 0 && (
                  <span className="bg-blue-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Filter Options</h3>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cuisine Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                    {CUISINE_TYPES.map((cuisine) => (
                      <label
                        key={cuisine.value}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={filters.cuisineTypes.includes(cuisine.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFilterChange({
                                cuisineTypes: [
                                  ...filters.cuisineTypes,
                                  cuisine.value,
                                ],
                              });
                            } else {
                              handleFilterChange({
                                cuisineTypes: filters.cuisineTypes.filter(
                                  (c) => c !== cuisine.value,
                                ),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{cuisine.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((price) => (
                      <label
                        key={price}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={filters.priceRange.includes(price)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFilterChange({
                                priceRange: [
                                  ...filters.priceRange,
                                  price,
                                ].sort(),
                              });
                            } else {
                              handleFilterChange({
                                priceRange: filters.priceRange.filter(
                                  (p) => p !== price,
                                ),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{getPriceLevel(price)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) =>
                      handleFilterChange({ minRating: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value={0}>Any rating</option>
                    <option value={3}>3+ stars</option>
                    <option value={3.5}>3.5+ stars</option>
                    <option value={4}>4+ stars</option>
                    <option value={4.5}>4.5+ stars</option>
                  </select>
                </div>

                {/* Open Now */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.openNow}
                      onChange={(e) =>
                        handleFilterChange({ openNow: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Open now only</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-red-800">
                <ExternalLink className="w-5 h-5" />
                <div>
                  <p className="font-medium">Error loading restaurants</p>
                  <p className="text-sm">{error}</p>
                  {error.includes("API key") && (
                    <p className="text-sm mt-2">
                      Please configure VITE_GOOGLE_PLACES_API_KEY in your
                      environment variables.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!searchInitiated && !loading && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Find Restaurants Near Your Office
              </h3>
              <p className="text-gray-500 mb-4">
                Search for restaurants within {getDistanceText(radius)} of{" "}
                {currentOfficeLocation.name
                  ? `${currentOfficeLocation.name}, `
                  : ""}
                {currentOfficeLocation.address}
              </p>
              <button
                onClick={searchRestaurants}
                className="bg-gradient-to-r from-blue-600 to-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-slate-800 transition-all"
              >
                Start Searching
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Searching for restaurants...</p>
            </div>
          )}

          {!loading &&
            searchInitiated &&
            restaurants.length === 0 &&
            !error && (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No restaurants found
                </h3>
                <p className="text-gray-500">
                  Try increasing the search radius or adjusting your filters.
                </p>
              </div>
            )}

          {restaurants.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Showing {filteredRestaurants.length} of {restaurants.length}{" "}
                  restaurant{restaurants.length !== 1 ? "s" : ""} within{" "}
                  {getDistanceText(radius)}
                </p>
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.place_id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start space-x-4">
                    {/* Restaurant Photo */}
                    {restaurant.photos && restaurant.photos[0] && (
                      <img
                        src={googlePlacesService.getPhotoUrl(
                          restaurant.photos[0].photo_reference,
                          100,
                        )}
                        alt={restaurant.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}

                    {/* Restaurant Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg text-gray-800">
                          {restaurant.name}
                        </h3>
                        <button
                          onClick={() => handleSelectRestaurant(restaurant)}
                          className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex-shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Use This</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        {restaurant.distance_meters && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">
                              {restaurant.distance_meters < 1000
                                ? `${restaurant.distance_meters}m away`
                                : `${(restaurant.distance_meters / 1000).toFixed(1)}km away`}
                            </span>
                          </div>
                        )}

                        {restaurant.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{restaurant.rating.toFixed(1)}</span>
                          </div>
                        )}

                        {restaurant.price_level && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>{getPriceLevel(restaurant.price_level)}</span>
                          </div>
                        )}

                        {restaurant.opening_hours?.open_now !== undefined && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span
                              className={
                                restaurant.opening_hours.open_now
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {restaurant.opening_hours.open_now
                                ? "Open now"
                                : "Closed"}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {restaurant.vicinity}
                      </p>

                      {restaurant.business_status &&
                        restaurant.business_status !== "OPERATIONAL" && (
                          <p className="text-red-600 text-sm mt-1">
                            Status: {restaurant.business_status}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredRestaurants.length === 0 && restaurants.length > 0 && (
                <div className="text-center py-8">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No restaurants match your filters
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your filter criteria to see more options.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
