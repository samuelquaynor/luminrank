import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'leagues/join/:code',
    renderMode: RenderMode.Server
  },
  {
    path: 'leagues/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'leagues/:id/record-match',
    renderMode: RenderMode.Server
  },
  {
    path: 'leagues/:id/generate-fixtures',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
