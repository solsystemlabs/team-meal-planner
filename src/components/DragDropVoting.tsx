import React, { useState, useEffect } from "react";
import { GripVertical, Trophy, Save, RotateCcw } from "lucide-react";
import { Suggestion, Vote } from "../types/database";
import { useAuth } from "../contexts/AuthContext";

interface DragDropVotingProps {
  suggestions: Suggestion[];
  votes: Vote[];
  winnerSuggestionId: string;
  isUserAttending: boolean;
  onVotesUpdate: (newVotes: { suggestion_id: string; rank: number }[]) => void;
}

interface RankedSuggestion extends Suggestion {
  userRank: number;
}

export const DragDropVoting: React.FC<DragDropVotingProps> = ({
  suggestions,
  votes,
  winnerSuggestionId,
  isUserAttending,
  onVotesUpdate,
}) => {
  const { user } = useAuth();
  const [rankedSuggestions, setRankedSuggestions] = useState<
    RankedSuggestion[]
  >([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize ranked suggestions
  useEffect(() => {
    if (!user || !suggestions.length) return;

    const userVotes = votes.filter((v) => v.user_id === user.id);
    const maxRank = suggestions.length;

    const ranked = suggestions.map((suggestion) => {
      const userVote = userVotes.find((v) => v.suggestion_id === suggestion.id);
      return {
        ...suggestion,
        userRank: userVote ? maxRank - userVote.rank + 1 : 0, // Convert to display order (higher = better)
      };
    });

    // Sort by user rank (highest first), then by creation date for unranked items
    ranked.sort((a, b) => {
      if (a.userRank === 0 && b.userRank === 0) {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (a.userRank === 0) return 1;
      if (b.userRank === 0) return -1;
      return b.userRank - a.userRank;
    });

    setRankedSuggestions(ranked);
    setHasChanges(false);
  }, [suggestions, votes, user]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newRanked = [...rankedSuggestions];
    const draggedItem = newRanked[draggedIndex];

    // Remove the dragged item
    newRanked.splice(draggedIndex, 1);

    // Insert at new position
    newRanked.splice(dropIndex, 0, draggedItem);

    setRankedSuggestions(newRanked);
    setHasChanges(true);
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!user || !hasChanges) return;

    setIsSaving(true);
    try {
      const maxRank = rankedSuggestions.length;
      const newVotes = rankedSuggestions.map((suggestion, index) => ({
        suggestion_id: suggestion.id,
        rank: maxRank - index, // Convert back to DB format (1 = worst, max = best)
      }));

      await onVotesUpdate(newVotes);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving votes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to original order
    const userVotes = votes.filter((v) => v.user_id === user?.id);
    const maxRank = suggestions.length;

    const ranked = suggestions.map((suggestion) => {
      const userVote = userVotes.find((v) => v.suggestion_id === suggestion.id);
      return {
        ...suggestion,
        userRank: userVote ? maxRank - userVote.rank + 1 : 0,
      };
    });

    ranked.sort((a, b) => {
      if (a.userRank === 0 && b.userRank === 0) {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (a.userRank === 0) return 1;
      if (b.userRank === 0) return -1;
      return b.userRank - a.userRank;
    });

    setRankedSuggestions(ranked);
    setHasChanges(false);
  };

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
        <div className="flex items-center space-x-2">
          {winnerSuggestionId && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Current Leader</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>How to vote:</strong> Drag and drop suggestions to rank
            them. Your top choice will get the highest score, with each item
            below worth one point less.
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {rankedSuggestions.map((suggestion, index) => {
          const isWinner = suggestion.id === winnerSuggestionId;
          const isDragging = draggedIndex === index;
          const displayRank = index + 1;
          const points = rankedSuggestions.length - index;

          return (
            <div
              key={suggestion.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`border rounded-xl p-4 transition-all cursor-move ${
                isDragging
                  ? "opacity-50 shadow-lg scale-105"
                  : isWinner
                    ? "border-yellow-300 bg-yellow-50 shadow-md"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-slate-700 text-white font-bold text-sm">
                    {displayRank}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-800">
                      {suggestion.restaurant}
                    </h3>
                    {isWinner && <Trophy className="w-5 h-5 text-yellow-600" />}
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

                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">
                    {points} {points === 1 ? "point" : "points"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {displayRank === 1
                      ? "Top choice"
                      : displayRank === rankedSuggestions.length
                        ? "Last choice"
                        : `Choice #${displayRank}`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasChanges && (
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
