import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

/**
 * Service de notifications (toasts) affichées à l'utilisateur.
 *
 * Utilisé :
 *  - par l'intercepteur global d'erreurs (messages d'erreur du backend, uniquement pour les
 *    utilisateurs authentifiés — jamais pour les visiteurs des pages publiques) ;
 *  - potentiellement par les composants pour un retour de succès explicite.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {

  private seq = 0;
  /** File de toasts actuellement visibles. */
  readonly toasts = signal<Toast[]>([]);

  success(message: string, duration = 3500): void { this.push('success', message, duration); }
  error(message: string, duration = 5000): void { this.push('error', message, duration); }
  info(message: string, duration = 3500): void { this.push('info', message, duration); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(type: ToastType, message: string, duration: number): void {
    if (!message || !message.trim()) return;
    // Anti-doublon : on ignore un message identique déjà affiché.
    if (this.toasts().some(t => t.message === message && t.type === type)) return;

    const id = ++this.seq;
    this.toasts.update(list => [...list, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
