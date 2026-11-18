import { supabase } from './supabase'
import type { RecipeCategory, RecipeCost, SyncState } from './types'

export async function fetchRecipeCosts(): Promise<RecipeCost[]> {
  const { data, error } = await supabase
    .from('recipe_costs')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as RecipeCost[]
}

export async function fetchRecipeCategories(): Promise<RecipeCategory[]> {
  const { data, error } = await supabase
    .from('recipe_categories')
    .select('id, name')
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as RecipeCategory[]
}

export async function fetchSyncState(): Promise<SyncState | null> {
  const { data, error } = await supabase
    .from('sync_state')
    .select('schema_version, last_snapshot_at, row_counts')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as SyncState | null) ?? null
}
