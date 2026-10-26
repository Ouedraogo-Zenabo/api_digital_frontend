import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { Ministre } from '../../../core/models/event.model';
import { MinistereService } from '../../../core/services/ministere.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-anciens-ministres',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './anciens-ministres.component.html'
})
export class AnciensMinistresComponent {

  private readonly API_URL = environment.FileUrl;

  loading = signal(true);
  /** Anciens Ministres de la page courante (pagination serveur). */
  pagedAnciens = signal<Ministre[]>([]);
  /** Nombre total d'Anciens Ministres. */
  total = signal(0);

  currentPage = signal(1);
  readonly pageSize = 6;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  constructor(private min: MinistereService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.min.getFormerMinistres(this.currentPage() - 1, this.pageSize).subscribe({
      next: (r) => {
        if (r.success) {
          this.pagedAnciens.set(r.data.content || []);
          this.total.set(r.data.totalElements || 0);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(v => v + 1);
      this.load();
      this.scrollTop();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(v => v - 1);
      this.load();
      this.scrollTop();
    }
  }

  private scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getImageUrl(path?: string): string | null {
    return path ? this.API_URL + path : null;
  }

  /** Mois + année d'une date ISO (ex. « janv. 2018 »). */
  monthYear(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  }

  /** Libellé du mandat : « janv. 2018 – déc. 2022 » ou « janv. 2022 – … ». */
  mandat(m: Ministre): string {
    const debut = this.monthYear(m.dateDebut);
    const fin = this.monthYear(m.dateFin);
    if (!debut && !fin) return 'Mandat non renseigné';
    return `${debut || '?'} – ${fin || '…'}`;
  }

  /** Date complète en français (ex. « 3 janvier 2018 »). */
  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
