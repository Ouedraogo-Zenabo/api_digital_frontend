import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MediathequeService } from './mediatheque.service';
import { environment } from '../../../environments/environment';

describe('MediathequeService', () => {
  let service: MediathequeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), MediathequeService],
    });
    service = TestBed.inject(MediathequeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('resolveUrl', () => {
    it('préfixe les chemins relatifs par le host de fichiers', () => {
      expect(service.resolveUrl('/uploads/x.jpg')).toBe(environment.FileUrl + '/uploads/x.jpg');
    });
    it('laisse les URL absolues / data / blob intactes', () => {
      expect(service.resolveUrl('https://cdn/x.jpg')).toBe('https://cdn/x.jpg');
      expect(service.resolveUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    });
    it('renvoie une chaîne vide pour une valeur absente', () => {
      expect(service.resolveUrl(null)).toBe('');
      expect(service.resolveUrl(undefined)).toBe('');
    });
  });

  describe('parseYoutube', () => {
    it('reconnaît les URL watch, youtu.be, embed, shorts et l\'ID brut', () => {
      const id = 'dQw4w9WgXcQ';
      for (const input of [
        `https://www.youtube.com/watch?v=${id}`,
        `https://youtu.be/${id}`,
        `https://www.youtube.com/embed/${id}`,
        `https://www.youtube.com/shorts/${id}`,
        id,
      ]) {
        expect(service.parseYoutube(input)?.id).toBe(id);
      }
    });
    it('renvoie null pour une entrée non reconnue', () => {
      expect(service.parseYoutube('pas une video')).toBeNull();
      expect(service.parseYoutube('')).toBeNull();
    });
  });

  it('youtubeMeta construit les URL miniature / embed / watch', () => {
    const m = service.youtubeMeta('abcdef12345');
    expect(m.thumbnail).toContain('abcdef12345');
    expect(m.embed).toContain('/embed/abcdef12345');
    expect(m.watch).toContain('watch?v=abcdef12345');
  });

  describe('humanSize', () => {
    it('formate octets / Ko / Mo', () => {
      expect(service.humanSize(512)).toBe('512 o');
      expect(service.humanSize(2048)).toBe('2 Ko');
      expect(service.humanSize(3 * 1024 * 1024)).toBe('3,0 Mo');
    });
  });

  describe('formatDuration', () => {
    it('formate mm:ss et h:mm:ss', () => {
      expect(service.formatDuration(65)).toBe('1:05');
      expect(service.formatDuration(3661)).toBe('1:01:01');
      expect(service.formatDuration(0)).toBe('');
    });
  });

  it('categories() appelle /media-categories et tolère une erreur', () => {
    service.categories().subscribe(list => expect(list).toEqual([]));
    const req = httpMock.expectOne(`${environment.apiUrl}/media-categories`);
    expect(req.request.method).toBe('GET');
    req.flush(null, { status: 500, statusText: 'Server Error' });
  });

  it('getMedia() déballe la réponse ApiResponse et absolutise les URL', () => {
    let received: any[] = [];
    service.getMedia().subscribe(list => (received = list));
    const req = httpMock.expectOne(`${environment.apiUrl}/media/public`);
    req.flush({ success: true, data: [{ id: '1', title: 'x', type: 'photo', url: '/u/a.jpg', thumbnail: '/u/t.jpg' }] });
    expect(received[0].url).toBe(environment.FileUrl + '/u/a.jpg');
    expect(received[0].thumbnail).toBe(environment.FileUrl + '/u/t.jpg');
  });
});
