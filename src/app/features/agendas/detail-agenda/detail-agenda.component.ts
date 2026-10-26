import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Agenda } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-detail-agenda',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-agenda.component.html',
  styleUrls: ['./detail-agenda.component.scss']
})
export class DetailAgendaComponent {

  private readonly API_URL = environment.FileUrl;

  article = signal<Agenda | null>(null);
  loading = signal(true);
  agendas = signal<Agenda[]>([]);
  
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private seo: SeoService
  ) {}
  
  ngOnInit(): void {

    this.loadAgendas()
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadArticle(id);
    }
  }


    loadArticle(id: string): void {
    this.apiService.getPublishedAgendaeById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.article.set(response.data);
          this.applySeo(response.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  /** SEO spécifique à l'agenda (titre, description, image, fil d'ariane). */
  private applySeo(a: Agenda): void {
    const desc = this.stripHtml(a.summary || a.content).slice(0, 200);
    const img = this.getImageUrl(a.images?.[0]?.imageUrl) || undefined;
    const url = `/agendas/${a.id}`;
    this.seo.update({
      title: a.title, description: desc, image: img, url, type: 'article',
      publishedTime: a.publishedAt || a.createdAt,
    });
    this.seo.setBreadcrumb([
      { name: 'Accueil', url: '/' },
      { name: 'Agenda', url: '/agendas' },
      { name: a.title, url },
    ]);
  }


  loadAgendas(): void {
    this.loading.set(true);
    this.apiService.getPublishedAgendas(0, 10).subscribe({
      next: (response) => {
        if (response.success) {

          this.agendas.set(response.data.content);

          //this.articles.set(response.data.content);
          
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
  
  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'ACTUALITE': 'Actualité',
      'COMMUNIQUE': 'Communiqué',
      'EVENEMENT': 'Événement',
      'PROJET': 'Projet',
      'RAPPORT': 'Rapport',
      'DISCOURS': 'Discours'
    };
    return labels[category] || category;
  }

  getStatusLabel(status: string) {
    const labels: Record<string, string> = { DRAFT: 'Brouillon', PENDING: 'En attente', PUBLISHED: 'Publié', ARCHIVED: 'Archivé' };
    return labels[status] || status;
  }
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  
  formatContent1(content: string): string {
    // Simple formatting - convert line breaks to paragraphs
    if (!content) return '';
    return content.split('\n\n').map(p => `<p>${p}</p>`).join('');
  }

formatContent(content: string): string {
  if (!content) return '';
  // Contenu déjà au format HTML (éditeur riche) → on le rend tel quel.
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  // Sinon (ancien contenu texte brut) → on crée des paragraphes.
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = content.split(/\n+/);
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
}

/** Retire les balises HTML pour les aperçus courts (cartes, listes). */
stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

 getImageUrl(path?: string): string | null {
    return path ? this.API_URL + path : null;
   
  }
  

}
