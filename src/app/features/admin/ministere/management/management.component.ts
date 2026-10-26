import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Ministere, Ministre } from '../../../../core/models/event.model';
import { ApiService } from '../../../../core/services/api.service';
import { MinistereService } from '../../../../core/services/ministere.service';
import { DataTableComponent, DataTableColumn } from '../../../../shared/data-table/data-table.component';

type Tab = 'ministere' | 'ministre';

@Component({
  selector: 'app-ministere-management',
  standalone: true,
  imports: [CommonModule, RouterModule, DataTableComponent],
  templateUrl: './management.component.html',
})
export class ManagementComponent {
  activeTab = signal<Tab>('ministere');

  ministeres = signal<Ministere[]>([]);
  ministres = signal<Ministre[]>([]);
  loadingMinistere = signal(true);
  loadingMinistre = signal(true);

  ministereCols: DataTableColumn[] = [
    { key: 'nomGeneral', label: 'Nom général', sortable: true },
    { key: 'nomReel', label: "Nom d'accroche", sortable: true, hideOnMobile: true },
    { key: 'acronyme', label: 'Acronyme', sortable: true, hideOnMobile: true },
  ];
  ministreCols: DataTableColumn[] = [
    { key: 'nom', label: 'Nom', sortable: true, format: (r) => `${r.prenom || ''} ${r.nom || ''}`.trim() },
    { key: 'profession', label: 'Fonction', sortable: true, hideOnMobile: true },
    { key: 'isActif', label: 'Statut', type: 'badge', align: 'center',
      format: (r) => (r.isActif ? 'Actif' : 'Inactif'),
      badgeClasses: (_v, r) => (r.isActif ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500') },
  ];

  confirmModal = signal<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: '', onConfirm: () => {} });
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  constructor(private api: ApiService, private min: MinistereService, private router: Router) {
    const state = this.router.getCurrentNavigation()?.extras.state as any;
    if (state?.tab) this.activeTab.set(state.tab);
    if (state?.msg) this.notify(state.msg, 'success');
  }

  ngOnInit(): void {
    this.loadMinisteres();
    this.loadMinistres();
  }

  selectTab(t: Tab): void { this.activeTab.set(t); }

  loadMinisteres(): void {
    this.loadingMinistere.set(true);
    this.api.getAllMins(0, 1000).subscribe({
      next: (res) => { if (res.success) this.ministeres.set(res.data.content ?? []); this.loadingMinistere.set(false); },
      error: () => this.loadingMinistere.set(false),
    });
  }

  loadMinistres(): void {
    this.loadingMinistre.set(true);
    this.min.getAllMinistre(0, 1000).subscribe({
      next: (res) => { if (res.success) this.ministres.set(res.data.content ?? []); this.loadingMinistre.set(false); },
      error: () => this.loadingMinistre.set(false),
    });
  }

  // ---- Navigation vers les formulaires (nouvelle page) ----
  newMinistere(): void { this.router.navigate(['/admin/ministere-gestion/ministere/new']); }
  editMinistere(m: Ministere): void { this.router.navigate(['/admin/ministere-gestion/ministere', m.id]); }
  newMinistre(): void { this.router.navigate(['/admin/ministere-gestion/ministre/new']); }
  editMinistre(m: Ministre): void { this.router.navigate(['/admin/ministere-gestion/ministre', m.id]); }

  // ---- Suppression ----
  askDeleteMinistere(m: Ministere): void {
    this.confirmModal.set({ show: true, message: `Supprimer le ministère « ${m.nomGeneral} » ?`, onConfirm: () => {
      this.api.deleteMin(m.id).subscribe({
        next: () => { this.closeConfirm(); this.loadMinisteres(); this.notify('Ministère supprimé', 'success'); },
        error: () => { this.closeConfirm(); },
      });
    }});
  }
  askDeleteMinistre(m: Ministre): void {
    this.confirmModal.set({ show: true, message: `Supprimer le ministre « ${m.prenom} ${m.nom} » ?`, onConfirm: () => {
      this.min.deleteMinistre(m.id).subscribe({
        next: () => { this.closeConfirm(); this.loadMinistres(); this.notify('Ministre supprimé', 'success'); },
        error: () => { this.closeConfirm(); },
      });
    }});
  }

  closeConfirm(): void { this.confirmModal.update(c => ({ ...c, show: false })); }

  private notify(message: string, type: 'success' | 'error'): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), 3000);
  }
}
