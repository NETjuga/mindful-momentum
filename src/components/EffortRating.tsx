import { cn } from '@/lib/utils';

interface EffortRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const effortLabels = [
  { level: 1, label: 'Minimal', description: 'Just showed up' },
  { level: 2, label: 'Light', description: 'Easy effort' },
  { level: 3, label: 'Moderate', description: 'Solid work' },
  { level: 4, label: 'Strong', description: 'Pushed myself' },
  { level: 5, label: 'Maximum', description: 'Gave it all' },
];

export function EffortRating({ value, onChange, disabled }: EffortRatingProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-2">
        {effortLabels.map((item) => (
          <button
            key={item.level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.level)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200',
              'border-2',
              value === item.level
                ? 'border-primary bg-primary/10 scale-105'
                : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-serif font-semibold text-sm transition-colors',
                value === item.level ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {item.level}
            </div>
            <span className={cn(
              'text-xs font-medium',
              value === item.level ? 'text-primary' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
      
      {value > 0 && (
        <p className="text-center text-sm text-muted-foreground fade-in">
          {effortLabels.find(e => e.level === value)?.description}
        </p>
      )}
    </div>
  );
}
