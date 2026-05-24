// Supabase Configuration — Production-safe
const SUPABASE_URL = 'https://caxyxwpykyogmkzmzush.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheHl4d3B5a3lvZ21rem16dXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjE0NTEsImV4cCI6MjA5NDY5NzQ1MX0.WgFqmEDmxau5dIsQ6J4_qE7BpeJjv6aTqu4t2MZv5xA';

let supabaseClient = null;
let supabaseConnected = false;

// Catch any unhandled promise rejections from Supabase internals
// (GoTrueClient auto-refresh, Realtime, etc.) so they don't crash the page
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message &&
      (event.reason.message.includes('Failed to fetch') ||
       event.reason.message.includes('NetworkError') ||
       event.reason.message.includes('ERR_NAME_NOT_RESOLVED') ||
       event.reason.message.includes('Load failed') ||
       event.reason.message.includes('fetch'))) {
    event.preventDefault();
    console.warn('🔇 Suppressed network error (Supabase offline):', event.reason.message);
  }
});

// Try to initialize Supabase client with safety options
try {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,    // Prevent background token refresh to invalid URL
        persistSession: false,       // Don't persist auth session
        detectSessionInUrl: false    // Don't scan URL for auth tokens
      },
      global: {
        fetch: function(...args) {
          // Wrap fetch with a timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const [url, options = {}] = args;
          return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timeoutId));
        }
      }
    });
    console.log('✅ Supabase client initialized');
  } else {
    console.warn('⚠️ Supabase JS library not available');
  }
} catch (e) {
  console.warn('⚠️ Supabase client could not be initialized:', e.message);
  supabaseClient = null;
}

// Safe wrapper for Supabase operations — returns null/false on failure, NEVER throws
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
