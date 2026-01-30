export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type MissReason = 'time' | 'energy' | 'forgot' | 'motivation' | 'external' | 'other';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  timeframe_days: number;
  effort_per_day_minutes: number;
  days_per_week: number;
  feasibility_score: number;
  status: GoalStatus;
  current_difficulty_multiplier: number;
  consecutive_misses: number;
  consecutive_successes: number;
  in_recovery_mode: boolean;
  recovery_start_date: string | null;
  momentum_score: number;
  total_effort_logged: number;
  created_at: string;
  updated_at: string;
}

export interface GoalLog {
  id: string;
  goal_id: string;
  user_id: string;
  log_date: string;
  effort_rating: number;
  difficulty_feeling: string | null;
  notes: string | null;
  time_spent_minutes: number | null;
  created_at: string;
}

export interface Reflection {
  id: string;
  goal_id: string;
  user_id: string;
  reflection_date: string;
  reason: MissReason;
  reason_details: string | null;
  suggested_adjustment: string | null;
  acknowledged: boolean;
  created_at: string;
}

export interface CreateGoalData {
  name: string;
  description?: string;
  timeframe_days: number;
  effort_per_day_minutes: number;
  days_per_week: number;
}

export interface LogEffortData {
  goal_id: string;
  effort_rating: number;
  difficulty_feeling?: string;
  notes?: string;
  time_spent_minutes?: number;
}

export interface ReflectionData {
  goal_id: string;
  reason: MissReason;
  reason_details?: string;
}
