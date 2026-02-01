// @/types/goals.ts
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type MissReason = 'time' | 'energy' | 'forgot' | 'motivation' | 'external' | 'other';
export type DifficultyLevel = 'minimal' | 'light' | 'moderate' | 'strong' | 'maximum';
export type FeelOption = 
  | 'Exhausting but proud'
  | 'Challenging but worth it'
  | 'Manageable'
  | 'Easy flow'
  | 'Felt motivating'
  | 'Made me feel accomplished'
  | 'Satisfying'
  | 'Fulfilling'
  | string; // Allow custom feel options

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
  last_log_date: string | null;

  // NEW: Countdown accountability fields
  target_completion_date: string | null;
  countdown_active: boolean;
  countdown_ended: boolean;
  accountability_prompt_shown: boolean;

  // NEW: Log history for the goal
  log_history?: GoalLog[];
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
  
  // NEW: Fields for enhanced logging and history display
  timestamp?: string; // When the log was created (ISO string) - OPTIONAL
  difficulty?: string | null; // Standardized difficulty level - OPTIONAL
  feel_option?: string | null; // How the user felt about the effort - OPTIONAL
  message?: string | null; // Optional reflection/message from the user - OPTIONAL
  // Note: We DON'T have effort_minutes column in database - use time_spent_minutes instead
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
  
  // NEW: Fields for enhanced logging
  difficulty?: DifficultyLevel; // Make optional for backward compatibility
  feel_option?: FeelOption; // Make optional for backward compatibility
  message?: string;
}

export interface ReflectionData {
  goal_id: string;
  reason: MissReason;
  reason_details?: string;
}

// NEW: Type for the GoalLogHistoryDialog props
export interface GoalLogHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  logs: GoalLog[];
}

// NEW: Helper type for formatted date display
export interface FormattedDateTime {
  date: string;
  time: string;
}

// NEW: Statistics interface for goal logs
export interface GoalLogStats {
  totalLogs: number;
  totalMinutes: number;
  averageDifficulty: string;
  averageLogsPerWeek: string;
}

// NEW: Type for log entry display in the history dialog
export interface LogEntryDisplay {
  id: string;
  timestamp: Date;
  difficulty: DifficultyLevel;
  feel_option: FeelOption;
  message?: string;
  effort_minutes: number;
  log_date: string;
}

// NEW: Type for mapping difficulty levels to values
export interface DifficultyValue {
  level: DifficultyLevel;
  value: number;
  color: string;
  icon: string;
}

// NEW: Default difficulty values mapping
export const DIFFICULTY_VALUES: Record<DifficultyLevel, DifficultyValue> = {
  minimal: {
    level: 'minimal',
    value: 1,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: '😌'
  },
  light: {
    level: 'light',
    value: 2,
    color: 'bg-green-50 text-green-800 border-green-300',
    icon: '😊'
  },
  moderate: {
    level: 'moderate',
    value: 3,
    color: 'bg-blue-50 text-blue-800 border-blue-300',
    icon: '😐'
  },
  strong: {
    level: 'strong',
    value: 4,
    color: 'bg-orange-50 text-orange-800 border-orange-300',
    icon: '😅'
  },
  maximum: {
    level: 'maximum',
    value: 5,
    color: 'bg-red-50 text-red-800 border-red-300',
    icon: '🔥'
  }
};

// NEW: Feel option to icon mapping
export const FEEL_OPTION_ICONS: Record<string, string> = {
  'exhausting': '😫',
  'challenging': '💪',
  'manageable': '🙂',
  'easy': '😌',
  'motivating': '🚀',
  'proud': '🏆',
  'accomplished': '🏆',
  'satisfying': '😊',
  'fulfilling': '✨'
};

// NEW: Helper function to get feel icon
export const getFeelIcon = (feelOption: string): string => {
  if (!feelOption) return '📝';
  const lowerFeel = feelOption.toLowerCase();
  for (const [key, icon] of Object.entries(FEEL_OPTION_ICONS)) {
    if (lowerFeel.includes(key)) {
      return icon;
    }
  }
  return '📝';
};

// NEW: Helper function to format date and time
export const formatGoalLogDateTime = (dateString: string): FormattedDateTime => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
};

// NEW: Helper function to get difficulty color
export const getDifficultyColor = (difficulty: string): string => {
  if (!difficulty) return 'bg-gray-100 text-gray-800 border-gray-300';
  switch (difficulty.toLowerCase()) {
    case 'minimal': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'light': return 'bg-green-50 text-green-800 border-green-300';
    case 'moderate': return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'strong': return 'bg-orange-50 text-orange-800 border-orange-300';
    case 'maximum': return 'bg-red-50 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// NEW: Helper function to get difficulty icon
export const getDifficultyIcon = (difficulty: string): string => {
  if (!difficulty) return '📝';
  switch (difficulty.toLowerCase()) {
    case 'minimal': return '😌';
    case 'light': return '😊';
    case 'moderate': return '😐';
    case 'strong': return '😅';
    case 'maximum': return '🔥';
    default: return '📝';
  }
};

// NEW: Helper function to calculate goal log statistics
export const calculateGoalLogStats = (logs: GoalLog[]): GoalLogStats | null => {
  if (logs.length === 0) return null;
  
  const totalMinutes = logs.reduce((sum, log) => sum + (log.time_spent_minutes || 0), 0);
  
  const averageDifficulty = logs.reduce((sum, log) => {
    const difficulty = log.difficulty || 'moderate';
    const difficultyValue = DIFFICULTY_VALUES[difficulty as DifficultyLevel]?.value || 3;
    return sum + difficultyValue;
  }, 0) / logs.length;
  
  // Group by week
  const logsByWeek: { [key: string]: GoalLog[] } = {};
  logs.forEach(log => {
    const date = new Date(log.timestamp || log.created_at);
    const weekNumber = Math.floor(date.getTime() / (1000 * 60 * 60 * 24 * 7));
    if (!logsByWeek[weekNumber]) {
      logsByWeek[weekNumber] = [];
    }
    logsByWeek[weekNumber].push(log);
  });
  
  const averageLogsPerWeek = logs.length / Math.max(1, Object.keys(logsByWeek).length);
  
  return {
    totalLogs: logs.length,
    totalMinutes,
    averageDifficulty: averageDifficulty.toFixed(1),
    averageLogsPerWeek: averageLogsPerWeek.toFixed(1)
  };
};

// NEW: Helper function to sort logs chronologically (newest first)
export const sortGoalLogsByDate = (logs: GoalLog[]): GoalLog[] => {
  return [...logs].sort((a, b) => 
    new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime()
  );
};

// NEW: Helper to convert GoalLog to display format
export const goalLogToDisplayFormat = (log: GoalLog): LogEntryDisplay => {
  return {
    id: log.id,
    timestamp: new Date(log.timestamp || log.created_at),
    difficulty: (log.difficulty as DifficultyLevel) || 'moderate',
    feel_option: (log.feel_option as FeelOption) || 'Manageable',
    message: log.message || log.notes || undefined,
    effort_minutes: log.time_spent_minutes || 0,
    log_date: log.log_date
  };
};