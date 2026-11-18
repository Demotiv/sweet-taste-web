import { createClient } from '@supabase/supabase-js'

// Publishable-ключ безопасен в клиенте: доступ к строкам ограничен RLS.
// service_role здесь появляться не должен никогда.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

if (!url || !key) {
  throw new Error('Не заданы VITE_SUPABASE_URL и VITE_SUPABASE_KEY')
}

export const supabase = createClient(url, key)
