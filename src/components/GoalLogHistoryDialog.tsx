// src/components/GoalLogHistoryDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Calendar, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  BarChart,
  Brain,
  Heart
} from 'lucide-react';
import { Goal, GoalLog } from '@/types/goals';

interface GoalLogHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  logs: GoalLog[];
}

export function GoalLogHistoryDialog({ 
  open, 
  onOpenChange, 
  goal,
  logs 
}: GoalLogHistoryDialogProps) {
  // Helper functions defined locally
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

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'minimal': return '😌';
      case 'light': return '😊';
      case 'moderate': return '😐';
      case 'strong': return '😅';
      case 'maximum': return '🔥';
      default: return '📝';
    }
  };

  const getFeelIcon = (feelOption: string) => {
    if (!feelOption) return '📝';
    const lowerFeel = feelOption.toLowerCase();
    if (lowerFeel.includes('neutral')) return '😐';
    if (lowerFeel.includes('okay')) return '🙂';
    if (lowerFeel.includes('good')) return '😊';
    if (lowerFeel.includes('energizing')) return '✨';
    if (lowerFeel.includes('proud')) return '🏆';
    return '📝';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  // Calculate statistics
  const calculateStats = () => {
    if (logs.length === 0) return null;
    
    const totalMinutes = logs.reduce((sum, log) => sum + (log.time_spent_minutes || 0), 0);
    
    // Extract difficulty from difficulty_feeling field
    const averageDifficulty = logs.reduce((sum, log) => {
      const difficultyValue = {
        'minimal': 1,
        'light': 2,
        'moderate': 3,
        'strong': 4,
        'maximum': 5
      }[log.difficulty_feeling?.toLowerCase().split(' ')[0] || 'moderate'] || 3;
      return sum + difficultyValue;
    }, 0) / logs.length;
    
    // Group by week
    const logsByWeek: { [key: string]: GoalLog[] } = {};
    logs.forEach(log => {
      const date = new Date(log.created_at);
      const weekNumber = Math.floor(date.getTime() / (1000 * 60 * 60 * 24 * 7));
      if (!logsByWeek[weekNumber]) {
        logsByWeek[weekNumber] = [];
      }
      logsByWeek[weekNumber].push(log);
    });
    
    const averageLogsPerWeek = logs.length / Math.max(1, Object.keys(logsByWeek).length);

    return {
      totalLogs: logs.length,
      totalMinutes,
      averageDifficulty: averageDifficulty.toFixed(1),
      averageLogsPerWeek: averageLogsPerWeek.toFixed(1)
    };
  };

  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const stats = calculateStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle className="text-xl">{goal.name} - Effort History</DialogTitle>
              <DialogDescription>
                Track your journey and reflect on your progress
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-6 py-2">
          {/* Summary Stats */}
          {stats && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-5 border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalLogs}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <BarChart className="h-3 w-3" />
                    Total Logs
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalMinutes}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Total Minutes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.averageDifficulty}/5</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Brain className="h-3 w-3" />
                    Avg. Difficulty
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.averageLogsPerWeek}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Logs/Week
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Effort Journey
              </h3>
              <span className="text-sm text-muted-foreground">
                {sortedLogs.length} entr{sortedLogs.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
            
            {sortedLogs.length === 0 ? (
              <div className="text-center py-12 border rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No effort logs yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start logging your efforts to build your history
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedLogs.map((log, index) => {
                  const { date, time } = formatDateTime(log.created_at);
                  const isLast = index === sortedLogs.length - 1;
                  // Use the new difficulty field if available, otherwise fallback
                  const difficulty = log.difficulty || log.difficulty_feeling?.toLowerCase().split(' ')[0] || 'moderate';
                  // Use the new feel_option field if available, otherwise fallback to old field
                  const feelOption = log.feel_option || log.difficulty_feeling || 'Manageable';
                  
                  return (
                    <div 
                      key={log.id} 
                      className="border rounded-xl p-5 hover:shadow-sm transition-shadow bg-white dark:bg-gray-900"
                    >
                      {/* Log Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl">{getDifficultyIcon(difficulty)}</span>
                            <Badge 
                              variant="outline" 
                              className={`mt-2 text-xs font-semibold ${getDifficultyColor(difficulty)}`}
                            >
                              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </Badge>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {time}
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Effort:</span>{' '}
                              <span className="text-muted-foreground">
                                {goal.effort_per_day_minutes} minutes ({log.effort_rating}/5 rating)
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                          <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div>
                            <div className="text-sm font-medium">How it felt</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <span className="text-lg mr-1">{getFeelIcon(feelOption)}</span>
                              {feelOption}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Optional Message */}
                      {(log.message || log.notes) && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Your Reflection:</span>
                            </div>
                            <div className="pl-6">
                              <p className="text-sm leading-relaxed p-3 bg-muted/30 rounded-lg">
                                "{log.message || log.notes}"
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Timeline indicator (except for last item) */}
                      {!isLast && (
                        <div className="flex justify-center mt-4">
                          <div className="h-4 w-px bg-gradient-to-b from-blue-300 to-transparent"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t">
          <div className="flex justify-end">
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline"
            >
              Close History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}