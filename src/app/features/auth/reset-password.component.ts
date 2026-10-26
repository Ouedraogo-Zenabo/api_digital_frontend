import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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

      <!-- Vérification du jeton -->
      <div *ngIf="checking()" class="text-center py-6 text-slate-500">Vérification du lien</div>

      <!-- Jeton invalide -->
      <div *ngIf="!checking() && !tokenValid()" class="text-center">
        <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">Lien invalide ou expiré</h2>
        <p class="text-slate-500 text-sm mb-6">Ce lien de réinitialisation n'est plus valable. Veuillez en demander un nouveau.</p>
        <a routerLink="/auth/forgot-password"
           class="inline-block w-full bg-[#006B30] text-white font-medium rounded-lg py-3 hover:bg-[#005026] transition-colors">
          Demander un nouveau lien
        </a>
      </div>

      <!-- Succès -->
      <div *ngIf="done()" class="text-center">
        <div class="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-[#00843B]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">Mot de passe réinitialisé</h2>
        <p class="text-slate-500 text-sm mb-6">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        <a routerLink="/auth/login"
           class="inline-block w-full bg-[#006B30] text-white font-medium rounded-lg py-3 hover:bg-[#005026] transition-colors">
          Se connecter
        </a>
      </div>

      <!-- Formulaire -->
      <ng-container *ngIf="!checking() && tokenValid() && !done()">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Nouveau mot de passe</h2>
          <p class="text-slate-500">Choisissez un nouveau mot de passe sécurisé.</p>
        </div>

        <div *ngIf="error()" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {{ error() }}
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
            <input [type]="show() ? 'text' : 'password'" [(ngModel)]="password" name="password"
                   class="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#006B30] focus:border-[#006B30]"
                   placeholder="Au moins 6 caractères" required autocomplete="new-password"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input [type]="show() ? 'text' : 'password'" [(ngModel)]="confirm" name="confirm"
                   class="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#006B30] focus:border-[#006B30]"
                   placeholder="Retapez le mot de passe" required autocomplete="new-password"/>
          </div>

          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" [(ngModel)]="showFlag" name="show" (ngModelChange)="show.set($event)"/>
            Afficher le mot de passe
          </label>

          <button type="submit" [disabled]="loading()"
                  class="w-full bg-[#006B30] text-white font-medium rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-[#005026] transition-colors disabled:opacity-60">
            <svg *ngIf="loading()" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loading() ? 'Enregistrement' : 'Réinitialiser le mot de passe' }}
          </button>
        </form>
      </ng-container>
    </div>
  </div>
</div>
  `
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirm = '';
  show = signal(false);
  showFlag = false;
  loading = signal(false);
  checking = signal(true);
  tokenValid = signal(false);
  done = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.checking.set(false);
      this.tokenValid.set(false);
      return;
    }
    this.auth.validateResetToken(this.token).subscribe({
      next: (res) => { this.tokenValid.set(!!res.data); this.checking.set(false); },
      error: () => { this.tokenValid.set(false); this.checking.set(false); },
    });
  }

  onSubmit(): void {
    this.error.set('');
    if (this.password.length < 6) {
      this.error.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (this.password !== this.confirm) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Échec de la réinitialisation.');
      },
    });
  }
}
