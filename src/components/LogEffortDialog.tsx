import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { EffortRating } from './EffortRating';
import { Goal } from '@/types/goals';
import { useGoals } from '@/hooks/useGoals';
import { getAdjustedEffort } from '@/lib/momentum';
import { toast } from 'sonner';
import { CooldownTimerDialog } from './CooldownTimerDialog';

interface LogEffortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

const difficultyOptions = [
  { value: 'easy', label: 'Easier than expected' },
  { value: 'right', label: 'Just right' },
  { value: 'hard', label: 'Challenging' },
  { value: 'struggle', label: 'Really struggled' },
];

export function LogEffortDialog({ open, onOpenChange, goal }: LogEffortDialogProps) {
  const { logEffort } = useGoals();
  
  const [effort, setEffort] = useState(0);
  const [difficulty, setDifficulty] = useState('');
  const [notes, setNotes] = useState('');
  const [showCooldownDialog, setShowCooldownDialog] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);

  if (!goal) return null;

  const adjustedEffort = getAdjustedEffort(
    goal.effort_per_day_minutes,
    Number(goal.current_difficulty_multiplier)
  );

  const handleSubmit = async () => {
    if (effort === 0) {
      toast.error('Please rate your effort');
      return;
    }

    try {
      await logEffort.mutateAsync({
        goal_id: goal.id,
        effort_rating: effort,
        difficulty_feeling: difficulty || undefined,
        notes: notes || undefined,
      });

      toast.success('Effort logged! Great job today.');
      
      onOpenChange(false);
      resetForm();
      
    } catch (error: any) {
      // Check if it's a cooldown error (new format: COOLDOWN:HH:MM:SS:ISO_TIMESTAMP)
      if (error.message?.startsWith('COOLDOWN:')) {
        const parts = error.message.split(':');
        if (parts.length >= 5) {
          // Format: COOLDOWN:HH:MM:SS:ISO_TIMESTAMP
          // First part is "COOLDOWN", next 3 are HH:MM:SS, rest is ISO timestamp
          const nextLogTimeStr = parts.slice(4).join(':'); // Skip "COOLDOWN", HH, MM, SS
          const nextLogTime = new Date(nextLogTimeStr);
          setCooldownEndTime(nextLogTime);
          setShowCooldownDialog(true);
          
          // Show brief toast
          toast.info(
            <div className="space-y-1">
              <div className="font-semibold">✅ Daily log complete</div>
              <div className="text-sm">Check when you can log again</div>
            </div>,
            {
              duration: 2000,
            }
          );
        }
      } 
      // Handle old format for backward compatibility
      else if (error.message?.includes('cooldown') || error.message?.includes('wait')) {
        // Default to 12 hours from now
        const nextLogTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
        setCooldownEndTime(nextLogTime);
        setShowCooldownDialog(true);
        
        toast.info(
          <div className="space-y-1">
            <div className="font-semibold">✅ Daily log complete</div>
            <div className="text-sm">Check when you can log again</div>
          </div>,
          {
            duration: 2000,
          }
        );
      } else {
        toast.error(error.message || 'Failed to log effort');
      }
    }
  };

  const resetForm = () => {
    setEffort(0);
    setDifficulty('');
    setNotes('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Log Your Effort</DialogTitle>
            <DialogDescription>
              {goal.name} • Target: {adjustedEffort} minutes today
              {goal.in_recovery_mode && ' (Recovery mode)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Effort Rating */}
            <div className="space-y-3">
              <Label>How much effort did you put in?</Label>
              <EffortRating value={effort} onChange={setEffort} />
            </div>

            {/* Difficulty (optional) */}
            <div className="space-y-3">
              <Label>How did it feel? (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={difficulty === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDifficulty(difficulty === option.value ? '' : option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any reflections or wins to celebrate?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={effort === 0 || logEffort.isPending}
                className="flex-1"
              >
                {logEffort.isPending ? 'Logging...' : 'Log Effort'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cooldown Timer Dialog */}
      {goal && cooldownEndTime && (
        <CooldownTimerDialog
          open={showCooldownDialog}
          onOpenChange={setShowCooldownDialog}
          nextLogTime={cooldownEndTime}
          goalName={goal.name}
        />
      )}
    </>
  );
}