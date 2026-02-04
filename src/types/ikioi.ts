// src/types/ikioi.ts
export interface IkioiColumn {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  target_year: number;
  color: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface IkioiSequence {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  due_month: string;
  position_x: number;
  position_y: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface IkioiDailyStep {
  id: string;
  sequence_id: string;
  description: string;
  time_minutes: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Types for your existing component state
export interface ComponentIkioiColumn {
  id: string;
  position: { x: number; y: number };
  category: string;
  goal: string;
  targetYear: number;
  color: string;
  sequences: ComponentSequence[];
}

export interface ComponentSequence {
  id: string;
  description: string;
  completed: boolean;
  dueMonth: string;
  dailySteps: ComponentDailyStep[];
}

export interface ComponentDailyStep {
  id: string;
  description: string;
  timeMinutes: number;
  completed: boolean;
}

export interface IkioiSequence {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  due_month: string;
  position_x: number;
  position_y: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface IkioiDailyStep {
  id: string;
  sequence_id: string;
  description: string;
  time_minutes: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}