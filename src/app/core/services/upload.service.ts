import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResult {
  url: string;
  name: string;
  type: string;
  isImage: boolean;
  isPdf: boolean;
}

/**
 * Téléversement d'un fichier destiné à être inséré dans un contenu riche
 * (`<app-rich-editor>`). Le backend range le fichier sous `editor/AAAA/MM/` et
 * renvoie son URL publique (`/uploads/editor/...`). Le contenu HTML ne contient
 * donc que des URLs — jamais de base64.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/uploads`;
  /** Préfixe pour transformer un chemin `/uploads/...` en URL absolue servable. */
  readonly fileBase = environment.FileUrl || '';

  upload(file: File): Observable<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadResult>(this.API_URL, form);
  }

  /** URL absolue d'un chemin renvoyé par l'API. */
  absolute(url: string): string {
    if (!url) return url;
    if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
    return this.fileBase.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
  }
}
