import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from '../../../core/services/api.service';
import { Conseil } from '../../../core/models/event.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-conseils',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
  <div class="max-w-6xl mx-auto">

    <!-- En-tête -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Conseils</h1>
        <p class="text-sm text-slate-500 mt-1">
          Gérez les conseils défilants de la page d'accueil. Seuls les conseils <b>actifs</b> sont affichés,
          dans l'ordre défini.
        </p>
      </div>
      <button (click)="openModal()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nouveau conseil
      </button>
    </div>

    <!-- Liste (glisser-déposer pour réordonner) -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">

      @if (conseils().length > 1) {
        <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
          </svg>
          Glissez-déposez les conseils pour définir leur ordre de défilement.
        </div>
      }

      @if (loading()) {
        <div class="px-4 py-10 text-center text-slate-400">Chargement…</div>
      } @else if (conseils().length === 0) {
        <div class="px-4 py-10 text-center text-slate-400">Aucun conseil. Créez-en un.</div>
      } @else {
        <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="divide-y divide-slate-100">
          @for (c of conseils(); track c.id) {
            <div cdkDrag class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 bg-white">

              <!-- Poignée de glissement -->
              <button cdkDragHandle title="Déplacer" aria-label="Déplacer"
                      class="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a1 1 0 100 2 1 1 0 000-2zm0 5a1 1 0 100 2 1 1 0 000-2zm0 5a1 1 0 100 2 1 1 0 000-2zm6-10a1 1 0 100 2 1 1 0 000-2zm0 5a1 1 0 100 2 1 1 0 000-2zm0 5a1 1 0 100 2 1 1 0 000-2z"/>
                </svg>
              </button>

              <!-- Aperçu -->
              <div class="w-20 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                <img loading="lazy" [src]="conseilImage(c.image)" [alt]="c.title" class="w-full h-full object-cover" />
              </div>

              <!-- Titre + descriptif -->
              <div class="flex-1 min-w-0">
                <div class="font-medium text-slate-800 truncate">{{ c.title }}</div>
                <div class="text-xs text-slate-400 truncate">{{ c.description }}</div>
              </div>

              <!-- Statut -->
              <span [ngClass]="c.isActive
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                      : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'"
                    class="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0">
                {{ c.isActive ? 'Actif' : 'Inactif' }}
              </span>

              <!-- Actions -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button (click)="editConseil(c)" title="Modifier"
                        class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="askDelete(c)" title="Supprimer"
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
            {{ editing() ? 'Modifier le conseil' : 'Nouveau conseil' }}
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
                   class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Texte du conseil</label>
            <textarea name="description" [(ngModel)]="form.description" rows="4"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Ordre d'affichage</label>
            <input type="number" name="displayOrder" [(ngModel)]="form.displayOrder" min="0"
                   class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Image</label>
            <input type="file" accept="image/*" (change)="onFileSelected($event)"
                   class="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium hover:file:bg-primary-100" />
            @if (editing() && !selectedImage) {
              <p class="text-xs text-slate-400 mt-1">Laissez vide pour conserver l'image actuelle.</p>
            }
          </div>

          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" name="isActive" [(ngModel)]="form.isActive"
                   class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-400" />
            <span class="text-sm text-slate-700">Actif (affiché dans le défilement)</span>
          </label>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="closeModal(f)"
                    class="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100">
              Annuler
            </button>
            <button type="submit" [disabled]="saving() || !form.title"
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
        <h3 class="text-lg font-semibold text-slate-800 mb-2">Supprimer le conseil ?</h3>
        <p class="text-sm text-slate-500 mb-6">
          « {{ confirmDelete()?.title }} » sera définitivement supprimé.
        </p>
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
  `,
  styles: [`
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 0.5rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      background: #fff;
    }
    .cdk-drag-placeholder { opacity: 0.4; }
    .cdk-drag-animating { transition: transform 200ms cubic-bezier(0, 0, 0.2, 1); }
    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class ConseilsComponent {
  private apiService = inject(ApiService);
  private readonly FILE_URL = environment.FileUrl;

  conseils = signal<Conseil[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editing = signal<Conseil | null>(null);
  confirmDelete = signal<Conseil | null>(null);
  selectedImage: File | null = null;

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  form: { title: string; description: string; displayOrder: number; isActive: boolean; } = this.emptyForm();

  ngOnInit(): void {
    this.load();
  }

  private emptyForm() {
    return { title: '', description: '', displayOrder: 0, isActive: true };
  }

  load(): void {
    this.loading.set(true);
    this.apiService.getAllConseils().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        this.conseils.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  conseilImage(path?: string): string {
    if (!path) return 'assets/images/home.jpg';
    if (path.startsWith('http') || path.startsWith('assets')) return path;
    return this.FILE_URL + path;
  }

  openModal(): void {
    this.form = this.emptyForm();
    this.selectedImage = null;
    this.editing.set(null);
    this.showModal.set(true);
  }

  editConseil(c: Conseil): void {
    this.form = {
      title: c.title,
      description: c.description || '',
      displayOrder: c.displayOrder ?? 0,
      isActive: c.isActive ?? true
    };
    this.selectedImage = null;
    this.editing.set(c);
    this.showModal.set(true);
  }

  closeModal(form?: NgForm): void {
    this.showModal.set(false);
    this.editing.set(null);
    this.selectedImage = null;
    form?.resetForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedImage = null;
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.selectedImage = null;
      this.showNotification("Le fichier doit être une image", 'error');
      return;
    }
    this.selectedImage = file;
  }

  save(form: NgForm): void {
    if (!this.form.title) return;
    this.saving.set(true);

    const dto = {
      title: this.form.title,
      description: this.form.description,
      displayOrder: Number(this.form.displayOrder) || 0,
      isActive: this.form.isActive
    };

    const formData = new FormData();
    formData.append('conseil', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    if (this.selectedImage) formData.append('image', this.selectedImage);

    const editing = this.editing();
    const request = editing
      ? this.apiService.updateConseil(editing.id, formData)
      : this.apiService.createConseil(formData);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal(form);
        this.load();
        this.showNotification(editing ? "Conseil mis à jour" : "Conseil créé", 'success');
      },
      error: (err) => {
        console.error('Erreur sauvegarde conseil', err);
        this.saving.set(false);
      }
    });
  }

  /** Réordonnancement par glisser-déposer : met à jour l'ordre localement puis persiste. */
  onDrop(event: CdkDragDrop<Conseil[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const list = [...this.conseils()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    list.forEach((c, i) => (c.displayOrder = i + 1)); // retour visuel immédiat
    this.conseils.set(list);

    this.apiService.reorderConseils(list.map(c => c.id)).subscribe({
      next: () => this.showNotification('Ordre mis à jour', 'success'),
      error: () => {
        this.load(); // resynchronise avec le backend en cas d'échec
      }
    });
  }

  askDelete(c: Conseil): void {
    this.confirmDelete.set(c);
  }

  doDelete(): void {
    const c = this.confirmDelete();
    if (!c) return;
    this.apiService.deleteConseil(c.id).subscribe({
      next: () => {
        this.confirmDelete.set(null);
        this.load();
        this.showNotification("Conseil supprimé", 'success');
      },
      error: () => {
        this.confirmDelete.set(null);
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error' = 'success', duration = 2500): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), duration);
  }
}
