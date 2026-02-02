// src/components/ikioi/CustomCursor.tsx
import { Move, Hand, GripVertical } from 'lucide-react';

interface CustomCursorProps {
  type: 'default' | 'drag' | 'pan' | 'grab' | 'grabbing';
  position: { x: number; y: number };
  visible: boolean;
}

export default function CustomCursor({ type, position, visible }: CustomCursorProps) {
  if (!visible) return null;

  const cursorStyles = {
    default: {
      icon: null,
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/40',
      iconColor: 'text-emerald-500/60',
      size: 'w-8 h-8',
    },
    drag: {
      icon: <Move className="h-5 w-5" />,
      bg: 'bg-emerald-500/30',
      border: 'border-emerald-500',
      iconColor: 'text-emerald-500',
      size: 'w-10 h-10',
    },
    pan: {
      icon: <Hand className="h-5 w-5" />,
      bg: 'bg-emerald-600/30',
      border: 'border-emerald-600',
      iconColor: 'text-emerald-600',
      size: 'w-10 h-10',
    },
    grab: {
      icon: <GripVertical className="h-5 w-5" />,
      bg: 'bg-emerald-500/30',
      border: 'border-emerald-500',
      iconColor: 'text-emerald-500',
      size: 'w-10 h-10',
    },
    grabbing: {
      icon: <GripVertical className="h-5 w-5" />,
      bg: 'bg-emerald-600/40',
      border: 'border-emerald-600',
      iconColor: 'text-emerald-600',
      size: 'w-10 h-10',
    },
  };

  const style = cursorStyles[type];

  return (
    <div 
      className="fixed pointer-events-none z-[9999] transition-all duration-150 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className={`${style.size} rounded-full ${style.bg} ${style.border} border-2 flex items-center justify-center backdrop-blur-sm shadow-lg`}>
        <div className={style.iconColor}>
          {style.icon}
        </div>
      </div>
      {type !== 'default' && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full whitespace-nowrap shadow-lg">
          {type === 'pan' && 'Pan'}
          {type === 'drag' && 'Drag'}
          {type === 'grab' && 'Grab'}
          {type === 'grabbing' && 'Dragging'}
        </div>
      )}
    </div>
  );
}