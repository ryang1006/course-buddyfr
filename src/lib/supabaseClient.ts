import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Check Key Length:", supabaseKey?.length);
console.log("URL check:", `|${import.meta.env.VITE_SUPABASE_URL}|`);
console.log("KEY check:", `|${import.meta.env.VITE_SUPABASE_ANON_KEY}|`);


export const supabase = createClient(supabaseUrl, supabaseAnonKey);