import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/models';
import { ApiService } from '../../../../core/services/api.service';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../../../shared/data-table/data-table.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {

  columns: DataTableColumn[] = [
    { key: 'firstName', label: 'Utilisateur', sortable: true,
      format: (r) => (((r.firstName || '') + ' ' + (r.lastName || '')).trim() || r.username) },
    { key: 'email', label: 'Email', sortable: true, hideOnMobile: true },
    { key: 'roles', label: 'Rôles', hideOnMobile: true,
      format: (r) => (r.roles || []).map((x: string) => this.getRoleLabel(x)).join(', ') },
    { key: 'enabled', label: 'Statut', type: 'badge', align: 'center',
      format: (r) => (r.enabled ? 'Actif' : 'Inactif'),
      badgeClasses: (_v, r) => (r.enabled ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500') },
  ];
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
  show: false,
  message: '',
  type: 'success'
});

  users = signal<User[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingUser = signal<User | null>(null);
  saving = signal(false);

  currentPage = signal(1);
pageSize = 1000; // tout charger : pagination gérée côté tableau (app-data-table)
totalPages = signal(1);
  
  form = { firstName: '', lastName: '', username: '', email: '', password: '', role: 'ROLE_USER' };
  
  constructor(private apiService: ApiService) {}
  
  ngOnInit(): void { this.loadUsers(); }
  
  loadUsers(page: number = 0): void {
    this.apiService.getAllUsers(page, this.pageSize).subscribe({
      next: (response) => { if (response.success) {
          this.users.set(response.data.content); 
           // totalPages vient du backend
        this.totalPages.set(response.data.totalPages);

        // page backend commence à 0, UI à 1
        this.currentPage.set(page + 1);
           
        } this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }


  nextPage() {
  if (this.currentPage() < this.totalPages()) {
    this.loadUsers(this.currentPage());
  }
}

prevPage() {
  if (this.currentPage() > 1) {
    this.loadUsers(this.currentPage() - 2);
  }
}

goToPage(page: number) {
  this.loadUsers(page - 1);
}

pages(): number[] {
  return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
}
  
  openModal(): void { this.form = { firstName: '', lastName: '', username: '', email: '', password: '', role: 'ROLE_USER' }; this.editingUser.set(null); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); this.editingUser.set(null); }
  
  editUser1(user: User): void {
    this.form = { firstName: user.firstName || '', lastName: user.lastName || '', username: user.username, email: user.email, password: '', role: user.roles[0] || 'ROLE_USER' };
    this.editingUser.set(user);
    this.showModal.set(true);
  }

editUser(user: User): void {
  const role =
    Array.isArray(user.roles) && user.roles.length > 0
      ? String(user.roles[0])
      : 'ROLE_USER';

  this.form = {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username,
    email: user.email,
    password: '',
    role: role
  };

  this.editingUser.set(user);
  this.showModal.set(true);
}


  
  saveUser(): void {
    if (!this.form.firstName || !this.form.lastName || !this.form.username || !this.form.email) return;
    this.saving.set(true);
    const editing = this.editingUser();
    
    if (editing) {
      this.apiService.updateUser(editing.id, { firstName: this.form.firstName, lastName: this.form.lastName, email: this.form.email, roles: [this.form.role] }).subscribe({
        next: (response) => { if (response.success) { this.loadUsers(); this.closeModal(); } this.saving.set(false);  this.showNotification(  "Utilisateur mis à avec succès", 'success');
},
       error: (err) => {
          console.error('Erreur lors de la sauvegarde', err);
          this.saving.set(false);
        }
      });
    } else {
      this.apiService.createUser({ ...this.form, roles: [this.form.role] }).subscribe({
        next: (response) => { if (response.success) { this.loadUsers(); this.closeModal(); } this.saving.set(false); this.showNotification("Utilisateur mis à avec succès", 'success');},
       error: (err) => {
          console.error('Erreur lors de la sauvegarde', err);
          this.saving.set(false);
        }
      });
    }
  }
  
  toggleUserStatus(user: User): void {
    const action = user.enabled ? 'désactiver' : 'activer';
    if (confirm(`Voulez-vous ${action} l'utilisateur "${user.username}" ?`)) {
      this.apiService.toggleUserStatus(user.id).subscribe({ next: () => this.loadUsers() });
    }
  }
  
  getRoleLabel(role: string): string {
    const labels: Record<string, string> = { 'ROLE_USER': 'Utilisateur', 'ROLE_MODERATOR': 'Modérateur', 'ROLE_ADMIN': 'Admin', 'ROLE_SUPER_ADMIN': 'Super Admin' };
    return labels[role] || role;
  }


  // ----------------- RÉINITIALISATION MOT DE PASSE (admin) -----------------
  resetModal = signal<{ show: boolean; user: User | null }>({ show: false, user: null });
  resetForm = { newPassword: '', confirm: '' };
  resettingPwd = signal(false);
  showResetPwd = signal(false);

  openResetPassword(user: User): void {
    this.resetForm = { newPassword: '', confirm: '' };
    this.showResetPwd.set(false);
    this.resetModal.set({ show: true, user });
  }

  closeResetPassword(): void {
    this.resetModal.update(m => ({ ...m, show: false }));
  }

  submitResetPassword(): void {
    const u = this.resetModal().user;
    if (!u) return;
    if (this.resetForm.newPassword.length < 6) {
      this.showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    if (this.resetForm.newPassword !== this.resetForm.confirm) {
      this.showNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    this.resettingPwd.set(true);
    this.apiService.adminResetPassword(u.id, this.resetForm.newPassword).subscribe({
      next: () => {
        this.resettingPwd.set(false);
        this.closeResetPassword();
        this.showNotification('Mot de passe réinitialisé avec succès', 'success');
      },
      error: () => {
        this.resettingPwd.set(false);
      },
    });
  }

  // ----------------- CONFIRMATION MODAL -----------------
confirmModal = signal<{ show: boolean; message: string; onConfirm: () => void }>({
  show: false,
  message: '',
  onConfirm: () => {}
});

openConfirmModal(message: string, onConfirm: () => void) {
  this.confirmModal.set({ show: true, message, onConfirm });
}

closeConfirmModal() {
  this.confirmModal.update(c => ({ ...c, show: false }));
}

  deleteUser(user: User): void {
    // Ouvre le modal au lieu de confirm()
    this.openConfirmModal(`Voulez-vous vraiment supprimer l'utilisateur "${user.username}" ?`, () => {
      this.apiService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.closeConfirmModal(); // ferme le modal après suppression
          this.showNotification('Utilisateur supprimé avec succès', 'success'); // toast succès
        },
        error: () => {
          this.closeConfirmModal();
        }
      });
    });
  }

    showNotification(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2000) {
  this.notification.set({ show: true, message, type });
  setTimeout(() => this.notification.update(n => ({ ...n, show: false })), duration);


}

}
