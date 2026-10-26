import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Panneau latéral réutilisable qui s'ouvre en glissant depuis la droite.
 * Remplace les modals centrés par une UX type "drawer".
 *
 * Usage :
 *  @if (showModal()) {
 *    <app-drawer [title]="editing() ? 'Modifier' : 'Nouveau'" (close)="closeModal()">
 *      <form class="p-6 space-y-5">  </form>
 *    </app-drawer>
 *  }
 */
@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[60]">
      <!-- Fond -->
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] drawer-backdrop" (click)="close.emit()"></div>

      <!-- Panneau -->
      <div class="absolute top-0 right-0 h-full w-full bg-white shadow-2xl flex flex-col drawer-panel"
           [style.maxWidth]="width" role="dialog" aria-modal="true">

        <!-- En-tête -->
        <div class="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-white">
          <div class="min-w-0">
            <div class="flex items-center gap-2.5">
              <span class="w-1.5 h-5 rounded-full bg-[#00843B] flex-shrink-0"></span>
              <h2 class="text-lg font-semibold text-slate-800 truncate">{{ title }}</h2>
            </div>
            <p *ngIf="subtitle" class="text-sm text-slate-500 mt-1 ml-4">{{ subtitle }}</p>
          </div>
          <button type="button" (click)="close.emit()" aria-label="Fermer"
                  class="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Corps défilant -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes drawerFade { from { opacity: 0; } to { opacity: 1; } }
    .drawer-panel { animation: drawerIn .3s cubic-bezier(.22, 1, .36, 1); }
    .drawer-backdrop { animation: drawerFade .22s ease; }
  `]
})
export class DrawerComponent {
  @Input() title = '';
  @Input() subtitle = '';
  /** Largeur max du panneau (CSS). Défaut ~ 540px. */
  @Input() width = '34rem';

  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}
