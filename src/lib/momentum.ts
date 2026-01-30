import { Goal, GoalLog } from '@/types/goals';

export interface MomentumUpdate {
  newMomentum: number;
  newDifficultyMultiplier: number;
  newConsecutiveSuccesses: number;
  newConsecutiveMisses: number;
  shouldEnterRecovery: boolean;
  shouldExitRecovery: boolean;
  message?: string;
}

// Calculate momentum change after logging effort
export function calculateMomentumAfterLog(
  goal: Goal,
  effortRating: number,
  daysSinceLastLog: number
): MomentumUpdate {
  let newMomentum = Number(goal.momentum_score);
  let newDifficultyMultiplier = Number(goal.current_difficulty_multiplier);
  let newConsecutiveSuccesses = goal.consecutive_successes;
  let newConsecutiveMisses = 0; // Reset misses on any log
  let shouldEnterRecovery = false;
  let shouldExitRecovery = false;
  let message: string | undefined;

  // Base momentum gain from effort
  const baseGain = effortRating * 2; // 2-10 points based on effort

  // Bonus for returning after missed days (anti-guilt)
  let returnBonus = 0;
  if (daysSinceLastLog > 1 && daysSinceLastLog <= 7) {
    returnBonus = 5; // "Welcome back" bonus
    message = "Welcome back! Every return matters.";
  } else if (daysSinceLastLog > 7) {
    returnBonus = 10; // Extra bonus for returning after a week+
    message = "Amazing comeback! It takes courage to restart.";
  }

  // Apply gains
  newMomentum += baseGain + returnBonus;

  // Increment successes
  newConsecutiveSuccesses++;

  // Check if exiting recovery mode
  if (goal.in_recovery_mode && newConsecutiveSuccesses >= 3) {
    shouldExitRecovery = true;
    newDifficultyMultiplier = Math.min(1.0, newDifficultyMultiplier + 0.1);
    message = "Great progress! You're back on track.";
  }

  // Increase difficulty slightly after consistent effort
  if (!goal.in_recovery_mode && newConsecutiveSuccesses >= 5 && newDifficultyMultiplier < 1.2) {
    newDifficultyMultiplier = Math.min(1.2, newDifficultyMultiplier + 0.05);
  }

  // Natural momentum decay (slight)
  if (daysSinceLastLog === 0) {
    // Same day log, minimal decay
  } else if (daysSinceLastLog <= 2) {
    newMomentum -= 2;
  }

  // Clamp momentum
  newMomentum = Math.max(0, Math.min(100, newMomentum));

  return {
    newMomentum,
    newDifficultyMultiplier,
    newConsecutiveSuccesses,
    newConsecutiveMisses,
    shouldEnterRecovery,
    shouldExitRecovery,
    message,
  };
}

// Calculate momentum change after a missed day
export function calculateMomentumAfterMiss(goal: Goal): MomentumUpdate {
  let newMomentum = Number(goal.momentum_score);
  let newDifficultyMultiplier = Number(goal.current_difficulty_multiplier);
  const newConsecutiveSuccesses = 0; // Reset on miss
  let newConsecutiveMisses = goal.consecutive_misses + 1;
  let shouldEnterRecovery = false;
  let shouldExitRecovery = false;
  let message: string | undefined;

  // Gentle momentum decrease (not punishing)
  newMomentum -= 3;

  // Enter recovery mode after 3 consecutive misses
  if (newConsecutiveMisses >= 3 && !goal.in_recovery_mode) {
    shouldEnterRecovery = true;
    newDifficultyMultiplier = Math.max(0.5, newDifficultyMultiplier - 0.2);
    message = "Let's ease up a bit. Recovery mode activated.";
  }

  // Clamp momentum (never goes below 10 to avoid discouragement)
  newMomentum = Math.max(10, Math.min(100, newMomentum));

  return {
    newMomentum,
    newDifficultyMultiplier,
    newConsecutiveSuccesses,
    newConsecutiveMisses,
    shouldEnterRecovery,
    shouldExitRecovery,
    message,
  };
}

// Get momentum level label
export function getMomentumLevel(score: number): 'building' | 'steady' | 'strong' | 'soaring' {
  if (score < 25) return 'building';
  if (score < 50) return 'steady';
  if (score < 75) return 'strong';
  return 'soaring';
}

// Get momentum display info
export function getMomentumDisplay(score: number) {
  const level = getMomentumLevel(score);
  const labels = {
    building: { label: 'Building', emoji: '🌱', description: 'Every step counts' },
    steady: { label: 'Steady', emoji: '🌿', description: 'Consistent progress' },
    strong: { label: 'Strong', emoji: '🌳', description: 'Growing stronger' },
    soaring: { label: 'Soaring', emoji: '✨', description: 'Incredible momentum' },
  };
  return labels[level];
}

// Get adjusted effort requirement based on difficulty multiplier
export function getAdjustedEffort(baseMinutes: number, multiplier: number): number {
  return Math.round(baseMinutes * multiplier);
}
