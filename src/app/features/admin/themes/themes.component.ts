import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeModel } from '../../../core/models';

@Component({
  selector: 'app-admin-themes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-6xl mx-auto">

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Thème du site</h1>
        <p class="text-sm text-slate-500 mt-1">
          Définissez les couleurs de marque, puis <b>validez</b> un thème : il s'applique alors
          sur <b>tout le site public</b>. Un seul thème est actif à la fois.
        </p>
      </div>
      <button (click)="openCreate()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nouveau thème
      </button>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">

      <!-- Liste des thèmes -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="px-4 py-10 text-center text-slate-400">Chargement…</div>
        } @else if (themes().length === 0) {
          <div class="px-4 py-10 text-center text-slate-400">Aucun thème. Créez-en un puis validez-le.</div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (t of themes(); track t.id) {
              <div class="flex items-center gap-3 px-4 py-3">
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <span class="w-6 h-6 rounded-full ring-1 ring-slate-200" [style.background]="t.primaryColor"></span>
                  <span class="w-6 h-6 rounded-full ring-1 ring-slate-200" [style.background]="t.accentColor"></span>
                  <span class="w-6 h-6 rounded-full ring-1 ring-slate-200" [style.background]="t.secondaryColor"></span>
                  <span class="w-6 h-6 rounded-full ring-1 ring-slate-200" [style.background]="t.tertiaryColor"></span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-slate-800 truncate">{{ t.title }}</div>
                  <div class="text-xs text-slate-400">{{ t.primaryColor }}</div>
                </div>
                @if (t.isActive) {
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-200 flex-shrink-0">Actif</span>
                } @else {
                  <button (click)="activate(t)"
                          class="px-3 py-1.5 rounded-lg text-xs font-medium border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors flex-shrink-0">
                    Valider
                  </button>
                }
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button (click)="edit(t)" title="Modifier" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="remove(t)" title="Supprimer" [disabled]="t.isActive"
                          class="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Formulaire + aperçu -->
      <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ editing() ? 'Modifier le thème' : 'Nouveau thème' }}</h2>
        <form #f="ngForm" (ngSubmit)="save(f)" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nom <span class="text-red-500">*</span></label>
            <input type="text" name="title" [(ngModel)]="form.title" required
                   class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
          </div>

          @for (c of colorFields; track c.key) {
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ c.label }}</label>
              <div class="flex items-center gap-2">
                <input type="color" [ngModel]="form[c.key]" (ngModelChange)="form[c.key] = $event" [name]="c.key + 'Picker'"
                       class="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                <input type="text" [(ngModel)]="form[c.key]" [name]="c.key" placeholder="#RRGGBB"
                       class="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none" />
              </div>
            </div>
          }

          <!-- Aperçu live -->
          <div class="rounded-lg overflow-hidden ring-1 ring-slate-100">
            <div class="px-4 py-3 text-white text-sm font-semibold" [style.background]="form.primaryColor || '#00843B'">Aperçu — en-tête</div>
            <div class="p-4 bg-slate-50 space-y-2">
              <button type="button" class="px-3 py-1.5 rounded-lg text-white text-xs font-medium" [style.background]="form.primaryColor || '#00843B'">Bouton principal</button>
              <div class="flex gap-2">
                <span class="px-2 py-0.5 rounded-full text-xs text-white" [style.background]="form.accentColor || '#FCD116'">Accent</span>
                <span class="px-2 py-0.5 rounded-full text-xs text-white" [style.background]="form.secondaryColor || '#EF3340'">Secondaire</span>
                <span class="px-2 py-0.5 rounded-full text-xs text-white" [style.background]="form.tertiaryColor || '#B8860B'">Tertiaire</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            @if (editing()) {
              <button type="button" (click)="openCreate()" class="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100">Annuler</button>
            }
            <button type="submit" [disabled]="saving() || !form.title"
                    class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {{ saving() ? 'Enregistrement…' : (editing() ? 'Mettre à jour' : 'Créer') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `,
})
export class ThemesComponent {
  private api = inject(ApiService);
  private themeSvc = inject(ThemeService);
  private notify = inject(NotificationService);

  themes = signal<ThemeModel[]>([]);
  loading = signal(true);
  saving = signal(false);
  editing = signal<ThemeModel | null>(null);

  readonly colorFields: { key: 'primaryColor' | 'accentColor' | 'secondaryColor' | 'tertiaryColor'; label: string }[] = [
    { key: 'primaryColor', label: 'Couleur primaire' },
    { key: 'accentColor', label: 'Couleur accent' },
    { key: 'secondaryColor', label: 'Couleur secondaire' },
    { key: 'tertiaryColor', label: 'Couleur tertiaire' },
  ];

  form: any = this.emptyForm();

  ngOnInit(): void { this.load(); }

  private emptyForm() {
    return { title: '', primaryColor: '#00843B', accentColor: '#FCD116', secondaryColor: '#EF3340', tertiaryColor: '#B8860B' };
  }

  load(): void {
    this.loading.set(true);
    this.api.getAllThemes().subscribe({
      next: r => { if (r.success) this.themes.set(r.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.editing.set(null);
  }

  edit(t: ThemeModel): void {
    this.form = {
      title: t.title,
      primaryColor: t.primaryColor || '#00843B',
      accentColor: t.accentColor || '#FCD116',
      secondaryColor: t.secondaryColor || '#EF3340',
      tertiaryColor: t.tertiaryColor || '#B8860B',
    };
    this.editing.set(t);
  }

  save(f: NgForm): void {
    if (!this.form.title) return;
    this.saving.set(true);
    const dto: ThemeModel = { ...this.form };
    const editing = this.editing();
    const req = editing ? this.api.updateTheme(editing.id!, dto) : this.api.createTheme(dto);
    req.subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.notify.success(editing ? 'Thème mis à jour' : 'Thème créé');
          // Si l'on modifie le thème actif, on réapplique immédiatement.
          if (editing?.isActive && r.data) this.themeSvc.apply(r.data);
          this.openCreate();
          this.load();
        }
      },
      error: () => this.saving.set(false),
    });
  }

  activate(t: ThemeModel): void {
    this.api.activateTheme(t.id!).subscribe({
      next: r => {
        if (r.success && r.data) {
          this.notify.success('Thème validé — appliqué sur tout le site');
          this.themeSvc.apply(r.data); // application immédiate (admin + site)
          this.load();
        }
      },
    });
  }

  remove(t: ThemeModel): void {
    if (t.isActive) return;
    this.api.deleteTheme(t.id!).subscribe({
      next: r => { if (r.success) { this.notify.success('Thème supprimé'); this.load(); } },
    });
  }
}
