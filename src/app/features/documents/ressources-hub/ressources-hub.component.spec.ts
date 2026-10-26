import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RessourcesHubComponent } from './ressources-hub.component';

describe('RessourcesHubComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RessourcesHubComponent],
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  }));

  it('se crée', () => {
    expect(TestBed.createComponent(RessourcesHubComponent).componentInstance).toBeTruthy();
  });

  it('propose les 3 sous-rubriques (Règlementation, Stratégie, FAQ)', async () => {
    const fixture = TestBed.createComponent(RessourcesHubComponent);
    await fixture.whenStable();
    const cards = fixture.componentInstance.cards;
    expect(cards.map(c => c.link).sort()).toEqual(['/faq', '/ressources/documents', '/ressources/politiques']);
    const links = fixture.nativeElement.querySelectorAll('a[href="/ressources/documents"], a[href="/ressources/politiques"], a[href="/faq"]');
    expect(links.length).toBe(3);
  });
});
