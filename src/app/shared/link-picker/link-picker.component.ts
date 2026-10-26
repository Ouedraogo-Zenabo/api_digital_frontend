import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SITE_LINK_GROUPS, SITE_LINKS } from '../site-links';

let linkPickerUid = 0;

/**
 * Champ de saisie d'un lien : on choisit une page du site dans une liste
 * déroulante, ou on saisit une URL complète (http…) / un chemin personnalisé.
 *
 * Utilisable avec `[(ngModel)]` ou `formControlName`.
 *
 *   <app-link-picker [(ngModel)]="form.linkUrl" name="linkUrl" />
 */
@Component({
  selector: 'app-link-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LinkPickerComponent), multi: true },
  ],
  template: `
    <div class="space-y-2">
      <select
        [id]="selectId"
        [value]="isCustom() ? '__custom__' : (value() || '')"
        (change)="onSelect($event)"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none">
        <option value="">— Aucun lien —</option>
        @for (g of groups; track g.group) {
          <optgroup [label]="g.group">
            @for (l of g.links; track l.url) {
              <option [value]="l.url">{{ l.label }} ({{ l.url }})</option>
            }
          </optgroup>
        }
        <option value="__custom__">Autre — saisir une URL complète…</option>
      </select>

      <input
        type="text"
        [id]="inputId"
        [value]="value() || ''"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [placeholder]="isCustom() ? 'https://exemple.gov.bf/page' : '/ma-page'"
        class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />

      <p class="text-xs text-slate-400">
        @if (isCustom() && value()) {
          Lien personnalisé : <span class="font-medium text-slate-500">{{ value() }}</span>
        } @else if (value()) {
          Page du site : <span class="font-medium text-slate-500">{{ value() }}</span>
        } @else {
          Choisissez une page du site ou saisissez une URL complète.
        }
      </p>
    </div>
  `,
})
export class LinkPickerComponent implements ControlValueAccessor {
  @Input() name = 'lien';

  private readonly _uid = ++linkPickerUid;
  readonly selectId = `link-picker-select-${this._uid}`;
  readonly inputId = `link-picker-input-${this._uid}`;

  readonly groups = SITE_LINK_GROUPS;

  value = signal<string>('');
  /** Vrai quand la valeur ne correspond à aucune page connue (URL libre). */
  isCustom = signal(false);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    const val = v || '';
    this.value.set(val);
    this.isCustom.set(!!val && !SITE_LINKS.some(l => l.url === val));
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  onSelect(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    if (v === '__custom__') {
      this.isCustom.set(true);
      // on garde la valeur courante si elle est déjà libre, sinon on vide
      if (SITE_LINKS.some(l => l.url === this.value())) this.setValue('');
      return;
    }
    this.isCustom.set(false);
    this.setValue(v);
  }

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value.trim();
    this.isCustom.set(!!v && !SITE_LINKS.some(l => l.url === v));
    this.setValue(v);
  }

  private setValue(v: string): void {
    this.value.set(v);
    this.onChange(v);
  }
}
