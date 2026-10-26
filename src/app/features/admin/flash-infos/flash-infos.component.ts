import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { FlashInfo, FlashInfoPriority } from '../../../core/models/event.model';

@Component({
  selector: 'app-admin-flash-infos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-5xl mx-auto">

    <!-- En-tête -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Flash Infos</h1>
        <p class="text-sm text-slate-500 mt-1">
          Messages défilant dans le bandeau en haut du site. Seules les flash infos <b>actives</b> sont affichées.
        </p>
      </div>
      <button (click)="openModal()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nouvelle flash info
      </button>
    </div>

    <!-- Réglage de la vitesse de défilement -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex flex-wrap items-end gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Vitesse de défilement du bandeau</label>
        <p class="text-xs text-slate-400 mb-2">Durée d'un cycle complet, en secondes. Plus petit = plus rapide.</p>
        <div class="flex items-center gap-2">
          <input type="number" min="5" max="200" [(ngModel)]="scrollDuration"
                 class="w-28 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
          <span class="text-sm text-slate-500">secondes</span>
        </div>
      </div>
      <button (click)="saveSpeed()" [disabled]="savingSpeed()"
              class="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50">
        {{ savingSpeed() ? 'Enregistrement…' : 'Enregistrer la vitesse' }}
      </button>
    </div>

    <!-- Liste -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      @if (loading()) {
        <div class="px-4 py-10 text-center text-slate-400">Chargement…</div>
      } @else if (items().length === 0) {
        <div class="px-4 py-10 text-center text-slate-400">Aucune flash info. Créez-en une.</div>
      } @else {
        <div class="divide-y divide-slate-100">
          @for (f of items(); track f.id) {
            <div class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60">

              <!-- Priorité -->
              <span [ngClass]="priorityClass(f.priority)"
                    class="px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide flex-shrink-0 w-20 text-center">
                {{ priorityLabel(f.priority) }}
              </span>

              <!-- Titre + contenu -->
              <div class="flex-1 min-w-0">
                <div class="font-medium text-slate-800 truncate">{{ f.title }}</div>
                <div class="text-xs text-slate-400 truncate">{{ f.content }}</div>
              </div>

              <!-- Statut -->
              <span [ngClass]="f.isActive
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                      : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'"
                    class="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0">
                {{ f.isActive ? 'Active' : 'Inactive' }}
              </span>

              <!-- Actions -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button (click)="edit(f)" title="Modifier"
                        class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="askDelete(f)" title="Supprimer"
                        class="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  </div>

  <!-- Modal formulaire -->
  @if (showModal()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 class="text-lg font-semibold text-slate-800">
            {{ editing() ? 'Modifier la flash info' : 'Nouvelle flash info' }}
          </h2>
          <button (click)="closeModal(f)" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form #f="ngForm" (ngSubmit)="save(f)" class="px-6 py-5 space-y-4">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Titre <span class="text-red-500">*</span></label>
            <input type="text" name="title" [(ngModel)]="form.title" required maxlength="255"
                   placeholder="Texte affiché dans le bandeau"
                   class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Contenu <span class="text-red-500">*</span></label>
            <textarea name="content" [(ngModel)]="form.content" required rows="2" maxlength="500"
                      placeholder="Détail du message"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Lien (URL)</label>
              <input type="text" name="linkUrl" [(ngModel)]="form.linkUrl" placeholder="/actualites"
                     class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Texte du lien</label>
              <input type="text" name="linkText" [(ngModel)]="form.linkText" placeholder="En savoir plus"
                     class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
            <select name="priority" [(ngModel)]="form.priority"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none bg-white">
              <option value="LOW">Basse</option>
              <option value="NORMAL">Normale</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" name="isActive" [(ngModel)]="form.isActive"
                   class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-400" />
            <span class="text-sm text-slate-700">Active (affichée dans le bandeau)</span>
          </label>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="closeModal(f)"
                    class="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100">
              Annuler
            </button>
            <button type="submit" [disabled]="saving() || !form.title || !form.content"
                    class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {{ saving() ? 'Enregistrement…' : (editing() ? 'Mettre à jour' : 'Créer') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  }

  <!-- Confirmation suppression -->
  @if (confirmDelete()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-2">Supprimer la flash info ?</h3>
        <p class="text-sm text-slate-500 mb-6">« {{ confirmDelete()?.title }} » sera définitivement supprimée.</p>
        <div class="flex justify-end gap-3">
          <button (click)="confirmDelete.set(null)"
                  class="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100">Annuler</button>
          <button (click)="doDelete()"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Supprimer</button>
        </div>
      </div>
    </div>
  }

  <!-- Notification -->
  @if (notification().show) {
    <div class="fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white"
         [ngClass]="notification().type === 'error' ? 'bg-red-600' : 'bg-green-600'">
      {{ notification().message }}
    </div>
  }
  `
})
export class FlashInfosComponent {
  private apiService = inject(ApiService);

  items = signal<FlashInfo[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editing = signal<FlashInfo | null>(null);
  confirmDelete = signal<FlashInfo | null>(null);

  scrollDuration = 30;          // durée d'un cycle (secondes)
  savingSpeed = signal(false);

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  form: {
    title: string; content: string; linkUrl: string; linkText: string;
    priority: FlashInfoPriority; isActive: boolean;
  } = this.emptyForm();

  ngOnInit(): void {
    this.load();
    this.loadSpeed();
  }

  loadSpeed(): void {
    this.apiService.getTickerConfig().subscribe({
      next: (config) => {
        if (config?.scrollDuration) this.scrollDuration = config.scrollDuration;
      },
      error: () => { /* garde la valeur par défaut */ }
    });
  }

  saveSpeed(): void {
    const value = Number(this.scrollDuration);
    if (!value || value <= 0) {
      this.showNotification("Durée invalide", 'error');
      return;
    }
    this.savingSpeed.set(true);
    this.apiService.updateTickerConfig({ scrollDuration: value }).subscribe({
      next: (config) => {
        if (config?.scrollDuration) this.scrollDuration = config.scrollDuration;
        this.savingSpeed.set(false);
        this.showNotification("Vitesse de défilement enregistrée", 'success');
      },
      error: () => {
        this.savingSpeed.set(false);
      }
    });
  }

  private emptyForm() {
    return { title: '', content: '', linkUrl: '', linkText: '', priority: 'NORMAL' as FlashInfoPriority, isActive: true };
  }

  load(): void {
    this.loading.set(true);
    this.apiService.getAllFlashInfosList().subscribe({
      next: (data) => {
        this.items.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openModal(): void {
    this.form = this.emptyForm();
    this.editing.set(null);
    this.showModal.set(true);
  }

  edit(f: FlashInfo): void {
    this.form = {
      title: f.title,
      content: f.content || '',
      linkUrl: f.linkUrl || '',
      linkText: f.linkText || '',
      priority: f.priority || 'NORMAL',
      isActive: f.isActive ?? true
    };
    this.editing.set(f);
    this.showModal.set(true);
  }

  closeModal(form?: NgForm): void {
    this.showModal.set(false);
    this.editing.set(null);
    form?.resetForm();
  }

  save(form: NgForm): void {
    if (!this.form.title || !this.form.content) return;
    this.saving.set(true);

    const dto: Partial<FlashInfo> = {
      title: this.form.title,
      content: this.form.content,
      linkUrl: this.form.linkUrl,
      linkText: this.form.linkText,
      priority: this.form.priority,
      isActive: this.form.isActive
    };

    const editing = this.editing();
    const request = editing
      ? this.apiService.updateFlashInfo(editing.id, dto)
      : this.apiService.createFlashInfo(dto);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal(form);
        this.load();
        this.showNotification(editing ? "Flash info mise à jour" : "Flash info créée", 'success');
      },
      error: (err) => {
        console.error('Erreur sauvegarde flash info', err);
        this.saving.set(false);
      }
    });
  }

  askDelete(f: FlashInfo): void {
    this.confirmDelete.set(f);
  }

  doDelete(): void {
    const f = this.confirmDelete();
    if (!f) return;
    this.apiService.deleteFlashInfo(f.id).subscribe({
      next: () => {
        this.confirmDelete.set(null);
        this.load();
        this.showNotification("Flash info supprimée", 'success');
      },
      error: () => {
        this.confirmDelete.set(null);
      }
    });
  }

  priorityLabel(p: FlashInfoPriority): string {
    const labels: Record<string, string> = {
      LOW: 'Basse', NORMAL: 'Normale', MEDIUM: 'Moyenne', HIGH: 'Haute', URGENT: 'Urgente'
    };
    return labels[p] || p;
  }

  priorityClass(p: FlashInfoPriority): string {
    const classes: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-600',
      NORMAL: 'bg-blue-50 text-blue-700',
      MEDIUM: 'bg-amber-50 text-amber-700',
      HIGH: 'bg-orange-50 text-orange-700',
      URGENT: 'bg-red-50 text-red-700'
    };
    return classes[p] || 'bg-slate-100 text-slate-600';
  }

  showNotification(message: string, type: 'success' | 'error' = 'success', duration = 2500): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), duration);
  }
}
