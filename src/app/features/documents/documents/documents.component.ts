import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Document, TypeDocument } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent {
  private readonly API_URL = environment.FileUrl;

  /** Type de document de cette page (Règlementation). */
  private readonly TYPE = 'DOCUMENT SIMPLE';

  selectedType = signal<string | null>(null);      // catégorie sélectionnée (null = toutes)
  facets = signal<Record<string, number>>({});      // compteurs par catégorie (serveur)

  categories = computed(() =>
    Object.entries(this.facets())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => a.key.localeCompare(b.key))
  );

  /** Nombre total de documents de ce type (toutes catégories confondues). */
  totalAll = computed(() => Object.values(this.facets()).reduce((a, b) => a + b, 0));

  projects = signal<TypeDocument[]>([]);
  documents = signal<Document[]>([]);
  loading = signal(true);
  searchQuery = '';

  pageSize = 6;
  currentPage = signal(1);
  totalPages = signal(1);
  filteredCount = signal(0);

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  constructor(private apiService: ApiService, private http: HttpClient) {}

  ngOnInit(): void {
    this.browse();
    this.loadProjects();
  }

  /** Récupère la page courante depuis le serveur (type + catégorie + recherche + pagination). */
  browse(): void {
    this.loading.set(true);
    this.apiService.browseDocuments(this.TYPE, this.selectedType(), this.searchQuery, this.currentPage() - 1, this.pageSize)
      .subscribe({
        next: (response) => {
          if (response.success) {
            const d = response.data;
            this.documents.set(d.content || []);
            this.totalPages.set(Math.max(1, d.totalPages));
            this.filteredCount.set(d.totalElements);
            this.facets.set(d.facets || {});
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  selectType(category: string | null): void {
    this.selectedType.set(this.selectedType() === category ? null : category);
    this.currentPage.set(1);
    this.browse();
  }

  search(): void {
    this.currentPage.set(1);
    this.browse();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.browse();
  }

  nextPage(): void { this.goToPage(this.currentPage() + 1); }
  prevPage(): void { this.goToPage(this.currentPage() - 1); }

  categoryStyle(category: string): { icon: string; badge: string } {
    const map: Record<string, { icon: string; badge: string }> = {
      RAPPORT:    { icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
      GUIDE:      { icon: 'bg-cyan-100 text-cyan-600',       badge: 'bg-cyan-50 text-cyan-700' },
      FORMULAIRE: { icon: 'bg-indigo-100 text-indigo-600',   badge: 'bg-indigo-50 text-indigo-700' },
      LOI:        { icon: 'bg-red-100 text-red-600',         badge: 'bg-red-50 text-red-700' },
      DECRET:     { icon: 'bg-blue-100 text-blue-600',       badge: 'bg-blue-50 text-blue-700' },
      ARRETE:     { icon: 'bg-amber-100 text-amber-600',     badge: 'bg-amber-50 text-amber-700' },
      CIRCULAIRE: { icon: 'bg-purple-100 text-purple-600',   badge: 'bg-purple-50 text-purple-700' },
    };
    return map[category] || { icon: 'bg-slate-100 text-slate-600', badge: 'bg-slate-100 text-slate-600' };
  }

  stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = { RAPPORT: 'Rapport', LOI: 'Loi', DECRET: 'Décret', ARRETE: 'Arrêté', CIRCULAIRE: 'Circulaire', FORMULAIRE: 'Formulaire', GUIDE: 'Guide', AUTRE: 'Autre' };
    return labels[category] || category;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  loadProjects(): void {
    this.apiService.getAllTypes().subscribe({
      next: (response) => this.projects.set(response),
      error: (err) => console.error('Erreur API', err)
    });
  }

  getImageUrl(path?: string): string | null {
    return path ? this.API_URL + path : null;
  }

  downloadFile(doc: any): void {
    this.http.get(this.getImageUrl(doc.filePath)!, { responseType: 'blob' }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title + '.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  downloadDoc(doc: any): void {
    this.apiService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.title + '.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Erreur téléchargement', err)
    });
  }
}
