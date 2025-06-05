import React from "react";
import { Trophy, Users, Medal } from "lucide-react";
import { Suggestion, Vote, Attendance } from "../types/database";
import { RestaurantSorting } from "./RestaurantSorting";

interface VotingResultsProps {
  suggestions: Suggestion[];
  votes: Vote[];
  attendance: Attendance[];
  winnerSuggestionId: string;
}

interface SuggestionResult extends Suggestion {
  totalScore: number;
  averageRank: number;
  voteCount: number;
  rank: number;
}

export const VotingResults: React.FC<VotingResultsProps> = ({
  suggestions,
  votes,
  attendance,
  winnerSuggestionId,
}) => {
  // Calculate results
  const attendingUsers = attendance
    .filter((a) => a.is_attending)
    .map((a) => a.user_id);
  const relevantVotes = votes.filter((v) => attendingUsers.includes(v.user_id));

  const results: SuggestionResult[] = suggestions.map((suggestion) => {
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

  // Sort by total score (descending) and assign ranks
  results.sort((a, b) => b.totalScore - a.totalScore);
  results.forEach((result, index) => {
    result.rank = index + 1;
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-300 bg-yellow-50";
      case 2:
        return "border-gray-300 bg-gray-50";
      case 3:
        return "border-amber-300 bg-amber-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Final Results</h2>
        <p className="text-gray-500 text-center py-8">
          No suggestions were made for this week.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Winner Announcement */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200">
        <div className="text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Winner Selected!
          </h2>
          <h3 className="text-3xl font-bold text-green-700 mb-4">
            {results[0]?.restaurant || "No winner"}
          </h3>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span>{attendingUsers.length} voters participated</span>
          </div>
        </div>
      </div>

      {/* Sortable Results */}
      <RestaurantSorting
        suggestions={suggestions}
        votes={votes}
        attendingUserIds={attendingUsers}
      />

      {/* Detailed Results with Voting Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Detailed Results</h3>
        </div>

        <div className="space-y-4">
          {results.map((result) => {
            const isWinner = result.id === winnerSuggestionId;

            return (
              <div
                key={result.id}
                className={`border-2 rounded-xl p-4 transition-all ${
                  isWinner
                    ? "border-green-400 bg-green-50 shadow-md"
                    : getRankColor(result.rank)
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(result.rank)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-bold text-lg text-gray-800">
                        {result.restaurant}
                      </h4>
                      {isWinner && (
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          SELECTED
                        </div>
                      )}
                    </div>
                    {result.description && (
                      <p className="text-gray-600 mb-2">{result.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Suggested by {result.user_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex flex-col items-end space-y-1">
                      <div className="text-lg font-bold text-purple-600">
                        {result.totalScore} pts
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.voteCount} vote
                        {result.voteCount !== 1 ? "s" : ""}
                      </div>
                      {result.voteCount > 0 && (
                        <div className="text-xs text-gray-400">
                          Avg: {result.averageRank.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show voting breakdown */}
                {result.voteCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Ranking breakdown:</span>
                      <div className="flex space-x-1">
                        {[...Array(suggestions.length)].map((_, i) => {
                          const rank = i + 1;
                          const votesAtRank = relevantVotes.filter(
                            (v) =>
                              v.suggestion_id === result.id && v.rank === rank,
                          ).length;

                          if (votesAtRank === 0) return null;

                          return (
                            <div
                              key={rank}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                            >
                              #{rank}: {votesAtRank}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
