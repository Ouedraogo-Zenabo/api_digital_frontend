import { Component, OnInit, computed, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../../shared/data-table/data-table.component';
import { MediathequeService } from '../../mediatheque/mediatheque.service';
import { MediaAlbum, MediaItem, MediaSource, MediaType } from '../../mediatheque/mediatheque.models';
import { AuditService } from '../../../core/services/audit.service';
import { RichEditorComponent } from '../../../shared/rich-editor/rich-editor.component';

interface MediaForm {
  type: MediaType;
  title: string;
  category: string;
  date: string;
  description: string;
  source: MediaSource;
  /** Mode de renseignement du média : téléverser un fichier ou saisir une URL. */
  mediaMode: 'upload' | 'url';
  /** Idem pour la miniature / pochette (vidéo, audio). */
  thumbMode: 'upload' | 'url';
  thumbnail: string;
  url: string;
  youtubeId: string;
  youtubeInput: string;
  duration: string;
  author: string;
  album: string;
  // Métadonnées détectées automatiquement (lecture seule côté UI)
  fileType: string;
  mimeType: string;
  fileSize: string;
  sizeBytes: number;
  pages: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-admin-mediatheque',
  standalone: true,
  imports: [RichEditorComponent, CommonModule, FormsModule, DataTableComponent],
  templateUrl: './mediatheque.component.html',
  styleUrls: ['./mediatheque.component.scss'],
})
export class MediathequeComponent implements OnInit {

  readonly typeFilters: { key: MediaType | 'all' | 'albums'; label: string }[] = [
    { key: 'all',      label: 'Tout' },
    { key: 'photo',    label: 'Photos' },
    { key: 'video',    label: 'Vidéos' },
    { key: 'audio',    label: 'Audio' },
    { key: 'document', label: 'Documents' },
    { key: 'albums',   label: 'Albums' },
  ];

  readonly mediaTypes: { key: MediaType; label: string }[] = [
    { key: 'photo',    label: 'Photo' },
    { key: 'video',    label: 'Vidéo' },
    { key: 'audio',    label: 'Audio' },
    { key: 'document', label: 'Document' },
  ];

  /**
   * `accept` du sélecteur du fichier principal : on n'impose rien (le back valide
   * le type). L'utilisateur peut donc téléverser n'importe quel fichier accepté
   * par la médiathèque (image / vidéo / audio / document).
   */
  fileAccept(): string {
    return '';
  }

  columns: DataTableColumn[] = [
    { key: 'thumbnail', label: '', type: 'image' },
    { key: 'title', label: 'Titre', sortable: true },
    { key: 'type', label: 'Type', type: 'badge', sortable: true, hideOnMobile: true,
      format: (r) => this.typeLabel(r.type),
      badgeClasses: (_v, r) => this.typeBadge(r.type) },
    { key: 'category', label: 'Catégorie', type: 'badge', hideOnMobile: true },
    { key: 'source', label: 'Source', type: 'badge', align: 'center', hideOnMobile: true,
      format: (r) => (r.source === 'youtube' ? 'YouTube' : 'Plateforme'),
      badgeClasses: (_v, r) => (r.source === 'youtube' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600') },
    { key: 'date', label: 'Date', type: 'date', sortable: true, hideOnMobile: true },
  ];

  items = signal<MediaItem[]>([]);
  loading = signal(true);
  typeFilter = signal<MediaType | 'all' | 'albums'>('all');
  /** Rubriques disponibles (datalist du champ « Catégorie »). */
  categoryOptions = signal<string[]>([]);

  showModal = signal(false);
  editing = signal<MediaItem | null>(null);
  saving = signal(false);

  form: MediaForm = this.emptyForm();

  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });
  confirmModal = signal<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: '', onConfirm: () => {} });

  constructor(private media: MediathequeService, private audit: AuditService) {}

  ngOnInit(): void {
    this.load();
    this.loadAlbums();
    this.media.categories().subscribe(cats =>
      this.categoryOptions.set(cats.map(c => c.label)));
  }

  load(): void {
    this.loading.set(true);
    this.media.list().subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  // Lignes filtrées par type (la recherche/tri/pagination est gérée par <app-data-table>).
  rows = computed(() => {
    const f = this.typeFilter();
    if (f === 'all' || f === 'albums') return this.items();
    return this.items().filter(i => i.type === f);
  });

  count(type: MediaType | 'all' | 'albums'): number {
    if (type === 'albums') return this.albums().length;
    if (type === 'all') return this.items().length;
    return this.items().filter(i => i.type === type).length;
  }

  isAlbumsView = computed(() => this.typeFilter() === 'albums');

  // ======================= ALBUMS =======================
  albums = signal<MediaAlbum[]>([]);
  showAlbumModal = signal(false);
  editingAlbum = signal<MediaAlbum | null>(null);
  savingAlbum = signal(false);
  albumCover: File | null = null;
  private albumCoverPreview: string | null = null;

  albumForm: { name: string; description: string; category: string; coverUrl: string; coverMode: 'upload' | 'url'; isPublic: boolean } = this.emptyAlbumForm();
  /** Médias cochés pour composer l'album. */
  albumMediaIds = signal<Set<string>>(new Set());

  // ---- Sélecteur d'images en lot ----
  albumPickerQuery = signal('');
  albumPickerScope = signal<'all' | 'in' | 'out'>('all');
  /** Index de la dernière photo cliquée — ancre pour la sélection par plage (Maj+clic). */
  private albumAnchorIndex: number | null = null;

  setAlbumPickerQuery(v: string): void { this.albumPickerQuery.set(v); this.albumAnchorIndex = null; }
  setAlbumPickerScope(v: 'all' | 'in' | 'out'): void { this.albumPickerScope.set(v); this.albumAnchorIndex = null; }

  private emptyAlbumForm() {
    return { name: '', description: '', category: '', coverUrl: '', coverMode: 'upload' as const, isPublic: true };
  }

  /** Toutes les images de la médiathèque (pool). */
  albumImagePool = computed(() => this.items().filter(i => i.type === 'photo'));

  /** Pool filtré par recherche + périmètre (dans / hors album). */
  albumPoolFiltered = computed<MediaItem[]>(() => {
    const q = this.albumPickerQuery().trim().toLowerCase();
    const scope = this.albumPickerScope();
    const sel = this.albumMediaIds();
    return this.albumImagePool().filter(m => {
      if (scope === 'in' && !sel.has(m.id)) return false;
      if (scope === 'out' && sel.has(m.id)) return false;
      return !q || `${m.title} ${m.category}`.toLowerCase().includes(q);
    });
  });

  albumSelectedCount = computed(() => this.albumMediaIds().size);
  /** Vrai si toutes les images visibles sont déjà dans l'album. */
  albumAllVisibleSelected = computed(() => {
    const list = this.albumPoolFiltered();
    return list.length > 0 && list.every(m => this.albumMediaIds().has(m.id));
  });

  /**
   * Nom de l'album d'origine d'une photo lorsqu'elle appartient à un AUTRE
   * album que celui en cours d'édition. Une photo ne pouvant appartenir qu'à un
   * seul album, la cocher ici la déplacera.
   */
  otherAlbumName(m: MediaItem): string | null {
    const current = this.editingAlbum()?.id;
    return m.albumId && m.albumId !== current && m.albumName ? m.albumName : null;
  }

  /** Nombre de photos sélectionnées qui seront déplacées depuis un autre album. */
  albumMovingCount = computed(() => {
    const current = this.editingAlbum()?.id;
    const sel = this.albumMediaIds();
    return this.albumImagePool().filter(m => sel.has(m.id) && m.albumId && m.albumId !== current).length;
  });

  /** Au moins une photo visible appartient déjà à un autre album (affiche la légende). */
  albumPoolHasOther = computed(() => {
    const current = this.editingAlbum()?.id;
    return this.albumPoolFiltered().some(m => m.albumId && m.albumId !== current);
  });

  /** Ajoute (ou retire) en lot toutes les images actuellement visibles. */
  bulkAlbumSelect(add: boolean): void {
    const next = new Set(this.albumMediaIds());
    for (const m of this.albumPoolFiltered()) add ? next.add(m.id) : next.delete(m.id);
    this.albumMediaIds.set(next);
  }
  clearAlbumSelection(): void { this.albumMediaIds.set(new Set()); }

  loadAlbums(): void {
    this.media.adminAlbums().subscribe({
      next: (d) => this.albums.set(d),
      error: () => this.albums.set([]),
    });
  }

  openAlbumCreate(): void {
    this.editingAlbum.set(null);
    this.albumForm = this.emptyAlbumForm();
    this.albumMediaIds.set(new Set());
    this.albumPickerQuery.set('');
    this.albumPickerScope.set('all');
    this.albumAnchorIndex = null;
    this.clearAlbumCover();
    this.showAlbumModal.set(true);
  }

  openAlbumEdit(a: MediaAlbum): void {
    this.editingAlbum.set(a);
    this.albumForm = {
      name: a.name, description: a.description ?? '', category: a.category ?? '',
      coverUrl: a.coverUrl ?? '', coverMode: this.deriveMode(a.coverUrl) as 'upload' | 'url', isPublic: a.isPublic ?? true,
    };
    this.albumMediaIds.set(new Set(this.items().filter(i => i.albumId === a.id).map(i => i.id)));
    this.albumPickerQuery.set('');
    this.albumPickerScope.set('all');
    this.albumAnchorIndex = null;
    this.clearAlbumCover();
    this.showAlbumModal.set(true);
  }

  closeAlbumModal(): void {
    this.showAlbumModal.set(false);
    this.editingAlbum.set(null);
    this.albumMediaIds.set(new Set());
    this.albumPickerQuery.set('');
    this.albumPickerScope.set('all');
    this.albumAnchorIndex = null;
    this.clearAlbumCover();
  }

  private clearAlbumCover(): void {
    if (this.albumCoverPreview) { URL.revokeObjectURL(this.albumCoverPreview); this.albumCoverPreview = null; }
    this.albumCover = null;
  }

  setAlbumCoverMode(mode: 'upload' | 'url'): void {
    if (this.albumForm.coverMode === mode) return;
    this.albumForm.coverMode = mode;
    this.clearAlbumCover();
    this.albumForm.coverUrl = '';
  }

  onAlbumCover(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.clearAlbumCover();
    this.albumCover = file;
    this.albumCoverPreview = URL.createObjectURL(file);
    this.albumForm.coverUrl = this.albumCoverPreview;
  }

  toggleAlbumMedia(id: string): void {
    const next = new Set(this.albumMediaIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.albumMediaIds.set(next);
  }

  /** Nombre de photos en cours de téléversement depuis le sélecteur d'album. */
  uploadingAlbumPhotos = signal(0);

  /**
   * Téléverse plusieurs images du disque d'un coup : chaque fichier devient un
   * média « photo », est ajouté à la médiathèque puis coché dans l'album en cours.
   */
  onAlbumUploadFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(f => f.type.startsWith('image/'));
    input.value = '';
    if (!files.length) return;

    this.uploadingAlbumPhotos.set(files.length);
    const category = this.albumForm.category.trim() || 'Médiathèque';
    const date = new Date().toISOString().slice(0, 10);
    const reqs = files.map(f => this.media.create({
      type: 'photo',
      title: f.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || f.name,
      category, date, source: 'platform',
    }, f));

    forkJoin(reqs).subscribe({
      next: (created) => {
        const next = new Set(this.albumMediaIds());
        created.forEach(m => m?.id && next.add(m.id));
        this.albumMediaIds.set(next);
        this.uploadingAlbumPhotos.set(0);
        this.load(); // rafraîchit la bibliothèque (les nouvelles photos y apparaissent, cochées)
        this.notify(`${created.length} photo(s) téléversée(s) et ajoutée(s) à l'album`, 'success');
      },
      error: () => {
        this.uploadingAlbumPhotos.set(0);
        this.load();
        this.notify("Le téléversement d'une ou plusieurs photos a échoué.", 'error');
      },
    });
  }

  /**
   * Clic sur une vignette du sélecteur.
   * - clic simple : bascule la photo (et fixe l'ancre) ;
   * - Maj + clic : applique l'action de l'ancre à TOUTE la plage entre l'ancre
   *   et la photo cliquée (sélection rapide de beaucoup d'images d'un coup).
   */
  onAlbumTileClick(id: string, index: number, ev: MouseEvent): void {
    const list = this.albumPoolFiltered();
    if (ev.shiftKey && this.albumAnchorIndex !== null && this.albumAnchorIndex < list.length) {
      const anchorId = list[this.albumAnchorIndex].id;
      const select = this.albumMediaIds().has(anchorId); // état de l'ancre → appliqué à la plage
      const [a, b] = this.albumAnchorIndex <= index ? [this.albumAnchorIndex, index] : [index, this.albumAnchorIndex];
      const next = new Set(this.albumMediaIds());
      for (let i = a; i <= b; i++) select ? next.add(list[i].id) : next.delete(list[i].id);
      this.albumMediaIds.set(next);
    } else {
      this.toggleAlbumMedia(id);
      this.albumAnchorIndex = index;
    }
  }

  isInAlbum(id: string): boolean { return this.albumMediaIds().has(id); }

  get albumFormValid(): boolean { return !!this.albumForm.name.trim(); }

  saveAlbum(): void {
    if (!this.albumFormValid) return;
    this.savingAlbum.set(true);
    const payload = {
      name: this.albumForm.name.trim(),
      description: this.albumForm.description.trim() || undefined,
      category: this.albumForm.category.trim() || undefined,
      coverUrl: this.albumCover || this.albumForm.coverMode === 'upload' ? undefined : (this.albumForm.coverUrl || undefined),
      isPublic: this.albumForm.isPublic,
      mediaIds: Array.from(this.albumMediaIds()),
    };
    const editing = this.editingAlbum();
    const req = editing
      ? this.media.updateAlbum(editing.id, payload, this.albumCover)
      : this.media.createAlbum(payload, this.albumCover);
    req.subscribe({
      next: () => {
        this.savingAlbum.set(false);
        this.closeAlbumModal();
        this.load();
        this.loadAlbums();
        this.notify(editing ? 'Album mis à jour' : 'Album créé', 'success');
      },
      error: () => { this.savingAlbum.set(false); },
    });
  }

  askDeleteAlbum(a: MediaAlbum): void {
    this.confirmModal.set({
      show: true,
      message: `Supprimer l'album « ${a.name} » ? Les médias qu'il contient sont conservés.`,
      onConfirm: () => this.media.deleteAlbum(a.id).subscribe({
        next: () => { this.load(); this.loadAlbums(); this.closeConfirm(); this.notify('Album supprimé', 'success'); },
        error: () => this.closeConfirm(),
      }),
    });
  }

  // ---------------- « Tout voir » : visualiseur du contenu d'un album ----------------
  viewerAlbum = signal<MediaAlbum | null>(null);

  /** Tous les médias rattachés à l'album ouvert (déjà chargés via media.list()). */
  viewerMedia = computed<MediaItem[]>(() => {
    const a = this.viewerAlbum();
    if (!a) return [];
    return this.items().filter(i => i.albumId === a.id);
  });

  openAlbumViewer(a: MediaAlbum): void { this.viewerAlbum.set(a); }
  closeAlbumViewer(): void { this.viewerAlbum.set(null); }

  /** Vignette d'un média dans le visualiseur (photo, pochette vidéo/audio, icône doc). */
  viewerThumb(m: MediaItem): string | null {
    if (m.type === 'photo') return m.url || m.thumbnail || null;
    return m.thumbnail || null;
  }

  // ---------------- Modal / formulaire ----------------
  private emptyForm(): MediaForm {
    return {
      type: 'photo', title: '', category: '', date: new Date().toISOString().slice(0, 10),
      description: '', source: 'platform', mediaMode: 'upload', thumbMode: 'upload', thumbnail: '', url: '',
      youtubeId: '', youtubeInput: '', duration: '', author: '', album: '',
      fileType: '', mimeType: '', fileSize: '', sizeBytes: 0, pages: 0, width: 0, height: 0,
    };
  }

  /** Un fichier téléversé produit une data-URL ; une URL saisie commence par http. */
  private deriveMode(url?: string): 'upload' | 'url' {
    return url && /^https?:\/\//i.test(url) ? 'url' : 'upload';
  }

  /** Fichiers réellement sélectionnés (téléversés en multipart à l'enregistrement). */
  selectedFile: File | null = null;
  selectedThumb: File | null = null;
  private previewObjectUrl: string | null = null;
  private previewThumbUrl: string | null = null;

  setMediaMode(mode: 'upload' | 'url'): void {
    if (this.form.mediaMode === mode) return;
    this.form.mediaMode = mode;
    this.clearSelectedFile();
    this.form.url = '';
  }

  setThumbMode(mode: 'upload' | 'url'): void {
    if (this.form.thumbMode === mode) return;
    this.form.thumbMode = mode;
    this.clearSelectedThumb();
    this.form.thumbnail = '';
  }

  private clearSelectedFile(): void {
    if (this.previewObjectUrl) { URL.revokeObjectURL(this.previewObjectUrl); this.previewObjectUrl = null; }
    this.selectedFile = null;
  }

  private clearSelectedThumb(): void {
    if (this.previewThumbUrl) { URL.revokeObjectURL(this.previewThumbUrl); this.previewThumbUrl = null; }
    this.selectedThumb = null;
  }

  /** Sélection d'une image de miniature / pochette. */
  onThumbFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.notify('La miniature doit être une image.', 'error'); return; }
    this.clearSelectedThumb();
    this.selectedThumb = file;
    this.previewThumbUrl = URL.createObjectURL(file);
    this.form.thumbnail = this.previewThumbUrl; // aperçu uniquement
  }

  openCreate(): void {
    this.clearSelectedFile();
    this.clearSelectedThumb();
    this.form = this.emptyForm();
    const f = this.typeFilter();
    this.form.type = (f === 'all' || f === 'albums') ? 'photo' : f;
    this.editing.set(null);
    this.showModal.set(true);
  }

  openEdit(row: MediaItem): void {
    this.form = {
      type: row.type, title: row.title, category: row.category, date: row.date,
      description: row.description ?? '', source: row.source,
      mediaMode: this.deriveMode(row.url),
      thumbMode: this.deriveMode(row.thumbnail),
      thumbnail: row.thumbnail ?? '', url: row.url ?? '',
      youtubeId: row.youtubeId ?? '', youtubeInput: row.youtubeId ? this.media.youtubeMeta(row.youtubeId).watch : '',
      duration: row.duration ?? '', author: row.author ?? '', album: row.albumId ?? '',
      fileType: row.fileType ?? '', mimeType: row.mimeType ?? '', fileSize: row.fileSize ?? '',
      sizeBytes: row.sizeBytes ?? 0, pages: row.pages ?? 0, width: row.width ?? 0, height: row.height ?? 0,
    };
    this.clearSelectedFile();
    this.clearSelectedThumb();
    this.editing.set(row);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false); this.editing.set(null);
    this.clearSelectedFile(); this.clearSelectedThumb();
  }

  onTypeChange(type: MediaType): void {
    this.form.type = type;
    if (type !== 'video') this.form.source = 'platform';
  }

  /** Aide contextuelle sous le sélecteur de fichier principal. */
  mediaHint(): string {
    switch (this.form.type) {
      case 'photo': return 'Recommandé : JPG, PNG ou WebP. Tout fichier accepté.';
      case 'video': return 'Recommandé : .mp4. Durée et dimensions détectées à l’import. Tout fichier accepté.';
      case 'audio': return 'Recommandé : .mp3 ou .ogg. La durée est détectée à l’import. Tout fichier accepté.';
      default: return 'PDF, Word, Excel, PowerPoint, ZIP… Tout fichier accepté.';
    }
  }

  extracting = signal(false);

  /** Parse le lien YouTube + récupère titre/auteur/miniature via oEmbed. */
  applyYoutube(): void {
    const meta = this.media.parseYoutube(this.form.youtubeInput);
    if (!meta) { this.notify('Lien YouTube non reconnu', 'error'); return; }
    this.form.youtubeId = meta.id;
    this.form.thumbnail = this.form.thumbnail || meta.thumbnail;
    this.extracting.set(true);
    this.media.fetchYoutubeInfo(meta.id).subscribe(info => {
      if (info.title && !this.form.title.trim()) this.form.title = info.title;
      if (info.author) this.form.author = info.author;
      if (info.thumbnail) this.form.thumbnail = info.thumbnail;
      this.extracting.set(false);
      this.notify('Vidéo YouTube reconnue', 'success');
    });
  }

  /** Sélectionne un fichier local : conservé pour l'upload multipart + extraction des métadonnées. */
  onFile(event: Event, _target: 'thumbnail' | 'url' = 'url'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.clearSelectedFile();
    this.selectedFile = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.form.url = this.previewObjectUrl; // aperçu uniquement — non envoyé (remplacé par l'upload)

    this.extracting.set(true);
    this.media.extractFromFile(file).then(meta => {
      this.form.fileType = meta.fileType ?? this.form.fileType;
      this.form.mimeType = meta.mimeType ?? this.form.mimeType;
      this.form.fileSize = meta.fileSize ?? this.form.fileSize;
      this.form.sizeBytes = meta.sizeBytes ?? this.form.sizeBytes;
      this.form.pages = meta.pages ?? this.form.pages;
      this.form.width = meta.width ?? this.form.width;
      this.form.height = meta.height ?? this.form.height;
      if (meta.duration) this.form.duration = meta.duration;
      this.extracting.set(false);
    }).catch(() => this.extracting.set(false));
  }

  /** Présence d'au moins une métadonnée extraite (pour afficher le panneau récap). */
  get hasMeta(): boolean {
    const f = this.form;
    return !!(f.fileSize || f.pages || f.width || f.duration || f.mimeType);
  }

  get canSave(): boolean {
    if (!this.form.title.trim() || !this.form.category.trim()) return false;
    if (this.form.type === 'video' && this.form.source === 'youtube') return !!this.form.youtubeId;
    // Vidéo hébergée, audio et document : un fichier téléversé ou une URL est requis.
    if (this.form.type === 'video' || this.form.type === 'audio' || this.form.type === 'document') {
      return !!this.selectedFile || !!this.form.url;
    }
    return true; // photo : l'URL/miniature reste facultative
  }

  save(): void {
    if (!this.canSave) { this.notify('Renseignez au moins le titre, la catégorie et la source.', 'error'); return; }
    this.saving.set(true);

    const base: Omit<MediaItem, 'id'> = {
      type: this.form.type,
      title: this.form.title.trim(),
      category: this.form.category.trim(),
      date: this.form.date,
      description: this.form.description.trim() || undefined,
      source: this.form.type === 'video' ? this.form.source : 'platform',
      // En mode « upload », form.url / form.thumbnail sont des blob: d'aperçu → non envoyés.
      thumbnail: (this.selectedThumb || this.form.thumbMode === 'upload') ? undefined : (this.form.thumbnail || undefined),
      url: (this.selectedFile || this.form.mediaMode === 'upload') ? undefined : (this.form.url || undefined),
    };
    // Métadonnées extraites — communes (enregistrées si présentes)
    base.fileType = this.form.fileType || undefined;
    base.mimeType = this.form.mimeType || undefined;
    base.fileSize = this.form.fileSize || undefined;
    base.sizeBytes = this.form.sizeBytes || undefined;
    base.width = this.form.width || undefined;
    base.height = this.form.height || undefined;

    if (this.form.type === 'video') {
      if (this.form.source === 'youtube') {
        base.youtubeId = this.form.youtubeId;
        // Miniature : celle téléversée (gérée à part), sinon l'URL saisie, sinon celle de YouTube.
        if (!this.selectedThumb && this.form.thumbMode !== 'upload') {
          base.thumbnail = this.form.thumbnail || this.media.youtubeMeta(this.form.youtubeId).thumbnail;
        } else if (!this.selectedThumb) {
          base.thumbnail = this.media.youtubeMeta(this.form.youtubeId).thumbnail;
        }
        base.author = this.form.author || undefined;
      }
      base.duration = this.form.duration || undefined;
    }
    if (this.form.type === 'audio') {
      base.duration = this.form.duration || undefined;
      base.author = this.form.author || undefined;
    }
    if (this.form.type === 'document') {
      base.pages = this.form.pages || undefined;
    }
    base.albumId = this.form.album || '';  // "" = retirer de l'album

    const editing = this.editing();
    const req = editing
      ? this.media.update(editing.id, base, this.selectedFile, this.selectedThumb)
      : this.media.create(base, this.selectedFile, this.selectedThumb);
    req.subscribe({
      next: () => {
        this.audit.record({
          action: editing ? 'update' : 'create',
          method: editing ? 'PUT' : 'POST',
          entity: 'Média',
          url: editing ? `/api/v1/media/${editing.id}` : '/api/v1/media',
          target: base.title,
        });
        this.load();
        this.closeModal();
        this.saving.set(false);
        this.notify(editing ? 'Média mis à jour' : 'Média ajouté', 'success');
      },
      error: () => { this.saving.set(false); },
    });
  }

  // ---------------- Suppression ----------------
  askDelete(row: MediaItem): void {
    this.confirmModal.set({
      show: true,
      message: `Voulez-vous vraiment supprimer « ${row.title} » ?`,
      onConfirm: () => this.media.remove(row.id).subscribe({
        next: () => {
          this.audit.record({ action: 'delete', method: 'DELETE', entity: 'Média', url: `/api/v1/media/${row.id}`, target: row.title });
          this.load(); this.closeConfirm(); this.notify('Média supprimé', 'success');
        },
        error: () => { this.closeConfirm(); },
      }),
    });
  }
  closeConfirm(): void { this.confirmModal.update(c => ({ ...c, show: false })); }

  // ---------------- Helpers d'affichage ----------------
  typeLabel(t: MediaType): string {
    return t === 'photo' ? 'Photo' : t === 'video' ? 'Vidéo' : t === 'audio' ? 'Audio' : 'Document';
  }
  typeBadge(t: MediaType): string {
    return t === 'photo' ? 'bg-amber-50 text-amber-600'
         : t === 'video' ? 'bg-violet-50 text-violet-600'
         : t === 'audio' ? 'bg-teal-50 text-teal-600'
         : 'bg-blue-50 text-blue-600';
  }

  private notify(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2200): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.update(n => ({ ...n, show: false })), duration);
  }
}
