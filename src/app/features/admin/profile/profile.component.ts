import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

type Tab = 'profil' | 'securite' | 'compte';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  activeTab = signal<Tab>('profil');
  loading = signal(true);
  user = signal<User | null>(null);

  // Profil
  profile = { firstName: '', lastName: '', email: '', phone: '', position: '', department: '' };
  savingProfile = signal(false);

  // Mot de passe
  pwd = { oldPassword: '', newPassword: '', confirm: '' };
  showPwd = signal(false);
  savingPwd = signal(false);

  // Suppression / désactivation
  confirmAction = signal<null | 'deactivate' | 'delete'>(null);
  processing = signal(false);

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success',
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getCurrentUser().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.user.set(res.data);
          this.profile = {
            firstName: res.data.firstName ?? '',
            lastName: res.data.lastName ?? '',
            email: res.data.email ?? '',
            phone: res.data.phone ?? '',
            position: res.data.position ?? '',
            department: res.data.department ?? '',
          };
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get initials(): string {
    const u = this.user();
    const a = (u?.firstName?.[0] ?? u?.username?.[0] ?? '').toUpperCase();
    const b = (u?.lastName?.[0] ?? '').toUpperCase();
    return (a + b) || 'U';
  }

  // ----- Profil -----
  saveProfile(): void {
    const u = this.user();
    if (!u) return;
    if (!this.profile.email.trim()) {
      this.notify('L\'email est requis.', 'error');
      return;
    }
    this.savingProfile.set(true);
    this.api.updateUser(u.id, this.profile).subscribe({
      next: (res) => {
        this.savingProfile.set(false);
        if (res.success && res.data) {
          this.user.set(res.data);
          this.auth.updateStoredUser({
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            email: res.data.email,
          });
          this.notify('Profil mis à jour avec succès.', 'success');
        }
      },
      error: () => {
        this.savingProfile.set(false);
      },
    });
  }

  // ----- Mot de passe -----
  changePassword(): void {
    const u = this.user();
    if (!u) return;
    if (!this.pwd.oldPassword || !this.pwd.newPassword) {
      this.notify('Veuillez remplir tous les champs.', 'error');
      return;
    }
    if (this.pwd.newPassword.length < 6) {
      this.notify('Le nouveau mot de passe doit contenir au moins 6 caractères.', 'error');
      return;
    }
    if (this.pwd.newPassword !== this.pwd.confirm) {
      this.notify('Les mots de passe ne correspondent pas.', 'error');
      return;
    }
    this.savingPwd.set(true);
    this.api.changePassword(u.id, this.pwd.oldPassword, this.pwd.newPassword).subscribe({
      next: () => {
        this.savingPwd.set(false);
        this.pwd = { oldPassword: '', newPassword: '', confirm: '' };
        this.notify('Mot de passe modifié avec succès.', 'success');
      },
      error: () => {
        this.savingPwd.set(false);
      },
    });
  }

  // ----- Compte -----
  ask(action: 'deactivate' | 'delete'): void {
    this.confirmAction.set(action);
  }
  cancelConfirm(): void {
    this.confirmAction.set(null);
  }

  confirmDanger(): void {
    const u = this.user();
    const action = this.confirmAction();
    if (!u || !action) return;
    this.processing.set(true);
    const req = action === 'delete' ? this.api.deleteUser(u.id) : this.api.deactivateUser(u.id);
    req.subscribe({
      next: () => {
        this.processing.set(false);
        this.confirmAction.set(null);
        // Le compte n'est plus utilisable : déconnexion
        this.auth.logout();
      },
      error: () => {
        this.processing.set(false);
        this.confirmAction.set(null);
      },
    });
  }

  private notify(message: string, type: 'success' | 'error'): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), 3000);
  }
}
