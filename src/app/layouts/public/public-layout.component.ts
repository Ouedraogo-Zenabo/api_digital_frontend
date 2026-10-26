import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


import { HeaderComponent } from './header/header.component';
import { FootersComponent } from "./footers/footers.component";
import { TickerStateService } from '../../core/services/ticker-state.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FootersComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Lien d'évitement (accessibilité clavier) : masqué jusqu'au focus -->
      <a href="#main-content" class="skip-link">Aller au contenu principal</a>
      <app-header />
      <!-- Décalage supplémentaire quand le bandeau Flash Info (h-9 = 36px) est affiché -->
      <main id="main-content" tabindex="-1" class="flex-1 outline-none"
            [ngClass]="tickerState.visible() ? 'pt-[100px] sm:pt-[116px]' : 'pt-16 sm:pt-20'">
        <router-outlet />
      </main>
      <app-footers />
    </div>
  `
})
export class PublicLayoutComponent {
  tickerState = inject(TickerStateService);
}
