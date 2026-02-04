-- Ikioi Tables (completely separate from goals system)
-- Create ikioi_columns table
CREATE TABLE public.ikioi_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE) + 1,
  color VARCHAR(7) DEFAULT '#BAE1FF',
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ikioi_sequences table
CREATE TABLE public.ikioi_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID NOT NULL REFERENCES public.ikioi_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_month VARCHAR(7),
  position_x INTEGER DEFAULT 50,
  position_y INTEGER DEFAULT 50,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ikioi_daily_steps table
CREATE TABLE public.ikioi_daily_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.ikioi_sequences(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  time_minutes INTEGER DEFAULT 30,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (same as your goals table)
ALTER TABLE public.ikioi_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ikioi_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ikioi_daily_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as your goals table)
CREATE POLICY "Users can view own ikioi_columns" ON public.ikioi_columns 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ikioi_columns" ON public.ikioi_columns 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ikioi_columns" ON public.ikioi_columns 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ikioi_columns" ON public.ikioi_columns 
FOR DELETE USING (auth.uid() = user_id);

-- Sequences policies (same cascade pattern)
CREATE POLICY "Users can manage own ikioi_sequences" ON public.ikioi_sequences 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.ikioi_columns WHERE id = column_id AND user_id = auth.uid())
);

-- Daily steps policies
CREATE POLICY "Users can manage own ikioi_daily_steps" ON public.ikioi_daily_steps 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ikioi_sequences seq
    JOIN public.ikioi_columns col ON seq.column_id = col.id
    WHERE seq.id = sequence_id AND col.user_id = auth.uid()
  )
);

-- Create triggers for timestamp updates (same as your goals table)
CREATE TRIGGER update_ikioi_columns_updated_at 
  BEFORE UPDATE ON public.ikioi_columns 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ikioi_sequences_updated_at 
  BEFORE UPDATE ON public.ikioi_sequences 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ikioi_daily_steps_updated_at 
  BEFORE UPDATE ON public.ikioi_daily_steps 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();