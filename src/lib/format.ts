/** Форматы чисел и денег — повторяют desktop (Formats.cs, Units.cs). */

const ru = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const ru0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

const ruQty = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 })

/** 16 ₽ или 16,50 ₽ — без копеек, если сумма целая. */
export function moneySmart(value: number): string {
  return Number.isInteger(value) ? `${ru0.format(value)} ₽` : `${ru.format(value)} ₽`
}

/** Всегда с копейками: 16,50 ₽. */
export function money(value: number): string {
  return `${ru.format(value)} ₽`
}

/** 2,5 кг — до трёх знаков после запятой. */
export function quantity(value: number, unit: string): string {
  return `${ruQty.format(value)} ${unit}`
}

/** Цена за единицу: для «г» — с копейками, для «кг» и «шт» — без. */
export function unitPrice(value: number, unit: string): string {
  return `${unit === 'г' ? money(value) : moneySmart(value)} / ${unit}`
}

/** Склонение: 1 ингредиент, 2 ингредиента, 5 ингредиентов. */
export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function ingredientsCount(count: number): string {
  return `${count} ${plural(count, 'ингредиент', 'ингредиента', 'ингредиентов')}`
}
