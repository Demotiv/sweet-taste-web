import { useEffect, useState } from 'react'
import { fetchRecipeCategories, fetchRecipeCosts, fetchSyncState } from '../lib/api'
import { moneySmart, quantity, unitPrice } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { RecipeCategory, RecipeCost, SyncState } from '../lib/types'
import { RecipeDetailsModal } from './RecipeDetailsModal'

interface Props {
  email: string
}

interface Group {
  id: string | null
  name: string
  recipes: RecipeCost[]
}

/** Рецепты по категориям: порядок категорий — по названию, «Без категории» в конце. */
function groupByCategory(recipes: RecipeCost[], categories: RecipeCategory[]): Group[] {
  const groups = new Map<string | null, Group>()

  for (const category of categories) {
    groups.set(category.id, { id: category.id, name: category.name, recipes: [] })
  }

  for (const recipe of recipes) {
    const key = recipe.category_id && groups.has(recipe.category_id) ? recipe.category_id : null
    const group = groups.get(key) ?? { id: null, name: 'Без категории', recipes: [] }
    groups.set(key, group)
    group.recipes.push(recipe)
  }

  return [...groups.values()]
    .filter((group) => group.recipes.length > 0)
    .sort((a, b) => {
      if (a.id === null) return 1
      if (b.id === null) return -1
      return a.name.localeCompare(b.name, 'ru')
    })
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

  const groups = groupByCategory(recipes, categories)

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1 className="page-title">Меню</h1>
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

      {groups.map((group) => (
        <section className="menu-group" key={group.id ?? 'none'}>
          <h2 className="group-title">
            {group.name}
            <span className="group-count">{group.recipes.length}</span>
          </h2>

          <ul className="recipe-list">
            {group.recipes.map((recipe) => (
              <li key={recipe.recipe_id}>
                <button
                  className="recipe-card"
                  type="button"
                  onClick={() => setSelected(recipe)}
                >
                  <div className="recipe-head">
                    <h3 className="recipe-name">{recipe.name}</h3>
                    <span className="recipe-output">
                      {quantity(recipe.output_quantity_milli / 1000, recipe.output_unit)}
                    </span>
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
        </section>
      ))}

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
