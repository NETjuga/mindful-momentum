// src/pages/ikioi.tsx
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';import { 
  Plus, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Trash2, 
  GripVertical,
  Minimize, 
  Maximize,
  ArrowLeft, 
  Target,
  BarChart,
  Calendar,
  ChevronDown
} from 'lucide-react';
import Whiteboard from '@/components/ikioi/Whiteboard';
import IkioiColumn from '@/components/ikioi/IkioiColumn';
import type { IkioiColumnData } from '@/components/ikioi/IkioiColumn';



import { useNavigate } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function IkioiPage() {
  const [columns, setColumns] = useState<IkioiColumnData[]>([
    {
      id: "1",
      position: { x: 100, y: 100 }, // This should be an object with x and y, not a number
      category: "",
      goal: "",
      sequences: []
    }
  ]);
  const [zoom, setZoom] = useState(1);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  
  const categories = [
    "Career", "Academia", "Business", "Sport", 
    "Health", "Creative", "Personal", "Financial",
    "Relationship", "Spiritual", "Other"
  ];

  // Calculate statistics
  const goalsCount = columns.length;
  const sequencesCount = columns.reduce((total, column) => total + column.sequences.length, 0);
  const dailyStepsCount = columns.reduce((total, column) => 
    total + column.sequences.reduce((seqTotal, seq) => seqTotal + seq.dailySteps.length, 0), 0
  );

  const addColumn = () => {
    if (columns.length >= 5) return;
    
    const newColumn: IkioiColumnData = {
      id: Date.now().toString(),
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      category: "",
      goal: "",
      sequences: []
    };
    
    setColumns([...columns, newColumn]);
  };

  const updateColumn = (columnId: string, updates: Partial<IkioiColumnData>) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    ));
  };

  const updateColumnPosition = (columnId: string, position: { x: number; y: number }) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, position } : col
    ));
  };

  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter(col => col.id !== columnId));
  };

  const addSequence = (columnId: string) => {
    setColumns(columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          sequences: [
            ...col.sequences,
            {
              id: Date.now().toString(),
              description: "",
              completed: false,
              dailySteps: []
            }
          ]
        };
      }
      return col;
    }));
  };

  const addDailyStep = (columnId: string, sequenceId: string) => {
    setColumns(columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          sequences: col.sequences.map(seq => {
            if (seq.id === sequenceId) {
              return {
                ...seq,
                dailySteps: [
                  ...seq.dailySteps,
                  {
                    id: Date.now().toString(),
                    description: "",
                    completed: false
                  }
                ]
              };
            }
            return seq;
          })
        };
      }
      return col;
    }));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  return (
    <div className="min-h-screen bg-background">
  <Header />
  
  <main className="container mx-auto px-4 py-8">
    {/* Page Header with Navigation */}
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        {isFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Focus
          </Button>
        )}
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Your Ikioi</h1>
          <p className="text-muted-foreground mt-2">
            Arrange your goals on the whiteboard. Drag to move, zoom to adjust view.
          </p>
        </div>
      </div>
      
      {/* Navigation Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <BarChart className="h-4 w-4" />
            <span>Your Ikioi</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            className="gap-2"
            onClick={() => navigate('/')}
          >
            <Target className="h-4 w-4" />
            <span>Goal Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" disabled>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <div className="text-2xl font-bold text-primary">{goalsCount}</div>
            <div className="text-sm text-muted-foreground">Goals to complete</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <div className="text-2xl font-bold text-primary">{sequencesCount}</div>
            <div className="text-sm text-muted-foreground">Sequences</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <div className="text-2xl font-bold text-primary">{dailyStepsCount}</div>
            <div className="text-sm text-muted-foreground">Daily steps</div>
          </div>
        </div>

        // In src/pages/ikioi.tsx, REMINDER: UPDATE THIS BAR UI | fix the grid snapping thingy:


{/* Controls Bar */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border backdrop-blur-sm">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium text-foreground">Whiteboard Controls:</span>
    <Button 
      variant={isDraggingBoard ? "default" : "outline"}
      size="sm"
      onClick={() => setIsDraggingBoard(!isDraggingBoard)}
      className="gap-2 transition-all"
    >
      <Move className="h-4 w-4" />
      {isDraggingBoard ? 'Panning Mode' : 'Pan Board'}
    </Button>
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setIsFullscreen(!isFullscreen)}
      className="gap-2 transition-all"
    >
      {isFullscreen ? (
        <>
          <Minimize className="h-4 w-4" />
          Exit Focus
        </>
      ) : (
        <>
          <Maximize className="h-4 w-4" />
          Focus Mode
        </>
      )}
    </Button>
  </div>
  
  <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-1.5 rounded-lg">
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleZoomOut}
      disabled={zoom <= 0.5}
      className="h-8 w-8 p-0"
    >
      <ZoomOut className="h-4 w-4" />
    </Button>
    <span className="text-sm font-medium min-w-[60px] text-center text-foreground">
      {Math.round(zoom * 100)}%
    </span>
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleZoomIn}
      disabled={zoom >= 2}
      className="h-8 w-8 p-0"
    >
      <ZoomIn className="h-4 w-4" />
    </Button>
    <Button 
      variant="outline" 
      size="sm"
      onClick={resetZoom}
      className="h-8 px-3"
    >
      <Grid className="h-4 w-4" />
    </Button>
  </div>

  <Button 
    onClick={addColumn}
    disabled={columns.length >= 5}
    className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
  >
    <Plus className="h-4 w-4" />
    Add Goal Column ({columns.length}/5)
  </Button>
</div>

{/* Interactive Whiteboard */}
{isFullscreen && (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" 
       onClick={() => setIsFullscreen(false)} />
)}

<div className={`${isFullscreen ? "fixed inset-4 z-50" : "relative"}`}>
  <Whiteboard 
    zoom={zoom}
    isDraggingBoard={isDraggingBoard}
    onDragChange={setIsDraggingBoard}
    isFullscreen={isFullscreen} // Add this prop
  >
    {columns.map((column) => (
      <IkioiColumn
        key={column.id}
        column={column}
        categories={categories}
        onUpdate={updateColumn}
        onPositionChange={updateColumnPosition}
        onDelete={deleteColumn}
        onAddSequence={addSequence}
        onAddDailyStep={addDailyStep}
        zoom={zoom}
        isDraggingBoard={isDraggingBoard}
      />
    ))}
  </Whiteboard>
</div>

        {/* Help Text */}
        <div className="mt-6 text-sm text-muted-foreground p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-medium mb-1">How to use:</p>
              <ul className="space-y-1 text-xs">
                <li>• Drag columns to arrange them</li>
                <li>• Click "Pan Board" to move the entire view</li>
                <li>• Use zoom controls to adjust view</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Goal Structure:</p>
              <ul className="space-y-1 text-xs">
                <li>• Category → Goal → Sequences → Daily Steps</li>
                <li>• Max 5 goal columns for focus</li>
                <li>• Each sequence can have multiple daily steps</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Start with 1-2 major goals</li>
                <li>• Break big goals into achievable sequences</li>
                <li>• Daily steps should be concrete actions</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}