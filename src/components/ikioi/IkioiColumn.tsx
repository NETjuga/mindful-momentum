// src/components/ikioi/IkioiColumn.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Plus, X } from 'lucide-react';

// Define interfaces locally instead of importing
interface Sequence {
  id: string;
  description: string;
  completed: boolean;
  dailySteps: DailyStep[];
}

interface DailyStep {
  id: string;
  description: string;
  completed: boolean;
}

export interface IkioiColumnData {
  id: string;
  position: { x: number; y: number };
  category: string;
  goal: string;
  sequences: Sequence[];
}

export interface IkioiColumnProps {
  column: IkioiColumnData;
  categories: string[];
  onUpdate: (columnId: string, updates: Partial<IkioiColumnData>) => void;
  onPositionChange: (columnId: string, position: { x: number; y: number }) => void;
  onDelete: (columnId: string) => void;
  onAddSequence: (columnId: string) => void;
  onAddDailyStep: (columnId: string, sequenceId: string) => void;
  zoom: number;
  isDraggingBoard: boolean;
}

export default function IkioiColumn({
  column,
  categories,
  onUpdate,
  onPositionChange,
  onDelete,
  onAddSequence,
  onAddDailyStep,
  zoom,
  isDraggingBoard,
}: IkioiColumnProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // VERY FIRST simple dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggingBoard) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - column.position.x,
      y: e.clientY - column.position.y,
    });
    
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isDraggingBoard) return;
    
    onPositionChange(column.id, {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
  }, [isDragging, dragOffset, isDraggingBoard]);

  // Delete functions
  const deleteSequence = (sequenceId: string) => {
    onUpdate(column.id, {
      sequences: column.sequences.filter(seq => seq.id !== sequenceId)
    });
  };

  const deleteDailyStep = (sequenceId: string, stepId: string) => {
    onUpdate(column.id, {
      sequences: column.sequences.map(seq => {
        if (seq.id === sequenceId) {
          return {
            ...seq,
            dailySteps: seq.dailySteps.filter(step => step.id !== stepId)
          };
        }
        return seq;
      })
    });
  };

  return (
    <div
      className={`absolute w-80 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-lg ${
        isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'
      } ${isDraggingBoard ? 'pointer-events-none' : ''}`}
      style={{
        left: `${column.position.x}px`,
        top: `${column.position.y}px`,
        transform: `scale(${1 / zoom})`,
        transformOrigin: 'top left',
        userSelect: 'none', // Prevent text selection
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Column Header with Drag Handle and Delete */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent rounded-t-xl">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Drag to move
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(column.id)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Column Content */}
      <div className="p-4 space-y-4">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            What do you want?
          </label>
          <select 
            value={column.category}
            onChange={(e) => onUpdate(column.id, { category: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Goal Input */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Goal
          </label>
          <input
            type="text"
            value={column.goal}
            onChange={(e) => onUpdate(column.id, { goal: e.target.value })}
            placeholder="e.g., Pilot license"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
        </div>

        {/* Sequences Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-muted-foreground">
              Sequences ({column.sequences.length})
            </label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => onAddSequence(column.id)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {column.sequences.map((sequence) => (
              <div key={sequence.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={sequence.description}
                    onChange={(e) => {
                      onUpdate(column.id, {
                        sequences: column.sequences.map(seq =>
                          seq.id === sequence.id 
                            ? { ...seq, description: e.target.value }
                            : seq
                        )
                      });
                    }}
                    placeholder="Sequence description"
                    className="flex-1 bg-transparent focus:outline-none text-sm"
                  />
                  <button 
                    onClick={() => deleteSequence(sequence.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                {/* Daily Steps for this Sequence */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Daily steps:</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => onAddDailyStep(column.id, sequence.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add step
                    </Button>
                  </div>
                  {sequence.dailySteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => {
                          onUpdate(column.id, {
                            sequences: column.sequences.map(seq => {
                              if (seq.id === sequence.id) {
                                return {
                                  ...seq,
                                  dailySteps: seq.dailySteps.map(ds =>
                                    ds.id === step.id 
                                      ? { ...ds, description: e.target.value }
                                      : ds
                                  )
                                };
                              }
                              return seq;
                            })
                          });
                        }}
                        placeholder="Daily action"
                        className="flex-1 bg-transparent focus:outline-none text-xs"
                      />
                      <button 
                        onClick={() => deleteDailyStep(sequence.id, step.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {column.sequences.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                Click "Add" to create your first sequence
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}