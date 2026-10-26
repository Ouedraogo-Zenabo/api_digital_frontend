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
 * Page « Ressources » : vue d'ensemble de la rubrique. Chaque sous-rubrique du
 * menu déroulant y est présentée sous forme de carte.
 */
@Component({
  selector: 'app-ressources-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <!-- Bannière -->
  <div class="relative overflow-hidden bg-gradient-to-r from-[#00843B] to-[#006B30] py-16">
    <div class="container mx-auto px-4 relative">
      <nav class="text-green-100 text-sm mb-3">
        <a routerLink="/" class="hover:text-white transition-colors">Accueil</a>
        <span class="mx-2">›</span>
        <span class="text-white">Ressources</span>
      </nav>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white">Ressources</h1>
          <p class="text-green-100 text-sm mt-1">Textes réglementaires, stratégies et questions fréquentes</p>
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
export class RessourcesHubComponent {
  cards: HubCard[] = [
    { label: 'Règlementation', link: '/ressources/documents',
      description: 'Décrets, arrêtés et textes réglementaires du secteur numérique.',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Stratégie & Politiques', link: '/ressources/politiques',
      description: 'Stratégies nationales et documents de politique publique.',
      icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
    { label: 'FAQ', link: '/faq',
      description: 'Réponses aux questions les plus fréquemment posées.',
      icon: 'M9.879 7.519C11.05 6.494 12.95 6.494 14.121 7.519c1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z' },
  ];
}
