import React, { useState } from "react";
import { Users, Plus, ListChecks } from "lucide-react";
import { getNextWeek } from "../utils/dateHelpers";
import { useAuth } from "../contexts/AuthContext";
import { DragDropVoting } from "./DragDropVoting";
import { VotingResults } from "./VotingResults";
import { AdminControls } from "./AdminControls";
import { RestaurantSorting } from "./RestaurantSorting";
import {
  useWeekData,
  useAddSuggestion,
  useUpdateVotes,
  useToggleAttendance,
  useConfirmSelection,
  useUndoSelection,
} from "../hooks/useQueries";

export const NextWeekView: React.FC = () => {
  const { user } = useAuth();
  const nextWeek = getNextWeek();

  // React Query hooks
  const { suggestions, votes, attendance, weekPlan, isLoading, error } =
    useWeekData(nextWeek);
  const addSuggestionMutation = useAddSuggestion(nextWeek);
  const updateVotesMutation = useUpdateVotes(nextWeek);
  const toggleAttendanceMutation = useToggleAttendance(nextWeek);
  const confirmSelectionMutation = useConfirmSelection(nextWeek);
  const undoSelectionMutation = useUndoSelection(nextWeek);

  // Form state
  const [newSuggestion, setNewSuggestion] = useState({
    restaurant: "",
    description: "",
  });

  // View state
  const [activeVotingView, setActiveVotingView] = useState<"browse" | "rank">(
    "browse",
  );

  // Utility functions
  const userAttendance = attendance.find((a) => a.user_id === user?.id);
  const isUserAttending = userAttendance?.is_attending ?? false;
  const attendingCount = attendance.filter((a) => a.is_attending).length;
  const attendingUsers = attendance
    .filter((a) => a.is_attending)
    .map((a) => a.user_id);

  const calculateWinner = () => {
    const relevantVotes = votes.filter((v) =>
      attendingUsers.includes(v.user_id),
    );

    const scoreMap = new Map<string, number>();
    relevantVotes.forEach((vote) => {
      scoreMap.set(
        vote.suggestion_id,
        (scoreMap.get(vote.suggestion_id) || 0) + vote.rank,
      );
    });

    let winner = "";
    let highestScore = 0;
    scoreMap.forEach((score, suggestionId) => {
      if (score > highestScore) {
        highestScore = score;
        winner = suggestionId;
      }
    });

    return winner;
  };

  const winnerSuggestionId = calculateWinner();
  const winnerSuggestion = suggestions.find((s) => s.id === winnerSuggestionId);

  // Event handlers
  const handleToggleAttendance = async () => {
    if (!user) return;

    try {
      await toggleAttendanceMutation.mutateAsync({
        user_id: user.id,
        week_of: nextWeek,
        is_attending: !isUserAttending,
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to update attendance. Please try again.");
    }
  };

  const handleAddSuggestion = async () => {
    if (!user || !newSuggestion.restaurant.trim()) return;

    try {
      await addSuggestionMutation.mutateAsync({
        user_id: user.id,
        restaurant: newSuggestion.restaurant,
        description: newSuggestion.description || undefined,
        week_of: nextWeek,
      });
      setNewSuggestion({ restaurant: "", description: "" });
    } catch (error) {
      console.error("Error adding suggestion:", error);
      alert("Failed to add suggestion. Please try again.");
    }
  };

  const handleVotesUpdate = async (
    newVotes: { suggestion_id: string; rank: number }[],
  ) => {
    if (!user) return;

    try {
      const votesWithUserId = newVotes.map((vote) => ({
        user_id: user.id,
        suggestion_id: vote.suggestion_id,
        rank: vote.rank,
      }));

      await updateVotesMutation.mutateAsync(votesWithUserId);
    } catch (error) {
      console.error("Error updating votes:", error);
      throw error; // Re-throw so the component can handle it
    }
  };

  const handleConfirmSelection = async (suggestionId?: string) => {
    if (!user?.is_admin) return;

    try {
      const selectedSuggestionId = suggestionId || winnerSuggestionId;
      const selectedSuggestion = suggestions.find(
        (s) => s.id === selectedSuggestionId,
      );

      await confirmSelectionMutation.mutateAsync({
        weekOf: nextWeek,
        selectedSuggestionId,
        adminOverride: !!suggestionId,
        finalDestination: selectedSuggestion?.restaurant || "Unknown",
      });
    } catch (error) {
      console.error("Error confirming selection:", error);
      alert("Failed to confirm selection. Please try again.");
    }
  };

  const handleUndoSelection = async () => {
    if (!user?.is_admin || !weekPlan) return;

    try {
      await undoSelectionMutation.mutateAsync(weekPlan.id);
    } catch (error) {
      console.error("Error undoing selection:", error);
      alert("Failed to undo selection. Please try again.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading week data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl shadow-lg p-8 text-center">
        <p className="text-red-800">Error loading data: {error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Attendance Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Attendance</h2>
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span>{attendingCount} attending</span>
          </div>
        </div>
        <button
          onClick={handleToggleAttendance}
          disabled={toggleAttendanceMutation.isPending}
          className={`w-full py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 ${
            isUserAttending
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {toggleAttendanceMutation.isPending
            ? "Updating..."
            : isUserAttending
              ? "I'm attending! 🎉"
              : "Click to join lunch"}
        </button>
      </div>

      {/* Add Suggestion Section - Only show if not confirmed */}
      {!weekPlan && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Suggest a Restaurant
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Restaurant name"
              value={newSuggestion.restaurant}
              onChange={(e) =>
                setNewSuggestion({
                  ...newSuggestion,
                  restaurant: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={addSuggestionMutation.isPending}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newSuggestion.description}
              onChange={(e) =>
                setNewSuggestion({
                  ...newSuggestion,
                  description: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={addSuggestionMutation.isPending}
            />
            <button
              onClick={handleAddSuggestion}
              disabled={
                !newSuggestion.restaurant.trim() ||
                addSuggestionMutation.isPending
              }
              className="w-full bg-gradient-to-r from-blue-600 to-slate-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-slate-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>
                {addSuggestionMutation.isPending
                  ? "Adding..."
                  : "Add Suggestion"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Voting Section - Show different views if not confirmed */}
      {!weekPlan ? (
        <div className="space-y-6">
          {/* View Toggle for Voting */}
          {suggestions.length > 0 && isUserAttending && (
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setActiveVotingView("browse")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeVotingView === "browse"
                    ? "bg-gradient-to-r from-blue-500 to-slate-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Browse & Compare</span>
                </div>
              </button>
              <button
                onClick={() => setActiveVotingView("rank")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeVotingView === "rank"
                    ? "bg-gradient-to-r from-slate-600 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <ListChecks className="w-4 h-4" />
                  <span>Rank Preferences</span>
                </div>
              </button>
            </div>
          )}

          {/* Browse View with Sorting */}
          {activeVotingView === "browse" ? (
            <RestaurantSorting
              suggestions={suggestions}
              votes={votes}
              attendingUserIds={attendingUsers}
            />
          ) : (
            /* Drag & Drop Voting */
            <DragDropVoting
              suggestions={suggestions}
              votes={votes}
              winnerSuggestionId={winnerSuggestionId}
              isUserAttending={isUserAttending}
              onVotesUpdate={handleVotesUpdate}
            />
          )}
        </div>
      ) : (
        /* Show Results if confirmed */
        <VotingResults
          suggestions={suggestions}
          votes={votes}
          attendance={attendance}
          winnerSuggestionId={winnerSuggestionId}
        />
      )}

      {/* Admin Controls - Always show for admins */}
      {user?.is_admin && (
        <AdminControls
          suggestions={suggestions}
          winnerSuggestion={winnerSuggestion}
          weekPlan={weekPlan}
          onConfirm={handleConfirmSelection}
          onUndo={handleUndoSelection}
        />
      )}
    </div>
  );
};
