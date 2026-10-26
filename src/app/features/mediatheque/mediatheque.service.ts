import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, MediaCategoryItem } from '../../core/models';
import { ExtractedMeta, MediaAlbum, MediaItem, YoutubeMeta } from './mediatheque.models';

/**
 * Médiathèque : lecture publique + CRUD admin, adossés à l'API `/api/v1/media`.
 * Les fichiers (image / vidéo / audio / document) sont téléversés en `multipart`
 * ou renseignés par URL. Le back renvoie déjà la forme `MediaItem`.
 */
@Injectable({ providedIn: 'root' })
export class MediathequeService {

  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/media`;
  private readonly FILE_URL = environment.FileUrl;

  // ============================ LECTURE ============================

  /** Résout une URL relative d'upload en URL absolue servie par le back. */
  resolveUrl(url?: string | null): string {
    if (!url) return '';
    return /^(https?:|data:|blob:)/i.test(url) ? url : this.FILE_URL + url;
  }

  private absolutise = (m: MediaItem): MediaItem => ({
    ...m,
    url: m.url ? this.resolveUrl(m.url) : m.url,
    thumbnail: m.thumbnail ? this.resolveUrl(m.thumbnail) : m.thumbnail,
    // Les légendes de la médiathèque s'affichent en texte simple.
    description: m.description ? this.plainText(m.description) : m.description,
  });

  private plainText(html: string): string {
    if (!/[<&]/.test(html)) return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /** Flux réactif (compat) — délègue à la lecture publique. */
  stream(): Observable<MediaItem[]> {
    return this.getMedia();
  }

  /** Lecture publique. */
  getMedia(): Observable<MediaItem[]> {
    return this.http.get<ApiResponse<MediaItem[]>>(`${this.API_URL}/public`).pipe(
      map(r => (r.data ?? []).map(this.absolutise)),
      catchError(() => of([] as MediaItem[])),
    );
  }

  /** Liste admin (inclut les médias non publics). */
  list(): Observable<MediaItem[]> {
    return this.http.get<ApiResponse<MediaItem[]>>(this.API_URL).pipe(
      map(r => (r.data ?? []).map(this.absolutise)),
    );
  }

  /** Rubriques de la médiathèque (gérées via /admin/parametres). */
  categories(): Observable<MediaCategoryItem[]> {
    return this.http.get<MediaCategoryItem[]>(`${environment.apiUrl}/media-categories`).pipe(
      catchError(() => of([] as MediaCategoryItem[])),
    );
  }

  // ============================ ALBUMS ============================
  private readonly ALBUM_URL = `${environment.apiUrl}/albums`;

  private absAlbum = (a: MediaAlbum): MediaAlbum => ({
    ...a,
    coverUrl: a.coverUrl ? this.resolveUrl(a.coverUrl) : a.coverUrl,
    previewImages: (a.previewImages ?? []).map(u => this.resolveUrl(u)),
    medias: (a.medias ?? []).map(this.absolutise),
  });

  publicAlbums(): Observable<MediaAlbum[]> {
    return this.http.get<ApiResponse<MediaAlbum[]>>(`${this.ALBUM_URL}/public`).pipe(
      map(r => (r.data ?? []).map(this.absAlbum)),
      catchError(() => of([] as MediaAlbum[])),
    );
  }

  adminAlbums(): Observable<MediaAlbum[]> {
    return this.http.get<ApiResponse<MediaAlbum[]>>(this.ALBUM_URL).pipe(
      map(r => (r.data ?? []).map(this.absAlbum)),
    );
  }

  album(id: string): Observable<MediaAlbum> {
    return this.http.get<ApiResponse<MediaAlbum>>(`${this.ALBUM_URL}/public/${id}`).pipe(
      map(r => this.absAlbum(r.data as MediaAlbum)),
    );
  }

  private albumForm(payload: Partial<MediaAlbum> & { mediaIds?: string[] }, cover?: File | null): FormData {
    const json: Record<string, unknown> = { ...payload };
    const c = json['coverUrl'];
    if (typeof c === 'string' && c.startsWith(this.FILE_URL)) json['coverUrl'] = c.slice(this.FILE_URL.length);
    if (cover) delete json['coverUrl'];
    const fd = new FormData();
    fd.append('album', new Blob([JSON.stringify(json)], { type: 'application/json' }));
    if (cover) fd.append('cover', cover);
    return fd;
  }

  createAlbum(payload: Partial<MediaAlbum> & { mediaIds?: string[] }, cover?: File | null): Observable<MediaAlbum> {
    return this.http.post<ApiResponse<MediaAlbum>>(this.ALBUM_URL, this.albumForm(payload, cover))
      .pipe(map(r => this.absAlbum(r.data as MediaAlbum)));
  }

  updateAlbum(id: string, payload: Partial<MediaAlbum> & { mediaIds?: string[] }, cover?: File | null): Observable<MediaAlbum> {
    return this.http.put<ApiResponse<MediaAlbum>>(`${this.ALBUM_URL}/${id}`, this.albumForm(payload, cover))
      .pipe(map(r => this.absAlbum(r.data as MediaAlbum)));
  }

  deleteAlbum(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.ALBUM_URL}/${id}`).pipe(map(() => void 0));
  }

  // ============================ ÉCRITURE ============================

  create(item: Omit<MediaItem, 'id'>, file?: File | null, thumbnail?: File | null): Observable<MediaItem> {
    return this.http.post<ApiResponse<MediaItem>>(this.API_URL, this.toFormData(item, file, thumbnail)).pipe(
      map(r => this.absolutise(r.data as MediaItem)),
    );
  }

  update(id: string, patch: Partial<MediaItem>, file?: File | null, thumbnail?: File | null): Observable<MediaItem> {
    return this.http.put<ApiResponse<MediaItem>>(`${this.API_URL}/${id}`, this.toFormData(patch, file, thumbnail)).pipe(
      map(r => this.absolutise(r.data as MediaItem)),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`).pipe(map(() => void 0));
  }

  private toFormData(payload: Partial<MediaItem>, file?: File | null, thumbnail?: File | null): FormData {
    // Si un fichier est téléversé, on n'envoie pas d'URL (le back la remplace).
    const json: Record<string, unknown> = { ...payload };
    const strip = (u: unknown) =>
      typeof u === 'string' && u.startsWith(this.FILE_URL) ? u.slice(this.FILE_URL.length) : u;
    json['url'] = strip(json['url']);
    json['thumbnail'] = strip(json['thumbnail']);
    if (file) delete json['url'];
    if (thumbnail) delete json['thumbnail'];

    const fd = new FormData();
    fd.append('media', new Blob([JSON.stringify(json)], { type: 'application/json' }));
    if (file) fd.append('file', file);
    if (thumbnail) fd.append('thumbnail', thumbnail);
    return fd;
  }

  // ============================ YOUTUBE ============================

  /** Analyse une URL YouTube (toutes formes) et renvoie id + miniature + embed. */
  parseYoutube(input: string): YoutubeMeta | null {
    const url = (input || '').trim();
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
      /(?:youtu\.be\/)([\w-]{11})/,
      /(?:youtube\.com\/embed\/)([\w-]{11})/,
      /(?:youtube\.com\/shorts\/)([\w-]{11})/,
      /^([\w-]{11})$/, // ID brut
    ];
    for (const re of patterns) {
      const m = url.match(re);
      if (m?.[1]) return this.youtubeMeta(m[1]);
    }
    return null;
  }

  youtubeMeta(id: string): YoutubeMeta {
    return {
      id,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      embed: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
      watch: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  /** Récupère titre / auteur / miniature d'une vidéo YouTube via l'oEmbed (sans clé API). */
  fetchYoutubeInfo(id: string): Observable<{ title?: string; author?: string; thumbnail?: string; width?: number; height?: number }> {
    const url = `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`;
    return this.http.get<any>(url).pipe(
      map(r => ({ title: r.title, author: r.author_name, thumbnail: r.thumbnail_url, width: r.width, height: r.height })),
      catchError(() => of({})), // hors-ligne / CORS : on garde la miniature déduite de l'ID
    );
  }

  // ============================ Extraction de métadonnées ============================

  /** Lit un fichier local et en déduit taille, type, dimensions, durée ou nombre de pages. */
  async extractFromFile(file: File): Promise<ExtractedMeta> {
    const meta: ExtractedMeta = {
      fileType: (file.name.split('.').pop() || '').toUpperCase() || undefined,
      mimeType: file.type || undefined,
      sizeBytes: file.size,
      fileSize: this.humanSize(file.size),
    };
    try {
      if (file.type.startsWith('image/')) {
        Object.assign(meta, await this.imageDimensions(file));
      } else if (file.type.startsWith('video/')) {
        Object.assign(meta, await this.videoMeta(file));
      } else if (file.type.startsWith('audio/')) {
        Object.assign(meta, await this.audioMeta(file));
      } else if (file.type === 'application/pdf' || meta.fileType === 'PDF') {
        const pages = await this.pdfPageCount(file);
        if (pages) meta.pages = pages;
      }
    } catch { /* extraction best-effort : on garde au moins taille + type */ }
    return meta;
  }

  humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2).replace('.', ',')} Go`;
  }

  formatDuration(seconds: number): string {
    if (!isFinite(seconds) || seconds <= 0) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  private imageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  private videoMeta(file: File): Promise<{ width: number; height: number; duration: string }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({ width: v.videoWidth, height: v.videoHeight, duration: this.formatDuration(v.duration) });
      };
      v.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      v.src = url;
    });
  }

  private audioMeta(file: File): Promise<{ duration: string }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement('audio');
      a.preload = 'metadata';
      a.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({ duration: this.formatDuration(a.duration) });
      };
      a.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      a.src = url;
    });
  }

  /** Estimation du nombre de pages d'un PDF par lecture brute (sans librairie externe). */
  private async pdfPageCount(file: File): Promise<number | undefined> {
    const buf = await file.arrayBuffer();
    const text = new TextDecoder('latin1').decode(new Uint8Array(buf));
    // 1) /Count N de l'arbre de pages (le plus fiable quand présent)
    const counts = [...text.matchAll(/\/Count\s+(\d+)/g)].map(m => parseInt(m[1], 10));
    if (counts.length) return Math.max(...counts);
    // 2) repli : occurrences de /Type /Page
    const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
    return pages || undefined;
  }
}
