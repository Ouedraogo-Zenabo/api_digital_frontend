import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../core/services/search.service';
import { SearchItem, SearchResponseModel } from '../../core/models';

const TYPE_ORDER = ['actualite', 'communique', 'projet', 'agenda', 'evenement', 'document',
                    'service', 'faq', 'media', 'ministere', 'conseil', 'page'];

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './search.component.html',
})
export class SearchComponent {
  query = signal('');
  input = '';
  loading = signal(false);

  response = signal<SearchResponseModel | null>(null);
  /** Facettes de la requête complète (non filtrée) — pour garder les puces stables. */
  private allFacets = signal<Record<string, number>>({});
  /** Suggestions « Vouliez-vous dire… » (issues de la requête complète). */
  suggestions = signal<string[]>([]);
  activeFilter = signal<string>('all');
  page = signal(0);

  private readonly size = 10;
  labelOf = SearchService.labelOf;

  results = computed(() => this.response()?.results ?? []);
  totalPages = computed(() => this.response()?.totalPages ?? 0);
  /** Nombre de résultats pour le filtre courant. */
  filteredTotal = computed(() => this.response()?.totalResults ?? 0);
  /** Total tous types confondus (somme des facettes). */
  grandTotal = computed(() => Object.values(this.allFacets()).reduce((a, b) => a + b, 0));

  /** Puces de filtre avec compteurs, dans l'ordre défini, uniquement les types présents. */
  filters = computed(() => {
    const f = this.allFacets();
    return TYPE_ORDER.filter(t => (f[t] || 0) > 0).map(t => ({ type: t, label: this.labelOf(t), count: f[t] }));
  });

  constructor(private search: SearchService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      const q = (p['q'] || '').trim();
      this.query.set(q);
      this.input = q;
      this.activeFilter.set('all');
      this.page.set(0);
      if (q) this.runSearch(true); else { this.response.set(null); this.allFacets.set({}); }
    });
  }

  submit(): void {
    this.router.navigate(['/recherche'], { queryParams: { q: this.input.trim() } });
  }

  /** Relance la recherche à partir d'une suggestion. */
  searchSuggestion(s: string): void {
    this.input = s;
    this.submit();
  }

  setFilter(type: string): void {
    if (this.activeFilter() === type) return;
    this.activeFilter.set(type);
    this.page.set(0);
    this.runSearch(false);
  }

  prevPage(): void {
    if (this.page() > 0) { this.page.update(v => v - 1); this.runSearch(false); this.scrollTop(); }
  }

  nextPage(): void {
    if (this.page() < this.totalPages() - 1) { this.page.update(v => v + 1); this.runSearch(false); this.scrollTop(); }
  }

  open(item: SearchItem): void {
    if (SearchService.isExternal(item.url)) window.open(item.url, '_blank');
    else if (item.url) this.router.navigateByUrl(item.url);
  }

  private runSearch(refreshFacets: boolean): void {
    const q = this.query();
    if (!q) return;
    this.loading.set(true);
    const filter = this.activeFilter();
    this.search.searchFull(q, {
      types: filter === 'all' ? undefined : [filter],
      page: this.page(),
      size: this.size,
    }).subscribe(res => {
      this.response.set(res);
      // Les facettes et suggestions ne sont fiables que sur la requête complète (non filtrée).
      if (refreshFacets || filter === 'all') {
        this.allFacets.set(res.facets || {});
        this.suggestions.set(res.suggestions || []);
      }
      this.loading.set(false);
    });
  }

  private scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  iconClass(type: string): string {
    return ({
      actualite: 'bg-emerald-100 text-emerald-600',
      communique: 'bg-red-100 text-red-600',
      projet: 'bg-blue-100 text-blue-600',
      agenda: 'bg-orange-100 text-orange-600',
      evenement: 'bg-purple-100 text-purple-600',
      document: 'bg-amber-100 text-amber-600',
      service: 'bg-teal-100 text-teal-600',
      faq: 'bg-slate-200 text-slate-600',
    } as Record<string, string>)[type] || 'bg-slate-100 text-slate-600';
  }
}
