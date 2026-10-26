import { SITE_LINKS, SITE_LINK_GROUPS, isKnownSiteLink, siteLinkLabel } from './site-links';

describe('site-links', () => {
  it('SITE_LINKS est l\'aplatissement des groupes', () => {
    const total = SITE_LINK_GROUPS.reduce((n, g) => n + g.links.length, 0);
    expect(SITE_LINKS.length).toBe(total);
    expect(SITE_LINKS.length).toBeGreaterThan(0);
  });

  it('chaque lien a une url interne et un libellé', () => {
    for (const l of SITE_LINKS) {
      expect(l.url.startsWith('/')).toBe(true);
      expect(l.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('isKnownSiteLink reconnaît une url du site et rejette le reste', () => {
    expect(isKnownSiteLink(SITE_LINKS[0].url)).toBe(true);
    expect(isKnownSiteLink('/route-inexistante-xyz')).toBe(false);
    expect(isKnownSiteLink(null)).toBe(false);
    expect(isKnownSiteLink('')).toBe(false);
  });

  it('siteLinkLabel renvoie le libellé connu, sinon l\'url', () => {
    expect(siteLinkLabel(SITE_LINKS[0].url)).toBe(SITE_LINKS[0].label);
    expect(siteLinkLabel('/inconnu')).toBe('/inconnu');
    expect(siteLinkLabel(undefined)).toBe('');
  });
});
