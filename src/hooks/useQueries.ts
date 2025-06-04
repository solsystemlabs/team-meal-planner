import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../services/supabase";
import { Suggestion, Vote, Attendance } from "../types/database";

// Query Keys
export const queryKeys = {
  suggestions: (weekOf: string) => ["suggestions", weekOf],
  votes: (weekOf: string) => ["votes", weekOf],
  attendance: (weekOf: string) => ["attendance", weekOf],
  weekPlan: (weekOf: string) => ["weekPlan", weekOf],
};

// Suggestions
export const useSuggestions = (weekOf: string) => {
  return useQuery({
    queryKey: queryKeys.suggestions(weekOf),
    queryFn: () => supabaseService.getSuggestions(weekOf),
    enabled: !!weekOf,
  });
};

export const useAddSuggestion = (weekOf: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestion: {
      user_id: string;
      restaurant: string;
      description?: string;
      week_of: string;
    }) => supabaseService.addSuggestion(suggestion),
    onSuccess: (newSuggestion) => {
      queryClient.setQueryData<Suggestion[]>(
        queryKeys.suggestions(weekOf),
        (old) => [...(old || []), newSuggestion],
      );
    },
  });
};

// Votes
export const useVotes = (weekOf: string) => {
  return useQuery({
    queryKey: queryKeys.votes(weekOf),
    queryFn: () => supabaseService.getVotes(weekOf),
    enabled: !!weekOf,
  });
};

export const useUpdateVotes = (weekOf: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      votes: { user_id: string; suggestion_id: string; rank: number }[],
    ) => {
      // Submit all votes
      const updatedVotes = await Promise.all(
        votes.map((vote) => supabaseService.upsertVote(vote)),
      );
      return updatedVotes;
    },
    onSuccess: (updatedVotes, variables) => {
      const userId = variables[0]?.user_id;
      if (!userId) return;

      queryClient.setQueryData<Vote[]>(queryKeys.votes(weekOf), (old) => {
        if (!old) return updatedVotes;
        // Remove old votes for this user and add new ones
        const filteredVotes = old.filter((v) => v.user_id !== userId);
        return [...filteredVotes, ...updatedVotes];
      });
    },
  });
};

// Attendance
export const useAttendance = (weekOf: string) => {
  return useQuery({
    queryKey: queryKeys.attendance(weekOf),
    queryFn: () => supabaseService.getAttendance(weekOf),
    enabled: !!weekOf,
  });
};

export const useToggleAttendance = (weekOf: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attendance: {
      user_id: string;
      week_of: string;
      is_attending: boolean;
    }) => supabaseService.upsertAttendance(attendance),
    onSuccess: (newAttendance) => {
      queryClient.setQueryData<Attendance[]>(
        queryKeys.attendance(weekOf),
        (old) => {
          if (!old) return [newAttendance];
          const existing = old.find((a) => a.user_id === newAttendance.user_id);
          if (existing) {
            return old.map((a) =>
              a.user_id === newAttendance.user_id ? newAttendance : a,
            );
          } else {
            return [...old, newAttendance];
          }
        },
      );
    },
  });
};

// Week Plans
export const useWeekPlan = (weekOf: string) => {
  return useQuery({
    queryKey: queryKeys.weekPlan(weekOf),
    queryFn: () => supabaseService.getWeekPlan(weekOf),
    enabled: !!weekOf,
  });
};

export const useConfirmSelection = (weekOf: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      weekOf: string;
      selectedSuggestionId: string;
      adminOverride: boolean;
      finalDestination: string;
    }) => {
      // Check if week plan already exists
      const existingPlan = await supabaseService.getWeekPlan(params.weekOf);

      if (existingPlan) {
        // Update existing plan instead of creating new one
        return await supabaseService.updateWeekPlan(existingPlan.id, {
          selected_suggestion_id: params.selectedSuggestionId,
          admin_override: params.adminOverride,
          final_destination: params.finalDestination,
          is_confirmed: true,
        });
      } else {
        // Create new plan
        return await supabaseService.createWeekPlan({
          week_of: params.weekOf,
          selected_suggestion_id: params.selectedSuggestionId,
          admin_override: params.adminOverride,
          final_destination: params.finalDestination,
          is_confirmed: true,
        });
      }
    },
    onSuccess: (weekPlan) => {
      queryClient.setQueryData(queryKeys.weekPlan(weekOf), weekPlan);
    },
    onError: (error) => {
      console.error("Error confirming selection:", error);
    },
  });
};

export const useUndoSelection = (weekOf: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => {
      console.log("useUndoSelection mutation called with planId:", planId);
      return supabaseService.deleteWeekPlan(planId);
    },
    onSuccess: () => {
      console.log("Undo mutation successful, updating cache");
      queryClient.setQueryData(queryKeys.weekPlan(weekOf), undefined);

      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.weekPlan(weekOf),
      });
    },
    onError: (error) => {
      console.error("Undo mutation failed:", error);
    },
  });
};

// Utility hook to get all data for a week
export const useWeekData = (weekOf: string) => {
  const suggestions = useSuggestions(weekOf);
  const votes = useVotes(weekOf);
  const attendance = useAttendance(weekOf);
  const weekPlan = useWeekPlan(weekOf);

  return {
    suggestions: suggestions.data || [],
    votes: votes.data || [],
    attendance: attendance.data || [],
    weekPlan: weekPlan.data,
    isLoading:
      suggestions.isLoading ||
      votes.isLoading ||
      attendance.isLoading ||
      weekPlan.isLoading,
    error:
      suggestions.error || votes.error || attendance.error || weekPlan.error,
  };
};
