// src/components/OfficeSettings.tsx
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Save,
  Search,
  Loader,
  CheckCircle,
  Settings,
  Navigation,
} from "lucide-react";
import {
  googlePlacesService,
  LocationSearchResult,
} from "../services/googlePlaces";

interface OfficeLocation {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface OfficeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved: (location: OfficeLocation) => void;
  currentLocation?: OfficeLocation;
}

export const OfficeSettings: React.FC<OfficeSettingsProps> = ({
  isOpen,
  onClose,
  onLocationSaved,
  currentLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<OfficeLocation | null>(currentLocation || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
    }
  }, [currentLocation]);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes cache
          });
        },
      );

      const { latitude, longitude } = position.coords;

      // Use reverse geocoding to get a readable address
      try {
        // We can use the browser's built-in reverse geocoding or Google's
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`,
        );
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          const result = data.results[0];
          const location: OfficeLocation = {
            lat: latitude,
            lng: longitude,
            address: result.formatted_address,
            name: "Current Location",
          };
          setSelectedLocation(location);
        } else {
          throw new Error("Could not get address for current location");
        }
      } catch (geocodeError) {
        // Fallback to coordinates only
        const location: OfficeLocation = {
          lat: latitude,
          lng: longitude,
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          name: "Current Location",
        };
        setSelectedLocation(location);
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              "Location access denied. Please enable location permissions and try again.",
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred while getting location.");
            break;
        }
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to get current location",
        );
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const searchLocations = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const results = await googlePlacesService.searchPlaces(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search locations",
      );
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (result: LocationSearchResult) => {
    const location: OfficeLocation = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address: result.formatted_address,
      name: result.name,
    };
    setSelectedLocation(location);
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) return;

    setSaving(true);
    try {
      // Save to localStorage for now - you could implement backend storage later
      localStorage.setItem("office_location", JSON.stringify(selectedLocation));
      onLocationSaved(selectedLocation);
      setSaved(true);

      // Auto-close after showing success
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError("Failed to save office location");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchLocations();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Office Location Settings</h2>
                <p className="text-blue-100 mt-1">
                  Configure your office location for restaurant searches
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {saved ? (
            <div className="text-center py-12">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Office Location Saved!
              </h3>
              <p className="text-gray-600">
                Restaurant searches will now use your configured office
                location.
              </p>
            </div>
          ) : (
            <>
              {/* Current Location Display */}
              {selectedLocation && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedLocation === currentLocation
                      ? "Current Office Location"
                      : "Selected Location"}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {selectedLocation.name && (
                      <span className="font-medium">
                        {selectedLocation.name}
                        <br />
                      </span>
                    )}
                    {selectedLocation.address}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Coordinates: {selectedLocation.lat.toFixed(6)},{" "}
                    {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Search Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search for Your Office Location
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter office address, company name, or landmark..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <button
                      onClick={searchLocations}
                      disabled={loading || !searchQuery.trim()}
                      className="bg-gradient-to-r from-blue-600 to-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-slate-800 transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                      {loading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Use Current Location Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                      {gettingLocation ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                      <span>
                        {gettingLocation
                          ? "Getting Location..."
                          : "Use Current Location"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800">
                      Search Results
                    </h3>
                    {searchResults.map((result) => (
                      <div
                        key={result.place_id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedLocation?.lat ===
                            result.geometry.location.lat &&
                          selectedLocation?.lng === result.geometry.location.lng
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handleLocationSelect(result)}
                      >
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">
                              {result.name}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {result.formatted_address}
                            </p>
                          </div>
                          {selectedLocation?.lat ===
                            result.geometry.location.lat &&
                            selectedLocation?.lng ===
                              result.geometry.location.lng && (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual Entry Option */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Manual Entry
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    If you can't find your location above, you can enter
                    coordinates manually:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="34.8021"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value);
                          if (!isNaN(lat)) {
                            setSelectedLocation({
                              lat,
                              lng: selectedLocation?.lng || 0,
                              address:
                                selectedLocation?.address || "Manual Entry",
                              name: "Manual Entry",
                            });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="-82.3940"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value);
                          if (!isNaN(lng)) {
                            setSelectedLocation({
                              lat: selectedLocation?.lat || 0,
                              lng,
                              address:
                                selectedLocation?.address || "Manual Entry",
                              name: "Manual Entry",
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLocation}
                  disabled={!selectedLocation || saving}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Office Location"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
