import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  /** Chemin (ex. "/actualites") ou URL absolue. Sert au canonical + og:url. */
  url?: string;
  /** Image absolue ou chemin relatif au domaine pour les partages sociaux. */
  image?: string;
  type?: 'website' | 'article' | 'profile';
  /** Empêcher l'indexation de la page (true → noindex). */
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

/**
 * Service SEO centralisé : titre, balises meta (description, mots-clés, robots),
 * URL canonique, Open Graph (Facebook/WhatsApp/LinkedIn) et Twitter Cards, plus
 * données structurées JSON-LD (Schema.org) pour le référencement et les rich results.
 *
 * NB : ce site est une SPA (rendu côté client). Google exécute le JS et voit ces
 * balises, mais les robots des réseaux sociaux (Facebook, WhatsApp…) ne l'exécutent
 * pas → pour des aperçus de partage fiables, prévoir le prerendering / SSR (voir README).
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  readonly siteName = "MTDPCE — Ministère de la Transition Digitale, des Postes et des Communications Électroniques, des Postes et des Communications Électroniques";
  readonly siteUrl = (environment as any).siteUrl || '';
  readonly defaultDescription =
    "Site officiel du Ministère de la Transition Digitale, des Postes et des Communications Électroniques, des Postes et des Communications Électroniques du Burkina Faso : actualités, projets, services, agenda et communiqués.";
  readonly defaultImage = '/favicon-192x192.png';

  /** Met à jour l'ensemble des balises SEO de la page courante. */
  update(config: SeoConfig = {}): void {
    const title = config.title ? `${config.title} | ${this.shortName}` : this.siteName;
    const description = (config.description || this.defaultDescription).slice(0, 320);
    const url = this.absolute(config.url);
    const image = this.absolute(config.image || this.defaultImage);
    const type = config.type || 'website';

    this.title.setTitle(title);
    this.setName('description', description);
    if (config.keywords) this.setName('keywords', config.keywords);
    this.setName('robots', config.noindex ? 'noindex, nofollow' : 'index, follow');
    this.setName('author', config.author || this.siteName);

    // URL canonique
    this.setCanonical(url);

    // Open Graph
    this.setProp('og:site_name', this.siteName);
    this.setProp('og:locale', 'fr_FR');
    this.setProp('og:type', type);
    this.setProp('og:title', config.title || this.siteName);
    this.setProp('og:description', description);
    this.setProp('og:url', url);
    this.setProp('og:image', image);

    // Twitter
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', config.title || this.siteName);
    this.setName('twitter:description', description);
    this.setName('twitter:image', image);

    // Méta d'article
    if (type === 'article') {
      if (config.publishedTime) this.setProp('article:published_time', config.publishedTime);
      if (config.modifiedTime) this.setProp('article:modified_time', config.modifiedTime);
      if (config.author) this.setProp('article:author', config.author);
    } else {
      this.removeProp('article:published_time');
      this.removeProp('article:modified_time');
      this.removeProp('article:author');
    }
  }

  private get shortName(): string { return 'MTDPCE'; }

  /** Construit une URL absolue à partir d'un chemin ou renvoie l'URL telle quelle. */
  absolute(pathOrUrl?: string): string {
    if (!pathOrUrl) return this.siteUrl || '';
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const base = (this.siteUrl || '').replace(/\/$/, '');
    return base + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
  }

  // ---------------- Données structurées JSON-LD ----------------

  /** Injecte (ou remplace) un bloc JSON-LD identifié par une clé. */
  setJsonLd(id: string, data: Record<string, any>): void {
    const elId = 'ld-' + id;
    let script = this.doc.getElementById(elId) as HTMLScriptElement | null;
    if (!script) {
      script = this.doc.createElement('script');
      script.id = elId;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }
    script.text = JSON.stringify(data);
  }

  removeJsonLd(id: string): void {
    this.doc.getElementById('ld-' + id)?.remove();
  }

  /** Données structurées de l'organisation gouvernementale (injectées une fois). */
  setOrganization(): void {
    this.setJsonLd('organization', {
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: this.siteName,
      alternateName: 'MTDPCE',
      url: this.siteUrl,
      logo: this.absolute('/favicon-192x192.png'),
      address: {
        '@type': 'PostalAddress',
        streetAddress: "Avenue de l'Indépendance",
        addressLocality: 'Ouagadougou',
        addressCountry: 'BF',
      },
      areaServed: 'BF',
    });
  }

  /** Fil d'ariane structuré pour les rich results. */
  setBreadcrumb(items: { name: string; url: string }[]): void {
    this.setJsonLd('breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        item: this.absolute(it.url),
      })),
    });
  }

  // ---------------- Helpers bas niveau ----------------

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }
  private setProp(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }
  private removeProp(property: string): void {
    this.meta.removeTag(`property='${property}'`);
  }
  private setCanonical(url: string): void {
    if (!url) return;
    let link = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
