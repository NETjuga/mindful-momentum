import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MomentumRing } from './MomentumRing';
import { Goal } from '@/types/goals';
import { Calendar, Clock, Target, AlertCircle } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onLogEffort: () => void;
  onViewDetails: () => void;
}

export function GoalCard({ goal, onLogEffort, onViewDetails }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate days left
  const calculateDaysLeft = () => {
    if (!goal.target_completion_date) return 0;
    
    const today = new Date();
    const target = new Date(goal.target_completion_date);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : 0;
  };

  const daysLeft = calculateDaysLeft();
  const isCountdownActive = goal.countdown_active && !goal.countdown_ended;
  const isUrgent = daysLeft <= 3;
  const isWarning = daysLeft <= 7;

  // Get countdown color based on days left
  const getCountdownColor = () => {
    if (!isCountdownActive) return 'text-muted-foreground';
    if (isUrgent) return 'text-red-600';
    if (isWarning) return 'text-amber-600';
    return 'text-green-600';
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!goal.target_completion_date || goal.timeframe_days <= 0) return 0;
    
    const elapsed = goal.timeframe_days - daysLeft;
    return Math.max(5, Math.min(100, (elapsed / goal.timeframe_days) * 100));
  };

  return (
    <Card className="card-elevated hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="font-serif text-xl line-clamp-1">
            {goal.name}
          </CardTitle>
          <MomentumRing score={goal.momentum_score} size="sm" showLabel={false} />
        </div>
        
        {goal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {goal.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Countdown Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time to completion</span>
            </div>
            <div className={`text-sm font-semibold ${getCountdownColor()}`}>
              {isCountdownActive ? (
                <>
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </>
              ) : goal.countdown_ended ? (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Time's up!
                </span>
              ) : (
                'No countdown'
              )}
            </div>
          </div>

          {isCountdownActive && (
            <>
              <Progress 
                value={getProgressPercentage()} 
                className={`h-2 ${
                  isUrgent ? 'bg-red-100' : 
                  isWarning ? 'bg-amber-100' : 
                  'bg-green-100'
                }`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Started</span>
                <span>
                  {goal.target_completion_date && new Date(goal.target_completion_date).toLocaleDateString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Goal Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Daily Effort</span>
            </div>
            <p className="font-medium">{goal.effort_per_day_minutes} min</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Days/Week</span>
            </div>
            <p className="font-medium">{goal.days_per_week}</p>
          </div>
        </div>

        {/* Total Logged */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total logged</span>
            <span className="font-medium">{goal.total_effort_logged} min</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLogEffort}
            className="flex-1"
          >
            Log Effort
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onViewDetails}
            className="flex-1"
          >
            Details
          </Button>
        </div>

        {/* Urgent Warning */}
        {isUrgent && isCountdownActive && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mt-2">
            <p className="text-xs text-red-700 dark:text-red-300 text-center font-medium">
              ⚠️ Only {daysLeft} day{daysLeft === 1 ? '' : 's'} left!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

