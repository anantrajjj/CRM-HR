import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('departments').select('count').limit(1)
    if (error) {
      console.log('Connection test result:', error.message)
      return { success: false, message: error.message }
    }
    console.log('Connection successful!')
    return { success: true, message: 'Connected to Supabase' }
  } catch (err) {
    console.log('Connection error:', err)
    return { success: false, message: 'Failed to connect' }
  }
}
