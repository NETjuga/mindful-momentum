// src/integrations/supabase/ikioiService.ts
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Tables = Database['public']['Tables']

export const ikioiService = {
  // Load all columns for a user
  async loadColumns(userId: string): Promise<Tables['ikioi_columns']['Row'][]> {
    const { data, error } = await supabase
      .from('ikioi_columns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    
    if (error) {
      console.error('Error loading ikioi columns:', error)
      return []
    }
    
    return data || []
  },

  // Save a column
  async saveColumn(
    columnData: Tables['ikioi_columns']['Insert']
  ): Promise<Tables['ikioi_columns']['Row'] | null> {
    try {
      // If ID doesn't look like a UUID, remove it so database generates one
      const finalData = { ...columnData }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (finalData.id && !uuidRegex.test(finalData.id)) {
        delete finalData.id
      }
      
      const { data, error } = await supabase
        .from('ikioi_columns')
        .upsert({
          ...finalData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving column:', error)
      return null
    }
  },

  // Delete a column
  async deleteColumn(columnId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ikioi_columns')
      .delete()
      .eq('id', columnId)
    
    if (error) {
      console.error('Error deleting ikioi column:', error)
      return false
    }
    
    return true
  },

  // Save a sequence
  async saveSequence(
    sequenceData: Tables['ikioi_sequences']['Insert']
  ): Promise<Tables['ikioi_sequences']['Row'] | null> {
    try {
      // If ID doesn't look like a UUID, remove it so database generates one
      const finalData = { ...sequenceData }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (finalData.id && !uuidRegex.test(finalData.id)) {
        delete finalData.id
      }
      
      const { data, error } = await supabase
        .from('ikioi_sequences')
        .upsert({
          ...finalData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving sequence:', error)
      return null
    }
  },

  // Save a daily step
  async saveDailyStep(
    dailyStepData: Tables['ikioi_daily_steps']['Insert']
  ): Promise<Tables['ikioi_daily_steps']['Row'] | null> {
    try {
      // If ID doesn't look like a UUID, remove it so database generates one
      const finalData = { ...dailyStepData }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (finalData.id && !uuidRegex.test(finalData.id)) {
        delete finalData.id
      }
      
      const { data, error } = await supabase
        .from('ikioi_daily_steps')
        .upsert({
          ...finalData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving daily step:', error)
      return null
    }
  },

  // Load sequences for a column
  async loadSequences(columnId: string): Promise<Tables['ikioi_sequences']['Row'][]> {
    const { data, error } = await supabase
      .from('ikioi_sequences')
      .select('*')
      .eq('column_id', columnId)
      .order('created_at')
    
    if (error) {
      console.error('Error loading sequences:', error)
      return []
    }
    
    return data || []
  },

  // Load daily steps for a sequence
  async loadDailySteps(sequenceId: string): Promise<Tables['ikioi_daily_steps']['Row'][]> {
    const { data, error } = await supabase
      .from('ikioi_daily_steps')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('created_at')
    
    if (error) {
      console.error('Error loading daily steps:', error)
      return []
    }
    
    return data || []
  },

  // Delete a sequence
  async deleteSequence(sequenceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ikioi_sequences')
      .delete()
      .eq('id', sequenceId)
    
    if (error) {
      console.error('Error deleting sequence:', error)
      return false
    }
    
    return true
  },

  // Delete a daily step
  async deleteDailyStep(dailyStepId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ikioi_daily_steps')
      .delete()
      .eq('id', dailyStepId)
    
    if (error) {
      console.error('Error deleting daily step:', error)
      return false
    }
    
    return true
  }
}