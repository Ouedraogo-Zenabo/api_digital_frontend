import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { SearchItem, SearchResponseModel } from '../models';

const EMPTY: SearchResponseModel = {
  query: '', totalResults: 0, page: 0, size: 0, totalPages: 0,
  results: [], facets: {}, suggestions: [], searchDurationMs: 0,
};

/**
 * Recherche riche et transversale — désormais servie par l'endpoint unifié
 * du backend (`/api/v1/public/search`) : pertinence, facettes, surbrillance
 * et pagination. Plus aucune agrégation côté client.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {

  static readonly MIN_LENGTH = 2;

  /** Libellés lisibles par type (facettes / puces de filtre). */
  static readonly TYPE_LABELS: Record<string, string> = {
    actualite: 'Actualités',
    communique: 'Communiqués',
    projet: 'Projets',
    agenda: 'Agenda',
    evenement: 'Événements',
    document: 'Documents',
    service: 'Services',
    faq: 'FAQ',
    media: 'Médiathèque',
    ministere: 'Ministère',
    conseil: 'Conseils',
    page: 'Pages',
  };

  constructor(private api: ApiService) {}

  /** Recherche complète (page de résultats) : réponse riche avec facettes et pagination. */
  searchFull(query: string, opts: { types?: string[]; page?: number; size?: number; sort?: string } = {}): Observable<SearchResponseModel> {
    const q = (query || '').trim();
    if (q.length < SearchService.MIN_LENGTH) return of(EMPTY);
    return this.api.searchAll(q, opts).pipe(
      map(r => (r.success ? r.data : EMPTY)),
      catchError(() => of(EMPTY)),
    );
  }

  /** Aperçu court (typeahead navbar). */
  searchTop(query: string, size = 8): Observable<SearchItem[]> {
    return this.searchFull(query, { size }).pipe(map(r => r.results));
  }

  /** Un lien est externe (à ouvrir dans un nouvel onglet) s'il ne commence pas par « / ». */
  static isExternal(url: string | undefined | null): boolean {
    return !!url && !url.startsWith('/');
  }

  static labelOf(type: string): string {
    return SearchService.TYPE_LABELS[type] || type;
  }
}
