import { useEffect, useState } from 'react'
import { fetchRecipeIngredients } from '../lib/api'
import { money, moneySmart, quantity, unitPrice } from '../lib/format'
import type { RecipeCost, RecipeIngredientCost } from '../lib/types'

interface Props {
  recipe: RecipeCost
  categoryName: string
  onClose: () => void
}

export function RecipeDetailsModal({ recipe, categoryName, onClose }: Props) {
  const [lines, setLines] = useState<RecipeIngredientCost[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchRecipeIngredients(recipe.recipe_id)
      .then((rows) => {
        if (!cancelled) setLines(rows)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [recipe.recipe_id])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={recipe.name}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <h2 className="modal-title">{recipe.name}</h2>
            <p className="modal-subtitle">{categoryName}</p>
          </div>
          <button className="btn btn-icon" type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <dl className="facts">
          <div>
            <dt>Выход</dt>
            <dd>{quantity(recipe.output_quantity_milli / 1000, recipe.output_unit)}</dd>
          </div>
          <div>
            <dt>Наценка</dt>
            <dd>{recipe.markup_percent} %</dd>
          </div>
          <div>
            <dt>Себестоимость партии</dt>
            <dd>{money(recipe.batch_cost)}</dd>
          </div>
          <div>
            <dt>Себестоимость единицы</dt>
            <dd>{money(recipe.cost_per_unit)}</dd>
          </div>
          <div>
            <dt>Цена</dt>
            <dd className="price-accent">{unitPrice(recipe.price_per_unit, recipe.output_unit)}</dd>
          </div>
        </dl>

        <h3 className="section-title">Состав</h3>

        {loading && <p className="state">Загрузка…</p>}
        {error && <p className="state state-error">{error}</p>}
        {!loading && !error && lines.length === 0 && (
          <p className="state">Состав не заполнен.</p>
        )}

        {lines.length > 0 && (
          <table className="lines">
            <thead>
              <tr>
                <th>Ингредиент</th>
                <th className="num">Количество</th>
                <th className="num">Цена</th>
                <th className="num">Стоимость</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.ingredient_id}>
                  <td>{line.ingredient_name}</td>
                  <td className="num">
                    {quantity(line.amount_milli / 1000, line.ingredient_unit)}
                  </td>
                  <td className="num">
                    {line.avg_price === null ? '—' : moneySmart(line.avg_price)}
                  </td>
                  <td className="num">{money(line.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
