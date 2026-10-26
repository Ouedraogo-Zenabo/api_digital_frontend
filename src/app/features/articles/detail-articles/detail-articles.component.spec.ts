import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { convertToParamMap, ParamMap } from '@angular/router';
import { DetailArticlesComponent } from './detail-articles.component';
import { ApiService } from '../../../core/services/api.service';
import { SeoService } from '../../../core/services/seo.service';

describe('DetailArticlesComponent — rechargement au changement de route', () => {
  let paramMap$: Subject<ParamMap>;
  let getById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    paramMap$ = new Subject<ParamMap>();
    getById = vi.fn((id: string) =>
      of({ success: true, data: { id, title: `Article ${id}`, category: 'ACTUALITE', content: '<p>x</p>' } }));

    const apiStub = {
      getPublishedArticleById: getById,
      getPublishedArticles: () => of({ success: true, data: { content: [] } }),
    };
    const seoStub = {
      update: () => {}, setBreadcrumb: () => {}, setJsonLd: () => {},
      absolute: (x: string) => x, siteName: 'MTDPCE',
    };

    TestBed.configureTestingModule({
      imports: [DetailArticlesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ApiService, useValue: apiStub },
        { provide: SeoService, useValue: seoStub },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
      ],
    });
  });

  it('charge l\'article à l\'id initial puis recharge à chaque nouvel id', () => {
    const fixture = TestBed.createComponent(DetailArticlesComponent);
    fixture.detectChanges();

    paramMap$.next(convertToParamMap({ id: 'a1' }));
    expect(getById).toHaveBeenCalledWith('a1');
    expect(fixture.componentInstance.article()?.id).toBe('a1');

    paramMap$.next(convertToParamMap({ id: 'a2' }));
    expect(getById).toHaveBeenCalledWith('a2');
    expect(fixture.componentInstance.article()?.id).toBe('a2');
    expect(getById).toHaveBeenCalledTimes(2);
  });

  it('se désabonne à la destruction (pas de rechargement après ngOnDestroy)', () => {
    const fixture = TestBed.createComponent(DetailArticlesComponent);
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ id: 'a1' }));
    fixture.destroy();
    paramMap$.next(convertToParamMap({ id: 'a2' }));
    expect(getById).toHaveBeenCalledTimes(1);
  });
});
