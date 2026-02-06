// src/components/ikioi/IkioiColumn.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Plus, X, Calendar, Clock, ChevronRight, ChevronDown } from 'lucide-react';
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
  const [expandedSequence, setExpandedSequence] = useState<string | null>(null);
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
    if (expandedSequence === sequenceId) {
      setExpandedSequence(null);
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

  const toggleSequenceExpansion = (sequenceId: string) => {
    setExpandedSequence(expandedSequence === sequenceId ? null : sequenceId);
  };

  const formatDueMonth = (dueMonth: string) => {
  if (!dueMonth) return 'Set date';
  const date = new Date(dueMonth + '-01');
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

  return (
    <div
      className={`absolute w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg ${
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
      {/* Column Header */}
      <div 
        className="flex items-center justify-between p-4 rounded-t-xl border-b border-gray-200 dark:border-gray-700"
        style={{ 
          backgroundColor: column.color ? `${column.color}20` : 'transparent',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
          
          {/* Color Picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: column.color || '#BAE1FF' }}
              title="Change color"
            />
            
            {isColorPickerOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsColorPickerOpen(false)}
                />
                <div className="absolute left-0 top-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 z-50 min-w-[180px]">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Choose a color</div>
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
                            ? 'border-gray-700 dark:border-gray-300 scale-110' 
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
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

          {/* Category and Goal in header */}
          <div className="flex-1 min-w-0">
            <select 
              value={column.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="text-sm font-medium bg-transparent border-0 p-0 focus:outline-none focus:ring-0 w-full text-gray-900 dark:text-gray-100 truncate"
            >
              <option value="" className="text-gray-500">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat.toLowerCase()} className="text-gray-900">{cat}</option>
              ))}
            </select>
            <input
              type="text"
              value={column.goal}
              onChange={(e) => handleGoalChange(e.target.value)}
              placeholder="What's your goal?"
              className="text-lg font-semibold bg-transparent border-0 p-0 focus:outline-none focus:ring-0 w-full text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Target year and delete */}
          <div className="flex items-center gap-2">
            {column.targetYear && (
              <div className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700">
                🎯 {column.targetYear}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(column.id)}
              className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-4">
        {/* Year Selection */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Year</span>
          </div>
          <select 
            value={column.targetYear || ''}
            onChange={(e) => handleTargetYearChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Select target year</option>
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

        {/* Sequences Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Sequences ({column.sequences.length})
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => onAddSequence(column.id)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Sequence
            </Button>
          </div>

          {column.sequences.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No sequences yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add your first sequence to get started</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {column.sequences.map((sequence) => (
                <div key={sequence.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  
                  {/* Sequence Header */}
<div 
  className="flex flex-col p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
  onClick={() => toggleSequenceExpansion(sequence.id)}
>
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`h-2 w-2 rounded-full ${expandedSequence === sequence.id ? 'bg-blue-500' : 'bg-gray-300'}`} />
      <input
        type="text"
        value={sequence.description}
        onChange={(e) => handleSequenceDescriptionChange(sequence.id, e.target.value)}
        placeholder="Sequence name"
        className="flex-1 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-0"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-500">
        {sequence.dailySteps.length} step{sequence.dailySteps.length !== 1 ? 's' : ''}
      </div>
      {expandedSequence === sequence.id ? (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronRight className="h-4 w-4 text-gray-400" />
      )}
    </div>
  </div>
  
  {/* Date row below sequence name */}
<div className="flex items-center gap-2 text-gray-500 mt-1 ml-5">
  <button
    onClick={(e) => {
      e.stopPropagation();
      // Trigger the date input programmatically
      const input = e.currentTarget.nextElementSibling as HTMLInputElement;
      input?.showPicker();
    }}
    className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition-colors group"
  >
    <Calendar className="h-3.5 w-3.5 text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
    {sequence.dueMonth && (
      <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-orange-700 dark:group-hover:text-orange-300">
        {formatDueMonth(sequence.dueMonth)}
      </span>
    )}
    {!sequence.dueMonth && (
      <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400">
        Set date
      </span>
    )}
  </button>
  <input
    type="month"
    value={sequence.dueMonth || ''}
    onChange={(e) => handleSequenceDueMonthChange(sequence.id, e.target.value)}
    className="absolute opacity-0 w-0 h-0"
    min={`${new Date().getFullYear()}-01`}
    max={column.targetYear ? `${column.targetYear}-12` : `${new Date().getFullYear() + 5}-12`}
  />
</div>
</div>

                  {/* Daily Steps (Collapsible) */}
                  {expandedSequence === sequence.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Daily Steps</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => onAddDailyStep(column.id, sequence.id)}
                        >
                          <Plus className="h-3 w-3 mr-1.5" />
                          Add Step
                        </Button>
                      </div>
                      
                      {sequence.dailySteps.length === 0 ? (
                        <div className="text-center py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">No daily steps yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sequence.dailySteps.map((step) => (
                            <div key={step.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                              {/* Daily step name - 70% width */}
                              <div className="flex-1 min-w-0 w-[70%]">
                                <input
                                  type="text"
                                  value={step.description}
                                  onChange={(e) => handleDailyStepDescriptionChange(sequence.id, step.id, e.target.value)}
                                  placeholder="What to do daily?"
                                  className="w-full bg-transparent border-0 p-0 focus:outline-none focus:ring-0 text-sm text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              
                              {/* Time input - 30% width */}
<div className="flex items-center justify-end gap-1 w-[30%]">
  <div className="flex items-center gap-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5">
    <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
    <input
      type="number"
      min="1"
      max="480"
      value={step.timeMinutes || ''}
      onChange={(e) => handleDailyStepTimeChange(sequence.id, step.id, parseInt(e.target.value) || 0)}
      className="w-12 text-xs bg-transparent border-0 p-0 focus:outline-none focus:ring-0 text-right text-gray-900 dark:text-gray-100"
      placeholder="0"
    />
  </div>
  <button 
    onClick={() => deleteDailyStep(sequence.id, step.id)}
    className="text-gray-400 hover:text-red-500 transition-colors p-1"
  >
    <X className="h-3.5 w-3.5" />
  </button>
</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sequence Footer */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <button 
  onClick={() => deleteSequence(sequence.id)}
  className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
>
  <Trash2 className="h-3 w-3" />
  Remove
</button>
                    <div className="text-xs text-gray-500">
                      Total: {sequence.dailySteps.reduce((sum, step) => sum + (step.timeMinutes || 0), 0)} min/day
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total sequences:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{column.sequences.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-400">Total daily steps:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {column.sequences.reduce((sum, seq) => sum + seq.dailySteps.length, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}