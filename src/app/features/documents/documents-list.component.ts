import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Document } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<!-- Bannière -->
<div class="relative overflow-hidden bg-gradient-to-r from-[#00843B] to-[#006B30] py-14">
  <div class="absolute inset-0 opacity-10 pointer-events-none"
       style="  background-size: 28px 28px;"></div>
  <div class="container mx-auto px-4 relative">
    <nav class="text-green-100 text-sm mb-3">
      <a routerLink="/" class="hover:text-white transition-colors">Accueil</a>
      <span class="mx-2">›</span>
      <span class="text-white">Documents</span>
    </nav>
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
      </div>
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold text-white">Documents & ressources</h1>
        <p class="text-green-100 text-sm mt-1">Rapports, guides, formulaires et publications du ministère</p>
      </div>
    </div>
  </div>
</div>

<section class="py-10 bg-gray-50 min-h-[60vh]">
  <div class="container mx-auto px-4 max-w-6xl">

    <!-- Recherche -->
    <div class="bg-white border border-slate-200 rounded-2xl p-3 mb-6 flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/></svg>
        <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="search()" placeholder="Rechercher un document..."
               class="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#00843B]/30 focus:border-[#00843B] outline-none"/>
      </div>
      <button (click)="search()" class="px-6 py-2.5 bg-[#00843B] text-white text-sm font-medium rounded-xl hover:bg-[#006e31] transition-colors">Rechercher</button>
    </div>

    <!-- Chargement -->
    <div *ngIf="loading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div *ngFor="let s of [1,2,3,4,5,6]" class="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse h-40"></div>
    </div>

    <div *ngIf="!loading()">
      <!-- Filtres + compteur -->
      <div class="flex flex-wrap items-center gap-2 mb-5">
        <button (click)="selectCategory(null)"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          [ngClass]="!selectedCategory() ? 'bg-[#00843B] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">
          Tous ({{ allDocuments().length }})
        </button>
        <button *ngFor="let c of categories()" (click)="selectCategory(c.key)"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          [ngClass]="selectedCategory() === c.key ? 'bg-[#00843B] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">
          {{ getCategoryLabel(c.key) }} ({{ c.count }})
        </button>
      </div>

      <!-- Vide -->
      <div *ngIf="documents().length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-100">
        <svg class="w-14 h-14 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
        <p class="text-slate-500 font-medium">Aucun document trouvé</p>
      </div>

      <!-- Grille de cartes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let doc of documents()"
             class="group bg-white border border-slate-200 rounded-2xl p-5 flex flex-col hover:shadow-md hover:border-[#00843B]/30 transition-all">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" [ngClass]="categoryStyle(doc.category).icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full mt-1" [ngClass]="categoryStyle(doc.category).badge">{{ getCategoryLabel(doc.category) }}</span>
          </div>
          <h3 class="font-semibold text-slate-800 leading-snug line-clamp-2">{{ doc.title }}</h3>
          <p *ngIf="doc.description" class="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{{ stripHtml(doc.description) }}</p>
          <div class="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <span *ngIf="doc.fileSize">{{ formatFileSize(doc.fileSize) }}</span>
            <span *ngIf="doc.createdAt">· {{ doc.createdAt | date:'dd/MM/yyyy' }}</span>
          </div>
          <button *ngIf="doc.filePath" (click)="downloadFile(doc)"
            class="mt-4 inline-flex items-center justify-center gap-2 w-full px-3.5 py-2 border border-[#00843B] text-[#00843B] text-sm font-medium rounded-xl hover:bg-[#e7f6ee] transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Télécharger
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="totalPages() > 1" class="flex flex-wrap justify-center items-center gap-1.5 mt-8">
        <button (click)="prevPage()" [disabled]="currentPage() === 1"
          class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white">‹</button>
        <button *ngFor="let page of pages()" (click)="goToPage(page)"
          class="px-3.5 py-1.5 text-sm rounded-lg border transition-colors"
          [ngClass]="currentPage() === page ? 'bg-[#00843B] text-white border-[#00843B]' : 'border-slate-300 hover:bg-white'">
          {{ page }}
        </button>
        <button (click)="nextPage()" [disabled]="currentPage() === totalPages()"
          class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white">›</button>
      </div>
    </div>
  </div>
</section>
  `
})
export class DocumentsListComponent implements OnInit {
  private readonly API_URL = environment.FileUrl;

  allDocuments = signal<Document[]>([]);
  documents = signal<Document[]>([]);
  selectedCategory = signal<string | null>(null);
  loading = signal(true);
  searchQuery = '';
  pageSize = 9;
  currentPage = signal(1);
  totalPages = signal(1);

  categories = computed(() => {
    const map = new Map<string, number>();
    this.allDocuments().forEach(d => map.set(d.category, (map.get(d.category) || 0) + 1));
    return Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => a.key.localeCompare(b.key));
  });
  filteredCount = computed(() =>
    this.allDocuments().filter(d => !this.selectedCategory() || d.category === this.selectedCategory()).length
  );
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  constructor(private apiService: ApiService, private http: HttpClient) {}

  ngOnInit(): void { this.loadDocuments(); }

  loadDocuments(): void {
    this.loading.set(true);
    this.apiService.getPublicDocuments(0, 300).subscribe({
      next: (response) => {
        if (response.success) {
          this.allDocuments.set(response.data.content.filter((d: any) => d.typeDocument !== 'DOCUMENT POLITIQUE'));
          this.currentPage.set(1);
          this.filterDocuments();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  search(): void {
    if (!this.searchQuery.trim()) { this.loadDocuments(); return; }
    this.loading.set(true);
    this.apiService.searchDocuments(this.searchQuery, 0, 300).subscribe({
      next: (response) => {
        if (response.success) {
          this.allDocuments.set(response.data.content.filter((d: any) => d.typeDocument !== 'DOCUMENT POLITIQUE'));
          this.currentPage.set(1);
          this.filterDocuments();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectCategory(cat: string | null): void {
    this.selectedCategory.set(this.selectedCategory() === cat ? null : cat);
    this.currentPage.set(1);
    this.filterDocuments();
  }

  filterDocuments(): void {
    const filtered = this.allDocuments().filter(d => !this.selectedCategory() || d.category === this.selectedCategory());
    this.totalPages.set(Math.max(1, Math.ceil(filtered.length / this.pageSize)));
    const start = (this.currentPage() - 1) * this.pageSize;
    this.documents.set(filtered.slice(start, start + this.pageSize));
  }

  goToPage(p: number): void { if (p < 1 || p > this.totalPages()) return; this.currentPage.set(p); this.filterDocuments(); }
  prevPage(): void { this.goToPage(this.currentPage() - 1); }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = { RAPPORT: 'Rapport', LOI: 'Loi', DECRET: 'Décret', ARRETE: 'Arrêté', CIRCULAIRE: 'Circulaire', FORMULAIRE: 'Formulaire', GUIDE: 'Guide', AUTRE: 'Autre' };
    return labels[category] || category;
  }

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

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  getImageUrl(path?: string): string | null { return path ? this.API_URL + path : null; }

  downloadFile(doc: any): void {
    const url = this.getImageUrl(doc.filePath);
    if (!url) return;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = doc.fileName || doc.title || 'document';
        link.click();
        URL.revokeObjectURL(link.href);
      },
      error: () => window.open(url, '_blank'),
    });
  }
}
