import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Suivi de fréquentation côté site public :
 *  - une page vue à chaque navigation Angular
 *  - les clics sur les liens (<a>)
 * Les événements sont envoyés à l'endpoint public /analytics/track.
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {

  private router = inject(Router);
  private readonly endpoint = `${environment.apiUrl}/analytics/track`;
  private readonly SESSION_KEY = 'mtdpce_visitor_id';
  private started = false;

  /** Démarre le suivi (appelé une seule fois depuis le composant racine). */
  init(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    // Page vue à chaque fin de navigation (URL initiale incluse)
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.trackPageView(e.urlAfterRedirects));

    // Clics sur les liens
    document.addEventListener('click', (event) => this.onClick(event), true);
  }

  private trackPageView(path: string): void {
    // On ne trace pas l'espace d'administration
    if (path.startsWith('/admin') || path.startsWith('/auth')) return;
    this.send({ path, type: 'PAGE_VIEW', referrer: document.referrer || null });
  }

  private onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a');
    if (!anchor) return;
    if (this.router.url.startsWith('/admin')) return;

    const label = (anchor.textContent || '').trim().slice(0, 120)
      || anchor.getAttribute('href') || '(lien)';
    this.send({
      path: this.router.url,
      type: 'CLICK',
      label,
      referrer: anchor.getAttribute('href') || null,
    });
  }

  private send(payload: { path: string; type: string; label?: string; referrer: string | null }): void {
    const body = JSON.stringify({ ...payload, sessionId: this.getSessionId() });
    // sendBeacon : non bloquant, survit au changement de page
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* silencieux */ });
  }

  private getSessionId(): string {
    let id = localStorage.getItem(this.SESSION_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() ?? 'v-' + Date.now() + '-' + Math.random().toString(36).slice(2));
      localStorage.setItem(this.SESSION_KEY, id);
    }
    return id;
  }
}
