/** Строки облачных таблиц, которые читает веб-интерфейс. */

/** Строка вью `recipe_costs` — цена уже посчитана в SQL. */
export interface RecipeCost {
  recipe_id: string
  name: string
  category_id: string | null
  output_quantity_milli: number
  output_unit: string
  markup_percent: number
  updated_at: string
  batch_cost: number
  cost_per_unit: number
  price_per_unit: number
}

export interface RecipeCategory {
  id: string
  name: string
}

export interface SyncState {
  schema_version: number
  last_snapshot_at: string
  row_counts: Record<string, number>
}
