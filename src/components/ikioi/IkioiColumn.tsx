// src/components/ikioi/IkioiColumn.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Plus, X } from 'lucide-react';

// Define interfaces locally instead of importing
interface Sequence {
  id: string;
  description: string;
  completed: boolean;
  dueMonth: string;
  dailySteps: DailyStep[];
}

interface DailyStep {
  id: string;
  description: string;
  timeMinutes: number;
  completed: boolean;
}

export interface IkioiColumnData {
  id: string;
  position: { x: number; y: number };
  category: string;
  goal: string;
  targetYear: number; // Add this
  color: string; // Add this (hex code)
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

const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);


const pastelColors = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#D0BAFF', '#FFB3FF', '#B3FFF3', '#FFD8B1', '#C1FFB1'
];



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
    userSelect: 'none',
  }}
  onMouseDown={handleMouseDown}
>
 {/* Column Header with Color, Drag Handle and Delete */}
<div 
  className="flex items-center justify-between p-4 border-b rounded-t-xl"
  style={{ 
    backgroundColor: column.color ? `${column.color}40` : 'transparent',
    backgroundImage: column.color 
      ? `linear-gradient(to right, ${column.color}20, transparent)`
      : 'linear-gradient(to right, from-primary/5, to-transparent)'
  }}
>
  <div className="flex items-center gap-3">
    <GripVertical className="h-4 w-4 text-muted-foreground" />
    
    {/* Color Selector - Better aligned */}
    <div className="relative flex items-center">
      <button
        onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
        className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 shadow-sm hover:scale-110 transition-transform"
        style={{ backgroundColor: column.color || '#BAE1FF' }}
        title="Change color"
      />
      
      {isColorPickerOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsColorPickerOpen(false)}
          />
          
          {/* Color Picker */}
          <div className="absolute left-0 top-7 bg-white dark:bg-gray-800 border rounded-xl shadow-xl p-3 z-50 min-w-[180px]">
            <div className="text-xs font-medium text-muted-foreground mb-2">Choose a color</div>
            <div className="grid grid-cols-5 gap-2">
              {[
                '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
                '#D0BAFF', '#FFB3FF', '#B3FFF3', '#FFD8B1', '#C1FFB1'
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onUpdate(column.id, { color });
                    setIsColorPickerOpen(false);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    column.color === color 
                      ? 'border-gray-700 scale-110' 
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
    
    <span className="text-xs font-medium text-muted-foreground mt-0.5">
      Drag to move
    </span>
  </div>
  
  <div className="flex items-center gap-2">
    {column.targetYear && (
      <span className="text-xs font-medium px-2 py-1 bg-white/80 dark:bg-gray-800/80 rounded">
        🎯 {column.targetYear}
      </span>
    )}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onDelete(column.id)}
      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</div>

{/* Column Content */}
<div className="p-4 space-y-4">
  {/* Category Selection - AT THE TOP */}
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

  {/* Goal Input with Year BELOW IT */}
  <div>
    <label className="block text-sm font-medium text-muted-foreground mb-2">
      Goal
    </label>
    <input
      type="text"
      value={column.goal}
      onChange={(e) => onUpdate(column.id, { goal: e.target.value })}
      placeholder="e.g., Pilot license"
      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background mb-2"
    />
    
    {/* Year Dropdown - Smaller and secondary */}
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Target year:</span>
      <select 
        value={column.targetYear || ''}
        onChange={(e) => onUpdate(column.id, { targetYear: parseInt(e.target.value) || 0 })}
        className="text-xs px-2 py-1 border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary flex-1"
      >
        <option value="">Select year</option>
        {Array.from({ length: 10 }, (_, i) => {
          const year = new Date().getFullYear() + i;
          return (
            <option key={year} value={year}>
              {year}
            </option>
          );
        })}
      </select>
    </div>
    
    {/* Year info text */}
    {column.targetYear && (
      <div className="text-xs text-muted-foreground mt-1">
        {column.targetYear > new Date().getFullYear() 
          ? `Complete in ${column.targetYear - new Date().getFullYear()} years` 
          : 'Complete this year'}
      </div>
    )}
  </div>

  {/* Sequences Section - UPDATED */}
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
            <div className="flex-1">
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
                className="w-full bg-transparent focus:outline-none text-sm"
              />
              {/* Due Month Input - Smaller */}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Due:</span>
                <input
                  type="month"
                  value={sequence.dueMonth || ''}
                  onChange={(e) => {
                    onUpdate(column.id, {
                      sequences: column.sequences.map(seq =>
                        seq.id === sequence.id 
                          ? { ...seq, dueMonth: e.target.value }
                          : seq
                      )
                    });
                  }}
                  className="text-xs border rounded px-2 py-1 bg-background flex-1"
                  min={`${new Date().getFullYear()}-01`}
                  max={column.targetYear ? `${column.targetYear}-12` : `${new Date().getFullYear() + 5}-12`}
                />
              </div>
            </div>
            <button 
              onClick={() => deleteSequence(sequence.id)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          
          {/* Daily Steps for this Sequence - UPDATED */}
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
                <div className="flex-1 flex items-center gap-2">
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
                  {/* Time Input - Smaller */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={step.timeMinutes || ''}
                      onChange={(e) => {
                        onUpdate(column.id, {
                          sequences: column.sequences.map(seq => {
                            if (seq.id === sequence.id) {
                              return {
                                ...seq,
                                dailySteps: seq.dailySteps.map(ds =>
                                  ds.id === step.id 
                                    ? { ...ds, timeMinutes: parseInt(e.target.value) || 0 }
                                    : ds
                                )
                              };
                            }
                            return seq;
                          })
                        });
                      }}
                      className="w-14 text-xs border rounded px-1.5 py-1 bg-background text-right"
                      placeholder="min"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
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