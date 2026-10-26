import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

describe('ApiService', () => {
  let api: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    api = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('catégories de média', () => {
    it('getMediaCategories → GET /media-categories', () => {
      let res: any;
      api.getMediaCategories().subscribe(d => (res = d));
      const req = httpMock.expectOne(`${API}/media-categories`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: '1', label: 'Podcast' }]);
      expect(res[0].label).toBe('Podcast');
    });

    it('createMediaCategory → POST /media-categories avec le corps', () => {
      api.createMediaCategory({ label: 'Infographie' }).subscribe();
      const req = httpMock.expectOne(`${API}/media-categories`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ label: 'Infographie' });
      req.flush({ id: '9', label: 'Infographie' });
    });

    it('updateMediaCategory → PUT /media-categories/:id', () => {
      api.updateMediaCategory('9', { label: 'Infographies' }).subscribe();
      const req = httpMock.expectOne(`${API}/media-categories/9`);
      expect(req.request.method).toBe('PUT');
      req.flush({ id: '9', label: 'Infographies' });
    });

    it('deleteMediaCategory → DELETE /media-categories/:id', () => {
      api.deleteMediaCategory('9').subscribe();
      const req = httpMock.expectOne(`${API}/media-categories/9`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('événements (endpoints publics)', () => {
    it('getEventById → GET /events/public/:id, réponse enveloppée ApiResponse', () => {
      let res: any;
      api.getEventById('abc').subscribe(r => (res = r));
      const req = httpMock.expectOne(`${API}/events/public/abc`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { id: 'abc', title: 'SITIC' } });
      expect(res.success).toBe(true);
      expect(res.data.title).toBe('SITIC');
    });

    it('getUpcomingEvents → GET /events/public/upcoming', () => {
      api.getUpcomingEvents().subscribe();
      const req = httpMock.expectOne(`${API}/events/public/upcoming`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });
});
