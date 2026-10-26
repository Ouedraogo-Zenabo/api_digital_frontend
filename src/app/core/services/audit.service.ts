import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type AuditAction = 'create' | 'update' | 'delete' | 'auth';

export interface AuditEntry {
  id: string;
  timestamp: string;          // ISO
  action: AuditAction;
  method: string;             // POST / PUT / PATCH / DELETE
  entity: string;             // libellé métier : Article, Document, Média…
  target?: string;            // id ou intitulé de l'objet concerné
  url?: string;
  status?: number;
  // Infos réelles de l'utilisateur authentifié
  userId?: string;
  userName: string;
  userEmail?: string;
  roles?: string[];
  ip: string;
}

/**
 * Journal d'audit des actions d'administration (création / modification / suppression).
 * Les lectures (GET) ne sont jamais journalisées.
 *
 * ⚠️ IP : récupérée côté navigateur via un service public (ipify) → c'est l'IP publique
 * telle que vue depuis le client. Pour un audit fiable et infalsifiable, l'IP et l'identité
 * doivent être enregistrées CÔTÉ BACKEND (request.getRemoteAddr() + utilisateur du token).
 * Ce service est prêt pour ça : décommenter `push()` pour POSTer chaque entrée à l'API.
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly STORAGE_KEY = 'mtdpce_audit_log';
  private readonly MAX_ENTRIES = 500;

  private auth = inject(AuthService);

  readonly entries = signal<AuditEntry[]>(this.load());
  readonly ip = signal<string>('…');

  constructor() {
    this.resolveIp();
  }

  // ---------------- API publique de journalisation ----------------

  /** Journalise une action métier (utilisé pour les opérations hors HTTP, ex. médiathèque en mémoire). */
  record(input: { action: AuditAction; method: string; entity: string; target?: string; url?: string; status?: number }): void {
    const u = this.auth.currentUser();
    const entry: AuditEntry = {
      id: this.genId(),
      timestamp: new Date().toISOString(),
      ...input,
      userId: u?.id,
      userName: this.displayName(),
      userEmail: u?.email,
      roles: u?.roles,
      ip: this.ip(),
    };
    const list = [entry, ...this.entries()].slice(0, this.MAX_ENTRIES);
    this.entries.set(list);
    this.persist(list);
    // this.push(entry);  // ← API : this.http.post(`${env.apiUrl}/audit`, entry).subscribe();
  }

  /** Journalise depuis l'intercepteur HTTP (déduit action + entité + cible de la requête). */
  recordHttp(method: string, url: string, status: number, body?: any): void {
    const m = method.toUpperCase();
    const action: AuditAction =
      m === 'POST' ? (this.isAuth(url) ? 'auth' : 'create')
      : m === 'DELETE' ? 'delete'
      : 'update';
    const { entity, target } = this.parse(url, body);
    this.record({ action, method: m, entity, target, url, status });
  }

  // ---------------- Helpers ----------------

  private displayName(): string {
    const u = this.auth.currentUser();
    if (!u) return 'Utilisateur inconnu';
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return full || u.username || u.email || `#${u.id}`;
  }

  private isAuth(url: string): boolean {
    return /\/auth\b|\/login|\/logout|\/register/i.test(url);
  }

  /** Déduit l'entité métier et la cible à partir de l'URL et du corps de réponse. */
  private parse(url: string, body?: any): { entity: string; target?: string } {
    if (this.isAuth(url)) return { entity: 'Authentification' };
    const path = url.split('?')[0].replace(/\/+$/, '');
    const segs = path.split('/').filter(Boolean);
    // segment significatif après "v1" (ou "api"), en ignorant "public"
    let idx = segs.findIndex(s => s === 'v1' || s === 'api');
    let key = segs[idx + 1] === 'public' ? segs[idx + 2] : segs[idx + 1];
    key = (key || segs[segs.length - 1] || '').toLowerCase();

    const labels: Record<string, string> = {
      articles: 'Article', documents: 'Document', projects: 'Projet', projets: 'Projet',
      services: 'Service public', agendas: 'Agenda', evenements: 'Événement', events: 'Événement',
      contacts: 'Message', users: 'Utilisateur', types: 'Type', domains: 'Domaine',
      missions: 'Attribution', structures: 'Structure rattachée', media: 'Média', mediatheque: 'Média',
      ministere: 'Ministère', ministre: 'Ministre', ministres: 'Ministre',
    };
    const entity = labels[key] ?? this.titleize(key) ?? 'Ressource';

    // cible = dernier segment numérique de l'URL, sinon id du corps de réponse
    const lastNum = [...segs].reverse().find(s => /^\d+$/.test(s));
    const bodyId = body?.data?.id ?? body?.id;
    const bodyTitle = body?.data?.title ?? body?.data?.name ?? body?.title ?? body?.name;
    const target = bodyTitle ?? (lastNum ? `#${lastNum}` : bodyId != null ? `#${bodyId}` : undefined);
    return { entity, target };
  }

  private titleize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  private genId(): string {
    return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }

  private async resolveIp(): Promise<void> {
    // fetch natif → contourne les intercepteurs (pas de header Authorization vers ipify).
    try {
      const r = await fetch('https://api.ipify.org?format=json');
      const j = await r.json();
      this.ip.set(j.ip || 'Indisponible');
    } catch {
      this.ip.set('Indisponible');
    }
  }

  private load(): AuditEntry[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) as AuditEntry[] : [];
    } catch { return []; }
  }

  private persist(list: AuditEntry[]): void {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list)); } catch { /* quota */ }
  }
}
