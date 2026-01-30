import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Goal, MissReason } from '@/types/goals';
import { useGoals } from '@/hooks/useGoals';
import { toast } from 'sonner';

interface ReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

const reasons: { value: MissReason; label: string; emoji: string }[] = [
  { value: 'time', label: "Didn't have time", emoji: '⏰' },
  { value: 'energy', label: 'Low energy', emoji: '🔋' },
  { value: 'forgot', label: 'Forgot about it', emoji: '💭' },
  { value: 'motivation', label: 'Wasn\'t feeling it', emoji: '😔' },
  { value: 'external', label: 'Something came up', emoji: '🌪️' },
  { value: 'other', label: 'Other reason', emoji: '📝' },
];

export function ReflectionDialog({ open, onOpenChange, goal }: ReflectionDialogProps) {
  const { submitReflection } = useGoals();
  
  const [reason, setReason] = useState<MissReason | ''>('');
  const [details, setDetails] = useState('');

  if (!goal) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    try {
      const result = await submitReflection.mutateAsync({
        goal_id: goal.id,
        reason,
        reason_details: details || undefined,
      });

      if (result.message) {
        toast.success(result.message);
      } else {
        toast.success('Reflection saved. Tomorrow is a new day.');
      }
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save reflection');
    }
  };

  const resetForm = () => {
    setReason('');
    setDetails('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) resetForm();
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Quick Reflection</DialogTitle>
          <DialogDescription>
            No judgment here. Understanding why helps us adapt your goal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>What got in the way?</Label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={reason === option.value ? 'default' : 'outline'}
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => setReason(option.value)}
                >
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Details (optional) */}
          <div className="space-y-2">
            <Label htmlFor="details">Anything else? (optional)</Label>
            <Textarea
              id="details"
              placeholder="This helps us spot patterns and adjust your goal..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
            />
          </div>

          {/* Encouragement */}
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💚 Missing a day doesn't erase your progress. Your momentum is still there.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Skip for now
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!reason || submitReflection.isPending}
              className="flex-1"
            >
              {submitReflection.isPending ? 'Saving...' : 'Save Reflection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
