import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuditService } from '../../../core/services/audit.service';
import { FacebookConfig } from '../../../core/models';

@Component({
  selector: 'app-admin-facebook-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facebook-config.component.html',
  styleUrls: ['./facebook-config.component.scss'],
})
export class FacebookConfigComponent implements OnInit {

  loading = signal(true);
  saving = signal(false);
  reveal = signal(false);
  /** true si une configuration existe déjà côté backend. */
  existing = signal(false);

  form: FacebookConfig = { label: '', pageId: '', accessToken: '', active: true };

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });

  constructor(private api: ApiService, private audit: AuditService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getFacebookConfig().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const c = res.data;
          this.existing.set(true);
          this.form = { id: c.id, label: c.label ?? '', pageId: c.pageId ?? '', accessToken: '', active: c.active ?? true, hasToken: c.hasToken, tokenExpiresAt: c.tokenExpiresAt };
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }, // aucune config encore → formulaire vierge
    });
  }

  get canSave(): boolean {
    if (!this.form.pageId?.trim()) return false;
    // À la création, le token est obligatoire ; en édition il peut rester vide (inchangé).
    if (!this.existing() && !this.form.accessToken?.trim()) return false;
    return true;
  }

  save(): void {
    if (!this.canSave) { this.notify('Renseignez au moins le Page ID et le token.', 'error'); return; }
    this.saving.set(true);

    const payload: FacebookConfig = {
      id: this.form.id,
      label: this.form.label?.trim() || undefined,
      pageId: this.form.pageId.trim(),
      active: this.form.active ?? true,
    };
    // N'envoyer le token que s'il a été saisi (évite d'écraser par une valeur vide).
    if (this.form.accessToken?.trim()) payload.accessToken = this.form.accessToken.trim();

    this.api.saveFacebookConfig(payload).subscribe({
      next: () => {
        this.audit.record({ action: this.existing() ? 'update' : 'create', method: 'PUT', entity: 'Configuration Facebook', url: '/api/v1/facebook-config', target: payload.pageId });
        this.saving.set(false);
        this.form.accessToken = '';
        this.reveal.set(false);
        this.notify('Configuration Facebook enregistrée', 'success');
        this.load();
      },
      error: () => { this.saving.set(false); },
    });
  }

  /** Aperçu masqué du token saisi (ex. EAAU…Mgi). */
  get tokenPreview(): string {
    const t = this.form.accessToken || '';
    if (t.length <= 10) return '••••••';
    return `${t.slice(0, 4)}…${t.slice(-4)}`;
  }

  private notify(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2400): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), duration);
  }
}
