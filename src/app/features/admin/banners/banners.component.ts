import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from '../../../core/services/api.service';
import { Banner } from '../../../core/models/event.model';
import { environment } from '../../../../environments/environment';
import { LinkPickerComponent } from '../../../shared/link-picker/link-picker.component';
import { siteLinkLabel } from '../../../shared/site-links';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, LinkPickerComponent],
  template: `
  <div class="max-w-6xl mx-auto">

    <!-- En-tête -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Bannières d'accueil</h1>
        <p class="text-sm text-slate-500 mt-1">
          Gérez le carousel de la première section. Seules les bannières <b>actives</b> défilent,
          chacune selon sa <b>durée</b> définie.
        </p>
      </div>
      <button (click)="openModal()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nouvelle bannière
      </button>
    </div>

    <!-- Liste (glisser-déposer pour réordonner) -->
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">

      @if (banners().length > 1) {
        <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
          </svg>
          Glissez-déposez les bannières pour définir leur ordre de défilement.
        </div>
      }

      @if (loading()) {
        <div class="px-4 py-10 text-center text-slate-400">Chargement…</div>
      } @else if (banners().length === 0) {
        <div class="px-4 py-10 text-center text-slate-400">Aucune bannière. Créez-en une.</div>
      } @else {
        <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="divide-y divide-slate-100">
          @for (b of banners(); track b.id) {
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
                <img loading="lazy" [src]="bannerImage(b.image)" [alt]="b.title" class="w-full h-full object-cover" />
              </div>

              <!-- Titre + descriptif -->
              <div class="flex-1 min-w-0">
                <div class="font-medium text-slate-800 truncate">{{ b.title }}</div>
                <div class="text-xs text-slate-400 truncate">{{ b.description }}</div>
                @if (b.linkUrl) {
                  <div class="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                    <svg class="w-3.5 h-3.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5"/>
                    </svg>
                    <span class="truncate">
                      {{ b.linkText || 'Bouton' }} → <span class="text-slate-400">{{ linkLabel(b.linkUrl) }}</span>
                    </span>
                  </div>
                }
              </div>

              <!-- Durée -->
              <div class="hidden sm:flex items-center gap-1 text-slate-500 text-xs flex-shrink-0" title="Durée de défilement">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ b.displayDuration }} s
              </div>

              <!-- Statut -->
              <span [ngClass]="b.isActive
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                      : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'"
                    class="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0">
                {{ b.isActive ? 'Active' : 'Inactive' }}
              </span>

              <!-- Actions -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button (click)="editBanner(b)" title="Modifier"
                        class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="askDelete(b)" title="Supprimer"
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
    <div class="fixed inset-0 z-50 bg-slate-100 flex flex-col">

      <!-- Barre supérieure -->
      <div class="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white flex-shrink-0">
        <h2 class="text-base sm:text-lg font-semibold text-slate-800">
          {{ editing() ? 'Modifier la bannière' : 'Nouvelle bannière' }}
        </h2>
        <button (click)="closeModal(f)" title="Fermer" aria-label="Fermer"
                class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form #f="ngForm" (ngSubmit)="save(f)" class="flex-1 min-h-0 flex flex-col">

        <div class="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:flex">

          <!-- ===== Colonne Prévisualisation ===== -->
          <div class="lg:w-3/5 xl:w-[62%] bg-slate-50 lg:border-r border-slate-200 lg:overflow-y-auto p-5 sm:p-8 lg:p-12 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Prévisualisation — page d'accueil</p>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    [ngClass]="form.isActive ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-slate-200 text-slate-500 ring-1 ring-slate-300'">
                {{ form.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <div class="relative w-full max-w-4xl mx-auto aspect-[16/7] min-h-[220px] rounded-2xl overflow-hidden bg-[#004a2a] shadow-2xl ring-1 ring-white/10">
              @if (modalPreviewImage(); as img) {
                <img [src]="img" alt="Prévisualisation de la bannière" class="absolute inset-0 w-full h-full object-cover" />
              } @else {
                <div class="absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-br from-[#00552f] to-[#003d21] text-white/60 text-sm">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Choisissez une image de fond
                </div>
              }
              <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10"></div>
              <div class="absolute inset-0 bg-gradient-to-t from-[#00351d]/85 via-transparent to-transparent"></div>

              <div class="absolute inset-0 px-6 sm:px-10 lg:px-12 pb-6 flex flex-col justify-center max-w-2xl">
                <h3 class="text-white font-bold text-lg sm:text-2xl lg:text-3xl leading-[1.15] tracking-tight [text-wrap:balance] line-clamp-3 drop-shadow-sm">
                  {{ form.title || 'Titre de la bannière' }}
                </h3>
                @if (form.description) {
                  <p class="text-white/85 text-xs sm:text-sm lg:text-base mt-3 line-clamp-2 max-w-xl">{{ form.description }}</p>
                }
                <div class="mt-4 lg:mt-6 flex flex-wrap items-center gap-2.5">
                  @if (form.linkUrl && form.linkText) {
                    <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#00843B] text-sm font-semibold shadow-lg shadow-black/20">
                      {{ form.linkText }}
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </span>
                  }
                  <span class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-medium ring-1 ring-white/40">
                    Toute l'actualité
                  </span>
                </div>
              </div>

              <div class="absolute inset-x-0 bottom-0 h-1 flex">
                <span class="flex-1 bg-[#00843B]"></span>
                <span class="flex-1 bg-[#FCD116]"></span>
                <span class="flex-1 bg-[#E30613]"></span>
              </div>
            </div>

            <p class="text-xs text-slate-500 mt-3 text-center max-w-4xl mx-auto">
              Rendu approximatif de la bannière plein écran.
              @if (form.linkUrl) { Le bouton mène à <span class="text-slate-700 font-medium">{{ linkLabel(form.linkUrl) }}</span>. }
            </p>
          </div>

          <!-- ===== Colonne Champs ===== -->
          <div class="lg:w-2/5 xl:w-[38%] bg-white lg:overflow-y-auto p-5 sm:p-8">
            <div class="max-w-xl mx-auto space-y-5">

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Titre <span class="text-red-500">*</span></label>
                <input type="text" name="title" [(ngModel)]="form.title" required maxlength="255"
                       class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Descriptif</label>
                <textarea name="description" [(ngModel)]="form.description" rows="3" maxlength="500"
                          class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none"></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Lien du bouton</label>
                <app-link-picker name="linkUrl" [(ngModel)]="form.linkUrl" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Texte du bouton</label>
                <input type="text" name="linkText" [(ngModel)]="form.linkText" placeholder="En savoir plus"
                       class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
                <p class="text-xs text-slate-400 mt-1">Le bouton s'affiche seulement si un lien <b>et</b> un texte sont renseignés.</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Ordre d'affichage</label>
                  <input type="number" name="displayOrder" [(ngModel)]="form.displayOrder" min="0"
                         class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Durée de défilement (s)</label>
                  <input type="number" name="displayDuration" [(ngModel)]="form.displayDuration" min="1"
                         class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Image de fond</label>
                <input type="file" accept="image/*" (change)="onFileSelected($event)"
                       class="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium hover:file:bg-primary-100" />
                @if (editing() && !selectedImage) {
                  <p class="text-xs text-slate-400 mt-1">Laissez vide pour conserver l'image actuelle.</p>
                }
              </div>

              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" name="isActive" [(ngModel)]="form.isActive"
                       class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-400" />
                <span class="text-sm text-slate-700">Active (entre dans le défilement)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Barre d'actions -->
        <div class="flex justify-end gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-200 flex-shrink-0 bg-white">
          <button type="button" (click)="closeModal(f)"
                  class="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100">
            Annuler
          </button>
          <button type="submit" [disabled]="saving() || !form.title"
                  class="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {{ saving() ? 'Enregistrement…' : (editing() ? 'Mettre à jour' : 'Créer') }}
          </button>
        </div>
      </form>
    </div>
  }

  <!-- Confirmation suppression -->
  @if (confirmDelete()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-2">Supprimer la bannière ?</h3>
        <p class="text-sm text-slate-500 mb-6">
          « {{ confirmDelete()?.title }} » sera définitivement supprimée.
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
export class BannersComponent implements OnDestroy {
  private apiService = inject(ApiService);
  private readonly FILE_URL = environment.FileUrl;

  banners = signal<Banner[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editing = signal<Banner | null>(null);
  confirmDelete = signal<Banner | null>(null);
  selectedImage: File | null = null;
  /** URL d'objet de l'image choisie, pour la prévisualisation du formulaire. */
  previewUrl = signal<string | null>(null);

  /** Libellé lisible d'une page du site (ou l'URL brute si personnalisée). */
  linkLabel = siteLinkLabel;

  /** Image affichée dans la prévisualisation (nouvelle image, sinon image actuelle). */
  modalPreviewImage(): string | null {
    const p = this.previewUrl();
    if (p) return p;
    const cur = this.editing()?.image;
    return cur ? this.bannerImage(cur) : null;
  }

  private clearPreview(): void {
    const p = this.previewUrl();
    if (p) URL.revokeObjectURL(p);
    this.previewUrl.set(null);
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  form: {
    title: string; description: string; linkUrl: string; linkText: string;
    displayOrder: number; displayDuration: number; isActive: boolean;
  } = this.emptyForm();

  ngOnInit(): void {
    this.load();
  }

  private emptyForm() {
    return { title: '', description: '', linkUrl: '', linkText: '', displayOrder: 0, displayDuration: 5, isActive: true };
  }

  load(): void {
    this.loading.set(true);
    this.apiService.getAllBanners().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        this.banners.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  bannerImage(path?: string): string {
    if (!path) return 'assets/images/home.jpg';
    if (path.startsWith('http') || path.startsWith('assets')) return path;
    return this.FILE_URL + path;
  }

  openModal(): void {
    this.form = this.emptyForm();
    this.selectedImage = null;
    this.clearPreview();
    this.editing.set(null);
    this.showModal.set(true);
  }

  editBanner(b: Banner): void {
    this.form = {
      title: b.title,
      description: b.description || '',
      linkUrl: b.linkUrl || '',
      linkText: b.linkText || '',
      displayOrder: b.displayOrder ?? 0,
      displayDuration: b.displayDuration ?? 5,
      isActive: b.isActive ?? true
    };
    this.selectedImage = null;
    this.clearPreview();
    this.editing.set(b);
    this.showModal.set(true);
  }

  closeModal(form?: NgForm): void {
    this.showModal.set(false);
    this.editing.set(null);
    this.selectedImage = null;
    this.clearPreview();
    form?.resetForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedImage = null;
      this.clearPreview();
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.selectedImage = null;
      this.clearPreview();
      this.showNotification("Le fichier doit être une image", 'error');
      return;
    }
    this.selectedImage = file;
    this.clearPreview();
    this.previewUrl.set(URL.createObjectURL(file));
  }

  save(form: NgForm): void {
    if (!this.form.title) return;
    this.saving.set(true);

    const dto = {
      title: this.form.title,
      description: this.form.description,
      linkUrl: this.form.linkUrl,
      linkText: this.form.linkText,
      displayOrder: Number(this.form.displayOrder) || 0,
      displayDuration: Number(this.form.displayDuration) || 5,
      isActive: this.form.isActive
    };

    const formData = new FormData();
    formData.append('banner', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    if (this.selectedImage) formData.append('image', this.selectedImage);

    const editing = this.editing();
    const request = editing
      ? this.apiService.updateBanner(editing.id, formData)
      : this.apiService.createBanner(formData);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal(form);
        this.load();
        this.showNotification(editing ? "Bannière mise à jour" : "Bannière créée", 'success');
      },
      error: (err) => {
        console.error('Erreur sauvegarde bannière', err);
        this.saving.set(false);
      }
    });
  }

  /** Réordonnancement par glisser-déposer : met à jour l'ordre localement puis persiste. */
  onDrop(event: CdkDragDrop<Banner[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const list = [...this.banners()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    list.forEach((b, i) => (b.displayOrder = i + 1)); // retour visuel immédiat
    this.banners.set(list);

    this.apiService.reorderBanners(list.map(b => b.id)).subscribe({
      next: () => this.showNotification('Ordre mis à jour', 'success'),
      error: () => {
        this.load(); // resynchronise avec le backend en cas d'échec
      }
    });
  }

  askDelete(b: Banner): void {
    this.confirmDelete.set(b);
  }

  doDelete(): void {
    const b = this.confirmDelete();
    if (!b) return;
    this.apiService.deleteBanner(b.id).subscribe({
      next: () => {
        this.confirmDelete.set(null);
        this.load();
        this.showNotification("Bannière supprimée", 'success');
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
