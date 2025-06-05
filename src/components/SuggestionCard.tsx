// src/components/SuggestionCard.tsx
import React from "react";
import {
  MapPin,
  Star,
  DollarSign,
  Phone,
  ExternalLink,
  User,
} from "lucide-react";
import { Suggestion } from "../types/database";

interface SuggestionCardProps {
  suggestion: Suggestion;
  rank?: number;
  points?: number;
  isWinner?: boolean;
  className?: string;
  showRanking?: boolean;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  rank,
  points,
  isWinner = false,
  className = "",
  showRanking = false,
}) => {
  const getPriceLevel = (level?: number): string => {
    if (!level) return "";
    return "$".repeat(level);
  };

  const formatPhoneNumber = (phone?: string): string => {
    if (!phone) return "";
    // Simple US phone number formatting
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <div
      className={`border rounded-xl p-4 transition-all ${
        isWinner
          ? "border-green-400 bg-green-50 shadow-md"
          : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
      } ${className}`}
    >
      {/* Header with ranking */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {showRanking && rank && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-slate-700 text-white font-bold text-sm flex-shrink-0">
              {rank}
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800 mb-1">
              {suggestion.restaurant}
            </h3>

            {/* Restaurant Details */}
            <div className="space-y-1">
              {suggestion.address && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{suggestion.address}</span>
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm">
                {suggestion.rating && (
                  <div className="flex items-center text-yellow-600">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    <span className="font-medium">{suggestion.rating}</span>
                  </div>
                )}

                {suggestion.price_level && (
                  <div className="flex items-center text-green-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span className="font-medium">
                      {getPriceLevel(suggestion.price_level)}
                    </span>
                  </div>
                )}
              </div>

              {suggestion.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <a
                    href={`tel:${suggestion.phone}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {formatPhoneNumber(suggestion.phone)}
                  </a>
                </div>
              )}

              {suggestion.website && (
                <div className="flex items-center text-sm text-gray-600">
                  <ExternalLink className="w-4 h-4 mr-2 text-gray-500" />
                  <a
                    href={suggestion.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors truncate"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Points/Ranking Info */}
        {showRanking && points !== undefined && (
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-blue-600">
              {points} {points === 1 ? "point" : "points"}
            </div>
            {rank && (
              <div className="text-xs text-gray-500">
                {rank === 1 ? "Top choice" : `Choice #${rank}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Description */}
      {suggestion.description && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-gray-700 text-sm italic">
            "{suggestion.description}"
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center">
          <User className="w-3 h-3 mr-1" />
          <span>Suggested by {suggestion.user_name}</span>
        </div>
        <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
