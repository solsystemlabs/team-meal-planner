// src/components/VotingResults.tsx
import React from "react";
import { Trophy, Users, Medal } from "lucide-react";
import { Suggestion, Vote, Attendance } from "../types/database";
import { SuggestionCard } from "./SuggestionCard";

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
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Final Voting Results
        </h2>
        <div className="flex items-center space-x-2 text-gray-600">
          <Users className="w-5 h-5" />
          <span>{attendingUsers.length} voters</span>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((result) => {
          const isWinner = result.id === winnerSuggestionId;

          return (
            <div key={result.id} className="flex items-center space-x-4">
              {/* Rank Icon */}
              <div className="flex-shrink-0">{getRankIcon(result.rank)}</div>

              {/* Enhanced Suggestion Card */}
              <div className="flex-1">
                <SuggestionCard
                  suggestion={result}
                  isWinner={isWinner}
                  showRanking={false}
                  className={`${
                    isWinner
                      ? "border-green-400 bg-green-50 shadow-md"
                      : result.rank === 1
                        ? "border-yellow-300 bg-yellow-50"
                        : result.rank === 2
                          ? "border-gray-300 bg-gray-50"
                          : result.rank === 3
                            ? "border-amber-300 bg-amber-50"
                            : "border-gray-200 bg-white"
                  }`}
                />
              </div>

              {/* Voting Stats */}
              <div className="text-right flex-shrink-0 px-4">
                <div className="flex flex-col items-end space-y-1">
                  <div className="text-lg font-bold text-purple-600">
                    {result.totalScore} pts
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.voteCount} vote{result.voteCount !== 1 ? "s" : ""}
                  </div>
                  {result.voteCount > 0 && (
                    <div className="text-xs text-gray-400">
                      Avg: {result.averageRank.toFixed(1)}
                    </div>
                  )}
                  {isWinner && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                      SELECTED
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Voting Breakdown */}
      <div className="mt-6 space-y-3">
        {results.map((result) => {
          if (result.voteCount === 0) return null;

          return (
            <div
              key={`breakdown-${result.id}`}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {result.restaurant} - Ranking breakdown:
                </span>
                <div className="flex space-x-1">
                  {[...Array(suggestions.length)].map((_, i) => {
                    const rank = i + 1;
                    const votesAtRank = relevantVotes.filter(
                      (v) => v.suggestion_id === result.id && v.rank === rank,
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
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 text-center">
          <p>
            <strong>{relevantVotes.length}</strong> total votes cast by{" "}
            <strong>{attendingUsers.length}</strong> attending team members
          </p>
          {results.length > 0 && (
            <p className="mt-1">
              Winner: <strong>{results[0].restaurant}</strong> with{" "}
              <strong>{results[0].totalScore} points</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
