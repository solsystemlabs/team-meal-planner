import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Calendar,
  User,
  Trophy,
  Star,
} from "lucide-react";
import { Suggestion, Vote } from "../types/database";

interface SuggestionWithStats extends Suggestion {
  totalScore: number;
  averageRank: number;
  voteCount: number;
  rank: number;
}

type SortOption = "name" | "date" | "author" | "votes" | "score" | "popularity";
type SortDirection = "asc" | "desc";

interface RestaurantSortingProps {
  suggestions: Suggestion[];
  votes: Vote[];
  attendingUserIds: string[];
}

export const RestaurantSorting: React.FC<RestaurantSortingProps> = ({
  suggestions,
  votes,
  attendingUserIds,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Calculate suggestions with voting statistics
  const suggestionsWithStats = useMemo((): SuggestionWithStats[] => {
    const relevantVotes = votes.filter((v) =>
      attendingUserIds.includes(v.user_id),
    );

    return suggestions.map((suggestion) => {
      const suggestionVotes = relevantVotes.filter(
        (v) => v.suggestion_id === suggestion.id,
      );
      const totalScore = suggestionVotes.reduce(
        (sum, vote) => sum + vote.rank,
        0,
      );
      const voteCount = suggestionVotes.length;
      const averageRank = voteCount > 0 ? totalScore / voteCount : 0;

      return {
        ...suggestion,
        totalScore,
        averageRank,
        voteCount,
        rank: 0, // Will be set after sorting
      };
    });
  }, [suggestions, votes, attendingUserIds]);

  // Sort suggestions based on current criteria
  const sortedSuggestions = useMemo(() => {
    const sorted = [...suggestionsWithStats].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.restaurant.localeCompare(b.restaurant);
          break;
        case "date":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "author":
          comparison = a.user_name.localeCompare(b.user_name);
          break;
        case "votes":
          comparison = a.voteCount - b.voteCount;
          break;
        case "score":
          comparison = a.totalScore - b.totalScore;
          break;
        case "popularity":
          comparison = a.averageRank - b.averageRank;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    // Assign ranks based on total score (for display purposes)
    const scoreRanked = [...sorted].sort((a, b) => b.totalScore - a.totalScore);
    scoreRanked.forEach((item, index) => {
      item.rank = index + 1;
    });

    return sorted;
  }, [suggestionsWithStats, sortBy, sortDirection]);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDirection(
        option === "name" || option === "author" ? "asc" : "desc",
      );
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Star className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Star className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
            {rank}
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Restaurant Suggestions
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
              showFilters
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Sort</span>
          </button>
        </div>
      </div>

      {/* Sorting Controls */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-semibold text-gray-700">
              Sort by:
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as SortOption)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="score">Total Score</option>
                <option value="votes">Vote Count</option>
                <option value="popularity">Average Rank</option>
                <option value="name">Restaurant Name</option>
                <option value="author">Suggested By</option>
                <option value="date">Date Added</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              {sortDirection === "asc" ? (
                <>
                  <ArrowUp className="w-4 h-4" />
                  <span>Ascending</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4" />
                  <span>Descending</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      {sortedSuggestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <Filter className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500">No restaurant suggestions yet.</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to add one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getRankIcon(suggestion.rank)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 truncate">
                        {suggestion.restaurant}
                      </h3>
                      {suggestion.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {suggestion.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{suggestion.user_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(suggestion.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {suggestion.voteCount > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600">
                            {suggestion.totalScore} pts
                          </div>
                          <div className="text-xs text-gray-500">
                            {suggestion.voteCount} vote
                            {suggestion.voteCount !== 1 ? "s" : ""}
                            {suggestion.averageRank > 0 && (
                              <span>
                                {" "}
                                • Avg: {suggestion.averageRank.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {sortedSuggestions.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 text-center">
            <p>
              Showing <strong>{sortedSuggestions.length}</strong> restaurant
              {sortedSuggestions.length !== 1 ? "s" : ""}
              {votes.length > 0 && (
                <span>
                  {" "}
                  • <strong>{votes.length}</strong> total votes cast
                </span>
              )}
            </p>
            <p className="mt-1 text-xs">
              Sorted by: <strong>{sortBy}</strong> (
              {sortDirection === "asc" ? "ascending" : "descending"})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
