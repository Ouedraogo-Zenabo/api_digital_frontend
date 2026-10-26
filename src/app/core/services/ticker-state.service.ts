import { Injectable, signal } from '@angular/core';

/**
 * État partagé du bandeau « Flash Info » figé en haut de page.
 * Permet au layout public d'ajuster le décalage (padding-top) du contenu
 * uniquement lorsque le bandeau est réellement affiché.
 */
@Injectable({ providedIn: 'root' })
export class TickerStateService {
  /** true quand au moins une flash info active est affichée dans le bandeau. */
  visible = signal(false);
}
