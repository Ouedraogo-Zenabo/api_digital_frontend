import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

type Filter = 'all' | 'EN_COURS' | 'TERMINE' | 'PLANIFIE' | 'PROGRAMME';

@Component({
  selector: 'app-projets',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './projets.component.html',
  styleUrls: ['./projets.component.scss'],
})
export class ProjetsComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  /** Toute la liste, récupérée une fois — filtre + pagination gérés côté client. */
  private all = signal<Project[]>([]);
  loading = signal(true);

  searchQuery = signal('');
  activeFilter = signal<Filter>('all');
  currentPage = signal(0);
  readonly pageSize = 9;

  pageTitle = signal('Projets & Programmes');
  pageSubtitle = signal('Les grands chantiers de la transformation digitale du Burkina Faso.');

  /** Onglets de filtre affichés au-dessus de la grille. */
  readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'TERMINE', label: 'Réalisés' },
    { key: 'PLANIFIE', label: 'Planifiés' },
    { key: 'PROGRAMME', label: 'Programmes' },
  ];

  // ---- Données dérivées ----------------------------------------------------

  private matchesFilter(p: Project, f: Filter): boolean {
    if (f === 'all') return true;
    if (f === 'PROGRAMME') return (p.type as string) === 'PROGRAMME';
    return p.status === f;
  }

  filtered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const f = this.activeFilter();
    return this.all()
      .filter(p => this.matchesFilter(p, f))
      .filter(p => !q
        || p.name?.toLowerCase().includes(q)
        || this.stripHtml(p.description).toLowerCase().includes(q)
        || (p.partner || '').toLowerCase().includes(q));
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  paged = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  /** Bandeau de chiffres clés (calculé sur toute la liste). */
  stats = computed(() => {
    const list = this.all();
    return {
      total: list.length,
      enCours: list.filter(p => p.status === 'EN_COURS').length,
      termines: list.filter(p => p.status === 'TERMINE').length,
      planifies: list.filter(p => p.status === 'PLANIFIE').length,
      budget: list.reduce((s, p) => s + (p.budget || 0), 0),
    };
  });

  count(f: Filter): number {
    return this.all().filter(p => this.matchesFilter(p, f)).length;
  }

  // ---- Cycle de vie ------------------------------------------------------

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      const status = data['status'] as string | undefined;
      const type = data['type'] as string | undefined;
      this.activeFilter.set((type === 'PROGRAMME' ? 'PROGRAMME' : (status as Filter)) || 'all');
      if (data['title']) this.pageTitle.set(data['title'] as string);
      if (data['subtitle']) this.pageSubtitle.set(data['subtitle'] as string);
      this.currentPage.set(0);
      if (!this.all().length) this.loadAll();
    });
  }

  private loadAll(): void {
    this.loading.set(true);
    this.api.getPublicProjects(0, 300).subscribe({
      next: (res) => {
        this.all.set(res.success ? (res.data.content ?? []) : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(f: Filter): void {
    this.activeFilter.set(f);
    this.currentPage.set(0);
  }

  onSearch(v: string): void {
    this.searchQuery.set(v);
    this.currentPage.set(0);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    const start = Math.max(0, Math.min(cur - 2, total - 5));
    const end = Math.min(total - 1, start + 4);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }

  // ---- Helpers d'affichage ---------------------------------------------

  statusLabel(status: string): string {
    return { PLANIFIE: 'Planifié', EN_COURS: 'En cours', SUSPENDU: 'Suspendu', TERMINE: 'Terminé', ANNULE: 'Annulé' }[status] || status;
  }

  statusClass(status: string): string {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold';
    const map: Record<string, string> = {
      PLANIFIE: 'bg-slate-100 text-slate-600',
      EN_COURS: 'bg-amber-50 text-amber-700',
      SUSPENDU: 'bg-orange-50 text-orange-700',
      TERMINE: 'bg-[#E6F5EB] text-[#00843B]',
      ANNULE: 'bg-red-50 text-red-700',
    };
    return `${base} ${map[status] || 'bg-slate-100 text-slate-600'}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  }

  formatBudget(budget?: number): string {
    if (!budget) return '—';
    if (budget >= 1_000_000_000) return (budget / 1_000_000_000).toFixed(1).replace('.0', '') + ' Mds FCFA';
    if (budget >= 1_000_000) return Math.round(budget / 1_000_000) + ' M FCFA';
    return budget.toLocaleString('fr-FR') + ' FCFA';
  }

  stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
