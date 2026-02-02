// src/components/ikioi/Whiteboard.tsx
import { ReactNode, useState, useEffect } from 'react';
import { Move } from 'lucide-react';

interface WhiteboardProps {
  children: ReactNode;
  zoom: number;
  isDraggingBoard: boolean;
  onDragChange: (isDragging: boolean) => void;
  isFullscreen?: boolean;
}

export default function Whiteboard({ 
  children, 
  zoom, 
  isDraggingBoard, 
  onDragChange,
  isFullscreen = false 
}: WhiteboardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggingBoard) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    onDragChange(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isDraggingBoard) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    onDragChange(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isDraggingBoard]);

  const handleDivMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isDraggingBoard) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  return (
    <div className={`
      ${isFullscreen 
        ? "fixed inset-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 z-50 transition-all duration-300" 
        : "relative w-full h-[600px] bg-[#fafafa] dark:bg-gray-900 rounded-xl border-2 border-gray-300 dark:border-gray-600 transition-all duration-300"
      } overflow-hidden
    `}>
      {/* Clean Grid Background */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center',
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
          `,
        }}
      />
      
      {/* Whiteboard Content */}
      <div 
        className={`relative w-full h-full ${isDraggingBoard ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{
          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleDivMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>

      {/* Panning Indicator */}
      {isDraggingBoard && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full flex items-center gap-2">
          <Move className="h-3 w-3 animate-pulse" />
          Click and drag to pan
        </div>
      )}

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 text-sm rounded-full flex items-center gap-2 backdrop-blur-sm border shadow-sm">
        <div className="w-2 h-2 rounded-full bg-primary"></div>
        <span className="font-medium">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Focus Mode Indicator */}
      {isFullscreen && (
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 text-white text-sm rounded-full flex items-center gap-2 backdrop-blur-sm">
          <Move className="h-3 w-3" />
          <span>Focus Mode - Click outside to exit</span>
        </div>
      )}
    </div>
  );
}