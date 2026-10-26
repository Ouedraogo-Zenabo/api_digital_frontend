import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Project } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-detail-projets',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-projets.component.html',
  styleUrls: ['./detail-projets.component.scss']
})
export class DetailProjetsComponent implements OnDestroy {

    project = signal<Project | null>(null);
  loading = signal(true);
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    // Recharge à chaque changement d'`id` (composant réutilisé d'un projet à l'autre).
    this.routeSub = this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (!id) return;
      this.loading.set(true);
      this.project.set(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.apiService.getPublicProjectById(id).subscribe({
        next: res => {
          if (res.success) { this.project.set(res.data); this.applySeo(res.data); }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  /** SEO spécifique au projet (titre, description, fil d'ariane). */
  private applySeo(p: Project): void {
    const desc = (p.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    const url = `/projets/${p.id}`;
    this.seo.update({ title: p.name, description: desc, url, type: 'article' });
    this.seo.setBreadcrumb([
      { name: 'Accueil', url: '/' },
      { name: 'Grands Chantiers', url: '/projets' },
      { name: p.name, url },
    ]);
  }

  /* ================= STATUS ================= */

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PLANIFIE: 'Planifié',
      EN_COURS: 'En cours',
      SUSPENDU: 'Suspendu',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold';
    const map: Record<string, string> = {
      PLANIFIE: `${base} bg-white/20 text-white`,
      EN_COURS: `${base} bg-yellow-100 text-yellow-800`,
      SUSPENDU: `${base} bg-red-100 text-red-800`,
      TERMINE: `${base} bg-green-100 text-green-800`,
      ANNULE: `${base} bg-red-200 text-red-900`
    };
    return map[status] || base;
  }

  /* ================= PROGRESSION ================= */

  getProgressColor(project: Project): string {
    const p = project.progressPercentage;
    if (p >= 80) return '#00843B';
    if (p >= 50) return '#6FCF97';
    if (p >= 20) return '#F2C94C';
    return '#EB5757';
  }

  getContrastTextColor(hex: string): string {
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
  }

  /* ================= FORMAT ================= */

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatBudget(budget: number): string {
    if (budget >= 1_000_000_000) return (budget / 1_000_000_000).toFixed(1) + ' Mds FCFA';
    if (budget >= 1_000_000) return (budget / 1_000_000).toFixed(0) + ' M FCFA';
    return budget.toLocaleString('fr-FR') + ' FCFA';
  }

  /** Rendu d'un champ riche : HTML tel quel si l'éditeur a produit des balises,
   *  sinon (ancien texte brut) on préserve les sauts de ligne. */
  renderRich(value?: string): string {
    if (!value) return '';
    if (/<[a-z][\s\S]*>/i.test(value)) return value;
    return value.replace(/\r\n|\r|\n/g, '<br>');
  }

}
