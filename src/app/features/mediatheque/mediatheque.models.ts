export type MediaType = 'photo' | 'video' | 'document' | 'audio';
export type MediaSource = 'platform' | 'youtube';

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  description?: string;
  /** Album / rubrique pour le filtrage. */
  category: string;
  /** Date ISO (publication). */
  date: string;
  source: MediaSource;

  // Visuel commun (photo : image ; vidéo : miniature ; document : aperçu/couverture).
  thumbnail?: string;
  /** URL plein format : image HD, fichier vidéo hébergé, ou fichier document. */
  url?: string;

  // Vidéo / audio
  youtubeId?: string;
  duration?: string;   // "06:48"
  views?: number;
  author?: string;     // ex. chaîne YouTube, intervenant du podcast

  // Album de rattachement
  albumId?: string;
  albumName?: string;

  // ===== Métadonnées extraites automatiquement à l'import =====
  fileType?: string;   // PDF, DOCX, XLSX, JPG, MP4...
  mimeType?: string;   // application/pdf, image/jpeg...
  fileSize?: string;   // lisible : "2,4 Mo"
  sizeBytes?: number;  // taille brute
  pages?: number;      // documents PDF
  width?: number;      // images / vidéos
  height?: number;
}

/** Métadonnées détectées côté client à partir d'un fichier ou d'une URL. */
export type ExtractedMeta = Partial<Pick<MediaItem,
  'fileType' | 'mimeType' | 'fileSize' | 'sizeBytes' | 'pages' | 'width' | 'height' | 'duration'>>;

/** Album (regroupement de médias, surtout des images). */
export interface MediaAlbum {
  id: string;
  name: string;
  description?: string;
  category?: string;
  coverUrl?: string;
  isPublic?: boolean;
  displayOrder?: number;
  mediaCount?: number;
  /** Quelques vignettes pour le diaporama de la carte. */
  previewImages?: string[];
  /** Contenu complet (détail d'un album). */
  medias?: MediaItem[];
  createdAt?: string;
}

export interface YoutubeMeta {
  id: string;
  thumbnail: string;
  embed: string;
  watch: string;
}
