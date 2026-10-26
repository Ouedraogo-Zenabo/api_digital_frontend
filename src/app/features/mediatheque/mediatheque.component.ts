import { Component, HostListener, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MediathequeService } from './mediatheque.service';
import { MediaAlbum, MediaItem, MediaType } from './mediatheque.models';

type TabKey = MediaType | 'album';

interface TabDef {
  key: TabKey;
  label: string;
  icon: string;
  pageSize: number;
}

@Component({
  selector: 'app-mediatheque',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mediatheque.component.html',
  styleUrls: ['./mediatheque.component.scss'],
})
export class MediathequeComponent implements OnInit, OnDestroy {

  readonly tabs: TabDef[] = [
    { key: 'photo',    label: 'Photos',    icon: 'photo',  pageSize: 12 },
    { key: 'album',    label: 'Albums',    icon: 'album',  pageSize: 12 },
    { key: 'video',    label: 'Vidéos',    icon: 'video',  pageSize: 9  },
    { key: 'audio',    label: 'Audio',     icon: 'audio',  pageSize: 8  },
    { key: 'document', label: 'Documents', icon: 'doc',    pageSize: 8  },
  ];

  /** Nom (pluriel) de l'onglet courant, pour les libellés dynamiques. */
  tabNoun = computed(() => {
    switch (this.activeTab()) {
      case 'photo': return 'photos';
      case 'album': return 'albums';
      case 'video': return 'vidéos';
      case 'audio': return 'contenus audio';
      default: return 'documents';
    }
  });

  // ----- État -----
  loading = signal(true);
  items = signal<MediaItem[]>([]);

  activeTab = signal<TabKey>('photo');
  search = signal('');
  activeCategory = signal<string>('');
  sort = signal<'recent' | 'ancien' | 'titre'>('recent');
  page = signal(0);

  // Lightbox photos / lecteur vidéo / aperçu document
  lightboxIndex = signal<number | null>(null);
  activeVideo = signal<MediaItem | null>(null);
  activeDoc = signal<MediaItem | null>(null);

  /** Lecture automatique de l'élément suivant (vidéos / audio) — activée par défaut. */
  autoplay = signal(true);
  /** Index de la vidéo courante dans la file de lecture (= liste filtrée). */
  videoIndex = signal(0);

  // Diaporama de la tuile principale du bento photos
  heroIndex = signal(0);
  heroPaused = signal(false);
  private heroTimer?: any;
  private readonly reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Import YouTube
  ytInput = signal('');
  ytError = signal('');
  ytPreviewId = signal<string | null>(null);

  private routeSub?: Subscription;

  constructor(
    private media: MediathequeService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.media.getMedia().subscribe(data => {
      this.items.set(data);
      this.loading.set(false);
    });
    this.media.publicAlbums().subscribe(a => this.albums.set(a));

    // Sous-rubriques du menu (/mediatheque/photos, /videos, /podcasts, …) :
    // pré-sélectionne l'onglet correspondant. Se met à jour à la navigation
    // entre rubriques sœurs (le composant est réutilisé).
    this.routeSub = this.route.data.subscribe(d => {
      const r = d['rubrique'] as TabKey | undefined;
      if (r && this.tabs.some(t => t.key === r)) {
        this.activeTab.set(r);
        this.page.set(0);
        this.search.set('');
        this.activeCategory.set('');
      }
    });

    // Diaporama de la tuile principale (photos) : rotation douce, en pause au survol.
    this.heroTimer = setInterval(() => {
      if (this.reducedMotion || this.heroPaused() || this.activeTab() !== 'photo') return;
      const n = this.heroPhotos().length;
      if (n > 1) this.heroIndex.update(i => (i + 1) % n);
    }, 4500);

    // Défilement des vignettes d'un album au survol de sa carte.
    this.albumHoverTimer = setInterval(() => {
      if (this.reducedMotion || !this.hoverAlbumId()) return;
      this.albumHoverTick.update(t => t + 1);
    }, 850);

    // Diaporama du visualiseur d'album ouvert.
    this.albumViewTimer = setInterval(() => {
      const imgs = this.albumImages();
      if (this.reducedMotion || !this.autoplay() || imgs.length < 2 || !this.activeAlbum()) return;
      this.albumSlide.update(i => (i + 1) % imgs.length);
    }, 3800);
  }

  ngOnDestroy(): void {
    [this.heroTimer, this.albumHoverTimer, this.albumViewTimer].forEach(t => t && clearInterval(t));
    this.routeSub?.unsubscribe();
  }

  // ===================== ALBUMS =====================
  albums = signal<MediaAlbum[]>([]);
  hoverAlbumId = signal<string | null>(null);
  albumHoverTick = signal(0);
  private albumHoverTimer?: any;

  activeAlbum = signal<MediaAlbum | null>(null);
  albumSlide = signal(0);
  private albumViewTimer?: any;

  /** Images du visualiseur d'album (photos de l'album). */
  albumImages = computed<MediaItem[]>(() => {
    const a = this.activeAlbum();
    if (!a?.medias) return [];
    const imgs = a.medias.filter(m => m.type === 'photo');
    return imgs.length ? imgs : a.medias;
  });
  albumCurrent = computed<MediaItem | null>(() => {
    const imgs = this.albumImages();
    return imgs.length ? imgs[this.albumSlide() % imgs.length] : null;
  });

  filteredAlbums = computed<MediaAlbum[]>(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.activeCategory();
    return this.albums().filter(a =>
      (!cat || a.category === cat) &&
      (!q || `${a.name} ${a.description ?? ''} ${a.category ?? ''}`.toLowerCase().includes(q)));
  });

  albumCategories = computed<string[]>(() => {
    const set = new Set(this.albums().map(a => a.category).filter((c): c is string => !!c));
    return Array.from(set).sort();
  });

  /** Vignette affichée sur la carte d'un album (défile au survol). */
  albumCardImg(a: MediaAlbum): string {
    const imgs = a.previewImages ?? [];
    if (!imgs.length) return a.coverUrl ?? '';
    if (this.hoverAlbumId() === a.id) return imgs[this.albumHoverTick() % imgs.length];
    return a.coverUrl ?? imgs[0];
  }

  onAlbumEnter(id: string): void { this.hoverAlbumId.set(id); this.albumHoverTick.set(0); }
  onAlbumLeave(): void { this.hoverAlbumId.set(null); }

  openAlbum(a: MediaAlbum): void {
    this.albumSlide.set(0);
    this.activeAlbum.set(a); // affichage immédiat avec l'aperçu
    this.media.album(a.id).subscribe(full => {
      if (this.activeAlbum()?.id === full.id) this.activeAlbum.set(full);
    });
  }
  closeAlbum(): void { this.activeAlbum.set(null); }
  nextAlbumSlide(): void {
    const n = this.albumImages().length;
    if (n) this.albumSlide.update(i => (i + 1) % n);
  }
  prevAlbumSlide(): void {
    const n = this.albumImages().length;
    if (n) this.albumSlide.update(i => (i - 1 + n) % n);
  }

  /** Photos alimentant le diaporama de la grande tuile (les 5 premières de la page). */
  heroPhotos = computed<MediaItem[]>(() => this.activeTab() === 'photo' ? this.paged().slice(0, 5) : []);
  heroPhoto = computed<MediaItem | null>(() => {
    const list = this.heroPhotos();
    return list.length ? list[this.heroIndex() % list.length] : null;
  });

  // ----- Dérivés -----
  private byTab = computed(() =>
    this.activeTab() === 'album' ? [] : this.items().filter(i => i.type === this.activeTab()));

  categories = computed(() => {
    if (this.activeTab() === 'album') return this.albumCategories();
    const set = new Set(this.byTab().map(i => i.category));
    return Array.from(set).sort();
  });

  /** Compteurs par onglet pour les badges. */
  count(type: TabKey): number {
    if (type === 'album') return this.albums().length;
    return this.items().filter(i => i.type === type).length;
  }

  private filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.activeCategory();
    let list = this.byTab().filter(i => {
      const okCat = !cat || i.category === cat;
      const okQ = !q || `${i.title} ${i.description ?? ''} ${i.category}`.toLowerCase().includes(q);
      return okCat && okQ;
    });
    const dir = this.sort();
    list = [...list].sort((a, b) => {
      if (dir === 'titre') return a.title.localeCompare(b.title);
      const cmp = a.date.localeCompare(b.date);
      return dir === 'recent' ? -cmp : cmp;
    });
    return list;
  });

  totalResults = computed(() => this.activeTab() === 'album' ? this.filteredAlbums().length : this.filtered().length);

  pageSize = computed(() => this.tabs.find(t => t.key === this.activeTab())!.pageSize);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalResults() / this.pageSize())));

  paged = computed(() => {
    const start = this.page() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  /** Numéros de pages affichés (fenêtre glissante autour de la page courante). */
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur = this.page();
    const span = 1;
    const pages: (number | '…')[] = [];
    const push = (n: number) => pages.push(n);
    push(0);
    const from = Math.max(1, cur - span);
    const to = Math.min(total - 2, cur + span);
    if (from > 1) pages.push('…');
    for (let i = from; i <= to; i++) push(i);
    if (to < total - 2) pages.push('…');
    if (total > 1) push(total - 1);
    return pages;
  });

  // ----- Actions de filtrage (reset pagination) -----
  selectTab(key: TabKey): void {
    if (this.activeTab() === key) return;
    this.activeTab.set(key);
    this.activeCategory.set('');
    this.search.set('');
    this.page.set(0);
    this.heroIndex.set(0);
  }

  onSearch(value: string): void { this.search.set(value); this.page.set(0); this.heroIndex.set(0); }

  selectCategory(cat: string): void {
    this.activeCategory.set(this.activeCategory() === cat ? '' : cat);
    this.page.set(0);
    this.heroIndex.set(0);
  }

  onSortChange(value: string): void {
    this.sort.set(value as 'recent' | 'ancien' | 'titre');
    this.page.set(0);
    this.heroIndex.set(0);
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages()) return;
    this.page.set(p);
    this.heroIndex.set(0);
    window.scrollTo({ top: 280, behavior: 'smooth' });
  }

  // ----- Lightbox photos -----
  private photoList = computed(() => this.paged().filter(i => i.type === 'photo'));

  openLightbox(item: MediaItem): void {
    const idx = this.paged().indexOf(item);
    this.lightboxIndex.set(idx);
  }
  closeLightbox(): void { this.lightboxIndex.set(null); }

  lightboxItem = computed(() => {
    const idx = this.lightboxIndex();
    return idx === null ? null : this.paged()[idx] ?? null;
  });

  nextPhoto(): void {
    const idx = this.lightboxIndex();
    if (idx === null) return;
    this.lightboxIndex.set((idx + 1) % this.paged().length);
  }
  prevPhoto(): void {
    const idx = this.lightboxIndex();
    if (idx === null) return;
    const len = this.paged().length;
    this.lightboxIndex.set((idx - 1 + len) % len);
  }

  // ----- Vidéo (file de lecture = liste filtrée de l'onglet) -----
  /** Vidéos de la file de lecture. */
  videoQueue = computed(() => this.activeTab() === 'video' ? this.filtered() : []);

  openVideo(item: MediaItem): void {
    const list = this.videoQueue();
    const idx = Math.max(0, list.findIndex(v => v.id === item.id));
    this.videoIndex.set(idx);
    this.activeVideo.set(list[idx] ?? item);
  }
  closeVideo(): void { this.activeVideo.set(null); }

  nextVideo(): void {
    const list = this.videoQueue();
    if (list.length < 2) { this.closeVideo(); return; }
    const i = (this.videoIndex() + 1) % list.length;
    this.videoIndex.set(i);
    this.activeVideo.set(list[i]);
  }
  prevVideo(): void {
    const list = this.videoQueue();
    if (list.length < 2) return;
    const i = (this.videoIndex() - 1 + list.length) % list.length;
    this.videoIndex.set(i);
    this.activeVideo.set(list[i]);
  }

  /** Fin de lecture d'une vidéo : on enchaîne si la lecture auto est active. */
  onVideoEnded(): void {
    if (this.autoplay() && this.videoQueue().length > 1) this.nextVideo();
  }

  /** Le lecteur YouTube demande à recevoir les événements de lecture. */
  onYtLoad(iframe: HTMLIFrameElement): void {
    try {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
    } catch { /* cross-origin : ignoré */ }
  }

  videoEmbed = computed<SafeResourceUrl | null>(() => {
    const v = this.activeVideo();
    if (!v?.youtubeId) return null;
    const url = `https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // ----- Audio : une seule lecture à la fois + enchaînement automatique -----
  onAudioPlay(el: EventTarget | null): void {
    document.querySelectorAll('audio').forEach(a => { if (a !== el && !a.paused) a.pause(); });
  }
  onAudioEnded(el: EventTarget | null): void {
    if (!this.autoplay()) return;
    const all = Array.from(document.querySelectorAll('audio'));
    const next = all[all.indexOf(el as HTMLAudioElement) + 1];
    if (next) {
      next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      next.play().catch(() => { /* lecture bloquée par le navigateur : ignoré */ });
    }
  }

  // ----- Document -----
  openDoc(item: MediaItem): void { this.activeDoc.set(item); }
  closeDoc(): void { this.activeDoc.set(null); }

  docPreview = computed<SafeResourceUrl | null>(() => {
    const d = this.activeDoc();
    if (!d?.url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(d.url);
  });

  // ----- Import YouTube -----
  previewYoutube(): void {
    this.ytError.set('');
    const meta = this.media.parseYoutube(this.ytInput());
    if (!meta) { this.ytPreviewId.set(null); this.ytError.set('Lien YouTube non reconnu. Collez une URL ou un ID valide.'); return; }
    this.ytPreviewId.set(meta.id);
  }

  ytPreviewEmbed = computed<SafeResourceUrl | null>(() => {
    const id = this.ytPreviewId();
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.media.youtubeMeta(id).embed);
  });

  addYoutube(): void {
    const id = this.ytPreviewId();
    if (!id) return;
    const meta = this.media.youtubeMeta(id);
    const newItem: MediaItem = {
      id: `yt-${id}-${Date.now()}`,
      type: 'video',
      title: 'Vidéo importée depuis YouTube',
      category: 'Importé',
      date: new Date().toISOString().slice(0, 10),
      source: 'youtube',
      youtubeId: id,
      thumbnail: meta.thumbnail,
    };
    this.items.update(list => [newItem, ...list]);
    this.selectTab('video');
    this.activeCategory.set('Importé');
    this.ytInput.set('');
    this.ytPreviewId.set(null);
  }

  // ----- Clavier (lightbox / modales) -----
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.lightboxIndex() !== null) {
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowRight') this.nextPhoto();
      if (e.key === 'ArrowLeft') this.prevPhoto();
    } else if (this.activeVideo()) {
      if (e.key === 'Escape') this.closeVideo();
      if (e.key === 'ArrowRight') this.nextVideo();
      if (e.key === 'ArrowLeft') this.prevVideo();
    } else if (this.activeAlbum()) {
      if (e.key === 'Escape') this.closeAlbum();
      if (e.key === 'ArrowRight') this.nextAlbumSlide();
      if (e.key === 'ArrowLeft') this.prevAlbumSlide();
    } else if (e.key === 'Escape' && this.activeDoc()) {
      this.closeDoc();
    }
  }

  /** Détection de fin de lecture d'une vidéo YouTube (API postMessage, sans script externe). */
  @HostListener('window:message', ['$event'])
  onWindowMessage(e: MessageEvent): void {
    if (!this.activeVideo()?.youtubeId || typeof e.data !== 'string') return;
    if (!e.origin.includes('youtube.com')) return;
    try {
      const d = JSON.parse(e.data);
      const state = d?.info?.playerState ?? (d?.event === 'onStateChange' ? d.info : undefined);
      if (state === 0) this.onVideoEnded(); // 0 = ENDED
    } catch { /* message non-JSON : ignoré */ }
  }

  // ----- Utilitaires d'affichage -----
  formatViews(n?: number): string {
    if (!n) return '';
    return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')} k` : `${n}`;
  }

  /** Vignette d'un média : celle définie, sinon celle de YouTube, sinon rien (placeholder CSS). */
  thumbOf(item: MediaItem): string {
    if (item.thumbnail) return item.thumbnail;
    if (item.youtubeId) return `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
    return '';
  }

  docColor(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'PDF':  return 'bg-red-50 text-red-600';
      case 'XLSX': case 'XLS': return 'bg-emerald-50 text-emerald-600';
      case 'DOCX': case 'DOC': return 'bg-blue-50 text-blue-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  }

  /** Tailles des tuiles du bento grid (rythme régulier : grandes / larges / standard). */
  bento(i: number): string {
    const m = i % 6;
    if (m === 0) return 'sm:col-span-2 sm:row-span-2';
    if (m === 3) return 'sm:col-span-2';
    return '';
  }

  trackById = (_: number, item: { id: string }) => item.id;
}
