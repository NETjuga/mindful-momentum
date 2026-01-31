// src/components/CooldownTimerDialog.tsx
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Clock, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface CooldownTimerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextLogTime: Date;
  goalName: string;
}

export function CooldownTimerDialog({ 
  open, 
  onOpenChange, 
  nextLogTime,
  goalName 
}: CooldownTimerDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());

  function calculateTimeRemaining() {
    const now = new Date().getTime();
    const target = nextLogTime.getTime();
    const diff = Math.max(0, target - now);
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, totalMs: diff };
  }

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);
      
      if (newTime.totalMs <= 1000) {
        clearInterval(interval);
        setTimeout(() => {
          toast.success(`You can now log effort for "${goalName}"!`);
          onOpenChange(false);
        }, 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [open, nextLogTime, onOpenChange, goalName]);

  const progress = 100 - (timeRemaining.totalMs / (12 * 60 * 60 * 1000)) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Log Complete ✅
          </DialogTitle>
          <DialogDescription>
            You've already logged for "{goalName}" today
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timer Display */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-mono font-bold">
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </div>
            <p className="text-sm text-muted-foreground">
              Until next log is available
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Last log</span>
              <span>{progress.toFixed(0)}%</span>
              <span>Ready!</span>
            </div>
          </div>

          {/* Simple Message */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="text-sm font-medium">Why the wait?</span>
            </div>
            <p className="text-sm">
              You've already put in effort today! Come back tomorrow to continue your progress.
              This helps prevent burnout and builds sustainable habits.
            </p>
          </div>

          {/* Next Available Time */}
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <p className="text-sm font-medium">Next log available:</p>
            <p className="font-mono font-bold">
              {nextLogTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {nextLogTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}