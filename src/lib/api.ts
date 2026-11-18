import { supabase } from './supabase'
import type { RecipeCategory, RecipeCost, RecipeIngredientCost, SyncState } from './types'

export async function fetchRecipeCosts(): Promise<RecipeCost[]> {
  const { data, error } = await supabase
    .from('recipe_costs')
    .select(
      'recipe_id, name, category_id, output_quantity_milli, output_unit, markup_percent, updated_at, batch_cost, cost_per_unit, price_per_unit',
    )
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

export async function fetchRecipeIngredients(recipeId: string): Promise<RecipeIngredientCost[]> {
  const { data, error } = await supabase
    .from('recipe_ingredient_costs')
    .select(
      'recipe_id, ingredient_id, position, amount_milli, ingredient_name, ingredient_unit, avg_price, cost',
    )
    .eq('recipe_id', recipeId)
    .order('position')

  if (error) throw new Error(error.message)
  return (data ?? []) as RecipeIngredientCost[]
}
