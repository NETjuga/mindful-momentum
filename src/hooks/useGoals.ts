import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Goal, GoalLog, Reflection, CreateGoalData, LogEffortData, ReflectionData } from '@/types/goals';
import { calculateFeasibility } from '@/lib/feasibility';
import { calculateMomentumAfterLog, calculateMomentumAfterMiss } from '@/lib/momentum';
import { differenceInDays, parseISO, format } from 'date-fns';

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all goals for the user
  const goalsQuery = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });

  // Fetch logs for a specific goal
  const useGoalLogs = (goalId: string) => {
    return useQuery({
      queryKey: ['goal-logs', goalId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('goal_logs')
          .select('*')
          .eq('goal_id', goalId)
          .order('log_date', { ascending: false })
          .limit(30);
        
        if (error) throw error;
        return data as GoalLog[];
      },
      enabled: !!goalId,
    });
  };

// Create a new goal
const createGoal = useMutation({
  mutationFn: async (goalData: CreateGoalData) => {
    console.log('Starting goal creation for user:', user?.id);
    
    if (!user) {
      console.error('No user found - not authenticated');
      throw new Error('Not authenticated');
    }

    try {
      // Calculate feasibility
      const feasibility = calculateFeasibility(goalData);
      console.log('Feasibility calculated:', feasibility.score);
      
      // Calculate target completion date
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + goalData.timeframe_days);
      const targetDateString = targetDate.toISOString().split('T')[0];
      
      console.log('Inserting goal with data:', {
        user_id: user.id,
        name: goalData.name,
        timeframe_days: goalData.timeframe_days,
        target_completion_date: targetDateString
      });
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: goalData.name,
          description: goalData.description || null,
          timeframe_days: goalData.timeframe_days,
          effort_per_day_minutes: goalData.effort_per_day_minutes,
          days_per_week: goalData.days_per_week,
          feasibility_score: feasibility.score,
          // NEW: Countdown fields
          target_completion_date: targetDateString,
          countdown_active: true,
          countdown_ended: false,
          accountability_prompt_shown: false,
          // NEW: For 24-hour cooldown
          last_log_date: null,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Goal created successfully:', data.id);
      return data as Goal;
    } catch (error) {
      console.error('Error in createGoal mutation:', error);
      throw error;
    }
  },
  onSuccess: () => {
    console.log('Invalidating goals query cache');
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  },
  onError: (error) => {
    console.error('Mutation failed with error:', error);
  },
});

  // Log effort for a goal
  const logEffort = useMutation({
    mutationFn: async (logData: LogEffortData) => {
      if (!user) throw new Error('Not authenticated');

      // Get the goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', logData.goal_id)
        .single();
      
      if (goalError) throw goalError;

      // Get the last log
      const { data: lastLogs } = await supabase
        .from('goal_logs')
        .select('log_date')
        .eq('goal_id', logData.goal_id)
        .order('log_date', { ascending: false })
        .limit(1);

      const today = format(new Date(), 'yyyy-MM-dd');
      const lastLogDate = lastLogs?.[0]?.log_date;
      const daysSinceLastLog = lastLogDate 
        ? differenceInDays(new Date(), parseISO(lastLogDate))
        : 1;

      // Calculate momentum update
      const update = calculateMomentumAfterLog(goal as Goal, logData.effort_rating, daysSinceLastLog);

      // Insert the log
      const { error: logError } = await supabase
        .from('goal_logs')
        .upsert({
          goal_id: logData.goal_id,
          user_id: user.id,
          log_date: today,
          effort_rating: logData.effort_rating,
          difficulty_feeling: logData.difficulty_feeling || null,
          notes: logData.notes || null,
          time_spent_minutes: logData.time_spent_minutes || null,
        }, {
          onConflict: 'goal_id,log_date',
        });
      
      if (logError) throw logError;

      // Update the goal
      const { error: updateError } = await supabase
        .from('goals')
        .update({
          momentum_score: update.newMomentum,
          current_difficulty_multiplier: update.newDifficultyMultiplier,
          consecutive_successes: update.newConsecutiveSuccesses,
          consecutive_misses: update.newConsecutiveMisses,
          in_recovery_mode: update.shouldExitRecovery ? false : goal.in_recovery_mode,
          recovery_start_date: update.shouldExitRecovery ? null : goal.recovery_start_date,
          total_effort_logged: (goal.total_effort_logged || 0) + 1,
        })
        .eq('id', logData.goal_id);
      
      if (updateError) throw updateError;

      return { success: true, message: update.message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-logs'] });
    },
  });

  // Submit a reflection for a missed day
  const submitReflection = useMutation({
    mutationFn: async (reflectionData: ReflectionData) => {
      if (!user) throw new Error('Not authenticated');

      // Get the goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', reflectionData.goal_id)
        .single();
      
      if (goalError) throw goalError;

      // Calculate momentum update for miss
      const update = calculateMomentumAfterMiss(goal as Goal);

      // Insert the reflection
      const { error: refError } = await supabase
        .from('reflections')
        .insert({
          goal_id: reflectionData.goal_id,
          user_id: user.id,
          reason: reflectionData.reason,
          reason_details: reflectionData.reason_details || null,
          acknowledged: true,
        });
      
      if (refError) throw refError;

      // Update the goal
      const { error: updateError } = await supabase
        .from('goals')
        .update({
          momentum_score: update.newMomentum,
          current_difficulty_multiplier: update.newDifficultyMultiplier,
          consecutive_successes: update.newConsecutiveSuccesses,
          consecutive_misses: update.newConsecutiveMisses,
          in_recovery_mode: update.shouldEnterRecovery ? true : goal.in_recovery_mode,
          recovery_start_date: update.shouldEnterRecovery ? format(new Date(), 'yyyy-MM-dd') : goal.recovery_start_date,
        })
        .eq('id', reflectionData.goal_id);
      
      if (updateError) throw updateError;

      return { success: true, message: update.message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Update goal status
  const updateGoalStatus = useMutation({
    mutationFn: async ({ goalId, status }: { goalId: string; status: Goal['status'] }) => {
      const { error } = await supabase
        .from('goals')
        .update({ status })
        .eq('id', goalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Delete a goal
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    error: goalsQuery.error,
    useGoalLogs,
    createGoal,
    logEffort,
    submitReflection,
    updateGoalStatus,
    deleteGoal,
  };
}
