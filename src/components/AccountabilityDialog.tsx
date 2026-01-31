import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Goal } from '@/types/goals';
import { Trophy, X, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  onComplete: () => void;
}

export default function AccountabilityDialog({
  open,
  onOpenChange,
  goal,
  onComplete,
}: AccountabilityDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleCompleteGoal = async (completed: boolean) => {
    if (!goal) return;
    
    setLoading(true);
    try {
      if (completed) {
        // Mark goal as completed - SUCCESS
        await supabase
          .from('goals')
          .update({ 
            status: 'completed',
            countdown_ended: true,
            accountability_prompt_shown: true,
            momentum_score: 100.00 // Max score for completion
          })
          .eq('id', goal.id);
        
        toast.success(
          `🎉 Amazing! "${goal.name}" completed! Your Ikioi is now at 100%!`,
          { duration: 5000 }
        );
      } else {
        // User failed - reduce Ikioi to 10% and enter recovery
        await supabase
          .from('goals')
          .update({ 
            momentum_score: 10.00,
            countdown_ended: true,
            accountability_prompt_shown: true,
            in_recovery_mode: true,
            status: 'paused' // Pause goal for recovery
          })
          .eq('id', goal.id);
        
        toast.error(
          `📉 Ikioi reset to 10% for "${goal.name}". Let's try a recovery plan.`,
          { duration: 5000 }
        );
      }
      
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal status');
    } finally {
      setLoading(false);
    }
  };

  if (!goal) return null;

  const daysLate = goal.target_completion_date 
    ? Math.max(0, Math.floor(
        (new Date().getTime() - new Date(goal.target_completion_date).getTime()) 
        / (1000 * 60 * 60 * 24)
      ))
    : 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {daysLate > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <Trophy className="h-5 w-5 text-primary" />
            )}
            Time's Up: {goal.name}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Your {goal.timeframe_days}-day timeframe has ended{daysLate > 0 ? ` (${daysLate} day${daysLate === 1 ? '' : 's'} ago)` : ''}.</p>
              <p className="text-sm">
                <strong>Target:</strong> {new Date(goal.target_completion_date!).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Did you successfully complete this goal?</p>
              <p className="text-sm text-muted-foreground">
                <strong>Be honest with yourself.</strong> Your Ikioi score will adjust based on your answer:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><span className="font-medium">Yes</span>: Ikioi goes to 100%! Goal moves to "Completed"</li>
                <li><span className="font-medium">No</span>: Ikioi resets to 10% and goal enters recovery mode</li>
              </ul>
            </div>

            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Ikioi Philosophy</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Progress isn't about perfection. It's about honest reflection and consistent effort. 
                Even if you didn't complete it, acknowledging it is the first step to improvement.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={() => handleCompleteGoal(false)}
            disabled={loading}
            className="w-full sm:w-auto gap-2"
          >
            <X className="h-4 w-4" />
            No, I didn't complete it
          </Button>
          <Button
            onClick={() => handleCompleteGoal(true)}
            disabled={loading}
            className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700"
          >
            <Trophy className="h-4 w-4" />
            Yes, I completed it!
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}