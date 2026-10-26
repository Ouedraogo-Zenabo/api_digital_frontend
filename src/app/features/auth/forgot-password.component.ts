import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="min-h-screen flex items-center justify-center bg-gray-100 p-8">
  <div class="w-full max-w-md">

    <div class="flex justify-center mb-8">
      <a routerLink="/" class="flex items-center gap-3">
        <div class="w-16 h-16 flex-shrink-0">
          <img loading="lazy" src="assets/images/armoirie.png" alt="Logo MTDPCE" class="w-full h-full object-contain"/>
        </div>
        <div class="flex flex-col leading-tight justify-center">
          <span class="text-xl font-bold text-slate-900">MTDPCE</span>
          <span class="text-sm font-medium text-danger-500">Burkina Faso</span>
        </div>
      </a>
    </div>

    <div class="bg-white shadow-lg rounded-2xl p-8 border border-slate-200">

      <!-- État : succès -->
      <div *ngIf="sent()" class="text-center">
        <div class="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-[#00843B]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">Email envoyé</h2>
        <p class="text-slate-500 text-sm mb-6">
          Si un compte est associé à <span class="font-medium text-slate-700">{{ email }}</span>,
          vous recevrez un lien pour réinitialiser votre mot de passe (valable 60 minutes).
        </p>
        <a routerLink="/auth/login"
           class="inline-block w-full bg-[#006B30] text-white font-medium rounded-lg py-3 hover:bg-[#005026] transition-colors">
          Retour à la connexion
        </a>
      </div>

      <!-- État : formulaire -->
      <ng-container *ngIf="!sent()">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Mot de passe oublié</h2>
          <p class="text-slate-500">Entrez votre email pour recevoir un lien de réinitialisation.</p>
        </div>

        <div *ngIf="error()" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {{ error() }}
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700">Adresse email</label>
            <div class="relative mt-1">
              <input type="email" [(ngModel)]="email" name="email"
                     class="w-full border border-gray-300 rounded-lg px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-[#006B30] focus:border-[#006B30]"
                     placeholder="vous@exemple.com" required autocomplete="email"/>
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
          </div>

          <button type="submit" [disabled]="loading()"
                  class="w-full bg-[#006B30] text-white font-medium rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-[#005026] transition-colors disabled:opacity-60">
            <svg *ngIf="loading()" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loading() ? 'Envoi' : 'Envoyer le lien' }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-slate-500 border-t border-slate-200 pt-6">
          <a routerLink="/auth/login" class="text-[#006B30] font-medium hover:text-[#005026]">Retour à la connexion</a>
        </div>
      </ng-container>
    </div>
  </div>
</div>
  `
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  error = signal('');
  sent = signal(false);

  constructor(private auth: AuthService) {}

  onSubmit(): void {
    if (!this.email.trim()) {
      this.error.set('Veuillez saisir votre email.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      // Réponse générique : on confirme l'envoi même en cas d'erreur réseau légère côté serveur
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || "Une erreur s'est produite. Réessayez plus tard.");
      },
    });
  }
}
