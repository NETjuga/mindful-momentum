// Countdown utility functions
export const calculateDaysLeft = (targetDate: string | null): number => {
  if (!targetDate) return 0;
  
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : 0;
};

export const getCountdownColor = (daysLeft: number): string => {
  if (daysLeft <= 3) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  if (daysLeft <= 7) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
  return 'text-green-600 bg-green-50 dark:bg-green-900/20';
};

export const getProgressPercentage = (
  daysLeft: number, 
  totalDays: number
): number => {
  if (totalDays <= 0) return 0;
  const elapsed = totalDays - daysLeft;
  return Math.max(5, Math.min(100, (elapsed / totalDays) * 100));
};

export const formatTargetDate = (dateString: string | null): string => {
  if (!dateString) return 'No target date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};