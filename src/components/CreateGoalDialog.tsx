import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { FeasibilityMeter } from './FeasibilityMeter';
import { calculateFeasibility, FeasibilityResult } from '@/lib/feasibility';
import { CreateGoalData } from '@/types/goals';
import { useGoals } from '@/hooks/useGoals';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGoalDialog({ open, onOpenChange }: CreateGoalDialogProps) {
  const { user } = useAuth();
  const { createGoal } = useGoals();
  
  const [formData, setFormData] = useState<CreateGoalData>({
    name: '',
    description: '',
    timeframe_days: 30,
    effort_per_day_minutes: 30,
    days_per_week: 5,
  });
  
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);
  const [step, setStep] = useState<'details' | 'feasibility'>('details');

  useEffect(() => {
    if (formData.name) {
      setFeasibility(calculateFeasibility(formData));
    }
  }, [formData]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a goal name');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a goal');
      return;
    }

    // Calculate target completion date
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + formData.timeframe_days);

    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          name: formData.name,
          description: formData.description || null,
          timeframe_days: formData.timeframe_days,
          effort_per_day_minutes: formData.effort_per_day_minutes,
          days_per_week: formData.days_per_week,
          target_completion_date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD
          countdown_active: true,
          countdown_ended: false,
          accountability_prompt_shown: false,
          user_id: user.id,
        });

      if (error) {
        console.error('Error creating goal:', error);
        toast.error('Failed to create goal');
        return;
      }

      toast.success(`Goal created! Countdown started - ${formData.timeframe_days} days to complete.`);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const handleUseAdjusted = () => {
    if (feasibility?.adjustedGoal) {
      setFormData(feasibility.adjustedGoal);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      timeframe_days: 30,
      effort_per_day_minutes: 30,
      days_per_week: 5,
    });
    setStep('details');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) resetForm();
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {step === 'details' ? 'Create a New Goal' : 'Goal Feasibility'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' 
              ? 'Define what you want to achieve and how much time you can dedicate.'
              : 'Let\'s check if this goal is set up for success.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                placeholder="e.g., Learn Spanish, Exercise daily"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What does success look like?"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="timeframe"
                    type="number"
                    min={7}
                    max={365}
                    value={formData.timeframe_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeframe_days: parseInt(e.target.value) || 30 }))}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effort">Daily Effort</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="effort"
                    type="number"
                    min={5}
                    max={240}
                    value={formData.effort_per_day_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, effort_per_day_minutes: parseInt(e.target.value) || 30 }))}
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Days/Week</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    max={7}
                    value={formData.days_per_week}
                    onChange={(e) => setFormData(prev => ({ ...prev, days_per_week: parseInt(e.target.value) || 5 }))}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            </div>

            {/* Countdown Preview */}
            <div className="p-3 bg-muted/30 rounded-lg mt-2">
              <p className="text-sm font-medium">Countdown Preview</p>
              <p className="text-sm text-muted-foreground">
                You'll have <span className="font-semibold">{formData.timeframe_days} days</span> to complete this goal.
                The countdown starts immediately when you create it.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('feasibility')} 
                disabled={!formData.name.trim()}
                className="flex-1"
              >
                Check Feasibility
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {feasibility && <FeasibilityMeter result={feasibility} />}

            {feasibility?.adjustedGoal && feasibility.score < 70 && (
              <div className="p-4 bg-primary/5 rounded-lg space-y-3">
                <p className="text-sm font-medium">Suggested Adjustment</p>
                <p className="text-sm text-muted-foreground">
                  {feasibility.adjustedGoal.effort_per_day_minutes} min/day, {' '}
                  {feasibility.adjustedGoal.days_per_week} days/week, {' '}
                  {feasibility.adjustedGoal.timeframe_days} days
                </p>
                <Button variant="secondary" size="sm" onClick={handleUseAdjusted}>
                  Use This Instead
                </Button>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1"
              >
                Create Goal & Start Countdown
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
