// Development environment configuration
// Values are loaded from .env file via @ngx-env/builder

export const environment = {
  production: false,
  supabaseUrl: import.meta.env.NG_APP_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.NG_APP_SUPABASE_ANON_KEY
};