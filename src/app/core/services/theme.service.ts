import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ApiService } from './api.service';
import { ThemeModel } from '../models';

/**
 * Applique le thème validé (couleurs de marque) sur tout le site.
 *
 * Au démarrage, on récupère le thème actif du backend et on écrit ses couleurs
 * dans les variables CSS `:root` (--color-primary, --color-primary-dark, …).
 * Les classes utilitaires de la charte lisent ces variables (voir styles.scss),
 * donc l'ensemble du site suit automatiquement le thème.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {

  private doc = inject(DOCUMENT);
  private api = inject(ApiService);

  /** Charge le thème actif et l'applique (appelé au démarrage de l'application). */
  loadAndApply(): void {
    this.api.getActiveTheme().subscribe({
      next: r => { if (r.success && r.data) this.apply(r.data); },
      error: () => { /* on garde les valeurs par défaut du :root */ },
    });
  }

  /** Écrit les couleurs du thème dans les variables CSS de la racine. */
  apply(theme: ThemeModel): void {
    const root = this.doc.documentElement;
    const primary = this.normalize(theme.primaryColor) || '#00843B';

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-dark', this.darken(primary, 0.14));

    const accent = this.normalize(theme.accentColor);
    const secondary = this.normalize(theme.secondaryColor);
    const tertiary = this.normalize(theme.tertiaryColor);
    if (accent) root.style.setProperty('--color-accent', accent);
    if (secondary) root.style.setProperty('--color-secondary', secondary);
    if (tertiary) root.style.setProperty('--color-tertiary', tertiary);
  }

  /** Valide/normalise une couleur hex (#RGB ou #RRGGBB), sinon null. */
  private normalize(value?: string): string | null {
    if (!value) return null;
    const v = value.trim();
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : null;
  }

  /** Assombrit une couleur hex d'un facteur (0..1) pour les survols / dégradés. */
  private darken(hex: string, amount: number): string {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
    const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
    const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }
}
