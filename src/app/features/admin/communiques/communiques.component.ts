import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Article, ArticleCategory, Articlemage, ArticleStatus } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import { RichEditorComponent } from '../../../shared/rich-editor/rich-editor.component';
import { SearchBarComponent } from '../../../shared/search-bar/search-bar.component';

/**
 * CRUD des Communiqués officiels du ministère.
 *
 * Un communiqué est un article de catégorie `COMMUNIQUE` : cet écran ne manipule
 * que cette catégorie (liste filtrée, catégorie forcée à la création/édition).
 */
@Component({
  selector: 'app-admin-communiques',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RichEditorComponent, SearchBarComponent],
  templateUrl: './communiques.component.html',
})
export class CommuniquesComponent {

  private readonly FILE_URL = environment.FileUrl;

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false, message: '', type: 'success',
  });

  allItems = signal<Article[]>([]);
  search = signal('');
  loading = signal(true);
  showModal = signal(false);
  editing = signal<Article | null>(null);
  saving = signal(false);
  selectedFiles: File[] = [];
  currentPage = signal(1);
  pageSize = 8;

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const all = this.allItems();
    if (!q) return all;
    return all.filter(a =>
      [a.title, a.summary, a.content, this.getStatusLabel(a.status)]
        .some(v => (v || '').toString().toLowerCase().includes(q)));
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  items = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  form: {
    title: string; summary: string; content: string;
    status: ArticleStatus; featured: boolean; images: Articlemage[];
  } = this.emptyForm();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  private emptyForm() {
    return { title: '', summary: '', content: '', status: ArticleStatus.DRAFT, featured: false, images: [] as Articlemage[] };
  }

  load(): void {
    this.loading.set(true);
    this.apiService.getAllArticles(0, 500).subscribe({
      next: (response) => {
        if (response.success) {
          const list = (response.data.content || []).filter(a => a.category === ArticleCategory.COMMUNIQUE);
          list.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
          this.allItems.set(list);
          if (this.currentPage() > this.totalPages()) this.currentPage.set(1);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(v: string) {
    this.search.set(v);
    this.currentPage.set(1);
  }

  nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
  prevPage() { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  goToPage(page: number) { this.currentPage.set(page); }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  openModal(): void {
    this.form = this.emptyForm();
    this.selectedFiles = [];
    this.editing.set(null);
    this.showModal.set(true);
  }

  editItem(a: Article): void {
    this.form = {
      title: a.title,
      summary: a.summary || '',
      content: a.content || '',
      status: a.status,
      featured: a.featured ?? false,
      images: a.images || [],
    };
    this.selectedFiles = [];
    this.editing.set(a);
    this.showModal.set(true);
  }

  closeModal(form?: NgForm): void {
    this.showModal.set(false);
    this.editing.set(null);
    this.selectedFiles = [];
    form?.resetForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) { this.selectedFiles = []; return; }
    const valid = Array.from(input.files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (valid.length !== input.files.length) {
      this.showNotification('Certains fichiers ne sont ni des images ni des PDF et ont été ignorés.', 'info');
    }
    this.selectedFiles = valid;
  }

  saveItem(form?: NgForm): void {
    if (!this.form.title || !this.form.content) return;
    this.saving.set(true);
    const editing = this.editing();

    const dto = {
      title: this.form.title,
      summary: this.form.summary,
      content: this.form.content,
      category: ArticleCategory.COMMUNIQUE,
      status: this.form.status,
      featured: this.form.featured,
      publishToFacebook: false,
      facebookContent: '',
    };

    const formData = new FormData();
    formData.append('article', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    this.selectedFiles.forEach(f => formData.append('file', f));

    const request = editing
      ? this.apiService.updateArticle(editing.id, formData)
      : this.apiService.createArticle(formData);

    request.subscribe({
      next: () => {
        this.load();
        this.closeModal(form);
        this.saving.set(false);
        this.showNotification(editing ? 'Communiqué mis à jour' : 'Communiqué créé', 'success');
      },
      error: (err) => {
        console.error('Erreur sauvegarde communiqué', err);
        this.saving.set(false);
        this.showNotification("Échec de l'enregistrement", 'error');
      },
    });
  }

  // ---- helpers ----
  attachmentUrl(path: string): string {
    if (!path) return '';
    return /^https?:\/\//i.test(path) ? path : this.FILE_URL + path;
  }
  isPdf(path: string): boolean { return /\.pdf(\?|$)/i.test(path || ''); }

  getStatusLabel(status: string) {
    const labels: Record<string, string> = { DRAFT: 'Brouillon', PENDING: 'En attente', PUBLISHED: 'Publié', ARCHIVED: 'Archivé' };
    return labels[status] || status;
  }
  getStatusBadgeClass(status: string) {
    const classes: Record<string, string> = {
      DRAFT: 'badge bg-neutral-100 text-neutral-700 ring-1 ring-neutral-300',
      PENDING: 'badge bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
      PUBLISHED: 'badge bg-green-50 text-green-700 ring-1 ring-green-200',
      ARCHIVED: 'badge bg-red-50 text-red-700 ring-1 ring-red-200',
    };
    return classes[status] || 'badge bg-neutral-100 text-neutral-600';
  }
  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2200) {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), duration);
  }

  // ---- confirmation ----
  confirmModal = signal<{ show: boolean; message: string; onConfirm: () => void }>({
    show: false, message: '', onConfirm: () => {},
  });
  openConfirmModal(message: string, onConfirm: () => void) { this.confirmModal.set({ show: true, message, onConfirm }); }
  closeConfirmModal() { this.confirmModal.update(c => ({ ...c, show: false })); }

  deleteItem(a: Article): void {
    this.openConfirmModal(`Voulez-vous vraiment supprimer le communiqué « ${a.title} » ?`, () => {
      this.apiService.deleteArticle(a.id).subscribe({
        next: () => {
          this.load();
          this.closeConfirmModal();
          this.showNotification('Communiqué supprimé', 'success');
        },
        error: () => this.closeConfirmModal(),
      });
    });
  }
}
