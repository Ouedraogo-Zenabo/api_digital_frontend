import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

/**
 * Hôte d'affichage des toasts (monté une seule fois à la racine de l'application).
 * Le contenu est piloté par le NotificationService.
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-[min(92vw,24rem)]">
      @for (t of notify.toasts(); track t.id) {
        <div role="alert"
             class="flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-toast-in"
             [ngClass]="{
               'bg-green-600': t.type === 'success',
               'bg-red-600': t.type === 'error',
               'bg-slate-700': t.type === 'info'
             }">
          <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            @if (t.type === 'success') {
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            } @else if (t.type === 'error') {
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            } @else {
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            }
          </svg>
          <span class="flex-1 leading-snug">{{ t.message }}</span>
          <button type="button" (click)="notify.dismiss(t.id)"
                  aria-label="Fermer"
                  class="opacity-80 hover:opacity-100 transition-opacity flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-toast-in { animation: toast-in .2s ease-out; }
    @keyframes toast-in {
      from { transform: translateX(1rem); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class NotificationComponent {
  notify = inject(NotificationService);
}
