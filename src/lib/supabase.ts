import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ahmokktpzjulzfpjtveh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobW9ra3Rwemp1bHpmcGp0dmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODY0OTIsImV4cCI6MjA5MDk2MjQ5Mn0.HK7uEg2Nyq6AwF6CwCYUXxUqRpiYWmUK9sbNXAhmY_E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
