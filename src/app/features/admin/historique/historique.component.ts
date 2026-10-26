import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, DataTableColumn } from '../../../shared/data-table/data-table.component';
import { AuditService, AuditAction, AuditEntry } from '../../../core/services/audit.service';

@Component({
  selector: 'app-admin-historique',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss'],
})
export class HistoriqueComponent {

  readonly filters: { key: AuditAction | 'all'; label: string }[] = [
    { key: 'all',    label: 'Tout' },
    { key: 'create', label: 'Ajouts' },
    { key: 'update', label: 'Modifications' },
    { key: 'delete', label: 'Suppressions' },
    { key: 'auth',   label: 'Connexions' },
  ];

  filter = signal<AuditAction | 'all'>('all');

  columns: DataTableColumn[] = [
    { key: 'when', label: 'Date', sortable: true, format: (r) => this.fullDate(r.timestamp) },
    { key: 'userName', label: 'Utilisateur', sortable: true, format: (r) => this.userCell(r) },
    { key: 'action', label: 'Action', type: 'badge', align: 'center',
      format: (r) => this.actionLabel(r.action),
      badgeClasses: (_v, r) => this.actionBadge(r.action) },
    { key: 'endpoint', label: 'Endpoint exécuté', sortable: true, format: (r) => this.endpointCell(r) },
    { key: 'target', label: 'Concerné', hideOnMobile: true, format: (r) => r.target || '—' },
    { key: 'ip', label: 'Adresse IP', hideOnMobile: true, format: (r) => r.ip || '—' },
  ];

  constructor(public audit: AuditService) {}

  rows = computed<AuditEntry[]>(() => {
    const f = this.filter();
    const list = this.audit.entries();
    return f === 'all' ? list : list.filter(e => e.action === f);
  });

  count(action: AuditAction | 'all'): number {
    const list = this.audit.entries();
    return action === 'all' ? list.length : list.filter(e => e.action === action).length;
  }

  // ---------- Helpers d'affichage ----------
  fullDate(iso: string): string {
    const d = new Date(iso);
    // ex : "mercredi 24 juin 2026 à 14:32:05"
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'medium' }).format(d);
  }

  relative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h} h`;
    const j = Math.floor(h / 24);
    return `il y a ${j} j`;
  }

  userCell(r: AuditEntry): string {
    return r.userEmail ? `${r.userName} (${r.userEmail})` : r.userName;
  }

  /** Endpoint exact appelé : méthode HTTP + chemin (ex. « DELETE /api/v1/articles/12 »). */
  endpointCell(r: AuditEntry): string {
    const path = this.shortUrl(r.url);
    return path ? `${r.method} ${path}` : r.method;
  }

  private shortUrl(url?: string): string {
    if (!url) return '';
    try { const u = new URL(url); return u.pathname + (u.search || ''); }
    catch { return url; } // déjà un chemin relatif
  }

  actionLabel(a: AuditAction): string {
    return a === 'create' ? 'Ajout' : a === 'update' ? 'Modification' : a === 'delete' ? 'Suppression' : 'Connexion';
  }

  actionBadge(a: AuditAction): string {
    return a === 'create' ? 'bg-green-50 text-green-700'
         : a === 'update' ? 'bg-amber-50 text-amber-700'
         : a === 'delete' ? 'bg-red-50 text-red-700'
         : 'bg-blue-50 text-blue-700';
  }
}
