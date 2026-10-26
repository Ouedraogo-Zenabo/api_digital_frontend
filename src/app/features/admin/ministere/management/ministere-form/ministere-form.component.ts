import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EditorModule } from 'primeng/editor';
import { Ministere } from '../../../../../core/models/event.model';
import { ApiService } from '../../../../../core/services/api.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-ministere-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditorModule],
  templateUrl: './ministere-form.component.html',
})
export class MinistereFormComponent {
  private readonly FILE_URL = environment.FileUrl;

  id: string | null = null;
  loading = signal(false);
  saving = signal(false);

  form = {
    nomGeneral: '', nomReel: '', acronyme: '',
    missionGeneral: '', presentationSynthetique: '', presentationGlobale: '',
    logo: '', image: '',
  };
  logoFile: File | null = null;
  imageFile: File | null = null;
  logoPreview = signal<string | null>(null);
  imagePreview = signal<string | null>(null);

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const param = this.route.snapshot.params['id'];
    if (param && param !== 'new') {
      this.id = param;
      this.load(param);
    }
  }

  get isEdit(): boolean { return this.id != null; }

  load(id: string): void {
    this.loading.set(true);
    this.api.getminById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const m = res.data;
          this.form = {
            nomGeneral: m.nomGeneral ?? '', nomReel: m.nomReel ?? '', acronyme: m.acronyme ?? '',
            missionGeneral: m.missionGeneral ?? '', presentationSynthetique: m.presentationSynthetique ?? '',
            presentationGlobale: m.presentationGlobale ?? '', logo: m.logo ?? '', image: m.image ?? '',
          };
          this.logoPreview.set(m.logo ? this.FILE_URL + m.logo : null);
          this.imagePreview.set(m.image ? this.FILE_URL + m.image : null);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onLogo(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f && f.type.startsWith('image/')) { this.logoFile = f; this.logoPreview.set(URL.createObjectURL(f)); }
  }
  onImage(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f && f.type.startsWith('image/')) { this.imageFile = f; this.imagePreview.set(URL.createObjectURL(f)); }
  }

  save(): void {
    if (!this.form.nomGeneral.trim() || !this.form.nomReel.trim()) {
      this.notify('Le nom général et le nom réel sont requis.', 'error');
      return;
    }
    this.saving.set(true);
    const dto = {
      nomGeneral: this.form.nomGeneral,
      nomReel: this.form.nomReel,
      acronyme: this.form.acronyme,
      missionGeneral: this.form.missionGeneral,
      presentationGlobale: this.form.presentationGlobale,
      presentationSynthetique: this.form.presentationSynthetique,
    };
    const fd = new FormData();
    fd.append('ministere', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    if (this.logoFile) fd.append('logo', this.logoFile);
    if (this.imageFile) fd.append('image', this.imageFile);

    const req = this.isEdit ? this.api.updatemin(this.id!, fd) : this.api.createmin(fd);
    req.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.router.navigate(['/admin/ministere-gestion'], { state: { tab: 'ministere', msg: this.isEdit ? 'Ministère mis à jour' : 'Ministère créé' } });
        } else { this.notify(res.message || 'Échec de l\'enregistrement.', 'error'); }
      },
      error: () => { this.saving.set(false); },
    });
  }

  cancel(): void { this.router.navigate(['/admin/ministere-gestion']); }

  private notify(message: string, type: 'success' | 'error'): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), 3000);
  }
}
