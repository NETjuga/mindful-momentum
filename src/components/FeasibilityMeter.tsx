import { FeasibilityResult, getFeasibilityColor } from '@/lib/feasibility';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface FeasibilityMeterProps {
  result: FeasibilityResult;
  className?: string;
}

export function FeasibilityMeter({ result, className }: FeasibilityMeterProps) {
  const getIcon = () => {
    switch (result.level) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'moderate':
        return <Info className="w-5 h-5 text-accent" />;
      case 'challenging':
      case 'difficult':
        return <AlertTriangle className="w-5 h-5 text-momentum-medium" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Score bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Feasibility Score</span>
          <span className={cn('font-serif font-semibold', getFeasibilityColor(result.level))}>
            {result.score}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 effort-gradient"
            style={{ width: `${result.score}%` }}
          />
        </div>
      </div>

      {/* Message */}
      <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
        {getIcon()}
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium capitalize">{result.level}</p>
          <p className="text-sm text-muted-foreground">{result.message}</p>
        </div>
      </div>

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Suggestions</p>
          <ul className="space-y-1">
            {result.suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
