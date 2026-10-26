import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Ministre } from '../../../core/models/event.model';
import { MinistereService } from '../../../core/services/ministere.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ministre',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './ministre.component.html',
  styleUrls: ['./ministre.component.scss']
})
export class MinistreComponent {

  private readonly API_URL = environment.FileUrl;

 ministres = signal<Ministre[]>([]);
 ministre= signal<Ministre | null>(null);
  loading = signal(true);
   constructor(private apiService: ApiService, private router: Router, private min: MinistereService) {}

  ngOnInit(): void {
    this.loadMinistres();
  }


     loadMinistres(): void {
      this.loading.set(true);

      this.min.getAllMinistre(0, 10).subscribe({
        next: (response) => {
          if (response.success) {
            // articles DEJA paginés par le backend
            this.ministres.set(response.data.content);

            // Récupérer l'ID du premier ministère
            const ministreIdsArray = this.ministres(); // <-- important !

            if (ministreIdsArray.length > 0) {
              const ministreId = ministreIdsArray[0].id;
              this.loadMinistreById(ministreId);
            }

          
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }


    loadMinistreById(id: string) {
      this.min.getMinistreById(id).subscribe({
        next: (response) => {
          
          if (response.success) {
        this.ministre.set(response.data); // ✅ extraire data
        console.log('Ministère chargé :', this.ministre);
        } else {
          console.error('Erreur :', response.message);
        }
        },
        error: (err) => {
          console.error('Erreur chargement ministère', err);
        }
      });
    }

formatContentTailwind(content: string): string {
  if (!content) return '';
  if (/<[a-z][\s\S]*>/i.test(content)) return content; // déjà du HTML (éditeur riche)
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = content.split(/\n{2,}/);
  return paragraphs
    .map(block => `<p class="mb-4 leading-relaxed">${block.replace(/\n/g, '<br>').trim()}</p>`)
    .join('');
}

  getImageUrl(path?: string): string | null {
    if (!path) return null;
    return /^(https?:|data:|blob:|assets\/)/i.test(path) ? path : this.API_URL + path;
  }

  /**
   * Photo à afficher pour un ministre :
   *  - sa photo téléversée si elle existe ;
   *  - sinon, pour le ministre EN EXERCICE, le portrait officiel livré avec le site ;
   *  - sinon `null` → l'icône générique s'affiche (anciens ministres sans photo).
   */
  photoUrl(m: Ministre): string | null {
    if (m?.photo) return this.getImageUrl(m.photo);
    if (m?.isActif) return 'assets/images/minsitre.jpeg';
    return null;
  }


}
