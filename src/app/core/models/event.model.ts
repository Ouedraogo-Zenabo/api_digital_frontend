export interface Events {
  id: string;
  title: string;
  description: string;
  content: string;
  location: string;
  address: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  imageUrl: string;
  category: string;
  statut: string;            // libellé FR renvoyé par le backend (ex. "Programmé")
  status?: EventStatus;      // valeur enum (UPCOMING, ONGOING, COMPLETED, CANCELLED)
  isOnline: boolean;
  onlineUrl: string;
  isFree: boolean;
  price: number;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  
}

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface FlashInfo {
  id: string;
  title: string;
  content: string;
  linkUrl: string;
  linkText: string;
  priority: FlashInfoPriority;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FlashInfoPriority = 'LOW' | 'NORMAL' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface EService {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  targetAudience: string;
  cost: number;
  costDetails: string;
  processingTime: string;
  accessConditions: string;
  requiredDocuments: string[];
  procedureSteps: string;
  onlineUrl: string;
  physicalAddress: string;
  contactEmail: string;
  contactPhone: string;
  exampleFileUrl: string;
  iconName: string;
  isOnline: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferences: string[];
  frequency: string;
  isActive: boolean;
  isVerified: boolean;
  subscribedAt: string;
}

export interface Structure {
  id: string;
  
  name: string;
  acronym: string;
  type: StructureType;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logourl: string;
  ministereId: string;
  domaineIds: string[];
  displayOrder: number;
  isActive: boolean;



}

export interface Organigramme {
  id: string;
  title: string;
  phone: string;
  name: string;
  acronym: string;
  structureType: StructureType;
  ministereName: string;
  ministereId: string;
  address: string;

  niveau: string,
  photo: string,
  description: string,

  email: string;
  website: string;
  logoUrl: string;
  parentId: string;
  displayOrder: number;
  isActive: boolean;
}



export interface Ministere {
  id: string;
  nomGeneral: string;
  nomReel: string;
  acronyme: string;
  logo: string;
  missionGeneral: string;
  image: string;
  presentationSynthetique: string;
  presentationGlobale:string;
  
}

export interface Domains {
  id: string;
  nom: string;
  
  
}

export type StructureType = 'DIRECTION' | 'SERVICE' | 'AGENCE' | 'ETABLISSEMENT' | 'PROJET' | 'MINISTERE'| 'CABINET';


export interface Mission {
  id: string;
  
  categorie: string;
  description: string;
  
  ministereId: string;
  



}

export interface Ministre {
  id: string;

  nom: string,
  prenom: string,
  profession: string,
  biographie: string,
  /** Mot du Ministre — texte riche (HTML) affiché sur la page d'accueil. */
  content?: string,
  photo: string,
  isActif: boolean,
  /** Début du mandat. */
  dateDebut?: string,
  /** Fin du mandat (vide pour le ministre en fonction). */
  dateFin?: string,
  ministereId: "",
}



export interface Etats {
  id: string;
  nom: string;
  valeur: string;

}

export interface TickerConfig {
  id?: string;
  /** Durée (en secondes) d'un cycle complet de défilement du bandeau Flash Info. */
  scrollDuration: number;
  updatedAt?: string;
}

/** Document officiel mis en avant sur la page d'accueil. */
export interface HomeDocConfig {
  id?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  active: boolean;
  updatedAt?: string;
}

/** Liste (PDF) des entreprises détentrices de l'agrément technique en TIC. */
export interface AgrementListConfig {
  id?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  active: boolean;
  updatedAt?: string;
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image?: string;
  linkUrl?: string;
  linkText?: string;
  displayOrder?: number;
  /** Durée d'affichage (en secondes) avant le défilement automatique. */
  displayDuration?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Conseil (astuce) affiché dans la section défilante horizontale de la page d'accueil. */
export interface Conseil {
  id: string;
  title: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}