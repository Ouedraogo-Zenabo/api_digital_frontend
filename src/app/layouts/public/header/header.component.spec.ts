import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { ApiService } from '../../../core/services/api.service';
import { MinistereService } from '../../../core/services/ministere.service';
import { SearchService } from '../../../core/services/search.service';
import { AuthService } from '../../../core/services/auth.service';

describe('HeaderComponent — responsive de la barre de navigation', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ApiService, useValue: {
          getAllMins: () => of({ success: true, data: { content: [] } }),
          getminById: () => of({ success: true, data: null }),
          getPublicFlashInfos: () => of([]),
          getTickerConfig: () => of({}),
        } },
        { provide: MinistereService, useValue: {} },
        { provide: SearchService, useValue: { searchTop: () => of([]) } },
        { provide: AuthService, useValue: { isAdmin: () => false } },
      ],
    });
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('la nav horizontale n\'apparaît qu\'à partir de 1440px (sinon : hamburger)', () => {
    const el = render();
    const nav = el.querySelector('header nav')!;
    // masquée par défaut, révélée uniquement au breakpoint 1440
    expect(nav.className).toContain('hidden');
    expect(nav.className).toContain('min-[1440px]:flex');
  });

  it('le bouton « hamburger » est masqué à partir de 1440px', () => {
    const el = render();
    const burger = el.querySelector('button[aria-label="Menu"]')!;
    expect(burger.className).toContain('min-[1440px]:hidden');
  });

  it('le menu mobile donne accès à TOUTES les rubriques + sous-menus', () => {
    const el = render();
    const mobileNav = el.querySelector('.min-\\[1440px\\]\\:hidden nav') as HTMLElement;
    expect(mobileNav).toBeTruthy();
    const txt = mobileNav.textContent || '';
    for (const rubrique of ['Accueil', 'Ministère', 'Actualités', 'Communiqués', 'Grands Chantiers',
                            'Services', 'Événements', 'Médiathèque', 'Ressources', 'Contact']) {
      expect(txt).toContain(rubrique);
    }
  });

  it('exactement une des deux navigations est prévue à chaque largeur (pas de zone morte)', () => {
    const el = render();
    const nav = el.querySelector('header nav')!;
    const burger = el.querySelector('button[aria-label="Menu"]')!;
    // desktop nav : hidden puis flex @1440 ; hamburger : visible puis hidden @1440
    expect(nav.className).toMatch(/hidden/);
    expect(nav.className).toMatch(/min-\[1440px\]:flex/);
    expect(burger.className).toMatch(/min-\[1440px\]:hidden/);
    expect(burger.className).not.toMatch(/(^|\s)hidden(\s|$)/);
  });
});
