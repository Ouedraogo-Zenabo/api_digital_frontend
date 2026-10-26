import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Rend tel quel le HTML produit par l'éditeur riche (`<app-rich-editor>`) —
 * qu'Angular nettoierait sinon.
 *
 * Le contenu n'est éditable que par des comptes authentifiés (MODERATOR+), il
 * est donc considéré comme de confiance. À n'utiliser QUE sur du contenu issu
 * de l'administration, jamais sur une saisie visiteur.
 */
@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  private static readonly NBSP = new RegExp('&nbsp;|&#160;|' + String.fromCharCode(160), 'g');

  transform(value: string | null | undefined): SafeHtml {
    // Neutralise les espaces insécables parasites (copier-coller depuis Word /
    // un PDF) qui empêchent le retour à la ligne du texte.
    const cleaned = (value || '').replace(SafeHtmlPipe.NBSP, ' ');
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }
}
