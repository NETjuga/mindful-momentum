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
import AccountabilityDialog from '@/components/AccountabilityDialog';
import { toast } from 'sonner';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Goal } from '@/types/goals';
import { Plus, Target, Leaf, TrendingUp, Trophy, ChevronDown, Calendar, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { goals, isLoading: goalsLoading } = useGoals();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [reflectionDialogOpen, setReflectionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [showAccountabilityDialog, setShowAccountabilityDialog] = useState(false);

  // Fetch user's display name from profiles table
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Profile fetch error:', error);
            setDisplayName(user.email?.split('@')[0] || '');
            return;
          }
          
          const name = 
            data?.display_name || 
            user.user_metadata?.display_name || 
            user.email?.split('@')[0] || 
            '';
          
          setDisplayName(name);
          
          if (user.user_metadata?.display_name && !data?.display_name) {
            await supabase
              .from('profiles')
              .update({ display_name: user.user_metadata.display_name })
              .eq('id', user.id);
          }
        } catch (error) {
          console.error('Error in fetchDisplayName:', error);
          setDisplayName(user.email?.split('@')[0] || '');
        }
      }
    };
    
    fetchDisplayName();
  }, [user]);


// Check for completed countdowns
useEffect(() => {
  const checkCountdowns = async () => {
    if (!user || goalsLoading) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Find goals where countdown ended but prompt hasn't been shown
    const endedGoals = goals.filter(goal => {
      if (!goal.target_completion_date || 
          goal.countdown_ended || 
          goal.accountability_prompt_shown) {
        return false;
      }
      return goal.target_completion_date <= today;
    });
    
    if (endedGoals.length > 0) {
      // Show accountability dialog for the first ended goal
      setSelectedGoal(endedGoals[0]);
      setShowAccountabilityDialog(true);
    }
  };
  
  checkCountdowns();
}, [goals, goalsLoading, user]);


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
  const completedGoals = goals.filter(g => g.status === 'completed');
  const overallMomentum = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + Number(g.momentum_score), 0) / activeGoals.length
    : 50;

  const handleLogEffort = (goal: Goal) => {
    setSelectedGoal(goal);
    setLogDialogOpen(true);
  };

  const handleViewDetails = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero section with dropdown */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-2">
              Good to see you{displayName ? `, ${displayName}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              {activeGoals.length === 0 
                ? "Ready to set your first adaptive goal?"
                : `You have ${activeGoals.length} active goal${activeGoals.length > 1 ? 's' : ''}`}
            </p>
          </div>
          
          {/* Navigation Dropdown - Updated with "Goal Dashboard" as default */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="gap-2">
      <Target className="h-4 w-4" />
      <span>Goal Dashboard</span>
      <ChevronDown className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuItem className="gap-2" disabled>
      <Target className="h-4 w-4" />
      <span>Goal Dashboard</span>
    </DropdownMenuItem>
    <DropdownMenuItem 
      className="gap-2"
      onClick={() => navigate('/ikioi')}
    >
      <BarChart className="h-4 w-4" />
      <span>Your Ikioi</span>
    </DropdownMenuItem>
    <DropdownMenuItem className="gap-2">
      <Calendar className="h-4 w-4" />
      <span>Calendar</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
        </div>

        {/* Stats row - Updated with Ikioi branding */}
        {activeGoals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="card-elevated">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Ikioi</p>
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

        {/* Active Goals Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl font-semibold">Active Goals</h2>
            <Button 
              size="sm" 
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </Button>
          </div>
          
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
                <span className="font-medium">Add another goal</span>
              </button>
            </div>
          ) : (
            /* Empty state for active goals */
            <div className="max-w-md mx-auto text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Leaf className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-semibold mb-3">
                No active goals yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Create your first goal and build sustainable momentum — no streak pressure, just progress.
              </p>
              <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Create your first goal
              </Button>
            </div>
          )}
        </div>

        {/* Completed Goals Section */}
        <div>
          <h2 className="font-serif text-2xl font-semibold mb-4">Completed Goals</h2>
          
          {completedGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onLogEffort={() => handleLogEffort(goal)}
                  onViewDetails={() => handleViewDetails(goal)}
                />
              ))}
            </div>
          ) : (
            /* Empty state for completed goals */
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">
                We're waiting!
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Complete your first goal and earn your trophy here. 
                Every achievement deserves celebration.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
              >
                <Target className="w-4 h-4" />
                Start a new goal
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <CreateGoalDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <LogEffortDialog open={logDialogOpen} onOpenChange={setLogDialogOpen} goal={selectedGoal} />
      <ReflectionDialog open={reflectionDialogOpen} onOpenChange={setReflectionDialogOpen} goal={selectedGoal} />
      <AccountabilityDialog
  open={showAccountabilityDialog}
  onOpenChange={setShowAccountabilityDialog}
  goal={selectedGoal}
  onComplete={() => {
    // Goals will refresh via useGoals hook
    toast.info('Accountability recorded. Keep building your Ikioi!');
  }}
/>
    </div>
  );
}


