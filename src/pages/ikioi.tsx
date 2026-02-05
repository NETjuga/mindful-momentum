import { useEffect, useState } from 'react'; // Combined imports
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { 
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
  ChevronDown,
  Download,
  CheckCircle,
  XCircle
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
import { ikioiService } from '@/integrations/supabase/ikioiService';
import { IkioiExporter, type ExportOptions, type ExportProgress } from '@/lib/ikioiExporter';
import ExportModal from '@/components/ikioi/ExportModal';

export default function IkioiPage() {
  const [columns, setColumns] = useState<IkioiColumnData[]>([]); 
  const [zoom, setZoom] = useState(1);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start as false
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    current: 0,
    total: 0,
    message: ''
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  const categories = [
    "Career", "Academia", "Business", "Sport", 
    "Health", "Creative", "Personal", "Financial",
    "Relationship", "Spiritual", "Other"
  ];

  // Load columns from database on mount
  useEffect(() => {
    console.log('IkioiPage mounted, user:', user?.id);
    if (user) {
      loadColumnsFromDB();
    } else {
      console.log('No user, skipping load');
      setIsLoading(false);
    }
  }, [user]);

  const loadColumnsFromDB = async () => {
  console.log('=== START loadColumnsFromDB ===');
  console.log('User ID:', user?.id);
  
  if (!user) {
    console.log('No user, exiting');
    setIsLoading(false);
    return;
  }
  
  try {
    setIsLoading(true);
    console.log('Calling ikioiService.loadColumns...');
    
    // 1. Load columns
    const dbColumns = await ikioiService.loadColumns(user.id);
    console.log('DB Columns:', dbColumns);
    console.log('Number of columns:', dbColumns.length);
    
    if (dbColumns.length === 0) {
      console.log('No columns found in database, setting empty array');
      setColumns([]);
      setIsLoading(false);
      return;
    }
    
    // 2. For each column, load its sequences
    const columnsWithSequences = await Promise.all(
      dbColumns.map(async (col) => {
        console.log(`Loading sequences for column: ${col.id} (${col.title})`);
        
        // Load sequences for this column
        const sequences = await ikioiService.loadSequences(col.id);
        console.log(`Found ${sequences.length} sequences for column ${col.id}`);
        
        // 3. For each sequence, load its daily steps
        const sequencesWithSteps = await Promise.all(
          sequences.map(async (seq) => {
            console.log(`Loading daily steps for sequence: ${seq.id}`);
            
            const dailySteps = await ikioiService.loadDailySteps(seq.id);
            console.log(`Found ${dailySteps.length} daily steps for sequence ${seq.id}`);
            
            return {
              id: seq.id,
              description: seq.title || "",
              dueMonth: seq.due_month || "",
              completed: seq.completed || false,
              dailySteps: dailySteps.map(step => ({
                id: step.id,
                description: step.description || "",
                timeMinutes: step.time_minutes || 30,
                completed: step.completed || false
              }))
            };
          })
        );
        
        return {
          id: col.id,
          position: { 
            x: col.position_x || 100, 
            y: col.position_y || 100 
          },
          category: col.category || "",
          goal: col.title || "",
          targetYear: col.target_year || new Date().getFullYear() + 1,
          color: col.color || '#BAE1FF',
          sequences: sequencesWithSteps // ← THIS NOW HAS DATA!
        };
      })
    );
    
    console.log('Final columns with sequences:', columnsWithSequences);
    setColumns(columnsWithSequences);
    
  } catch (error) {
    console.error('❌ ERROR in loadColumnsFromDB:', error);
    setColumns([]);
  } finally {
    console.log('=== END loadColumnsFromDB ===');
    setIsLoading(false);
  }
};

  // Auto-save columns when they change (debounced)
  useEffect(() => {
    if (!user || isLoading) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        for (const column of columns) {
          await ikioiService.saveColumn({
            id: column.id,
            user_id: user.id,
            title: column.goal,
            category: column.category,
            target_year: column.targetYear,
            color: column.color,
            position_x: column.position.x,
            position_y: column.position.y
          });
        }
      } catch (error) {
        console.error('Error auto-saving columns:', error);
      }
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timeoutId);
  }, [columns, user, isLoading]);


  // Calculate statistics
  const goalsCount = columns.length;
  const sequencesCount = columns.reduce((total, column) => total + column.sequences.length, 0);
  const dailyStepsCount = columns.reduce((total, column) => 
    total + column.sequences.reduce((seqTotal, seq) => seqTotal + seq.dailySteps.length, 0), 0
  );
  
  const totalDailyTime = columns.reduce((total, column) => 
    total + column.sequences.reduce((seqTotal, seq) => 
      seqTotal + seq.dailySteps.reduce((stepTotal, step) => 
        stepTotal + (step.timeMinutes || 0), 0), 0), 0);



  const addColumn = async () => {
  if (columns.length >= 5 || !user) return;
  
  // Create column data WITHOUT an id
  const columnData = {
    user_id: user.id,
    title: 'New Goal',
    category: '',
    target_year: new Date().getFullYear() + 1,
    color: '#BAE1FF',
    position_x: Math.floor(Math.random() * 500), // Use Math.floor() for INTEGER
    position_y: Math.floor(Math.random() * 300)  // Use Math.floor() for INTEGER
  };
  
  // Save to database
  const savedColumn = await ikioiService.saveColumn(columnData);
  
  if (savedColumn) {
    // Create local column with the REAL database ID
    const newColumn: IkioiColumnData = {
      id: savedColumn.id,
      position: { 
        x: savedColumn.position_x || 100, 
        y: savedColumn.position_y || 100 
      },
      category: savedColumn.category || '',
      goal: savedColumn.title || '',
      targetYear: savedColumn.target_year || new Date().getFullYear() + 1,
      color: savedColumn.color || '#BAE1FF',
      sequences: []
    };
    
    setColumns([...columns, newColumn]);
  }
};

  const updateColumn = (columnId: string, updates: Partial<IkioiColumnData>) => {
    setColumns(columns.map(col => {
      if (col.id === columnId) {
        const updated = { ...col, ...updates };
        
        // Save to database
        if (user) {
          ikioiService.saveColumn({
            id: updated.id,
            user_id: user.id,
            title: updated.goal,
            category: updated.category,
            target_year: updated.targetYear,
            color: updated.color,
            position_x: updated.position.x,
            position_y: updated.position.y
          });
        }
        
        return updated;
      }
      return col;
    }));
  };

  const updateColumnPosition = (columnId: string, position: { x: number; y: number }) => {
  setColumns(columns.map(col => {
    if (col.id === columnId) {
      const updated = { ...col, position };
      
      // Save to database with INTEGER positions
      if (user) {
        ikioiService.saveColumn({
          id: updated.id,
          user_id: user.id,
          title: updated.goal,
          category: updated.category,
          target_year: updated.targetYear,
          color: updated.color,
          position_x: Math.floor(position.x), // ROUND to integer
          position_y: Math.floor(position.y)  // ROUND to integer
        });
      }
      
      return updated;
    }
    return col;
  }));
};

  const deleteColumn = async (columnId: string) => {
    // Delete from database
    await ikioiService.deleteColumn(columnId);
    
    // Update local state
    setColumns(columns.filter(col => col.id !== columnId));
  };

  const addSequence = async (columnId: string) => {
  // Create temporary ID for immediate UI update
  const tempId = Date.now().toString();
  const newSequence = {
    id: tempId,
    description: "",
    dueMonth: "",
    completed: false,
    dailySteps: []
  };
  
  // Update UI immediately with temporary ID
  setColumns(prevColumns => prevColumns.map(col => {
    if (col.id === columnId) {
      return {
        ...col,
        sequences: [...col.sequences, newSequence]
      };
    }
    return col;
  }));
  
  // Save to database in background
  if (user) {
    try {
      const savedSequence = await ikioiService.saveSequence({
        column_id: columnId,
        title: "",
        due_month: "",
        position_x: 50,
        position_y: 50,
        completed: false
      });
      
      if (savedSequence) {
        // Update the local sequence with real database ID
        setColumns(prev => prev.map(c => {
          if (c.id === columnId) {
            return {
              ...c,
              sequences: c.sequences.map(seq => 
                seq.id === tempId 
                  ? { 
                      ...seq, 
                      id: savedSequence.id,
                      description: savedSequence.title || "",
                      dueMonth: savedSequence.due_month || ""
                    } 
                  : seq
              )
            };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error('Failed to save sequence:', error);
    }
  }
};

  const addDailyStep = async (columnId: string, sequenceId: string) => {
  // Create temporary ID for immediate UI update
  const tempId = Date.now().toString();
  const newStep = {
    id: tempId,
    description: "",
    timeMinutes: 30,
    completed: false
  };
  
  // Update UI immediately with temporary ID
  setColumns(prevColumns => prevColumns.map(col => {
    if (col.id === columnId) {
      return {
        ...col,
        sequences: col.sequences.map(seq => {
          if (seq.id === sequenceId) {
            return {
              ...seq,
              dailySteps: [...seq.dailySteps, newStep]
            };
          }
          return seq;
        })
      };
    }
    return col;
  }));
  
  // Save to database in background
  if (user) {
    try {
      const savedStep = await ikioiService.saveDailyStep({
        sequence_id: sequenceId,
        description: "",
        time_minutes: 30,
        completed: false
      });
      
      if (savedStep) {
        // Update the local step with real database ID
        setColumns(prev => prev.map(c => {
          if (c.id === columnId) {
            return {
              ...c,
              sequences: c.sequences.map(s => {
                if (s.id === sequenceId) {
                  return {
                    ...s,
                    dailySteps: s.dailySteps.map(step =>
                      step.id === tempId
                        ? { 
                            ...step, 
                            id: savedStep.id,
                            description: savedStep.description || "",
                            timeMinutes: savedStep.time_minutes || 30
                          }
                        : step
                    )
                  };
                }
                return s;
              })
            };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error('Failed to save daily step:', error);
    }
  }
};

  // Fetch display name
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

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  // Export function
  // In the handleExport function, add this error handling:
const handleExport = async (options: ExportOptions) => {
  if (!user || columns.length === 0) return;
  
  setIsExporting(true);
  setShowExportModal(false);
  setExportError(null);
  
  try {
    const exporter = new IkioiExporter(options);
    
    const statistics = {
      goalsCount,
      sequencesCount,
      dailyStepsCount,
      totalDailyTime
    };

    let blob: Blob;
    
    switch (options.format) {
      case 'pdf':
        blob = await exporter.export(columns, displayName, statistics, (progress) => {
          setExportProgress(progress);
        });
        break;
        
      case 'png':
        // Give it a moment for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const whiteboardElement = document.querySelector('.whiteboard-container') as HTMLElement;
        if (!whiteboardElement) {
          throw new Error('Whiteboard element not found. Please refresh and try again.');
        }
        blob = await exporter.exportAsImage(whiteboardElement, options.fileName);
        break;
        
      case 'json':
        blob = exporter.exportAsJson(columns, displayName, statistics);
        break;
        
      case 'csv':
        blob = exporter.exportAsCsv(columns);
        break;
        
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
    
    // Download the file
    IkioiExporter.downloadBlob(blob, `${options.fileName}.${options.format}`);
    
    // Show success message
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
    
  } catch (error) {
    console.error('Export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Export failed';
    
    // Special handling for html2canvas errors
    if (errorMessage.includes('html2canvas') || errorMessage.includes('canvas')) {
      setExportError('PNG export requires additional setup. Try PDF, JSON, or CSV format instead.');
    } else {
      setExportError(errorMessage);
    }
    
    setTimeout(() => setExportError(null), 5000);
  } finally {
    setIsExporting(false);
    setExportProgress({ current: 0, total: 0, message: '' });
  }
};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your Ikioi whiteboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Toast Notifications */}
        {showExportSuccess && (
          <div className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-right-5 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Whiteboard exported successfully!</p>
              <p className="text-sm">Check your downloads folder.</p>
            </div>
          </div>
        )}
        
        {exportError && (
          <div className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-right-5 bg-red-50 border-red-200 text-red-800">
            <XCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Export failed</p>
              <p className="text-sm">{exportError}</p>
            </div>
          </div>
        )}
        
        {/* Export Progress Indicator */}
        {isExporting && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 border rounded-xl shadow-lg p-4 min-w-[300px]">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <div className="flex-1">
                <p className="font-medium text-sm">Exporting whiteboard...</p>
                <p className="text-xs text-muted-foreground">{exportProgress.message}</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ 
                      width: exportProgress.total > 0 
                        ? `${(exportProgress.current / exportProgress.total) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          userName={displayName}
          columnsCount={columns.length}
          isLoading={isExporting}
        />
        
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <div className="text-2xl font-bold text-primary">{Math.round(totalDailyTime / 60)}h</div>
            <div className="text-sm text-muted-foreground">Daily time</div>
          </div>
        </div>

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

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowExportModal(true)}
              disabled={columns.length === 0 || isExporting}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button 
              onClick={addColumn}
              disabled={columns.length >= 5}
              className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              <Plus className="h-4 w-4" />
              Add Goal Column ({columns.length}/5)
            </Button>
          </div>
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
            isFullscreen={isFullscreen}
            onAddColumn={addColumn}
            onExitFocus={() => setIsFullscreen(false)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={resetZoom}
            userName={displayName}
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
                <li>• Export your whiteboard as PDF, PNG, JSON, or CSV</li>
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
                <li>• Export regularly to track progress</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

