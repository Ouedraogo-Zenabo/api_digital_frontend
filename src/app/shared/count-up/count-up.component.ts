import { AfterViewInit, Component, ElementRef, Input, OnDestroy, inject, signal } from '@angular/core';

/**
 * Affiche une valeur chiffrée avec une animation de comptage au défilement.
 *
 * Robuste : si la valeur ne commence pas par un nombre (ex. « — », « n/a »),
 * la chaîne est affichée telle quelle. Respecte `prefers-reduced-motion`.
 *
 * Usage :  <app-count-up [value]="etat.valeur" />
 */
@Component({
  selector: 'app-count-up',
  standalone: true,
  template: `{{ display() }}`,
})
export class CountUpComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) value = '';
  /** Durée de l'animation en ms. */
  @Input() duration = 1500;

  display = signal('');

  private host = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  private raf = 0;
  private started = false;

  ngAfterViewInit(): void {
    const raw = (this.value ?? '').trim();
    this.display.set(raw);

    // Sépare préfixe / nombre / suffixe (ex. "+ 12 500 projets").
    const m = /^(\D*?)([\d][\d\s., ]*)(.*)$/s.exec(raw);
    if (!m) return;

    const prefix = m[1];
    const suffix = m[3];
    const numText = m[2].replace(/[\s ]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
    const target = parseFloat(numText);
    if (!isFinite(target)) return;
    const decimals = (numText.split('.')[1] || '').length;

    const reduce = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') return;

    this.display.set(prefix + '0' + suffix);
    this.observer = new IntersectionObserver(entries => {
      if (!this.started && entries.some(e => e.isIntersecting)) {
        this.started = true;
        this.observer?.disconnect();
        this.run(prefix, target, decimals, suffix, raw);
      }
    }, { threshold: 0.35 });
    this.observer.observe(this.host.nativeElement);
  }

  private run(prefix: string, target: number, decimals: number, suffix: string, finalText: string): void {
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / this.duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = target * eased;
      const text = decimals
        ? current.toFixed(decimals)
        : Math.round(current).toLocaleString('fr-FR');
      this.display.set(prefix + text + suffix);
      if (p < 1) this.raf = requestAnimationFrame(step);
      else this.display.set(finalText); // restaure le formatage d'origine exact
    };
    this.raf = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}
