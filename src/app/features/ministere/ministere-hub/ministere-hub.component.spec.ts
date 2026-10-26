import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MinistereHubComponent } from './ministere-hub.component';

describe('MinistereHubComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [MinistereHubComponent],
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  }));

  it('se crée', () => {
    const fixture = TestBed.createComponent(MinistereHubComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('affiche une carte par sous-rubrique, chacune avec un lien /ministere/...', async () => {
    const fixture = TestBed.createComponent(MinistereHubComponent);
    await fixture.whenStable();
    const links = fixture.nativeElement.querySelectorAll('a[href^="/ministere/"]');
    expect(links.length).toBe(fixture.componentInstance.cards.length);
    expect(fixture.componentInstance.cards.length).toBeGreaterThanOrEqual(4);
  });

  it('chaque carte pointe vers une route enfant distincte', () => {
    const routes = new Set(TestBed.createComponent(MinistereHubComponent).componentInstance.cards.map(c => c.link));
    const cards = TestBed.createComponent(MinistereHubComponent).componentInstance.cards;
    expect(routes.size).toBe(cards.length);
    for (const c of cards) expect(c.link.startsWith('/ministere/')).toBe(true);
  });
});
