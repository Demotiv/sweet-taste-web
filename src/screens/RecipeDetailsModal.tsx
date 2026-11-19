import { useEffect, useState } from 'react'
import { fetchRecipeIngredients } from '../lib/api'
import { batchPrice, moneySmart, moneyUp, quantity, unitPrice } from '../lib/format'
import { estimateOrder, parseQuantity } from '../lib/orderEstimate'
import type { RecipeCost, RecipeIngredientCost } from '../lib/types'

interface Props {
  recipe: RecipeCost
  categoryName: string
  onClose: () => void
}

/** Выход партии в виде, пригодном для поля ввода: 2,5 вместо 2.5. */
function initialQuantityText(recipe: RecipeCost): string {
  return String(recipe.output_quantity_milli / 1000).replace('.', ',')
}

export function RecipeDetailsModal({ recipe, categoryName, onClose }: Props) {
  const [lines, setLines] = useState<RecipeIngredientCost[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantityText, setQuantityText] = useState(() => initialQuantityText(recipe))

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

  const check = parseQuantity(quantityText, recipe.output_unit)
  const estimate = check.ok ? estimateOrder(recipe, lines, check.quantity) : null
  const scaled = estimate !== null && estimate.scale !== 1
  const hasMissingPrices = lines.some((line) => line.avg_price === null)
  const showCalculator = !loading && !error && lines.length > 0 && recipe.output_quantity_milli > 0

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
            <dd>{moneyUp(recipe.batch_cost)}</dd>
          </div>
          <div>
            <dt>Себестоимость единицы</dt>
            <dd>{moneyUp(recipe.cost_per_unit)}</dd>
          </div>
          <div>
            <dt>Цена</dt>
            <dd className="price-accent">{unitPrice(recipe.price_per_unit, recipe.output_unit)}</dd>
          </div>
          <div>
            <dt>Цена партии</dt>
            <dd className="price-accent">
              {batchPrice(recipe.price_per_unit, recipe.output_quantity_milli)}
            </dd>
          </div>
        </dl>

        <h3 className="section-title">
          Состав
          {scaled && estimate && (
            <span className="section-note">
              на {quantity(estimate.quantity, recipe.output_unit)}
            </span>
          )}
        </h3>

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
              {lines.map((line, index) => {
                const scaledLine = scaled ? estimate?.lines[index] : undefined
                return (
                  <tr key={line.ingredient_id}>
                    <td>{line.ingredient_name}</td>
                    <td className="num">
                      {scaledLine
                        ? quantity(scaledLine.amount, line.ingredient_unit)
                        : quantity(line.amount_milli / 1000, line.ingredient_unit)}
                      {scaledLine && (
                        <span className="line-sub">
                          партия {quantity(line.amount_milli / 1000, line.ingredient_unit)}
                        </span>
                      )}
                    </td>
                    <td className="num">
                      {line.avg_price === null ? '—' : moneySmart(line.avg_price)}
                    </td>
                    <td className="num">
                      {scaledLine
                        ? scaledLine.cost === null
                          ? '—'
                          : moneyUp(scaledLine.cost)
                        : moneyUp(line.cost)}
                      {scaledLine && (
                        <span className="line-sub">партия {moneyUp(line.cost)}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {showCalculator && (
          <>
            <h3 className="section-title">Расчёт заказа</h3>
            <div className="order-calc">
              <div className="order-calc-row">
                <label className="field">
                  <span>Количество, {recipe.output_unit}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={quantityText}
                    onChange={(event) => setQuantityText(event.target.value)}
                    aria-invalid={check.ok ? undefined : true}
                  />
                </label>
                <div className="order-total">
                  <span className="price-label">
                    {estimate
                      ? `Итого за ${quantity(estimate.quantity, recipe.output_unit)}`
                      : 'Итого'}
                  </span>
                  <span className="order-total-value" aria-live="polite">
                    {estimate ? moneyUp(estimate.total) : '—'}
                  </span>
                </div>
              </div>
              {!check.ok && check.hint && <p className="calc-hint calc-hint-error">{check.hint}</p>}
              {check.ok && !estimate && (
                <p className="calc-hint">У рецепта не задан выход — расчёт невозможен.</p>
              )}
              {hasMissingPrices && (
                <p className="calc-hint">
                  У части ингредиентов нет закупок — их стоимость не учтена.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
