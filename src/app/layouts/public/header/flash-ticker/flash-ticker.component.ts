import { Component, signal, computed, inject, ElementRef, afterEveryRender, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { TickerStateService } from '../../../../core/services/ticker-state.service';
import { FlashInfo } from '../../../../core/models/event.model';

/**
 * Bandeau « FLASH INFO » figé tout en haut de page (au-dessus de la navbar).
 * Le texte des flash infos actives défile à l'infini, séparé par une puce.
 *
 * Boucle sans couture : la liste est répétée dans une piste `w-max` (largeur =
 * son contenu) translatée de `-50 %` — la seconde moitié vient donc prendre
 * exactement la place de la première à la fin du cycle : les premiers éléments
 * enchaînent immédiatement les derniers.
 *
 * Pour qu'il n'y ait ni « vide » ni espacement excessif, le nombre de
 * répétitions est ajusté à la largeur réelle : une moitié de piste doit couvrir
 * juste ce qu'il faut (au moins la zone visible), pas plus. Les éléments restent
 * donc serrés (séparés par la puce), sans trou au raccord.
 */
@Component({
  selector: 'app-flash-ticker',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (items().length > 0) {
      <div class="flash-band flex items-stretch bg-[#00843B] text-white h-9 overflow-hidden select-none">

        <!-- Label figé -->
        <div class="flash-label flex items-center gap-1.5 px-3 sm:px-4 bg-red-600 font-bold text-xs sm:text-sm uppercase tracking-wide flex-shrink-0 z-10">
          <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          Flash Info
        </div>

        <!-- Zone de défilement -->
        <div class="flash-viewport relative flex-1 overflow-hidden">
          <div class="flash-track flex w-max items-center h-full whitespace-nowrap"
               [style.animationDuration]="scrollDuration() + 's'">
            <!-- copies() est pair : les 2 moitiés sont identiques → translateX(-50%) sans couture -->
            @for (rep of loopUnits(); track rep) {
              @for (f of items(); track f.id) {
                <span class="inline-flex items-center text-sm">
                  <span class="flash-bullet mx-3 sm:mx-4 text-lg leading-none"
                        [class.text-yellow-300]="f.priority === 'URGENT' || f.priority === 'HIGH'"
                        [class.text-white]="f.priority !== 'URGENT' && f.priority !== 'HIGH'">&#9679;</span>
                  @if (f.linkUrl) {
                    <a [routerLink]="f.linkUrl" class="hover:underline"
                       [class.font-semibold]="f.priority === 'URGENT'">{{ f.title }}</a>
                  } @else {
                    <span [class.font-semibold]="f.priority === 'URGENT'">{{ f.title }}</span>
                  }
                </span>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .flash-label { box-shadow: 4px 0 8px rgba(0, 0, 0, 0.15); }

    .flash-track {
      animation: flash-scroll 40s linear infinite;
      will-change: transform;
    }
    /* Pause au survol pour laisser le temps de lire / cliquer */
    .flash-viewport:hover .flash-track { animation-play-state: paused; }

    @keyframes flash-scroll {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .flash-track { animation: none; }
    }
  `]
})
export class FlashTickerComponent {
  private apiService = inject(ApiService);
  private tickerState = inject(TickerStateService);
  private host = inject(ElementRef<HTMLElement>);

  items = signal<FlashInfo[]>([]);
  scrollDuration = signal(30); // durée d'un cycle (secondes), réglable en admin

  /** Nombre total de copies de la liste dans la piste (toujours PAIR, >= 2). */
  private copies = signal(2);
  loopUnits = computed(() => Array.from({ length: this.copies() }, (_, i) => i));

  /** Nombre de passes d'ajustement autorisées (anti-boucle) depuis le dernier changement de contexte. */
  private fitBudget = 4;

  constructor() {
    // Après chaque rendu : ajuste le nombre de copies à la largeur réelle.
    // La convergence se fait en 1-2 passes puis devient un no-op.
    afterEveryRender(() => this.fitToViewport());
  }

  @HostListener('window:resize')
  onResize(): void { this.fitBudget = 4; this.fitToViewport(); }

  private fitToViewport(): void {
    if (this.fitBudget <= 0) return;

    const host = this.host.nativeElement;
    const track = host.querySelector('.flash-track') as HTMLElement | null;
    const viewport = host.querySelector('.flash-viewport') as HTMLElement | null;
    const itemCount = this.items().length;
    if (!track || !viewport || itemCount === 0) return;

    const current = this.copies();
    // Largeur d'UNE répétition de la liste (fiable : dérivée du DOM réellement rendu).
    const renderedCopies = Math.round(track.children.length / itemCount);
    if (renderedCopies < 1) return;
    const oneSetWidth = track.scrollWidth / renderedCopies;
    const viewportWidth = viewport.clientWidth;
    if (!oneSetWidth || !isFinite(oneSetWidth) || !viewportWidth) return;

    // Une MOITIÉ de piste = copies/2 répétitions, doit couvrir au moins la zone visible.
    const halfReps = Math.min(6, Math.max(1, Math.ceil((viewportWidth + 1) / oneSetWidth)));
    const needed = halfReps * 2;
    if (needed !== current) {
      this.fitBudget--;
      this.copies.set(needed);
    }
  }

  ngOnInit(): void {
    this.apiService.getPublicFlashInfos().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.items.set(list);
        this.tickerState.visible.set(list.length > 0);
        this.fitBudget = 4; // nouveau contenu → on ré-autorise l'ajustement
      },
      error: () => this.tickerState.visible.set(false)
    });

    this.apiService.getTickerConfig().subscribe({
      next: (config) => {
        if (config?.scrollDuration && config.scrollDuration > 0) {
          this.scrollDuration.set(config.scrollDuration);
        }
      },
      error: () => { /* garde la valeur par défaut */ }
    });
  }

  ngOnDestroy(): void {
    this.tickerState.visible.set(false);
  }
}
