import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fdyejrdofejyvmljddcn.supabase.co'
const supabaseKey = 'sb_publishable_Kz3vpoRrwFpx8fXlSvcldA_QJ5Utq-a'

export const supabase = createClient(supabaseUrl, supabaseKey)
