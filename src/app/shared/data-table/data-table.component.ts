import {
  Component, Input, TemplateRef, computed, signal, ContentChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DataTableColumn {
  key: string;                         // clé (supporte le chemin "a.b")
  label: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'date' | 'image' | 'boolean' | 'index';
  align?: 'left' | 'center' | 'right';
  width?: string;                      // classe tailwind ex. "w-32"
  hideOnMobile?: boolean;
  badgeClasses?: (value: any, row: any) => string;
  format?: (row: any) => string;       // texte personnalisé
  truncate?: boolean;
}

/**
 * Tableau d'administration réutilisable : responsive, recherche (debounce),
 * tri par colonne, pagination, sélecteur de taille de page, états vide/chargement.
 *
 * Usage :
 *  <app-data-table [columns]="cols" [rows]="items()" [loading]="loading()"
 *                  [rowActions]="actionsTpl" searchPlaceholder="Rechercher">
 *    <button table-actions (click)="openCreate()">Ajouter</button>
 *  </app-data-table>
 *  <ng-template #actionsTpl let-row>  boutons  </ng-template>
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './data-table.component.html',
})
export class DataTableComponent {
  @Input() columns: DataTableColumn[] = [];
  @Input() set rows(value: any[] | null | undefined) {
    this._rows.set(value ?? []);
    // si la page courante dépasse, on revient en arrière
    if (this.page() > this.totalPages()) this.page.set(1);
  }
  @Input() loading = false;
  @Input() searchable = true;
  @Input() searchPlaceholder = 'Rechercher';
  @Input() emptyText = 'Aucun élément à afficher.';
  @Input() emptyHint = '';
  @Input() pageSizeOptions: number[] = [10, 25, 50];
  @Input() rowActions?: TemplateRef<any>;
  @Input() actionsLabel = 'Actions';

  @ContentChild('toolbar') toolbarTpl?: TemplateRef<any>;

  private _rows = signal<any[]>([]);
  search = signal('');
  sortKey = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');
  page = signal(1);
  pageSize = signal(10);

  private debounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.pageSize.set(this.pageSizeOptions[0] ?? 10);
  }

  // ---- Recherche avec debounce ----
  onSearchInput(value: string): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      this.search.set(value);
      this.page.set(1);
    }, 250);
  }

  // ---- Tri ----
  toggleSort(col: DataTableColumn): void {
    if (!col.sortable) return;
    if (this.sortKey() === col.key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  // ---- Valeurs ----
  getValue(row: any, key: string): any {
    return key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), row);
  }

  cellText(row: any, col: DataTableColumn): string {
    if (col.format) return col.format(row);
    const v = this.getValue(row, col.key);
    return v == null || v === '' ? '—' : String(v);
  }

  private rowSearchString(row: any): string {
    return this.columns
      .map(c => (c.format ? c.format(row) : this.getValue(row, c.key)))
      .filter(v => v != null && typeof v !== 'object')
      .join(' ')
      .toLowerCase();
  }

  // ---- Pipeline filtrage -> tri -> pagination ----
  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    let data = this._rows();
    if (q) data = data.filter(r => this.rowSearchString(r).includes(q));

    const key = this.sortKey();
    if (key) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      const col = this.columns.find(c => c.key === key);
      data = [...data].sort((a, b) => {
        const va = col?.format ? col.format(a) : this.getValue(a, key);
        const vb = col?.format ? col.format(b) : this.getValue(b, key);
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), 'fr', { numeric: true }) * dir;
      });
    }
    return data;
  });

  total = computed(() => this.filtered().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  // bornes affichées "x–y sur z"
  rangeStart = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  setPageSize(size: number): void {
    this.pageSize.set(Number(size));
    this.page.set(1);
  }
  next(): void { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }
  prev(): void { if (this.page() > 1) this.page.update(p => p - 1); }

  // numéros de page compacts (max 5 autour de la page courante)
  pageNumbers = computed<number[]>(() => {
    const tp = this.totalPages();
    const cur = this.page();
    const span = 2;
    const from = Math.max(1, cur - span);
    const to = Math.min(tp, cur + span);
    const arr: number[] = [];
    for (let i = from; i <= to; i++) arr.push(i);
    return arr;
  });

  trackByIndex(i: number): number { return i; }
}
