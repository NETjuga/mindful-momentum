import { Goal } from '@/types/goals';
import { MomentumRing } from './MomentumRing';
import { getAdjustedEffort } from '@/lib/momentum';
import { cn } from '@/lib/utils';
import { Clock, Target, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface GoalCardProps {
  goal: Goal;
  onLogEffort: () => void;
  onViewDetails: () => void;
}

export function GoalCard({ goal, onLogEffort, onViewDetails }: GoalCardProps) {
  const adjustedEffort = getAdjustedEffort(
    goal.effort_per_day_minutes,
    Number(goal.current_difficulty_multiplier)
  );

  const isRecoveryMode = goal.in_recovery_mode;

  return (
    <Card 
      className={cn(
        'card-elevated transition-all duration-300 hover:scale-[1.02] cursor-pointer',
        isRecoveryMode && 'ring-2 ring-recovery/30 recovery-pulse'
      )}
      onClick={onViewDetails}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="font-serif text-xl">{goal.name}</CardTitle>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>
          <MomentumRing score={Number(goal.momentum_score)} size="sm" showLabel={false} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{adjustedEffort} min/day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            <span>{goal.days_per_week} days/week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>{goal.total_effort_logged} logged</span>
          </div>
        </div>

        {/* Recovery badge */}
        {isRecoveryMode && (
          <div className="flex items-center gap-2 px-3 py-2 bg-recovery/10 rounded-lg">
            <span className="text-sm">🌸</span>
            <span className="text-sm text-recovery font-medium">Recovery Mode</span>
            <span className="text-xs text-muted-foreground">Taking it easy</span>
          </div>
        )}

        {/* Action button */}
        <Button 
          className="w-full" 
          onClick={(e) => {
            e.stopPropagation();
            onLogEffort();
          }}
        >
          Log Today's Effort
        </Button>
      </CardContent>
    </Card>
  );
}
