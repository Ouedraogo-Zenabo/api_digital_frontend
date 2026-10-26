import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse, ModerationItem } from '../models';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * File de validation : contenus soumis par les modérateurs, en attente d'un
 * admin. Le compteur `pendingCount` alimente la pastille de la barre latérale.
 */
@Injectable({ providedIn: 'root' })
export class ModerationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly URL = `${environment.apiUrl}/moderation`;

  /** Nombre de contenus en attente (rafraîchi à la demande). */
  pendingCount = signal(0);

  getPending(): Observable<ModerationItem[]> {
    return this.http.get<ApiResponse<ModerationItem[]>>(`${this.URL}/pending`)
      .pipe(map(r => r.data ?? []));
  }

  refreshCount(): void {
    if (!this.auth.isAdmin()) { this.pendingCount.set(0); return; }
    this.http.get<ApiResponse<number>>(`${this.URL}/pending/count`)
      .pipe(map(r => r.data ?? 0))
      .subscribe({ next: n => this.pendingCount.set(n), error: () => {} });
  }

  approve(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.URL}/${id}/approve`, {})
      .pipe(map(() => void 0), tap(() => this.refreshCount()));
  }

  reject(id: string, note: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.URL}/${id}/reject`, { note })
      .pipe(map(() => void 0), tap(() => this.refreshCount()));
  }
}
