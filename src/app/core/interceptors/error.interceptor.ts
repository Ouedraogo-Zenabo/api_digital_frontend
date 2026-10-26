import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Filet de sécurité global pour l'affichage des erreurs.
 *
 * Règle métier :
 *  - Utilisateur AUTHENTIFIÉ (espace d'administration) → on affiche le message d'erreur
 *    explicite renvoyé par le backend (champ `message` de l'ApiResponse).
 *  - Visiteur PUBLIC (non authentifié) → on ne lui affiche JAMAIS l'erreur ; la page
 *    publique gère elle-même son état vide. L'erreur est simplement propagée.
 *
 * Le 401 reste géré par l'authInterceptor (déconnexion + redirection), on l'ignore ici.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthenticated = !!auth.getToken();

      if (isAuthenticated && error.status !== 401) {
        notify.error(extractMessage(error));
      }

      // On propage toujours l'erreur pour que les composants puissent réagir.
      return throwError(() => error);
    })
  );
};

/** Extrait le message explicite du backend, avec des replis lisibles. */
function extractMessage(error: HttpErrorResponse): string {
  const backendMessage = error?.error?.message;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }
  if (error.status === 0) {
    return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  }
  if (error.status === 403) {
    return 'Accès refusé : vous n\'avez pas les droits nécessaires.';
  }
  return `Une erreur est survenue (code ${error.status}).`;
}
