import React, { useState } from "react";
import {
  Trophy,
  AlertTriangle,
  Check,
  X,
  RotateCcw,
  Crown,
} from "lucide-react";
import { Suggestion, WeekPlan } from "../types/database";

interface AdminControlsProps {
  suggestions: Suggestion[];
  winnerSuggestion: Suggestion | undefined;
  weekPlan: WeekPlan | undefined;
  onConfirm: (suggestionId?: string) => Promise<void>;
  onUndo: () => Promise<void>;
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: "confirm" | "override" | "undo";
  suggestionId?: string;
  suggestionName?: string;
}

export const AdminControls: React.FC<AdminControlsProps> = ({
  suggestions,
  winnerSuggestion,
  weekPlan,
  onConfirm,
  onUndo,
}) => {
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    isOpen: false,
    type: "confirm",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // If week is already planned, show undo option
  if (weekPlan) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                Selection Confirmed
              </h2>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Trophy className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-bold text-green-800">
                {weekPlan.final_destination}
              </h3>
            </div>
            {weekPlan.admin_override && (
              <p className="text-sm text-amber-700 bg-amber-100 px-2 py-1 rounded">
                Admin Override Applied
              </p>
            )}
          </div>
          <button
            onClick={() =>
              setConfirmation({
                isOpen: true,
                type: "undo",
              })
            }
            disabled={isProcessing}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Undo Selection</span>
          </button>
        </div>

        {/* Undo Confirmation Dialog */}
        {confirmation.isOpen && confirmation.type === "undo" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center mb-6">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Undo Selection?
                </h3>
                <p className="text-gray-600">
                  This will remove the confirmed selection for{" "}
                  <strong>{weekPlan.final_destination}</strong>
                  and allow new voting to continue.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() =>
                    setConfirmation({ isOpen: false, type: "confirm" })
                  }
                  disabled={isProcessing}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      await onUndo();
                      setConfirmation({ isOpen: false, type: "confirm" });
                    } catch (error) {
                      console.error("Error undoing selection:", error);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Undoing..." : "Yes, Undo"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // No suggestions yet
  if (suggestions.length === 0) {
    return null;
  }

  const handleConfirmVoteResults = () => {
    setConfirmation({
      isOpen: true,
      type: "confirm",
    });
  };

  const handleOverride = (suggestionId: string, suggestionName: string) => {
    setConfirmation({
      isOpen: true,
      type: "override",
      suggestionId,
      suggestionName,
    });
  };

  const executeAction = async () => {
    setIsProcessing(true);
    try {
      if (confirmation.type === "override" && confirmation.suggestionId) {
        await onConfirm(confirmation.suggestionId);
      } else {
        await onConfirm();
      }
      setConfirmation({ isOpen: false, type: "confirm" });
    } catch (error) {
      console.error("Error confirming selection:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-yellow-200">
      <div className="flex items-center space-x-2 mb-4">
        <Crown className="w-6 h-6 text-yellow-600" />
        <h2 className="text-2xl font-bold text-gray-800">Admin Controls</h2>
      </div>

      <div className="space-y-4">
        {/* Confirm Vote Results Button */}
        <button
          onClick={handleConfirmVoteResults}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <Check className="w-5 h-5" />
          <span>
            Confirm Vote Results
            {winnerSuggestion && ` - ${winnerSuggestion.restaurant}`}
          </span>
        </button>

        {/* Override Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Override Vote Results</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() =>
                  handleOverride(suggestion.id, suggestion.restaurant)
                }
                disabled={isProcessing}
                className="bg-white border-2 border-gray-300 hover:border-amber-400 hover:bg-amber-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{suggestion.restaurant}</span>
                  {suggestion.id === winnerSuggestion?.id && (
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                {suggestion.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {suggestion.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  confirmation.type === "override"
                    ? "bg-amber-100"
                    : "bg-green-100"
                }`}
              >
                {confirmation.type === "override" ? (
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                ) : (
                  <Check className="w-8 h-8 text-green-600" />
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {confirmation.type === "override"
                  ? "Override Vote Results?"
                  : "Confirm Selection?"}
              </h3>

              <div className="text-gray-600">
                {confirmation.type === "override" ? (
                  <div>
                    <p className="mb-2">
                      You're about to override the vote results and select:
                    </p>
                    <p className="font-bold text-amber-700 bg-amber-50 py-2 px-3 rounded-lg">
                      {confirmation.suggestionName}
                    </p>
                    <p className="mt-2 text-sm">
                      This will ignore all user votes and set this as the final
                      selection.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2">
                      You're about to confirm the winning selection:
                    </p>
                    <p className="font-bold text-green-700 bg-green-50 py-2 px-3 rounded-lg">
                      {winnerSuggestion?.restaurant || "No winner"}
                    </p>
                    <p className="mt-2 text-sm">
                      This will finalize the lunch choice and notify all team
                      members.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() =>
                  setConfirmation({ isOpen: false, type: "confirm" })
                }
                disabled={isProcessing}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={executeAction}
                disabled={isProcessing}
                className={`flex-1 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2 ${
                  confirmation.type === "override"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? "Processing..."
                    : confirmation.type === "override"
                      ? "Yes, Override"
                      : "Yes, Confirm"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
