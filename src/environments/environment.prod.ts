// Production environment configuration
// Values are loaded from .env file via @ngx-env/builder
// Set these in your CI/CD or hosting platform environment variables

export const environment = {
  production: true,
  supabaseUrl: import.meta.env.NG_APP_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.NG_APP_SUPABASE_ANON_KEY
};