export * from './user.model';

// API Response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Pagination
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}


//Agendas

export interface AgendaImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}


export interface Agenda {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: ArticleStatus;
  authorId?: string;
  authorName?: string;
  publishedAt?: string;    // ou Date
  createdAt: string;
  updatedAt?: string;
  images: AgendaImage[];
  lieux: string;
  datePublication: Date;
}

//service

export interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  logo: string;
  
}

// Article
export enum ArticleCategory {
  ACTUALITE = 'ACTUALITE',
  COMMUNIQUE = 'COMMUNIQUE',
  EVENEMENT = 'EVENEMENT',
  PROJET = 'PROJET',
  RAPPORT = 'RAPPORT',
  DISCOURS = 'DISCOURS'
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}


export interface Articlemage {
  id: string;
  imageUrl: string;
  isFeatured: boolean;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  featuredImage?: string;
  category: ArticleCategory;
  status: ArticleStatus;
  viewCount: number;
  featured: boolean;
  publishToFacebook?: boolean;
  facebookContent?: string;
  authorName?: string;
  authorId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  images: Articlemage[];
}

//eveneent

export interface Evenement {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  imageUrl?: string;
  category: ArticleCategory;
  status: ArticleStatus;
  maxParticipants:number;
  currentParticipants:number;
  registrationRequired:boolean;
  isRegistrationOpen:boolean;
  createdBy:string;
  isPublic:boolean;
  
  authorName?: string;
  authorId?: string;
  
  createdAt: string;

  updatedAt?: string;
}

// Project
export enum ProjectStatus {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  SUSPENDU = 'SUSPENDU',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE'
}

export interface Project {
  id: string;
  name: string;
  description: string;
  objectives: string;
  featuredImage?: string;
  status: ProjectStatus;
  budget?: number;
  progressPercentage: number;
  startDate?: string;
  endDate?: string;
  partner?: string;
  responsibleDepartment?: string;
  managerName?: string;
  managerId?: string;
  createdAt: string;
  updatedAt?: string;
  categorieProjetName: string;
  categorieProjetId: string;
  type: ProjetType;
}

// Document
export enum DocumentCategory {
  RAPPORT = 'RAPPORT',
  FORMULAIRE = 'FORMULAIRE',
  GUIDE = 'GUIDE',
  LOI = 'LOI',
  DECRET = 'DECRET',
  ARRETE = 'ARRETE',
  CIRCULAIRE = 'CIRCULAIRE',
  AUTRE = 'AUTRE'
}

export enum DocumentType {
  DOCUMENT = 'DOCUMENT SIMPLE',
  POLITIQUE = 'DOCUMENT POLITIQUE',

}

export enum ProjetType {
  PROJET = 'PROJET',
  PROGRAMME = 'PROGRAMME',

}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  category: DocumentCategory;
  downloadCount: number;
  isPublic: boolean;
  uploadedByName?: string;
  uploadedById?: string;
  createdAt: string;
  updatedAt?: string;
  typeId: string;
  typeName: string;
  typeDocument: DocumentType;
}

export interface TypeDocument {
  id: string;
  name: string;
  description: string;
}

// Catégorie d'article gérée en base (CRUD admin)
export interface ArticleCategoryItem {
  id: string;
  code: string;
  label: string;
  description?: string;
  displayOrder?: number;
  articleCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// File de validation des contenus soumis par les modérateurs
export type ReviewStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface ModerationItem {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  status: ReviewStatus;
  submittedByName: string;
  submittedById: string;
  submittedAt: string;
  reviewNote?: string;
  reviewedAt?: string;
}

// Catégorie (rubrique) de la médiathèque gérée en base (CRUD admin)
export interface MediaCategoryItem {
  id: string;
  label: string;
  description?: string;
  displayOrder?: number;
  mediaCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Contact
export enum ContactStatus {
  NON_LU = 'NON_LU',
  LU = 'LU',
  EN_TRAITEMENT = 'EN_TRAITEMENT',
  TRAITE = 'TRAITE',
  ARCHIVE = 'ARCHIVE'
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  response?: string;
  respondedByName?: string;
  respondedById?: string;
  respondedAt?: string;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalArticles: number;
  publishedArticles: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalDocuments: number;
  publicDocuments: number;
  totalContacts: number;
  pendingContacts: number;
  averageProjectProgress: number;

  // Pilotage éditorial (DCRP)
  totalActualites: number;
  publishedActualites: number;
  totalCommuniques: number;
  publishedCommuniques: number;
  draftArticles: number;
  publicationsLast7Days: number;
  publicationsLast30Days: number;
  totalAgendas: number;
  publishedAgendas: number;
  totalEvents: number;
  totalMedia: number;

  // Newsletter
  newsletterSubscribers: number;

  // Contenus les plus lus
  topReadArticles: TopContent[];
}

export interface TopContent {
  title: string;
  category: string;
  viewCount: number;
}

// ============ ANALYTICS (fréquentation DCRP) ============
export interface AnalyticsDailyPoint {
  date: string;       // yyyy-MM-dd
  visitors: number;
  pageViews: number;
}

export interface AnalyticsHourPoint {
  hour: number;       // 0-23
  count: number;
}

export interface AnalyticsLabelCount {
  label: string;
  count: number;
}

export interface AnalyticsOverview {
  visitorsToday: number;
  visitorsWeek: number;
  visitorsMonth: number;
  visitors3Months: number;
  pageViewsToday: number;
  pageViewsWeek: number;
  pageViewsMonth: number;
  pageViews3Months: number;
  totalClicks: number;
  dailySeries: AnalyticsDailyPoint[];
  hourly: AnalyticsHourPoint[];
  topPages: AnalyticsLabelCount[];
  topClicks: AnalyticsLabelCount[];
}

/** Configuration d'intégration Facebook (Graph API). Le token est masqué côté lecture. */
export interface FacebookConfig {
  id?: string;
  label?: string;
  pageId: string;
  /** Token longue durée — renvoyé masqué par l'API ; saisi en clair pour mise à jour. */
  accessToken?: string;
  /** Indique si un token est déjà enregistré (l'API ne renvoie pas le secret en clair). */
  hasToken?: boolean;
  tokenExpiresAt?: string;
  active?: boolean;
  updatedAt?: string;
}

// ============ RECHERCHE UNIFIÉE ============
export interface SearchItem {
  id: string;
  type: string;          // actualite, communique, projet, document, evenement, agenda, service, faq
  title: string;
  excerpt: string;       // extrait avec surbrillance (<mark>)
  url: string;           // chemin interne ('/actualites/:id') ou lien externe ('http...')
  imageUrl?: string;
  category?: string;
  relevanceScore?: number;
  date?: string;
  highlights?: { [field: string]: string };
}

export interface SearchResponseModel {
  query: string;
  totalResults: number;
  page: number;
  size: number;
  totalPages: number;
  results: SearchItem[];
  facets: { [type: string]: number };
  suggestions: string[];
  searchDurationMs: number;
}

// ============ THÈME DU SITE ============
export interface ThemeModel {
  id?: string;
  title: string;
  primaryColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  isActive?: boolean;
}

// Navigation paginée des documents (Règlementation / Stratégie) avec facettes
export interface DocumentBrowse {
  content: Document[];
  totalElements: number;
  totalPages: number;
  number: number;   // page courante (0-based)
  size: number;
  facets: { [category: string]: number };
}
