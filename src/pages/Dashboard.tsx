import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import { Header } from '@/components/Header';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { LogEffortDialog } from '@/components/LogEffortDialog';
import { ReflectionDialog } from '@/components/ReflectionDialog';
import { MomentumRing } from '@/components/MomentumRing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Goal } from '@/types/goals';
import { Plus, Target, Leaf, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { goals, isLoading: goalsLoading } = useGoals();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [reflectionDialogOpen, setReflectionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2">
          <Leaf className="w-6 h-6 text-primary" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeGoals = goals.filter(g => g.status === 'active');
  const overallMomentum = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + Number(g.momentum_score), 0) / activeGoals.length
    : 50;

  const handleLogEffort = (goal: Goal) => {
    setSelectedGoal(goal);
    setLogDialogOpen(true);
  };

  const handleViewDetails = (goal: Goal) => {
    setSelectedGoal(goal);
    // For now, open reflection dialog as a placeholder for details view
    // In a full app, this would navigate to a detail page
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-2">
            Good to see you{user.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            {activeGoals.length === 0 
              ? "Ready to set your first adaptive goal?"
              : `You have ${activeGoals.length} active goal${activeGoals.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Stats row */}
        {activeGoals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="card-elevated">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Momentum</p>
                  <p className="font-serif text-2xl font-semibold">{Math.round(overallMomentum)}%</p>
                </div>
                <MomentumRing score={overallMomentum} size="sm" showLabel={false} />
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                  <p className="font-serif text-2xl font-semibold">{activeGoals.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Logged</p>
                  <p className="font-serif text-2xl font-semibold">
                    {goals.reduce((sum, g) => sum + g.total_effort_logged, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Goals grid */}
        {goalsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onLogEffort={() => handleLogEffort(goal)}
                onViewDetails={() => handleViewDetails(goal)}
              />
            ))}
            
            {/* Add goal card */}
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[200px]"
            >
              <Plus className="w-8 h-8" />
              <span className="font-medium">Add a new goal</span>
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-semibold mb-3">
              No goals yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first goal and we'll help you build sustainable momentum — no streak pressure, just progress.
            </p>
            <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create your first goal
            </Button>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <CreateGoalDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <LogEffortDialog open={logDialogOpen} onOpenChange={setLogDialogOpen} goal={selectedGoal} />
      <ReflectionDialog open={reflectionDialogOpen} onOpenChange={setReflectionDialogOpen} goal={selectedGoal} />
    </div>
  );
}
