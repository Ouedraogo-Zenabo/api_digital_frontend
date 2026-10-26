import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { auditInterceptor } from './core/interceptors/audit.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, auditInterceptor, errorInterceptor])),
    // Thème PrimeNG appliqué globalement (sinon l'éditeur p-editor est « bizarre »
    // sur les pages qui n'embarquent pas le <theme-switcher />, ex. l'agenda).
    //
    // darkModeSelector : par défaut PrimeNG suit `prefers-color-scheme` du système,
    // ce qui faisait passer TOUS les composants PrimeNG en sombre sur un OS en dark
    // alors que le reste du site (Tailwind) restait clair — rendu incohérent.
    // On le fige sur une classe jamais posée : PrimeNG reste donc toujours en clair.
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } })
  ]
};
