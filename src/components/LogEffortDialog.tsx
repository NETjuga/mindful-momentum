// src/components/LogEffortDialog.tsx
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

// Updated difficulty options - clear intensity levels
const difficultyOptions = [
  { value: 'minimal', label: 'Minimal', emoji: '😌' },
  { value: 'light', label: 'Light', emoji: '😊' },
  { value: 'moderate', label: 'Moderate', emoji: '😐' },
  { value: 'strong', label: 'Strong', emoji: '😅' },
  { value: 'maximum', label: 'Maximum', emoji: '🔥' },
];

// NEW: Simplified emotional outcome options (no overlap with difficulty)
const feelOptions = [
  { value: 'Neutral', label: 'Neutral', emoji: '😐' },
  { value: 'Okay', label: 'Okay', emoji: '🙂' },
  { value: 'Good', label: 'Good', emoji: '😊' },
  { value: 'Energizing', label: 'Energizing', emoji: '✨' },
  { value: 'Proud', label: 'Proud', emoji: '🏆' },
];

export function LogEffortDialog({ open, onOpenChange, goal }: LogEffortDialogProps) {
  const { logEffort } = useGoals();
  
  const [effort, setEffort] = useState(0);
  const [difficulty, setDifficulty] = useState('');
  const [feelOption, setFeelOption] = useState('');
  const [message, setMessage] = useState('');
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

    if (!difficulty) {
      toast.error('Please select a difficulty level');
      return;
    }

    if (!feelOption) {
      toast.error('Please select how it felt');
      return;
    }

    try {
      // Create the enhanced log data
      const logData = {
        goal_id: goal.id,
        effort_rating: effort,
        difficulty_feeling: difficulty, // Keep for backward compatibility
        notes: message || undefined, // Keep for backward compatibility
        // New enhanced fields
        difficulty: difficulty as 'minimal' | 'light' | 'moderate' | 'strong' | 'maximum',
        feel_option: feelOption,
        message: message || undefined,
        // Use the goal's daily commitment minutes
        time_spent_minutes: goal.effort_per_day_minutes,
      };

      await logEffort.mutateAsync(logData);

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
    setFeelOption('');
    setMessage('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Log Your Effort</DialogTitle>
            <DialogDescription>
              {goal.name} • Daily commitment: {goal.effort_per_day_minutes} minutes
              {goal.in_recovery_mode && ' (Recovery mode)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Effort Rating */}
            <div className="space-y-3">
              <Label>How much effort did you put in? *</Label>
              <EffortRating value={effort} onChange={setEffort} />
              <p className="text-xs text-muted-foreground">
                1 = Minimal effort, 5 = Maximum effort
              </p>
            </div>

            {/* Difficulty Level (required) */}
            <div className="space-y-3">
              <Label>
                How intense was it? *
                <span className="text-xs text-muted-foreground ml-1">(Physical/Mental intensity)</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {difficultyOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={difficulty === option.value ? 'default' : 'outline'}
                    size="sm"
                    className="flex flex-col h-auto py-3"
                    onClick={() => setDifficulty(difficulty === option.value ? '' : option.value)}
                  >
                    <span className="text-lg mb-1">{option.emoji}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Feel Option (required) - Emotional outcome */}
            <div className="space-y-3">
              <Label>
                How did it feel? *
                <span className="text-xs text-muted-foreground ml-1">(Emotional outcome after doing it)</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {feelOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={feelOption === option.value ? 'default' : 'outline'}
                    size="sm"
                    className="flex flex-col h-auto py-3"
                    onClick={() => setFeelOption(feelOption === option.value ? '' : option.value)}
                  >
                    <span className="text-lg mb-1">{option.emoji}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Message/Reflection (optional) */}
            <div className="space-y-2">
              <Label htmlFor="message">Reflection (optional)</Label>
              <Textarea
                id="message"
                placeholder="Any thoughts, wins, or lessons from today's effort?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This will be saved in your log history for future reflection.
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">This log will add:</p>
                  <p className="text-sm text-muted-foreground">
                    {goal.effort_per_day_minutes} minutes to your total effort
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Daily commitment:</p>
                  <p className="text-sm text-muted-foreground">
                    {goal.effort_per_day_minutes} min/day
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={effort === 0 || !difficulty || !feelOption || logEffort.isPending}
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