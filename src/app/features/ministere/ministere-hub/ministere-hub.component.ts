import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface HubCard {
  label: string;
  description: string;
  link: string;
  icon: string; // SVG path "d"
}

/**
 * Page « Ministère » : vue d'ensemble de la rubrique. Chaque sous-rubrique du
 * menu déroulant y est présentée sous forme de carte, pour accéder à
 * l'information sans avoir à dérouler le menu.
 */
@Component({
  selector: 'app-ministere-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <!-- Bannière -->
  <div class="relative overflow-hidden bg-gradient-to-r from-[#00843B] to-[#006B30] py-16">
    <div class="container mx-auto px-4 relative">
      <nav class="text-green-100 text-sm mb-3">
        <a routerLink="/" class="hover:text-white transition-colors">Accueil</a>
        <span class="mx-2">›</span>
        <span class="text-white">Ministère</span>
      </nav>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
          </svg>
        </div>
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white">Le Ministère</h1>
          <p class="text-green-100 text-sm mt-1">Organisation, missions et structures du ministère</p>
        </div>
      </div>
    </div>
  </div>

  <section class="py-14 bg-gray-50 min-h-[50vh]">
    <div class="container mx-auto px-4 max-w-5xl">
      <div class="grid sm:grid-cols-2 gap-5">
        @for (c of cards; track c.link) {
          <a [routerLink]="c.link"
             class="group bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 hover:border-[#00843B]/40 hover:shadow-md transition-all">
            <div class="w-12 h-12 rounded-xl bg-[#E6F5EB] text-[#00843B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00843B] group-hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="c.icon"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h2 class="font-semibold text-slate-800 group-hover:text-[#00843B] transition-colors">{{ c.label }}</h2>
              <p class="text-sm text-slate-500 mt-1">{{ c.description }}</p>
            </div>
          </a>
        }
      </div>
    </div>
  </section>
  `,
})
export class MinistereHubComponent {
  cards: HubCard[] = [
    { label: 'Le Ministre', link: '/ministere/ministre',
      description: 'Présentation et biographie du Ministre en exercice.',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Missions & Visions', link: '/ministere/missions',
      description: 'Les attributions et domaines de compétence du ministère.',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Organisation', link: '/ministere/organigramme',
      description: "L'organigramme et les directions du ministère.",
      icon: 'M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z' },
    { label: 'Structures rattachées', link: '/ministere/structures',
      description: 'Agences et établissements sous tutelle du ministère.',
      icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    { label: 'Anciens Ministres', link: '/ministere/anciens-ministres',
      description: 'Les ministres qui se sont succédé et leurs mandats.',
      icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];
}
