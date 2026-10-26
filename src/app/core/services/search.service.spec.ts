import { SearchService } from './search.service';

/** Helpers statiques : testables sans instancier le service (pas de HttpClient). */
describe('SearchService (helpers statiques)', () => {
  it('labelOf mappe les types connus, sinon renvoie le type brut', () => {
    expect(SearchService.labelOf('actualite')).toBe('Actualités');
    expect(SearchService.labelOf('communique')).toBe('Communiqués');
    expect(SearchService.labelOf('evenement')).toBe('Événements');
    expect(SearchService.labelOf('inconnu')).toBe('inconnu');
  });

  it('couvre les nouveaux types transversaux (média, ministère, conseils, pages)', () => {
    expect(SearchService.labelOf('media')).toBe('Médiathèque');
    expect(SearchService.labelOf('ministere')).toBe('Ministère');
    expect(SearchService.labelOf('conseil')).toBe('Conseils');
    expect(SearchService.labelOf('page')).toBe('Pages');
  });

  it('isExternal distingue les liens internes et externes', () => {
    expect(SearchService.isExternal('/actualites')).toBe(false);
    expect(SearchService.isExternal('https://example.org')).toBe(true);
    expect(SearchService.isExternal(null)).toBe(false);
    expect(SearchService.isExternal(undefined)).toBe(false);
    expect(SearchService.isExternal('')).toBe(false);
  });

  it('MIN_LENGTH vaut 2', () => {
    expect(SearchService.MIN_LENGTH).toBe(2);
  });
});
