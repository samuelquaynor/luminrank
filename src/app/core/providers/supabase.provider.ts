import { Provider } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export function provideSupabase(): Provider {
  return {
    provide: SupabaseClient,
    useFactory: () => {
      return createClient(
        environment.supabaseUrl,
        environment.supabaseAnonKey
      );
    }
  };
}
