import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FlashTickerComponent } from './flash-ticker.component';
import { ApiService } from '../../../../core/services/api.service';
import { TickerStateService } from '../../../../core/services/ticker-state.service';

describe('FlashTickerComponent', () => {
  function setup(items: any[]) {
    TestBed.configureTestingModule({
      imports: [FlashTickerComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        TickerStateService,
        { provide: ApiService, useValue: {
          getPublicFlashInfos: () => of(items),
          getTickerConfig: () => of({ scrollDuration: 25 }),
        } },
      ],
    });
    const fixture = TestBed.createComponent(FlashTickerComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('ne rend rien quand il n\'y a aucune flash info', () => {
    const fixture = setup([]);
    expect(fixture.nativeElement.querySelector('.flash-track')).toBeNull();
    expect(TestBed.inject(TickerStateService).visible()).toBe(false);
  });

  it('rend un nombre PAIR de copies de la liste (2 moitiés identiques → -50%)', () => {
    const items = [
      { id: 'a', title: 'Info A' },
      { id: 'b', title: 'Info B' },
      { id: 'c', title: 'Info C' },
    ];
    const fixture = setup(items);
    const spans = fixture.nativeElement.querySelectorAll('.flash-track > span');
    expect(spans.length % (items.length * 2)).toBe(0);
    expect(spans.length).toBeGreaterThanOrEqual(items.length * 2);
    expect(TestBed.inject(TickerStateService).visible()).toBe(true);
  });

  it('la piste a la largeur de son contenu (w-max) — condition du translateX(-50%) continu', () => {
    const track = setup([{ id: 'a', title: 'A' }]).nativeElement.querySelector('.flash-track');
    expect(track.classList.contains('w-max')).toBe(true);
  });

  it('applique la durée de défilement issue de la config admin', () => {
    const track = setup([{ id: 'a', title: 'A' }]).nativeElement.querySelector('.flash-track');
    expect(track.style.animationDuration).toBe('25s');
  });
});
