import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Goal, GoalLog, Reflection, CreateGoalData, LogEffortData, ReflectionData } from '@/types/goals';
import { calculateFeasibility } from '@/lib/feasibility';
import { calculateMomentumAfterLog, calculateMomentumAfterMiss } from '@/lib/momentum';
import { differenceInDays, parseISO, format } from 'date-fns';
import { toast } from 'sonner';

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all goals for the user
  const goalsQuery = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('Fetching goals for user:', user.id);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching goals:', error);
        throw error;
      }
      console.log('Fetched goals:', data?.length || 0);
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

  // Create a new goal - MINIMAL SAFE VERSION
  const createGoal = useMutation({
    mutationFn: async (goalData: CreateGoalData) => {
      console.log('Creating goal with data:', goalData);
      
      if (!user) {
        console.error('User not authenticated');
        throw new Error('Not authenticated');
      }

      // Calculate feasibility
      let feasibility;
      try {
        feasibility = calculateFeasibility(goalData);
        console.log('Calculated feasibility:', feasibility);
      } catch (error) {
        console.error('Error calculating feasibility:', error);
        throw new Error(`Failed to calculate feasibility: ${error}`);
      }
      
      // Calculate target completion date
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + goalData.timeframe_days);
      
      // NOW WITH ALL COLUMNS SINCE THEY EXIST IN YOUR DATABASE
      const goalToInsert = {
        user_id: user.id,
        name: goalData.name,
        description: goalData.description || null,
        timeframe_days: goalData.timeframe_days,
        effort_per_day_minutes: goalData.effort_per_day_minutes,
        days_per_week: goalData.days_per_week,
        feasibility_score: feasibility.score,
        
        // Countdown system columns
        target_completion_date: targetDate.toISOString().split('T')[0],
        days_remaining: goalData.timeframe_days, // Now this column exists!
        countdown_active: true,
        countdown_ended: false,
        accountability_prompt_shown: false,
        
        // 12-hour cooldown system
        last_log_date: null, // Now this column exists!
        
        // Momentum system columns
        momentum_score: 50,
        current_difficulty_multiplier: 1.0,
        consecutive_successes: 0,
        consecutive_misses: 0,
        in_recovery_mode: false,
        recovery_start_date: null,
        total_effort_logged: 0,
        
        // Basic fields
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Inserting goal with all columns:', goalToInsert);
      
      const { data, error } = await supabase
        .from('goals')
        .insert(goalToInsert)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Failed to create goal: ${error.message}`);
      }
      
      console.log('Goal created successfully:', data);
      return data as Goal;
    },
    onSuccess: (newGoal) => {
      console.log('Mutation successful, updating cache for user:', user?.id);
      
      // Update cache immediately for instant UI update
      queryClient.setQueryData(['goals', user?.id], (oldGoals: Goal[] | undefined) => {
        const updatedGoals = oldGoals ? [newGoal, ...oldGoals] : [newGoal];
        console.log('Updated cache with new goal. Total goals:', updatedGoals.length);
        return updatedGoals;
      });
      
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      
      toast.success('Goal created successfully!');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error(error.message || 'Failed to create goal. Please try again.');
    },
  });

  const logEffort = useMutation({
    mutationFn: async (logData: LogEffortData) => {
      if (!user) throw new Error('Not authenticated');

      console.log('🔴 DEBUG: Starting log effort for goal:', logData.goal_id);

      // Get the goal with its last_log_date
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', logData.goal_id)
        .single();
      
      if (goalError) {
        console.error('🔴 DEBUG: Error fetching goal:', goalError);
        throw goalError;
      }

      const typedGoal = goal as Goal;
      console.log('🔴 DEBUG: Goal from DB - last_log_date:', typedGoal.last_log_date);

      // ================== COOLDOWN CHECK ==================
if (typedGoal.last_log_date) {
  console.log('🔴 DEBUG: last_log_date exists, checking cooldown...');
  console.log('🔴 DEBUG: Raw last_log_date:', typedGoal.last_log_date);
  console.log('🔴 DEBUG: Type:', typeof typedGoal.last_log_date);
  console.log('🔴 DEBUG: Length:', typedGoal.last_log_date.length);
  
  let lastLog: Date;
  
  // Handle different date formats
  if (typeof typedGoal.last_log_date === 'string') {
    if (typedGoal.last_log_date.length === 10) {
      // Format: "YYYY-MM-DD" (date only) - add time
      console.log('🔴 DEBUG: Date-only format detected');
      lastLog = new Date(typedGoal.last_log_date + 'T12:00:00.000Z');
    } else if (typedGoal.last_log_date.includes('T')) {
      // Format: ISO string with time
      console.log('🔴 DEBUG: ISO format detected');
      lastLog = new Date(typedGoal.last_log_date);
    } else {
      // Unknown format, try to parse anyway
      console.log('🔴 DEBUG: Unknown format, trying to parse');
      lastLog = new Date(typedGoal.last_log_date);
    }
  } else {
    // Already a Date object or something else
    lastLog = new Date(typedGoal.last_log_date);
  }
  
  console.log('🔴 DEBUG: Parsed lastLog:', lastLog.toISOString());
  
  const now = new Date();
  const hoursSinceLastLog = (now.getTime() - lastLog.getTime()) / (1000 * 60 * 60);
  
  console.log('🔴 DEBUG: hoursSinceLastLog:', hoursSinceLastLog);
  
  if (hoursSinceLastLog < 12) {
    console.log('🔴 DEBUG: COOLDOWN ACTIVE! Throwing error...');
    const nextLogTime = new Date(lastLog.getTime() + 12 * 60 * 60 * 1000);
    const timeUntilNextLog = nextLogTime.getTime() - now.getTime();
    
    const hours = Math.floor(timeUntilNextLog / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilNextLog % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilNextLog % (1000 * 60)) / 1000);
    
    const timeMessage = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    throw new Error(`COOLDOWN:${timeMessage}:${nextLogTime.toISOString()}`);
  } else {
    console.log('🔴 DEBUG: Cooldown passed, allowing log');
  }
} else {
  console.log('🔴 DEBUG: No last_log_date, allowing log');
}
// ================== END COOLDOWN CHECK ==================

      // Get the last log from goal_logs table for momentum calculation
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
      const update = calculateMomentumAfterLog(typedGoal, logData.effort_rating, daysSinceLastLog);

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

      // Update the goal with new last_log_date
      const newLastLogDate = new Date().toISOString();
      console.log('🔴 DEBUG: Setting last_log_date to:', newLastLogDate);
      
      const { error: updateError } = await supabase
        .from('goals')
        .update({
          momentum_score: update.newMomentum,
          current_difficulty_multiplier: update.newDifficultyMultiplier,
          consecutive_successes: update.newConsecutiveSuccesses,
          consecutive_misses: update.newConsecutiveMisses,
          in_recovery_mode: update.shouldExitRecovery ? false : typedGoal.in_recovery_mode,
          recovery_start_date: update.shouldExitRecovery ? null : typedGoal.recovery_start_date,
          total_effort_logged: (typedGoal.total_effort_logged || 0) + 1,
          last_log_date: newLastLogDate, // Update the cooldown timer
        } as any) // FIX: Add "as any" to bypass TypeScript error
        .eq('id', logData.goal_id);
      
      if (updateError) {
        console.error('🔴 DEBUG: Error updating goal:', updateError);
        throw updateError;
      }

      console.log('🔴 DEBUG: Update successful!');
      
      return { 
        success: true, 
        message: update.message || 'Effort logged!',
        nextLogTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      };
    },
    onSuccess: () => {
      console.log('🔴 DEBUG: Mutation onSuccess called');
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
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