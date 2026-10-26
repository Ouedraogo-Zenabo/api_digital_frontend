/**
 * Liste des pages publiques du site, regroupées par rubrique.
 *
 * Sert de source aux sélecteurs « choisir une page du site » de l'administration
 * (bannières d'accueil, etc.). Tenir aligné avec le menu public
 * (`layouts/public/header/header.component.html`) et `app.routes.ts`.
 */
export interface SiteLink {
  label: string;
  /** Chemin relatif au site (commence par « / »). */
  url: string;
}

export interface SiteLinkGroup {
  group: string;
  links: SiteLink[];
}

export const SITE_LINK_GROUPS: SiteLinkGroup[] = [
  {
    group: 'Général',
    links: [
      { label: 'Accueil', url: '/' },
      { label: 'Actualités', url: '/actualites' },
      { label: 'Communiqués', url: '/communiques' },
      { label: 'Agenda institutionnel', url: '/agendas' },
      { label: 'Événements', url: '/evenements' },
      { label: 'Médiathèque', url: '/mediatheque' },
      { label: 'Nous contacter', url: '/contact' },
      { label: 'FAQ', url: '/faq' },
      { label: 'Recherche', url: '/recherche' },
    ],
  },
  {
    group: 'Le Ministère',
    links: [
      { label: 'Le Ministre', url: '/ministere/ministre' },
      { label: 'Anciens Ministres', url: '/ministere/anciens-ministres' },
      { label: 'Missions et attributions', url: '/ministere/missions' },
      { label: 'Organigramme', url: '/ministere/organigramme' },
      { label: 'Structures rattachées', url: '/ministere/structures' },
    ],
  },
  {
    group: 'Services & Ressources',
    links: [
      { label: 'Services en ligne', url: '/services' },
      { label: 'Documents / Règlementation', url: '/ressources/documents' },
      { label: 'Stratégie & Politiques', url: '/ressources/politiques' },
    ],
  },
  {
    group: 'Projets',
    links: [
      { label: 'Tous les projets', url: '/projets' },
    ],
  },
];

/** Liste à plat de toutes les pages connues. */
export const SITE_LINKS: SiteLink[] = SITE_LINK_GROUPS.flatMap(g => g.links);

/** Vrai si l'URL correspond à une page connue du site. */
export function isKnownSiteLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return SITE_LINKS.some(l => l.url === url);
}

/** Libellé lisible d'une URL connue, sinon l'URL elle-même. */
export function siteLinkLabel(url: string | null | undefined): string {
  if (!url) return '';
  return SITE_LINKS.find(l => l.url === url)?.label ?? url;
}
