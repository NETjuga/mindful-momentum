// src/components/GoalCard.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MomentumRing } from './MomentumRing';
import { Goal } from '@/types/goals';
import { 
  Calendar, 
  Clock, 
  Target, 
  AlertCircle, 
  MoreVertical, 
  Trash2,
  History
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGoals } from '@/hooks/useGoals';
import { toast } from 'sonner';
import { GoalLogHistoryDialog } from './GoalLogHistoryDialog';

interface GoalCardProps {
  goal: Goal;
  onLogEffort: () => void;
  onViewDetails: () => void;
}

export function GoalCard({ goal, onLogEffort, onViewDetails }: GoalCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteGoal } = useGoals();

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGoal.mutateAsync(goal.id);
      // Success toast is handled in the mutation's onSuccess
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast.error('Failed to delete goal. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Get difficulty badge styling (for log history preview)
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'minimal': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'light': return 'bg-green-50 text-green-800 border-green-300';
      case 'moderate': return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'strong': return 'bg-orange-50 text-orange-800 border-orange-300';
      case 'maximum': return 'bg-red-50 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <>
      <Card className="card-elevated hover:shadow-lg transition-shadow relative">
        {/* Three-dot menu in top-right corner */}
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setShowLogHistory(true)}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                View Log History
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between pr-8">
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

          {/* Last Log Info - Show even if no logs exist */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {goal.log_history && goal.log_history.length > 0 ? 'Recent effort' : 'Effort history'}
                </p>
                {goal.log_history && goal.log_history.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(goal.log_history[0].difficulty || 'moderate')}`}>
                      {(goal.log_history[0].difficulty || 'moderate').charAt(0).toUpperCase() + (goal.log_history[0].difficulty || 'moderate').slice(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(goal.log_history[0].timestamp || goal.log_history[0].created_at).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No logs yet. Start tracking your progress!
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogHistory(true)}
                className="flex items-center gap-1 text-sm"
              >
                <History className="h-3 w-3" />
                View History
              </Button>
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
              onClick={() => setShowLogHistory(true)}
              className="flex-1 flex items-center gap-1"
            >
              <History className="h-3 w-3" />
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

      {/* Log History Dialog */}
      <GoalLogHistoryDialog
        open={showLogHistory}
        onOpenChange={setShowLogHistory}
        goal={goal}
        logs={goal.log_history || []}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {goal.name}? This is a permanent action.
              <br />
              <span className="font-semibold text-red-600">
                All your progress with this goal will be lost if you proceed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Goal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}