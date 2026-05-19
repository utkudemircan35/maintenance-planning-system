// Supabase Configuration
const SUPABASE_URL = 'https://caxyxwpkyogmkzmzush.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Hm3awWSqMlk9_agY74M8Pw_9nEDLrrS';

let supabaseClient = null;
let supabaseConnected = false;

// Try to initialize Supabase client, but don't crash if it fails
try {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn('Supabase client could not be initialized:', e.message);
}

// Safe wrapper for Supabase operations — returns null on failure
const db = {
  async select(table) {
    if (!supabaseClient) return null;
    try {
      const { data, error } = await supabaseClient.from(table).select('*');
      if (error) { console.warn(`Supabase select ${table}:`, error.message); return null; }
      return data;
    } catch (e) { console.warn(`Supabase select ${table} failed:`, e.message); return null; }
  },
  async insert(table, rows) {
    if (!supabaseClient) return false;
    try {
      const { error } = await supabaseClient.from(table).insert(rows);
      if (error) { console.warn(`Supabase insert ${table}:`, error.message); return false; }
      return true;
    } catch (e) { console.warn(`Supabase insert ${table} failed:`, e.message); return false; }
  },
  async update(table, values, matchColumn, matchValue) {
    if (!supabaseClient) return false;
    try {
      const { error } = await supabaseClient.from(table).update(values).eq(matchColumn, matchValue);
      if (error) { console.warn(`Supabase update ${table}:`, error.message); return false; }
      return true;
    } catch (e) { console.warn(`Supabase update ${table} failed:`, e.message); return false; }
  }
};
