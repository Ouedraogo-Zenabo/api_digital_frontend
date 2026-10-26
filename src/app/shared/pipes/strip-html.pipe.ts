import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convertit du HTML (issu de l'éditeur riche) en texte simple pour les aperçus :
 * cartes d'actualités, résumés, méta-descriptions… Retire les balises **et**
 * décode les entités (`&nbsp;`, `&#39;`, `&amp;`…), puis normalise les espaces.
 *
 * Utilise `DOMParser` (document inerte) : aucune image / iframe du contenu n'est
 * chargée pendant l'extraction.
 *
 * Usage :  {{ article.summary | stripHtml }}
 */
@Pipe({ name: 'stripHtml', standalone: true })
export class StripHtmlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return stripHtml(value);
  }
}

/** Version fonction, réutilisable hors template. */
export function stripHtml(value: string | null | undefined): string {
  if (!value) return '';
  const doc = new DOMParser().parseFromString(value, 'text/html');
  // \s couvre l'espace insécable (U+00A0) issu de &nbsp;
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
