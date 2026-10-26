import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UploadService } from './upload.service';
import { environment } from '../../../environments/environment';

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('upload() poste un FormData sur /uploads', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.upload(file).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/uploads`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ url: '/uploads/editor/2026/09/a.png', name: 'a.png', type: 'image/png', isImage: true, isPdf: false });
  });

  describe('absolute()', () => {
    it('préfixe un chemin relatif', () => {
      expect(service.absolute('/uploads/x.png')).toBe(environment.FileUrl + '/uploads/x.png');
      expect(service.absolute('uploads/x.png')).toBe(environment.FileUrl + '/uploads/x.png');
    });
    it('laisse http/data/blob intacts', () => {
      expect(service.absolute('https://cdn/x')).toBe('https://cdn/x');
      expect(service.absolute('blob:abc')).toBe('blob:abc');
    });
  });
});
