import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { Suggestion } from "../types/database";
import { getNextWeek } from "../utils/dateHelpers";
import { mockService } from "../services/mockSupabase";

export const NextWeekView: React.FC = () => {
  const nextWeek = getNextWeek();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const suggestionsData = await mockService.getSuggestions(nextWeek);
        setSuggestions(suggestionsData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [nextWeek]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Restaurant Suggestions
        </h2>
        {suggestions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No suggestions yet. Add the full functionality to start planning!
          </p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border rounded-xl p-4 border-gray-200"
              >
                <h3 className="font-bold text-lg text-gray-800">
                  {suggestion.restaurant}
                </h3>
                {suggestion.description && (
                  <p className="text-gray-600 mb-2">{suggestion.description}</p>
                )}
                <p className="text-sm text-gray-500">
                  Suggested by {suggestion.user_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border border-blue-200">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Ready for Full Functionality!
          </h3>
          <p className="text-gray-600">
            Connect your Supabase backend to enable voting, attendance tracking,
            and admin controls.
          </p>
        </div>
      </div>
    </div>
  );
};
