import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { HomeDocConfig } from '../../../core/models/event.model';
import { environment } from '../../../../environments/environment';
import { SafeUrlPipe } from '../../../safe-url.pipe';

/**
 * Gestion du document officiel mis en avant sur la page d'accueil.
 * Une seule configuration : intitulé, descriptif, fichier PDF, actif/inactif.
 */
@Component({
  selector: 'app-admin-home-doc',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './home-doc.component.html',
})
export class HomeDocComponent {

  private readonly FILE_URL = environment.FileUrl;

  config = signal<HomeDocConfig | null>(null);
  loading = signal(true);
  saving = signal(false);

  form: { title: string; description: string; active: boolean } = { title: '', description: '', active: false };
  selectedFile: File | null = null;

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.apiService.getHomeDoc().subscribe({
      next: (res) => {
        if (res.success) {
          this.config.set(res.data);
          this.form = {
            title: res.data.title || '',
            description: res.data.description || '',
            active: res.data.active ?? false,
          };
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get currentUrl(): string {
    const u = this.config()?.fileUrl;
    if (!u) return '';
    return /^https?:\/\//i.test(u) ? u : this.FILE_URL + u;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file && file.type !== 'application/pdf') {
      input.value = '';
      this.selectedFile = null;
      this.notify('Le document doit être un PDF.', 'error');
      return;
    }
    this.selectedFile = file;
  }

  save(): void {
    if (!this.form.title.trim()) { this.notify('Le titre est obligatoire.', 'error'); return; }
    if (!this.config()?.fileUrl && !this.selectedFile) { this.notify('Veuillez joindre un fichier PDF.', 'error'); return; }

    this.saving.set(true);
    const fd = new FormData();
    fd.append('title', this.form.title.trim());
    fd.append('description', this.form.description.trim());
    fd.append('active', String(this.form.active));
    if (this.selectedFile) fd.append('file', this.selectedFile);

    this.apiService.updateHomeDoc(fd).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedFile = null;
        if (res.success) this.config.set(res.data);
        this.notify('Document officiel mis à jour.', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.notify("Échec de l'enregistrement.", 'error');
      },
    });
  }

  private notify(message: string, type: 'success' | 'error' = 'success') {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), 2500);
  }
}
