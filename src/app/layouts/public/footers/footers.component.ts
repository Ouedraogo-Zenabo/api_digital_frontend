import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-footers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './footers.component.html',
  styleUrls: ['./footers.component.scss']
})
export class FootersComponent {
  private api = inject(ApiService);

  currentYear = new Date().getFullYear();

  // Liens internes (navigation Angular)
  quickLinks: { label: string; route: string }[] = [
    { label: 'Accueil', route: '/' },
    { label: 'Le Ministre', route: '/ministere/ministre' },
    { label: 'Actualités', route: '/actualites' },
    { label: 'Communiqués', route: '/communiques' },
    { label: 'Grands Chantiers', route: '/projets' },
    { label: 'Services en ligne', route: '/services' },
    { label: 'Événements', route: '/evenements' },
    { label: 'Documents', route: '/ressources/documents' },
    { label: 'Contact', route: '/contact' },
  ];

  // Annuaire officiel (liens externes)
  officialLinks: { label: string; url: string }[] = [
    { label: 'Présidence du Faso', url: 'https://www.presidencedufaso.bf' },
    { label: 'Gouvernement', url: 'https://www.gouvernement.gov.bf' },
    { label: 'Assemblée Législative de Transition', url: 'https://www.assembleenationale.gov.bf' },
    { label: 'SIG', url: 'https://www.sig.gov.bf' },
    { label: 'ANPTIC', url: 'https://anptic.gov.bf' },
    { label: 'ANSSI-BF', url: 'https://anssi.bf' },
    { label: 'Service Public', url: 'https://servicepublic.gov.bf' },
  ];

  // ----- Newsletter -----
  email = '';
  subscribing = signal(false);
  feedback = signal<{ text: string; ok: boolean } | null>(null);

  subscribe(): void {
    const email = this.email.trim();
    if (!email || this.subscribing()) return;

    this.subscribing.set(true);
    this.feedback.set(null);

    this.api.subscribeNewsletter({ email }).subscribe({
      next: (res: any) => {
        this.subscribing.set(false);
        this.feedback.set({
          text: res?.message || 'Inscription réussie. Merci !',
          ok: true,
        });
        this.email = '';
        setTimeout(() => this.feedback.set(null), 6000);
      },
      error: (err) => {
        this.subscribing.set(false);
        this.feedback.set({
          text: err?.error?.message || "Échec de l'inscription. Réessayez plus tard.",
          ok: false,
        });
        setTimeout(() => this.feedback.set(null), 6000);
      },
    });
  }
}
