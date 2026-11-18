# Sweet Taste — веб-интерфейс кондитера

Мобильный клиент к облаку Sweet Taste. Только чтение: данные пишет desktop-приложение,
веб их показывает. Клиент доступа к интерфейсу не получает — ему уходит только PDF.

## Запуск

```powershell
npm install
Copy-Item env.example .env.local   # ключи Supabase
npm run dev
```

`env.example` содержит публичный publishable-ключ; `service_role` в клиенте не появляется никогда.

## Скрипты

- `npm run dev` — dev-сервер Vite.
- `npm run build` — проверка типов и сборка в `dist/`.
- `npm run lint` — oxlint.

## Версии

Зафиксированы под Node 20.15: Vite 7, `@vitejs/plugin-react` 5, `oxlint` 0.16.
Vite 8 (rolldown) и oxlint 1.x требуют Node 22 LTS.

## Структура

- `src/lib/supabase.ts` — клиент Supabase.
- `src/lib/api.ts` — чтение `recipe_costs`, `recipe_categories`, `sync_state`.
- `src/lib/format.ts` — деньги и количества в форматах desktop.
- `src/screens/LoginScreen.tsx` — вход по email/паролю (регистрации нет).
- `src/screens/RecipesScreen.tsx` — список рецептов с ценой за единицу.

Цена считается SQL-вью `recipe_costs` в облаке, а не в TypeScript: одна формула,
один источник истины с desktop.
