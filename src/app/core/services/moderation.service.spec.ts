import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ModerationService } from './moderation.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const URL = `${environment.apiUrl}/moderation`;

describe('ModerationService', () => {
  let service: ModerationService;
  let httpMock: HttpTestingController;
  const isAdmin = signal(false);

  beforeEach(() => {
    isAdmin.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAdmin } },
      ],
    });
    service = TestBed.inject(ModerationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getPending déballe data (liste vide par défaut)', () => {
    let res: any;
    service.getPending().subscribe(d => (res = d));
    const req = httpMock.expectOne(`${URL}/pending`);
    req.flush({ success: true, data: [{ id: '1', title: 'x' }] });
    expect(res.length).toBe(1);
  });

  it('refreshCount ne fait aucun appel si l\'utilisateur n\'est pas admin', () => {
    service.refreshCount();
    httpMock.expectNone(`${URL}/pending/count`);
    expect(service.pendingCount()).toBe(0);
  });

  it('refreshCount interroge /pending/count pour un admin et met à jour le compteur', () => {
    isAdmin.set(true);
    service.refreshCount();
    const req = httpMock.expectOne(`${URL}/pending/count`);
    req.flush({ success: true, data: 3 });
    expect(service.pendingCount()).toBe(3);
  });

  it('approve poste sur /:id/approve', () => {
    service.approve('42').subscribe();
    const req = httpMock.expectOne(`${URL}/42/approve`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
    // tap(refreshCount) : non-admin → aucun appel de comptage
    httpMock.expectNone(`${URL}/pending/count`);
  });

  it('reject poste le motif sur /:id/reject', () => {
    service.reject('42', 'incomplet').subscribe();
    const req = httpMock.expectOne(`${URL}/42/reject`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ note: 'incomplet' });
    req.flush({ success: true });
  });
});
