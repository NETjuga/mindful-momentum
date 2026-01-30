import { getMomentumDisplay } from '@/lib/momentum';
import { cn } from '@/lib/utils';

interface MomentumRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function MomentumRing({ score, size = 'md', showLabel = true, className }: MomentumRingProps) {
  const display = getMomentumDisplay(score);
  
  const sizes = {
    sm: { ring: 60, stroke: 4, text: 'text-sm' },
    md: { ring: 100, stroke: 6, text: 'text-lg' },
    lg: { ring: 140, stroke: 8, text: 'text-2xl' },
  };
  
  const config = sizes[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        <svg className="transform -rotate-90" width={config.ring} height={config.ring}>
          {/* Background circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.stroke}
          />
          {/* Progress circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            className="momentum-bar"
            stroke="url(#momentumGradient)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
          <defs>
            <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--momentum-low))" />
              <stop offset="50%" stopColor="hsl(var(--momentum-medium))" />
              <stop offset="100%" stopColor="hsl(var(--momentum-high))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-serif font-semibold', config.text)}>
            {Math.round(score)}
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground">{display.emoji}</span>
          )}
        </div>
      </div>
      
      {showLabel && (
        <div className="text-center">
          <p className="text-sm font-medium">{display.label}</p>
          <p className="text-xs text-muted-foreground">{display.description}</p>
        </div>
      )}
    </div>
  );
}
