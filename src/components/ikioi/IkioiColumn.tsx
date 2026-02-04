// src/components/ikioi/IkioiColumn.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Plus, X } from 'lucide-react';
import { ikioiService } from '@/integrations/supabase/ikioiService';
import { useAuth } from '@/contexts/AuthContext';

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
  targetYear: number;
  color: string;
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
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const { user } = useAuth();

  // Dragging logic
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
      x: Math.floor(e.clientX - dragOffset.x),
      y: Math.floor(e.clientY - dragOffset.y),
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

  // Save column to database when category changes
  const handleCategoryChange = async (category: string) => {
    onUpdate(column.id, { category });
    
    if (user) {
      await ikioiService.saveColumn({
        id: column.id,
        user_id: user.id,
        title: column.goal,
        category: category,
        target_year: column.targetYear,
        color: column.color,
        position_x: Math.floor(column.position.x),
        position_y: Math.floor(column.position.y)
      });
    }
  };

  // Save column to database when goal changes
  const handleGoalChange = async (goal: string) => {
    onUpdate(column.id, { goal });
    
    if (user) {
      await ikioiService.saveColumn({
        id: column.id,
        user_id: user.id,
        title: goal,
        category: column.category,
        target_year: column.targetYear,
        color: column.color,
        position_x: Math.floor(column.position.x),
        position_y: Math.floor(column.position.y)
      });
    }
  };

  // Save column to database when target year changes
  const handleTargetYearChange = async (targetYear: number) => {
    onUpdate(column.id, { targetYear });
    
    if (user) {
      await ikioiService.saveColumn({
        id: column.id,
        user_id: user.id,
        title: column.goal,
        category: column.category,
        target_year: targetYear,
        color: column.color,
        position_x: Math.floor(column.position.x),
        position_y: Math.floor(column.position.y)
      });
    }
  };

  // Save column to database when color changes
  const handleColorChange = async (color: string) => {
    onUpdate(column.id, { color });
    
    if (user) {
      await ikioiService.saveColumn({
        id: column.id,
        user_id: user.id,
        title: column.goal,
        category: column.category,
        target_year: column.targetYear,
        color: color,
        position_x: Math.floor(column.position.x),
        position_y: Math.floor(column.position.y)
      });
    }
    setIsColorPickerOpen(false);
  };

  // Save sequence to database when description changes
  const handleSequenceDescriptionChange = async (sequenceId: string, description: string) => {
    onUpdate(column.id, {
      sequences: column.sequences.map(seq =>
        seq.id === sequenceId 
          ? { ...seq, description }
          : seq
      )
    });
    
    if (user) {
      const sequence = column.sequences.find(seq => seq.id === sequenceId);
      if (sequence) {
        await ikioiService.saveSequence({
          id: sequenceId,
          column_id: column.id,
          title: description,
          due_month: sequence.dueMonth,
          position_x: 50,
          position_y: 50,
          completed: sequence.completed
        });
      }
    }
  };

  // Save sequence to database when due month changes
  const handleSequenceDueMonthChange = async (sequenceId: string, dueMonth: string) => {
    onUpdate(column.id, {
      sequences: column.sequences.map(seq =>
        seq.id === sequenceId 
          ? { ...seq, dueMonth }
          : seq
      )
    });
    
    if (user) {
      const sequence = column.sequences.find(seq => seq.id === sequenceId);
      if (sequence) {
        await ikioiService.saveSequence({
          id: sequenceId,
          column_id: column.id,
          title: sequence.description,
          due_month: dueMonth,
          position_x: 50,
          position_y: 50,
          completed: sequence.completed
        });
      }
    }
  };

  // Save daily step to database when description changes
  const handleDailyStepDescriptionChange = async (sequenceId: string, stepId: string, description: string) => {
    onUpdate(column.id, {
      sequences: column.sequences.map(seq => {
        if (seq.id === sequenceId) {
          return {
            ...seq,
            dailySteps: seq.dailySteps.map(step =>
              step.id === stepId 
                ? { ...step, description }
                : step
            )
          };
        }
        return seq;
      })
    });
    
    if (user) {
      const sequence = column.sequences.find(seq => seq.id === sequenceId);
      const dailyStep = sequence?.dailySteps.find(step => step.id === stepId);
      if (sequence && dailyStep) {
        await ikioiService.saveDailyStep({
          id: stepId,
          sequence_id: sequenceId,
          description: description,
          time_minutes: dailyStep.timeMinutes,
          completed: dailyStep.completed
        });
      }
    }
  };

  // Save daily step to database when time changes
  const handleDailyStepTimeChange = async (sequenceId: string, stepId: string, timeMinutes: number) => {
    onUpdate(column.id, {
      sequences: column.sequences.map(seq => {
        if (seq.id === sequenceId) {
          return {
            ...seq,
            dailySteps: seq.dailySteps.map(step =>
              step.id === stepId 
                ? { ...step, timeMinutes }
                : step
            )
          };
        }
        return seq;
      })
    });
    
    if (user) {
      const sequence = column.sequences.find(seq => seq.id === sequenceId);
      const dailyStep = sequence?.dailySteps.find(step => step.id === stepId);
      if (sequence && dailyStep) {
        await ikioiService.saveDailyStep({
          id: stepId,
          sequence_id: sequenceId,
          description: dailyStep.description,
          time_minutes: timeMinutes,
          completed: dailyStep.completed
        });
      }
    }
  };

  // Delete sequence from database
  const deleteSequence = async (sequenceId: string) => {
    onUpdate(column.id, {
      sequences: column.sequences.filter(seq => seq.id !== sequenceId)
    });
    
    if (user) {
      await ikioiService.deleteSequence(sequenceId);
    }
  };

  // Delete daily step from database
  const deleteDailyStep = async (sequenceId: string, stepId: string) => {
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
    
    if (user) {
      await ikioiService.deleteDailyStep(stepId);
    }
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
          
          {/* Color Selector */}
          <div className="relative flex items-center">
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: column.color || '#BAE1FF' }}
              title="Change color"
            />
            
            {isColorPickerOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsColorPickerOpen(false)}
                />
                <div className="absolute left-0 top-7 bg-white dark:bg-gray-800 border rounded-xl shadow-xl p-3 z-50 min-w-[180px]">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Choose a color</div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
                      '#D0BAFF', '#FFB3FF', '#B3FFF3', '#FFD8B1', '#C1FFB1'
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
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
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            What do you want?
          </label>
          <select 
            value={column.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Goal Input with Year */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Goal
          </label>
          <input
            type="text"
            value={column.goal}
            onChange={(e) => handleGoalChange(e.target.value)}
            placeholder="e.g., Pilot license"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background mb-2"
          />
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Target year:</span>
            <select 
              value={column.targetYear || ''}
              onChange={(e) => handleTargetYearChange(parseInt(e.target.value) || 0)}
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
          
          {column.targetYear && (
            <div className="text-xs text-muted-foreground mt-1">
              {column.targetYear > new Date().getFullYear() 
                ? `Complete in ${column.targetYear - new Date().getFullYear()} years` 
                : 'Complete this year'}
            </div>
          )}
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
                  <div className="flex-1">
                    <input
                      type="text"
                      value={sequence.description}
                      onChange={(e) => handleSequenceDescriptionChange(sequence.id, e.target.value)}
                      placeholder="Sequence description"
                      className="w-full bg-transparent focus:outline-none text-sm"
                    />
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Due:</span>
                      <input
  type="month"
  value={sequence.dueMonth || ''}
  onChange={(e) => handleSequenceDueMonthChange(sequence.id, e.target.value)}
  className="text-xs border rounded-lg px-2 py-1.5 bg-gray-50 border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all w-full"
  style={{ borderRadius: '0.75rem' }}
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
                
                {/* Daily Steps */}
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
                          onChange={(e) => handleDailyStepDescriptionChange(sequence.id, step.id, e.target.value)}
                          placeholder="Daily action"
                          className="flex-1 bg-transparent focus:outline-none text-xs"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="480"
                            value={step.timeMinutes || ''}
                            onChange={(e) => handleDailyStepTimeChange(sequence.id, step.id, parseInt(e.target.value) || 0)}
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


