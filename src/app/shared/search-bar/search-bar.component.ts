import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

let searchBarUid = 0;

/**
 * Barre de recherche d'administration réutilisable (présentation seule).
 * Émet la valeur avec un léger debounce ; bouton d'effacement intégré.
 *
 * Usage :
 *  <app-search-bar placeholder="Rechercher un agenda"
 *                  (valueChange)="onSearch($event)" />
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full sm:w-72">
      <label [for]="inputId" class="sr-only">{{ placeholder }}</label>
      <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
           fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
      </svg>
      <input [id]="inputId" [name]="name" type="search" [attr.aria-label]="placeholder"
        [ngModel]="value" (ngModelChange)="onInput($event)" [placeholder]="placeholder"
        class="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-[#00843B]/25 focus:border-[#00843B] outline-none transition-colors"/>
      <button *ngIf="value" type="button" (click)="clear()" title="Effacer" aria-label="Effacer la recherche"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `,
})
export class SearchBarComponent {
  @Input() value = '';
  @Input() placeholder = 'Rechercher…';
  @Input() name = 'recherche';
  @Output() valueChange = new EventEmitter<string>();

  readonly inputId = `search-bar-${++searchBarUid}`;

  private debounce?: ReturnType<typeof setTimeout>;

  onInput(v: string): void {
    this.value = v;
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.valueChange.emit(v), 200);
  }

  clear(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.value = '';
    this.valueChange.emit('');
  }
}
