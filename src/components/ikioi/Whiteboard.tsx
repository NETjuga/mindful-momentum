// src/components/ikioi/Whiteboard.tsx
import { ReactNode, useState, useEffect } from 'react';
import { Move, Plus, LogOut, ZoomIn, ZoomOut, Grid, Target } from 'lucide-react';

interface WhiteboardProps {
  children: ReactNode;
  zoom: number;
  isDraggingBoard: boolean;
  onDragChange: (isDragging: boolean) => void;
  isFullscreen?: boolean;
  onAddColumn?: () => void;
  onExitFocus?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  userName?: string;
}

export default function Whiteboard({ 
  children, 
  zoom, 
  isDraggingBoard, 
  onDragChange,
  isFullscreen = false,
  onAddColumn,
  onExitFocus,
  onZoomIn,
  onZoomOut,
  onResetZoom,
   userName
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
      
     {/* Ikioi Header in Focus Mode - Top Left */}
{isFullscreen && (
  <div className="absolute top-4 left-4 z-50">
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Welcome to focus mode</span>
        <span className="text-primary font-medium">
          {userName || 'User'}
        </span>
        <span className="text-muted-foreground">|</span>
        <span className="font-serif font-bold">Ikioi</span>
      </div>
    </div>
  </div>
)}
      
      {/* Focus Mode Toolbar */}
      {isFullscreen && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border shadow-xl p-3 flex flex-col gap-3">
            {/* Pan Mode Toggle */}
            <div className="text-center">
              <button
                onClick={() => onDragChange(!isDraggingBoard)}
                className={`p-3 rounded-lg transition-all ${isDraggingBoard ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={isDraggingBoard ? 'Exit pan mode' : 'Enter pan mode'}
              >
                <Move className="h-5 w-5" />
              </button>
              <div className="text-xs mt-1 font-medium">
                {isDraggingBoard ? 'Panning' : 'Pan'}
              </div>
            </div>

            {/* Add Column */}
            <div className="text-center">
              <button
                onClick={onAddColumn}
                className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all"
                title="Add goal column"
              >
                <Plus className="h-5 w-5" />
              </button>
              <div className="text-xs mt-1 font-medium">Add Goal</div>
            </div>

            {/* Zoom Controls (Optional - if you want them in toolbar) */}
            {onZoomIn && onZoomOut && onResetZoom && (
              <div className="border-t pt-3">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={onZoomIn}
                    disabled={zoom >= 2}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4 mx-auto" />
                  </button>
                  <div className="text-center text-xs font-medium">
                    {Math.round(zoom * 100)}%
                  </div>
                  <button
                    onClick={onZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={onResetZoom}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Reset zoom"
                  >
                    <Grid className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            )}

            {/* Exit Focus Mode */}
            <div className="border-t pt-3">
              <div className="text-center">
                <button
                  onClick={onExitFocus}
                  className="p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600 transition-all"
                  title="Exit focus mode"
                >
                  <LogOut className="h-5 w-5" />
                </button>
                <div className="text-xs mt-1 font-medium">Exit</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

      {/* Panning Indicator (only show when not in focus mode) */}
      {isDraggingBoard && !isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full flex items-center gap-2">
          <Move className="h-3 w-3 animate-pulse" />
          Click and drag to pan
        </div>
      )}

      {/* Zoom Level Indicator (top right - hide in focus mode if header is in the way) */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 text-sm rounded-full flex items-center gap-2 backdrop-blur-sm border shadow-sm">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span className="font-medium">{Math.round(zoom * 100)}%</span>
        </div>
      )}

      {/* Zoom Level Indicator for Focus Mode (moved to bottom right) */}
      {isFullscreen && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 text-sm rounded-full flex items-center gap-2 backdrop-blur-sm border shadow-sm">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span className="font-medium">{Math.round(zoom * 100)}%</span>
        </div>
      )}
    </div>
  );
}