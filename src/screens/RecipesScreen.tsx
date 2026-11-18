import { useEffect, useState } from 'react'
import { fetchRecipeCategories, fetchRecipeCosts, fetchSyncState } from '../lib/api'
import { moneySmart, quantity, unitPrice } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { RecipeCategory, RecipeCost, SyncState } from '../lib/types'
import { RecipeDetailsModal } from './RecipeDetailsModal'

interface Props {
  email: string
}

export function RecipesScreen({ email }: Props) {
  const [recipes, setRecipes] = useState<RecipeCost[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [sync, setSync] = useState<SyncState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<RecipeCost | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchRecipeCosts(), fetchRecipeCategories(), fetchSyncState()])
      .then(([costs, cats, state]) => {
        if (cancelled) return
        setRecipes(costs)
        setCategories(cats)
        setSync(state)
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : String(reason))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const categoryName = (id: string | null) =>
    categories.find((category) => category.id === id)?.name ?? 'Без категории'

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1 className="page-title">Рецепты</h1>
          <p className="page-subtitle">{email}</p>
        </div>
        <button className="btn" type="button" onClick={() => supabase.auth.signOut()}>
          Выйти
        </button>
      </header>

      {sync && (
        <p className="sync-note">
          Данные из облака на {new Date(sync.last_snapshot_at).toLocaleString('ru-RU')}
        </p>
      )}

      {loading && <p className="state">Загрузка…</p>}
      {error && <p className="state state-error">{error}</p>}

      {!loading && !error && recipes.length === 0 && (
        <p className="state">В облаке нет рецептов. Выгрузите данные из приложения.</p>
      )}

      <ul className="recipe-list">
        {recipes.map((recipe) => (
          <li key={recipe.recipe_id}>
            <button
              className="recipe-card"
              type="button"
              onClick={() => setSelected(recipe)}
            >
              <div className="recipe-head">
                <h2 className="recipe-name">{recipe.name}</h2>
                <span className="recipe-category">{categoryName(recipe.category_id)}</span>
              </div>

              <div className="recipe-meta">
                <span>{quantity(recipe.output_quantity_milli / 1000, recipe.output_unit)}</span>
              </div>

              <div className="recipe-prices">
                <div>
                  <span className="price-label">Себестоимость</span>
                  <span className="price-value">{moneySmart(recipe.cost_per_unit)}</span>
                </div>
                <div>
                  <span className="price-label">Цена</span>
                  <span className="price-value price-accent">
                    {unitPrice(recipe.price_per_unit, recipe.output_unit)}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <RecipeDetailsModal
          recipe={selected}
          categoryName={categoryName(selected.category_id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
