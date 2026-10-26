import { Component, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { Ministere } from '../../../core/models/event.model';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { MinistereService } from '../../../core/services/ministere.service';
import { SearchService } from '../../../core/services/search.service';
import { SearchItem } from '../../../core/models';
import { FlashTickerComponent } from './flash-ticker/flash-ticker.component';


@Component({
  selector: 'app-header',
  standalone: true,
imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, FlashTickerComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  activeSection: string = '';
   loading = signal(true);
    private authService = inject(AuthService);
     private readonly API_URL = environment.FileUrl;
     private apiService = inject(ApiService);
     private etatService = inject(MinistereService);
  
  mobileMenuOpen = signal(false);
  searchOpen = signal(false);
  openSubmenu = signal<string | null>(null);

     ministeres= signal<Ministere[]>([]);
     ministere1!: Ministere;
     ministere = signal<Ministere | null>(null); 

     constructor(private router: Router) {}


      ngOnInit() {
    this.loadMinistere();
    this.initLiveSearch();
  }
  
  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
    if (!this.mobileMenuOpen()) {
      this.openSubmenu.set(null);
    }
  }
  
  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
    this.openSubmenu.set(null);
  }
  
  searchQuery = '';

  // ===================== Recherche instantanée (typeahead) =====================
  private searchService = inject(SearchService);
  private searchInput$ = new Subject<string>();
  liveResults = signal<SearchItem[]>([]);
  searching = signal(false);
  activeIndex = signal(-1);
  readonly minLength = SearchService.MIN_LENGTH;
  labelOf = SearchService.labelOf;

  /** Câblage du flux de recherche instantanée (debounce + annulation des requêtes obsolètes). */
  private initLiveSearch() {
    this.searchInput$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(q => this.searching.set(q.trim().length >= this.minLength)),
      switchMap(q => q.trim().length >= this.minLength ? this.searchService.searchTop(q, 8) : of([] as SearchItem[]))
    ).subscribe(results => {
      this.liveResults.set(results);
      this.searching.set(false);
      this.activeIndex.set(-1);
    });
  }

  onSearchInput(value: string) {
    this.searchQuery = value;
    this.searchInput$.next(value);
  }

  /** Aperçu limité affiché dans le menu déroulant. */
  previewResults(): SearchItem[] {
    return this.liveResults().slice(0, 8);
  }

  toggleSearch() {
    this.searchOpen.update(v => !v);
    if (!this.searchOpen()) this.clearSearch();
  }

  private clearSearch() {
    this.liveResults.set([]);
    this.activeIndex.set(-1);
    this.searching.set(false);
  }

  /** Ouvre un résultat (route interne ou lien externe pour les services). */
  openResult(r: SearchItem) {
    this.searchOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.clearSearch();
    if (SearchService.isExternal(r.url)) {
      window.open(r.url, '_blank');
    } else if (r.url) {
      this.router.navigateByUrl(r.url);
    }
  }

  /** Navigation clavier dans la liste de résultats. */
  onSearchKeydown(event: KeyboardEvent) {
    const list = this.previewResults();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.set(Math.min(this.activeIndex() + 1, list.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set(Math.max(this.activeIndex() - 1, -1));
    } else if (event.key === 'Enter') {
      const i = this.activeIndex();
      if (i >= 0 && i < list.length) {
        event.preventDefault();
        this.openResult(list[i]);
      }
      // sinon : ngSubmit -> doSearch (page complète)
    } else if (event.key === 'Escape') {
      this.searchOpen.set(false);
      this.clearSearch();
    }
  }

  doSearch() {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.searchOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.clearSearch();
    this.router.navigate(['/recherche'], { queryParams: { q } });
  }
  
  toggleSubmenu(menu: string) {
    this.openSubmenu.update(v => v === menu ? null : menu);
  }
  
  @HostListener('window:resize')
  onResize() {
    // La navigation horizontale apparaît à partir de 1440px ; en dessous c'est le
    // menu « hamburger ». On referme donc ce dernier une fois passé ce seuil.
    if (window.innerWidth >= 1440) {
      this.mobileMenuOpen.set(false);
      this.openSubmenu.set(null);
    }
  }

    loadMinistere(): void {
      this.loading.set(true);

      this.apiService.getAllMins(0, 10).subscribe({
        next: (response) => {
          if (response.success) {
            // articles DEJA paginés par le backend
            this.ministeres.set(response.data.content);

            // Récupérer l'ID du premier ministère
            const articlesArray = this.ministeres(); // <-- important !

            if (articlesArray.length > 0) {
              const ministereId = articlesArray[0].id;
              this.loadMinistereById(ministereId);
            }

          
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }


    loadMinistereById(id: string) {
      this.apiService.getminById(id).subscribe({
        next: (response) => {
          
          if (response.success) {
       this.ministere.set(response.data); // ✅ extraire data
        //console.log('Ministère chargé :', this.ministere);
        } else {
          console.error('Erreur :', response.message);
        }
        },
        error: (err) => {
          console.error('Erreur chargement ministère', err);
        }
      });
    }

      getImageUrl(path?: string): string | null {
    return path ? this.API_URL + path : null;
   
  }


setActive(section: string) {
  this.activeSection = section; // pour le scroll ou menu
}

@HostListener('window:scroll', [])
onScroll(): void {
  if (this.router.url !== '/') return;

  const sections = ['hero', 'projets', 'actualites'];
  let currentSection = '';

  for (let section of sections) {
    const element = document.getElementById(section);
    if (element) {
      const rect = element.getBoundingClientRect();
      // si le haut de la section est visible ou passé
      if (rect.top <= 150) {
        currentSection = section;
      }
    }
  }

  this.activeSection = currentSection; // '' si aucune n’est passée
}

goToAccueil() {
  this.activeSection = ''; // réinitialise la section active
  this.router.navigate(['/']).then(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

goToSection(section: string) {
  this.activeSection = ''; // 🔥 Réinitialise tout avant scroll
  if (this.router.url !== '/') {
    this.router.navigate(['/']).then(() => {
      setTimeout(() => this.scrollTo(section), 100);
    });
  } else {
    this.scrollTo(section);
  }
}

scrollTo(section: string) {
  const element = document.getElementById(section);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// Routes de la rubrique Ressources (vue d'ensemble + sous-rubriques)
ressourcesRoutes = ['/ressources', '/faq'];

isRessourcesActive(): boolean {
  const url = this.router.url.split('?')[0];
  return this.ressourcesRoutes.some(route => url === route || url.startsWith(route + '/'));
}

// Routes de la rubrique Ministère (vue d'ensemble + sous-rubriques)
ministereRoutes = ['/ministere'];

// Fonction pour savoir si le parent Ministère doit être actif
isMinistereActive(): boolean {
  const url = this.router.url.split('?')[0];
  return this.ministereRoutes.some(route => url === route || url.startsWith(route + '/'));
}

}
