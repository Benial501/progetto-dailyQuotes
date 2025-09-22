import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qcekvokpoexzywvkxykq.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZWt2b2twb2V4enl3dmt4eWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1Mjg2ODUsImV4cCI6MjA3NDEwNDY4NX0.rn9AU1skY7dZRW4q9r8HbWeBuTr9z1o_UUjK7za5_0Q"
export const supabase = createClient(supabaseUrl, supabaseKey)
