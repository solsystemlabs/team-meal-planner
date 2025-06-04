import React, { useState, useEffect, useMemo } from "react";
import {
  GripVertical,
  Trophy,
  Save,
  RotateCcw,
  ChevronDown,
  Crown,
} from "lucide-react";
import { Suggestion, Vote, Attendance } from "../types/database";
import { useAuth } from "../contexts/AuthContext";

interface DragDropVotingProps {
  suggestions: Suggestion[];
  votes: Vote[];
  attendance: Attendance[];
  winnerSuggestionId: string;
  isUserAttending: boolean;
  isLoading?: boolean;
  onVotesUpdate: (newVotes: { suggestion_id: string; rank: number }[]) => void;
}

interface RankedSuggestion extends Suggestion {
  userRank: number;
  userPoints: number;
  totalScore: number;
  totalVotes: number;
  overallRank: number;
}

type SortMode = "my-ranking" | "team-ranking" | "alphabetical" | "newest";

export const DragDropVoting: React.FC<DragDropVotingProps> = ({
  suggestions,
  votes,
  attendance,
  winnerSuggestionId,
  isUserAttending,
  isLoading = false,
  onVotesUpdate,
}) => {
  const { user } = useAuth();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("my-ranking");
  const [temporaryOrder, setTemporaryOrder] = useState<string[]>([]);

  // Reset temporary order when sort mode changes or data changes
  useEffect(() => {
    setTemporaryOrder([]);
    setHasChanges(false);
  }, [suggestions, votes, attendance, user, sortMode]);

  // Compute attending users
  const attendingUsers = useMemo(() => {
    if (!attendance) return [];
    return attendance.filter((a) => a.is_attending).map((a) => a.user_id);
  }, [attendance]);

  // Compute relevant votes from attending users
  const relevantVotes = useMemo(() => {
    if (!votes) return [];
    return votes.filter((v) => attendingUsers.includes(v.user_id));
  }, [votes, attendingUsers]);

  // Compute user votes
  const userVotes = useMemo(() => {
    if (!votes || !user) return [];
    return votes.filter((v) => v.user_id === user.id);
  }, [votes, user]);

  // Compute overall scores and rankings
  const overallData = useMemo(() => {
    if (!suggestions || !relevantVotes) return new Map();

    const overallScores = new Map<
      string,
      { totalScore: number; voteCount: number }
    >();
    relevantVotes.forEach((vote) => {
      const current = overallScores.get(vote.suggestion_id) || {
        totalScore: 0,
        voteCount: 0,
      };
      overallScores.set(vote.suggestion_id, {
        totalScore: current.totalScore + vote.rank,
        voteCount: current.voteCount + 1,
      });
    });

    // Create rankings based on total scores
    const overallSorted = [...suggestions].sort((a, b) => {
      const scoreA = overallScores.get(a.id)?.totalScore || 0;
      const scoreB = overallScores.get(b.id)?.totalScore || 0;
      return scoreB - scoreA;
    });

    const rankings = new Map<string, number>();
    overallSorted.forEach((suggestion, index) => {
      rankings.set(suggestion.id, index + 1);
    });

    return { scores: overallScores, rankings };
  }, [suggestions, relevantVotes]);

  // Compute ranked suggestions with all data
  const rankedSuggestions = useMemo((): RankedSuggestion[] => {
    if (!suggestions || !user) return [];

    const maxRank = suggestions.length;

    const ranked = suggestions.map((suggestion) => {
      const userVote = userVotes.find((v) => v.suggestion_id === suggestion.id);
      const userRank = userVote ? maxRank - userVote.rank + 1 : 0;
      const userPoints = userVote ? userVote.rank : 0;

      const overallInfo = overallData.scores.get(suggestion.id) || {
        totalScore: 0,
        voteCount: 0,
      };
      const overallRank = overallData.rankings.get(suggestion.id) || 0;

      return {
        ...suggestion,
        userRank,
        userPoints,
        totalScore: overallInfo.totalScore,
        totalVotes: overallInfo.voteCount,
        overallRank,
      };
    });

    // If we have a temporary order from dragging, use that for 'my-ranking' mode
    if (sortMode === "my-ranking" && temporaryOrder.length > 0) {
      return temporaryOrder
        .map((id) => ranked.find((r) => r.id === id)!)
        .filter(Boolean);
    }

    // Otherwise, sort based on sort mode
    switch (sortMode) {
      case "my-ranking":
        ranked.sort((a, b) => {
          if (a.userRank === 0 && b.userRank === 0) {
            return (
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            );
          }
          if (a.userRank === 0) return 1;
          if (b.userRank === 0) return -1;
          return b.userRank - a.userRank;
        });
        break;
      case "team-ranking":
        ranked.sort((a, b) => b.totalScore - a.totalScore);
        break;
      case "alphabetical":
        ranked.sort((a, b) => a.restaurant.localeCompare(b.restaurant));
        break;
      case "newest":
        ranked.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    return ranked;
  }, [suggestions, user, userVotes, overallData, sortMode, temporaryOrder]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (sortMode !== "my-ranking") return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (sortMode !== "my-ranking") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (
      sortMode !== "my-ranking" ||
      draggedIndex === null ||
      draggedIndex === dropIndex
    )
      return;

    const newOrder = [...rankedSuggestions];
    const draggedItem = newOrder[draggedIndex];

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setTemporaryOrder(newOrder.map((item) => item.id));
    setHasChanges(true);
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!user || !hasChanges || sortMode !== "my-ranking") return;

    setIsSaving(true);
    try {
      const maxRank = rankedSuggestions.length;
      const newVotes = rankedSuggestions.map((suggestion, index) => ({
        suggestion_id: suggestion.id,
        rank: maxRank - index,
      }));

      await onVotesUpdate(newVotes);
      setHasChanges(false);
      setTemporaryOrder([]);
    } catch (error) {
      console.error("Error saving votes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (sortMode !== "my-ranking") return;
    setTemporaryOrder([]);
    setHasChanges(false);
  };

  // Show loading state if data is still being fetched or is undefined
  if (isLoading || !suggestions || !votes || !attendance) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Vote on Suggestions
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (!isUserAttending) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Vote on Suggestions
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            You must be attending to vote on suggestions.
          </p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Vote on Suggestions
        </h2>
        <p className="text-gray-500 text-center py-8">
          No suggestions yet. Be the first to add one!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Rank Your Preferences
        </h2>
        <div className="flex items-center space-x-4">
          {winnerSuggestionId && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Current Leader</span>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 pr-8 font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="my-ranking">Sort by: My Ranking</option>
              <option value="team-ranking">Sort by: Team Results</option>
              <option value="alphabetical">Sort by: Alphabetical</option>
              <option value="newest">Sort by: Newest First</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {sortMode === "my-ranking" && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>How to vote:</strong> Drag and drop suggestions to rank
              them. Your top choice will get the highest score, with each item
              below worth one point less.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {rankedSuggestions.map((suggestion, index) => {
          const isWinner = suggestion.id === winnerSuggestionId;
          const isDragging = draggedIndex === index;
          const canDrag = sortMode === "my-ranking";

          return (
            <div
              key={suggestion.id}
              draggable={canDrag}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`border rounded-xl p-4 transition-all ${
                canDrag ? "cursor-move" : "cursor-default"
              } ${
                isDragging
                  ? "opacity-50 shadow-lg scale-105"
                  : isWinner
                    ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-lg ring-2 ring-yellow-200"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {canDrag && (
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  )}

                  {isWinner ? (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg">
                      <Crown className="w-6 h-6" />
                    </div>
                  ) : sortMode === "my-ranking" ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-slate-700 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm">
                      {suggestion.overallRank}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-800">
                      {suggestion.restaurant}
                    </h3>
                    {isWinner && (
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <Trophy className="w-3 h-3" />
                        <span>WINNING</span>
                      </div>
                    )}
                  </div>
                  {suggestion.description && (
                    <p className="text-gray-600 text-sm mb-1">
                      {suggestion.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Suggested by {suggestion.user_name}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex flex-col items-end space-y-1">
                    {/* Always show both personal and team info */}
                    <div className="text-sm font-bold text-blue-600">
                      You:{" "}
                      {suggestion.userPoints > 0
                        ? `${suggestion.userPoints}pts (#${suggestion.userRank})`
                        : "Not ranked"}
                    </div>
                    <div className="text-sm font-bold text-green-600">
                      Team: {suggestion.totalScore}pts (#
                      {suggestion.overallRank})
                    </div>
                    <div className="text-xs text-gray-500">
                      {suggestion.totalVotes} team vote
                      {suggestion.totalVotes !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasChanges && sortMode === "my-ranking" && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-amber-800 font-medium">
              You have unsaved changes
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-slate-700 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-slate-800 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Rankings"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
