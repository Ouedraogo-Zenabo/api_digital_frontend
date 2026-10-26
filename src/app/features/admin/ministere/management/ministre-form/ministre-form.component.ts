import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EditorModule } from 'primeng/editor';
import { Ministere, Ministre } from '../../../../../core/models/event.model';
import { ApiService } from '../../../../../core/services/api.service';
import { MinistereService } from '../../../../../core/services/ministere.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-ministre-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditorModule],
  templateUrl: './ministre-form.component.html',
})
export class MinistreFormComponent {
  private readonly FILE_URL = environment.FileUrl;

  id: string | null = null;
  loading = signal(false);
  saving = signal(false);
  ministeres = signal<Ministere[]>([]);

  form = { nom: '', prenom: '', profession: '', biographie: '', content: '', isActif: true, dateDebut: '', dateFin: '', ministereId: "" };
  photoFile: File | null = null;
  photoPreview = signal<string | null>(null);

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  constructor(
    private api: ApiService,
    private min: MinistereService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadMinisteres();
    const param = this.route.snapshot.params['id'];
    if (param && param !== 'new') {
      this.id = param;
      this.load(param);
    }
  }

  get isEdit(): boolean { return this.id != null; }

  loadMinisteres(): void {
    this.api.getAllMins(0, 100).subscribe({
      next: (res) => { if (res.success) this.ministeres.set(res.data.content ?? []); },
      error: () => {},
    });
  }

  load(id: string): void {
    this.loading.set(true);
    this.min.getAllMinistre(0, 1000).subscribe({
      next: (res) => {
        const found = (res.success ? res.data.content : [])?.find(m => m.id === id);
        if (found) {
          this.form = {
            nom: found.nom ?? '', prenom: found.prenom ?? '', profession: found.profession ?? '',
            biographie: found.biographie ?? '', content: found.content ?? '',
            isActif: found.isActif ?? true,
            dateDebut: found.dateDebut ?? '', dateFin: found.dateFin ?? '',
            ministereId: found.ministereId ?? 0,
          };
          this.photoPreview.set(found.photo ? this.FILE_URL + found.photo : null);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPhoto(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f && f.type.startsWith('image/')) { this.photoFile = f; this.photoPreview.set(URL.createObjectURL(f)); }
  }

  save(): void {
    if (!this.form.nom.trim() || !this.form.prenom.trim()) {
      this.notify('Le nom et le prénom sont requis.', 'error');
      return;
    }
    this.saving.set(true);
    const dto = {
      nom: this.form.nom,
      prenom: this.form.prenom,
      profession: this.form.profession,
      biographie: this.form.biographie,
      content: this.form.content,
      isActif: this.form.isActif,
      dateDebut: this.form.dateDebut || null,
      dateFin: this.form.dateFin || null,
      ministereId: this.form.ministereId,
    };
    const fd = new FormData();
    fd.append('ministre', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    if (this.photoFile) fd.append('photo', this.photoFile);

    const req = this.isEdit ? this.min.updateMinistre(this.id!, fd) : this.min.createMinistre(fd);
    req.subscribe({
      next: (res: any) => {
        this.saving.set(false);
        // Succès dès que la requête aboutit (HTTP 2xx) — l'API renvoie soit
        // { success, data }, soit directement le ministre.
        if (res && res.success === false) {
          this.notify(res.message || 'Échec de l\'enregistrement.', 'error');
          return;
        }
        this.router.navigate(['/admin/ministere-gestion'], { state: { tab: 'ministre', msg: this.isEdit ? 'Ministre mis à jour' : 'Ministre créé' } });
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err?.error?.message || "Échec de l'enregistrement.", 'error');
      },
    });
  }

  cancel(): void { this.router.navigate(['/admin/ministere-gestion']); }

  private notify(message: string, type: 'success' | 'error'): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), 3000);
  }
}
