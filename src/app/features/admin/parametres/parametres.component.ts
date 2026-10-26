import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ArticleCategoryItem, MediaCategoryItem, TypeDocument } from '../../../core/models';

type TabKey = 'documents' | 'projets' | 'articles' | 'mediacats';

interface Row {
  id: string;
  primary: string;        // titre principal (name / label)
  badge?: string;         // code (catégories d'article)
  description: string;
  count?: number;         // nombre d'éléments rattachés
  raw: TypeDocument | ArticleCategoryItem | MediaCategoryItem;
}

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.component.html',
})
export class ParametresComponent {

  // ----------------- Onglets -----------------
  tabs: { key: TabKey; label: string }[] = [
    { key: 'documents', label: 'Types de document' },
    { key: 'projets',   label: 'Types de projet' },
    { key: 'articles',  label: "Catégories d'article" },
    { key: 'mediacats', label: 'Catégories de média' },
  ];
  activeTab = signal<TabKey>('documents');

  // ----------------- Données -----------------
  docTypes = signal<TypeDocument[]>([]);
  projTypes = signal<TypeDocument[]>([]);
  artCats = signal<ArticleCategoryItem[]>([]);
  mediaCats = signal<MediaCategoryItem[]>([]);
  loading = signal(false);

  // ----------------- Recherche / pagination -----------------
  search = signal('');
  currentPage = signal(1);
  pageSize = 8;

  // ----------------- Modal formulaire -----------------
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);
  form: { code: string; label: string; name: string; description: string; displayOrder: number } = {
    code: '', label: '', name: '', description: '', displayOrder: 0,
  };

  // ----------------- Toast / confirmation -----------------
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false, message: '', type: 'success',
  });
  confirmModal = signal<{ show: boolean; message: string; onConfirm: () => void }>({
    show: false, message: '', onConfirm: () => {},
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  // ============ Chargement ============
  loadAll(): void {
    this.loading.set(true);
    this.api.getAllTypes().subscribe({
      next: (d) => this.docTypes.set(d ?? []),
      error: () => this.docTypes.set([]),
    });
    this.api.getTypes().subscribe({
      next: (d) => this.projTypes.set(d ?? []),
      error: () => this.projTypes.set([]),
    });
    this.api.getArticleCategories().subscribe({
      next: (d) => { this.artCats.set(d ?? []); this.loading.set(false); },
      error: () => { this.artCats.set([]); this.loading.set(false); },
    });
    this.api.getMediaCategories().subscribe({
      next: (d) => this.mediaCats.set(d ?? []),
      error: () => this.mediaCats.set([]),
    });
  }

  // ============ Onglets ============
  selectTab(key: TabKey): void {
    if (this.activeTab() === key) return;
    this.activeTab.set(key);
    this.search.set('');
    this.currentPage.set(1);
  }

  tabCount(key: TabKey): number {
    return this.rawList(key).length;
  }

  isArticles = computed(() => this.activeTab() === 'articles');
  isMediaCats = computed(() => this.activeTab() === 'mediacats');

  // ============ Lignes (vue unifiée) ============
  private rawList(key: TabKey): (TypeDocument | ArticleCategoryItem | MediaCategoryItem)[] {
    if (key === 'documents') return this.docTypes();
    if (key === 'projets') return this.projTypes();
    if (key === 'mediacats') return this.mediaCats();
    return this.artCats();
  }

  private toRow(item: TypeDocument | ArticleCategoryItem | MediaCategoryItem): Row {
    if (this.isArticles()) {
      const c = item as ArticleCategoryItem;
      return { id: c.id, primary: c.label, badge: c.code, description: c.description || '', count: c.articleCount, raw: c };
    }
    if (this.isMediaCats()) {
      const c = item as MediaCategoryItem;
      return { id: c.id, primary: c.label, description: c.description || '', count: c.mediaCount, raw: c };
    }
    const t = item as TypeDocument;
    return { id: t.id, primary: t.name, description: t.description || '', raw: t };
  }

  rows = computed<Row[]>(() => {
    const list = this.rawList(this.activeTab()).map((i) => this.toRow(i));
    const q = this.search().trim().toLowerCase();
    if (!q) return list;
    return list.filter(r =>
      r.primary.toLowerCase().includes(q) ||
      (r.badge ?? '').toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q));
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize)));

  paginated = computed<Row[]>(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.rows().slice(start, start + this.pageSize);
  });

  onSearch(): void {
    this.currentPage.set(1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }
  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  // ============ Modal CRUD ============
  openCreate(): void {
    this.editingId.set(null);
    this.form = { code: '', label: '', name: '', description: '', displayOrder: this.nextOrder() };
    this.showModal.set(true);
  }

  openEdit(row: Row): void {
    this.editingId.set(row.id);
    if (this.isArticles()) {
      const c = row.raw as ArticleCategoryItem;
      this.form = { code: c.code, label: c.label, name: '', description: c.description || '', displayOrder: c.displayOrder ?? 0 };
    } else if (this.isMediaCats()) {
      const c = row.raw as MediaCategoryItem;
      this.form = { code: '', label: c.label, name: '', description: c.description || '', displayOrder: c.displayOrder ?? 0 };
    } else {
      const t = row.raw as TypeDocument;
      this.form = { code: '', label: '', name: t.name, description: t.description || '', displayOrder: 0 };
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  private nextOrder(): number {
    const src = this.isMediaCats() ? this.mediaCats() : this.artCats();
    const orders = src.map(c => c.displayOrder ?? 0);
    return orders.length ? Math.max(...orders) + 1 : 1;
  }

  formValid(): boolean {
    if (this.isArticles()) return !!this.form.code.trim() && !!this.form.label.trim();
    if (this.isMediaCats()) return !!this.form.label.trim();
    return !!this.form.name.trim() && !!this.form.description.trim();
  }

  save(): void {
    if (!this.formValid()) return;
    this.saving.set(true);
    const id = this.editingId();
    const tab = this.activeTab();

    let request: Observable<unknown>;
    if (tab === 'articles') {
      const payload = {
        code: this.form.code.trim(),
        label: this.form.label.trim(),
        description: this.form.description.trim(),
        displayOrder: this.form.displayOrder,
      };
      request = id ? this.api.updateArticleCategoryItem(id, payload) : this.api.createArticleCategoryItem(payload);
    } else if (tab === 'mediacats') {
      const payload = {
        label: this.form.label.trim(),
        description: this.form.description.trim(),
        displayOrder: this.form.displayOrder,
      };
      request = id ? this.api.updateMediaCategory(id, payload) : this.api.createMediaCategory(payload);
    } else {
      const payload = { name: this.form.name.trim(), description: this.form.description.trim() };
      if (tab === 'documents') {
        request = id ? this.api.updateTypes(id, payload) : this.api.createTypes(payload);
      } else {
        request = id ? this.api.updateTypesProjets(id, payload) : this.api.createTypesProjets(payload);
      }
    }

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadAll();
        this.notify(id ? 'Modification enregistrée avec succès' : 'Élément créé avec succès', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(this.errorMessage(err, 'Erreur lors de la sauvegarde'), 'error');
      },
    });
  }

  // ============ Suppression ============
  askDelete(row: Row): void {
    const what = this.isArticles() ? "cette catégorie d'article"
      : this.isMediaCats() ? 'cette catégorie de média'
      : `ce ${this.activeTab() === 'documents' ? 'type de document' : 'type de projet'}`;
    this.confirmModal.set({
      show: true,
      message: `Voulez-vous vraiment supprimer ${what} « ${row.primary} » ?`,
      onConfirm: () => this.doDelete(row),
    });
  }

  private doDelete(row: Row): void {
    const tab = this.activeTab();
    let request: Observable<unknown>;
    if (tab === 'documents') request = this.api.deleteTypes(row.id);
    else if (tab === 'projets') request = this.api.deleteTypesProjets(row.id);
    else if (tab === 'mediacats') request = this.api.deleteMediaCategory(row.id);
    else request = this.api.deleteArticleCategoryItem(row.id);

    request.subscribe({
      next: () => {
        this.closeConfirm();
        this.loadAll();
        this.notify('Suppression effectuée avec succès', 'success');
      },
      error: (err) => {
        this.closeConfirm();
        this.notify(this.errorMessage(err, 'Erreur lors de la suppression'), 'error');
      },
    });
  }

  closeConfirm(): void {
    this.confirmModal.update(c => ({ ...c, show: false }));
  }

  // ============ Utilitaires ============
  private errorMessage(err: unknown, fallback: string): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message || fallback;
  }

  private notify(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2500): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), duration);
  }
}
