import { CreateGoalData } from '@/types/goals';

export interface FeasibilityResult {
  score: number;
  level: 'excellent' | 'good' | 'moderate' | 'challenging' | 'difficult';
  message: string;
  suggestions: string[];
  adjustedGoal?: CreateGoalData;
}

export function calculateFeasibility(goal: CreateGoalData): FeasibilityResult {
  // Calculate total time commitment
  const totalMinutesPerWeek = goal.effort_per_day_minutes * goal.days_per_week;
  const totalHoursPerWeek = totalMinutesPerWeek / 60;
  const totalWeeks = goal.timeframe_days / 7;
  const totalHours = totalHoursPerWeek * totalWeeks;

  let score = 100;
  const suggestions: string[] = [];

  // Factor 1: Daily effort intensity (sweet spot is 15-45 minutes)
  if (goal.effort_per_day_minutes > 90) {
    score -= 25;
    suggestions.push(`Consider reducing daily effort to 60 minutes. Long sessions can lead to burnout.`);
  } else if (goal.effort_per_day_minutes > 60) {
    score -= 15;
    suggestions.push(`60+ minute sessions work best when broken into chunks.`);
  } else if (goal.effort_per_day_minutes < 10) {
    score -= 10;
    suggestions.push(`Very short sessions can be hard to maintain. Consider 15-minute blocks.`);
  }

  // Factor 2: Days per week (sweet spot is 3-5 days)
  if (goal.days_per_week === 7) {
    score -= 20;
    suggestions.push(`Daily goals without rest days increase burnout risk. Try 5-6 days.`);
  } else if (goal.days_per_week === 6) {
    score -= 10;
  } else if (goal.days_per_week < 3) {
    score -= 15;
    suggestions.push(`Goals practiced fewer than 3x/week are harder to maintain. Consider adding a day.`);
  }

  // Factor 3: Weekly time commitment (sweet spot is 2-7 hours)
  if (totalHoursPerWeek > 15) {
    score -= 25;
    suggestions.push(`${totalHoursPerWeek.toFixed(1)} hours/week is a major commitment. Start smaller.`);
  } else if (totalHoursPerWeek > 10) {
    score -= 15;
    suggestions.push(`${totalHoursPerWeek.toFixed(1)} hours/week is ambitious. Build up gradually.`);
  } else if (totalHoursPerWeek < 1) {
    score -= 5;
  }

  // Factor 4: Timeframe (short timeframes for new habits are harder)
  if (goal.timeframe_days < 14) {
    score -= 15;
    suggestions.push(`2+ weeks helps build momentum. Consider extending to 21 days.`);
  } else if (goal.timeframe_days < 21) {
    score -= 5;
  } else if (goal.timeframe_days > 90) {
    score -= 10;
    suggestions.push(`Long timeframes can feel distant. Consider breaking into 30-day phases.`);
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: FeasibilityResult['level'];
  let message: string;

  if (score >= 85) {
    level = 'excellent';
    message = "This goal is well-structured for sustainable progress.";
  } else if (score >= 70) {
    level = 'good';
    message = "This goal is achievable with consistent effort.";
  } else if (score >= 55) {
    level = 'moderate';
    message = "This goal is doable but may require adjustments along the way.";
  } else if (score >= 40) {
    level = 'challenging';
    message = "This goal is ambitious. Consider the suggestions below.";
  } else {
    level = 'difficult';
    message = "This goal may be hard to sustain. We recommend adjusting it.";
  }

  // Generate adjusted goal if score is low
  let adjustedGoal: CreateGoalData | undefined;
  if (score < 70) {
    adjustedGoal = {
      name: goal.name,
      description: goal.description,
      timeframe_days: Math.min(Math.max(goal.timeframe_days, 21), 60),
      effort_per_day_minutes: Math.min(goal.effort_per_day_minutes, 45),
      days_per_week: Math.min(Math.max(goal.days_per_week, 3), 5),
    };
  }

  return { score, level, message, suggestions, adjustedGoal };
}

export function getFeasibilityColor(level: FeasibilityResult['level']): string {
  switch (level) {
    case 'excellent': return 'text-primary';
    case 'good': return 'text-effort-5';
    case 'moderate': return 'text-accent';
    case 'challenging': return 'text-momentum-medium';
    case 'difficult': return 'text-muted-foreground';
  }
}
