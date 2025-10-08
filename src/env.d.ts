// Define the type of the environment variables.
declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_APP_SUPABASE_URL: string;
  readonly NG_APP_SUPABASE_ANON_KEY: string;
}

// Use import.meta.env.YOUR_ENV_VAR in your code
declare interface ImportMeta {
  readonly env: Env;
}