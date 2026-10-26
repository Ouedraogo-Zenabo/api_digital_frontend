import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Article } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';
import { SeoService } from '../../../core/services/seo.service';
import { environment } from '../../../../environments/environment';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { stripHtml as stripHtmlText } from '../../../shared/pipes/strip-html.pipe';

@Component({
  selector: 'app-detail-articles',
  standalone: true,
  imports: [SafeHtmlPipe, CommonModule, RouterModule, ],
  templateUrl: './detail-articles.component.html',
  styleUrls: ['./detail-articles.component.scss']
})
export class DetailArticlesComponent implements OnDestroy {

  private readonly API_URL = environment.FileUrl;
  private routeSub?: Subscription;

  article = signal<Article | null>(null);
  loading = signal(true);
  agendas = signal<Article[]>([]);

  // ---- Présentation adaptée à la catégorie (communiqué vs actualité) ----
  get isCommunique(): boolean { return this.article()?.category === 'COMMUNIQUE'; }
  get listLabel(): string { return this.isCommunique ? 'Communiqués' : 'Actualités'; }
  get listRoute(): string { return this.isCommunique ? '/communiques' : '/actualites'; }
  get itemNoun(): string { return this.isCommunique ? 'ce communiqué' : 'cet article'; }
  get relatedTitle(): string { return this.isCommunique ? 'Autres communiqués' : 'Actualités récentes'; }

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    // On s'abonne aux paramètres de route : quand on clique sur un autre article
    // depuis la barre latérale, Angular réutilise le composant — il faut donc
    // recharger à chaque changement d'`id` (et pas seulement au premier affichage).
    this.routeSub = this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (id) {
        this.loading.set(true);
        this.article.set(null);
        this.agendas.set([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadArticle(id);
      } else {
        this.loadArticles();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadArticle(id: string): void {
    this.apiService.getPublishedArticleById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.article.set(response.data);
          this.applySeo(response.data);
          this.loadArticles(); // liste latérale filtrée par catégorie de l'article courant
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  /** SEO spécifique à l'article (titre, description, image, JSON-LD NewsArticle, fil d'ariane). */
  private applySeo(a: Article): void {
    const desc = this.stripHtml(a.summary || a.content).slice(0, 200);
    const img = this.getImageUrl(a.featuredImage || a.images?.[0]?.imageUrl) || undefined;
    const url = `/actualites/${a.id}`;
    this.seo.update({
      title: a.title, description: desc, image: img, url, type: 'article',
      publishedTime: a.publishedAt || a.createdAt, author: a.authorName,
    });
    this.seo.setBreadcrumb([
      { name: 'Accueil', url: '/' },
      { name: this.listLabel, url: this.listRoute },
      { name: a.title, url },
    ]);
    this.seo.setJsonLd('article', {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: a.title,
      description: desc,
      image: img ? this.seo.absolute(img) : undefined,
      datePublished: a.publishedAt || a.createdAt,
      dateModified: (a as any).updatedAt || a.publishedAt || a.createdAt,
      author: { '@type': 'Organization', name: this.seo.siteName },
      publisher: { '@type': 'Organization', name: this.seo.siteName, logo: { '@type': 'ImageObject', url: this.seo.absolute('/favicon-192x192.png') } },
      mainEntityOfPage: this.seo.absolute(url),
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
  // Normalise les espaces insécables parasites (collés partout lors d'un
  // copier-coller depuis Word / un PDF) qui empêchent le retour à la ligne.
  content = content.replace(new RegExp('&nbsp;|' + String.fromCharCode(160), 'g'), ' ');
  // Contenu déjà au format HTML (éditeur riche) → on le rend tel quel.
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  // Sinon (ancien contenu texte brut) → on crée des paragraphes.
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = content.split(/\n+/);
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
}

/** Retire les balises HTML et décode les entités pour les aperçus / le chapô. */
stripHtml(html?: string): string {
  return stripHtmlText(html);
}

 getImageUrl(path?: string): string | null {
    return path ? (/^(https?:|data:|blob:)/i.test(path) ? path : this.API_URL + path) : null;
  }

  /** Pièces jointes de l'article (hors image d'en-tête) : images + PDF. */
  get attachments(): { url: string; isPdf: boolean; name: string }[] {
    const a = this.article();
    if (!a?.images?.length) return [];
    // images[0] sert d'image d'en-tête quand aucune featuredImage n'est définie.
    // Pour un communiqué, pas d'image d'en-tête → toutes les images sont des pièces jointes.
    const list = (a.featuredImage || this.isCommunique) ? a.images : a.images.slice(1);
    return list.map(img => ({
      url: this.getImageUrl(img.imageUrl) || img.imageUrl,
      isPdf: /\.pdf(\?|$)/i.test(img.imageUrl || ''),
      name: (img.imageUrl || '').split('/').pop() || 'Pièce jointe',
    }));
  }
  get attachmentImages() { return this.attachments.filter(x => !x.isPdf); }
  get attachmentPdfs() { return this.attachments.filter(x => x.isPdf); }

  loadArticles(): void {
  this.apiService.getPublishedArticles().subscribe({
    next: (response) => {
      if (response.success) {
        const cat = this.article()?.category;
        const currentId = this.article()?.id;
        const ts = (v: any) => { const t = new Date(v).getTime(); return isNaN(t) ? 0 : t; };

        let list = response.data.content.filter((x: any) => x.id !== currentId);
        // Même catégorie que l'article courant ; repli sur tout si trop peu d'éléments.
        const sameCat = cat ? list.filter((x: any) => x.category === cat) : list;
        list = (sameCat.length >= 1 ? sameCat : list)
          .sort((a: any, b: any) => ts(b.publishedAt || b.createdAt) - ts(a.publishedAt || a.createdAt))
          .slice(0, 5);

        this.agendas.set(list);
      }
    },
    error: () => {}
  });
}

 






}
