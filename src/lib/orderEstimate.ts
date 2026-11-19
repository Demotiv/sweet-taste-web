/**
 * Расчёт заказа под произвольное количество — повторяет desktop
 * (OrderService.cs: масштаб состава, цена позиции, округление итога).
 */

import type { RecipeCost, RecipeIngredientCost } from './types'

/** Лимиты desktop: OrderService.cs:14-15. */
const MAX_PIECE_QUANTITY = 1000
const MAX_WEIGHT_QUANTITY = 1_000_000

export interface OrderEstimateLine {
  ingredientId: string
  /** Количество ингредиента в его единице измерения. */
  amount: number
  /** Стоимость под заказ; null — у ингредиента нет закупок. */
  cost: number | null
}

export interface OrderEstimate {
  quantity: number
  /** Во сколько раз состав больше партии. */
  scale: number
  /** Итог заказа: цена рецепта за количество, вверх до рубля. */
  total: number
  lines: OrderEstimateLine[]
}

/** ok: false и hint: null — поле пустое, это не ошибка. */
export type QuantityCheck = { ok: true; quantity: number } | { ok: false; hint: string | null }

/** Округление до копеек как decimal.Round(v, 2, AwayFromZero) для положительных. */
export function round2(value: number): number {
  return Math.round(value * 100 + 1e-6) / 100
}

/** Итог заказа: ceil(round2(цена × количество)) — OrderService.cs:648,663. */
export function orderTotal(pricePerUnit: number, quantity: number): number {
  return Math.ceil(round2(pricePerUnit * quantity))
}

function isPieceUnit(unit: string): boolean {
  return unit === 'шт'
}

/**
 * Разбор введённого количества. Порядок проверок как в desktop
 * (OrderService.cs:625-637): формат → больше нуля → целое для «шт» → лимит.
 */
export function parseQuantity(text: string, unit: string): QuantityCheck {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: false, hint: null }

  const normalized = trimmed.replace(',', '.').replace(/\.$/, '')
  if (!/^\d*\.?\d*$/.test(normalized) || normalized === '' || normalized === '.') {
    return { ok: false, hint: 'Введите число' }
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return { ok: false, hint: 'Введите число' }

  const quantity = Math.round(parsed * 1000) / 1000
  if (quantity <= 0) return { ok: false, hint: 'Количество должно быть больше нуля' }

  if (isPieceUnit(unit)) {
    if (!Number.isInteger(quantity)) {
      return { ok: false, hint: 'Штучные позиции заказываются только целым числом' }
    }
    if (quantity > MAX_PIECE_QUANTITY) {
      return { ok: false, hint: `Слишком большое количество: не больше ${MAX_PIECE_QUANTITY} шт` }
    }
    return { ok: true, quantity }
  }

  if (quantity > MAX_WEIGHT_QUANTITY) {
    return {
      ok: false,
      hint: `Слишком большое количество: не больше ${MAX_WEIGHT_QUANTITY} ${unit}`,
    }
  }

  return { ok: true, quantity }
}

/**
 * Состав и итог под количество. null — рецепт без выхода, делить нельзя.
 * Масштабы хранятся в тысячных долях, поэтому scale безразмерный.
 */
export function estimateOrder(
  recipe: RecipeCost,
  lines: RecipeIngredientCost[],
  quantity: number,
): OrderEstimate | null {
  if (recipe.output_quantity_milli <= 0) return null

  const scale = Math.round(quantity * 1000) / recipe.output_quantity_milli

  return {
    quantity,
    scale,
    total: orderTotal(recipe.price_per_unit, quantity),
    lines: lines.map((line) => {
      const amount = (line.amount_milli * scale) / 1000
      return {
        ingredientId: line.ingredient_id,
        amount,
        cost: line.avg_price === null ? null : line.avg_price * amount,
      }
    }),
  }
}
