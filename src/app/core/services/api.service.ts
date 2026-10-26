import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Page, Article, Project, Document, Contact, DashboardStats, User, TypeDocument, Agenda, Service, AnalyticsOverview, ArticleCategoryItem, MediaCategoryItem, FacebookConfig, SearchResponseModel, ThemeModel, DocumentBrowse } from '../models';
import { Events, FlashInfo, EService, FAQ, NewsletterSubscription, Structure, Ministere, Banner, Conseil, TickerConfig, HomeDocConfig, AgrementListConfig } from '../models/event.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}



  //Projets

  // Admin projects
  getAllService(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<Service>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<Service>>>(`${this.API_URL}/services`, { params });
  }

getAllServicepublic(): Observable<ApiResponse<Page<Service>>> {
  return this.http.get<ApiResponse<Page<Service>>>(`${this.API_URL}/services`);
}
 


  getServicesById(id: string): Observable<ApiResponse<Service>> {
    return this.http.get<ApiResponse<Service>>(`${this.API_URL}/services/${id}`);
  }

 

   createServices(formData: FormData): Observable<ApiResponse<Service>> {
    return this.http.post<ApiResponse<Service>>(
      `${this.API_URL}/services`,
      formData
    );
  }

  updateServices(id: string, formData: FormData): Observable<ApiResponse<Service>> {
    return this.http.put<ApiResponse<Service>>(
      `${this.API_URL}/services/${id}`,
      formData
    );
  }



  deleteServices(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/services/${id}`);
  }

  // ============ PUBLIC Agndas ============
  getAllAgendas(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<Agenda>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<Agenda>>>(`${this.API_URL}/agendas`, { params });
  }

 


  getAgendasById(id: string): Observable<ApiResponse<Agenda>> {
    return this.http.get<ApiResponse<Agenda>>(`${this.API_URL}/agendas/${id}`);
  }

 

   createAgendas(formData: FormData): Observable<ApiResponse<Agenda>> {
    return this.http.post<ApiResponse<Agenda>>(
      `${this.API_URL}/agendas`,
      formData
    );
  }

  updateAgendas(id: string, formData: FormData): Observable<ApiResponse<Agenda>> {
    return this.http.put<ApiResponse<Agenda>>(
      `${this.API_URL}/agendas/${id}`,
      formData
    );
  }



  deleteAgendas(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/agendas/${id}`);
  }

getPublishedAgendasLatest(): Observable<ApiResponse<Agenda[]>> {
  return this.http.get<ApiResponse<Agenda[]>>(`${this.API_URL}/agendas/published/latest`);
}


  getPublishedAgendaeById(id: string): Observable<ApiResponse<Agenda>> {
    return this.http.get<ApiResponse<Agenda>>(`${this.API_URL}/agendas/published/${id}`);
  }

   getPublishedAgendas(page = 0, size = 10): Observable<ApiResponse<Page<Agenda>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Agenda>>>(`${this.API_URL}/agendas/published`, { params });
  }


  // ============ PUBLIC ARTICLES ============
  getPublishedArticles(page = 0, size = 10): Observable<ApiResponse<Page<Article>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Article>>>(`${this.API_URL}/public/articles`, { params });
  }

  // Service pour récupérer les articles par catégorie
getArticlesByCategory(category: string, page: number = 0, size: number = 10): Observable<ApiResponse<Page<Article>>> {
  const params = new HttpParams()
    .set('page', page)
    .set('size', size);

  return this.http.get<ApiResponse<Page<Article>>>(`${this.API_URL}/public/articles/category/${category}`, { params });
}

  getAllCommuniques(): Observable<Article[]> {
  // Si ton backend accepte un paramètre "all=true"
  return this.http.get<Article[]>(`${this.API_URL}/public/articles`, { params: new HttpParams().set('category', 'COMMUNIQUE').set('all', 'true') });
}

  getLatestArticles(): Observable<ApiResponse<Article[]>> {
    return this.http.get<ApiResponse<Article[]>>(`${this.API_URL}/public/articles/latest`);
  }

  getFeaturedArticles(): Observable<ApiResponse<Article[]>> {
    return this.http.get<ApiResponse<Article[]>>(`${this.API_URL}/public/articles/featured`);
  }

  getPublishedArticleById(id: string): Observable<ApiResponse<Article>> {
    return this.http.get<ApiResponse<Article>>(`${this.API_URL}/public/articles/${id}`);
  }

  searchArticles(query: string, page = 0, size = 10): Observable<ApiResponse<Page<Article>>> {
    const params = new HttpParams().set('query', query).set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Article>>>(`${this.API_URL}/public/articles/search`, { params });
  }

  // ============ THÈME DU SITE ============
  /** Thème actif appliqué sur tout le site (public). */
  getActiveTheme(): Observable<ApiResponse<ThemeModel>> {
    return this.http.get<ApiResponse<ThemeModel>>(`${this.API_URL}/themes/active`);
  }

  getAllThemes(): Observable<ApiResponse<ThemeModel[]>> {
    return this.http.get<ApiResponse<ThemeModel[]>>(`${this.API_URL}/themes`);
  }

  createTheme(dto: ThemeModel): Observable<ApiResponse<ThemeModel>> {
    return this.http.post<ApiResponse<ThemeModel>>(`${this.API_URL}/themes`, dto);
  }

  updateTheme(id: string, dto: ThemeModel): Observable<ApiResponse<ThemeModel>> {
    return this.http.put<ApiResponse<ThemeModel>>(`${this.API_URL}/themes/${id}`, dto);
  }

  /** Valide (active) un thème : il s'applique alors sur tout le site. */
  activateTheme(id: string): Observable<ApiResponse<ThemeModel>> {
    return this.http.put<ApiResponse<ThemeModel>>(`${this.API_URL}/themes/${id}/activate`, {});
  }

  deleteTheme(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/themes/${id}`);
  }

  /** Recherche unifiée (backend) : pertinence, facettes, surbrillance, pagination. */
  searchAll(query: string, opts: { types?: string[]; page?: number; size?: number; sort?: string } = {}): Observable<ApiResponse<SearchResponseModel>> {
    let params = new HttpParams()
      .set('query', query)
      .set('page', String(opts.page ?? 0))
      .set('size', String(opts.size ?? 10));
    if (opts.sort) params = params.set('sort', opts.sort);
    (opts.types ?? []).forEach(t => params = params.append('types', t));
    return this.http.get<ApiResponse<SearchResponseModel>>(`${this.API_URL}/public/search`, { params });
  }

  // Admin articles
  getAllArticles(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<Article>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<Article>>>(`${this.API_URL}/articles`, { params });
  }

 getAllArticles1(): Observable<ApiResponse<Article[]>> {
  const url = `${this.API_URL}/articles`;
  return this.http.get<ApiResponse<Article[]>>(url);
}


  getArticleById(id: string): Observable<ApiResponse<Article>> {
    return this.http.get<ApiResponse<Article>>(`${this.API_URL}/articles/${id}`);
  }

  createArticle1(article: Partial<Article>): Observable<ApiResponse<Article>> {
    return this.http.post<ApiResponse<Article>>(`${this.API_URL}/articles`, article);
  }

   createArticle(formData: FormData): Observable<ApiResponse<Article>> {
    return this.http.post<ApiResponse<Article>>(
      `${this.API_URL}/articles`,
      formData
    );
  }

  updateArticle(id: string, formData: FormData): Observable<ApiResponse<Article>> {
    return this.http.put<ApiResponse<Article>>(
      `${this.API_URL}/articles/${id}`,
      formData
    );
  }



  updateArticle1(id: string, article: Partial<Article>): Observable<ApiResponse<Article>> {
    return this.http.put<ApiResponse<Article>>(`${this.API_URL}/articles/${id}`, article);
  }



  deleteArticle(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/articles/${id}`);
  }

  /** Publie (ou republie) l'article sur Facebook, quel que soit son statut. */
  publishArticleToFacebook(id: string): Observable<ApiResponse<Article>> {
    return this.http.post<ApiResponse<Article>>(`${this.API_URL}/articles/${id}/facebook`, {});
  }

  // ============ PUBLIC PROJECTS ============
  getPublicProjects(page = 0, size = 10): Observable<ApiResponse<Page<Project>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Project>>>(`${this.API_URL}/public/projects`, { params });
  }

  getLatestProjects(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(`${this.API_URL}/public/projects/latest`);
  }

  getPublicProjectById(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.API_URL}/public/projects/${id}`);
  }

  searchProjects(query: string, page = 0, size = 10): Observable<ApiResponse<Page<Project>>> {
    const params = new HttpParams().set('query', query).set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Project>>>(`${this.API_URL}/public/projects/search`, { params });
  }

  // Admin projects
  getAllProjects(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<Project>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<Project>>>(`${this.API_URL}/projects`, { params });
  }

  getProjectById(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.API_URL}/projects/${id}`);
  }

  createProject(project: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.API_URL}/projects`, project);
  }

  updateProject(id: string, project: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.API_URL}/projects/${id}`, project);
  }

  deleteProject(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/projects/${id}`);
  }


    // Admin Types document
  getAllTypes1(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<TypeDocument>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<TypeDocument>>>(`${this.API_URL}/types`, { params });
  }

getAllTypes(): Observable<TypeDocument[]> {
  return this.http.get<TypeDocument[]>(`${this.API_URL}/types`);
}



  getypesById(id: string): Observable<ApiResponse<TypeDocument>> {
    return this.http.get<ApiResponse<TypeDocument>>(`${this.API_URL}/types/${id}`);
  }

  createTypes(project: Partial<TypeDocument>): Observable<ApiResponse<TypeDocument>> {
    return this.http.post<ApiResponse<TypeDocument>>(`${this.API_URL}/types`, project);
  }

  updateTypes(id: string, project: Partial<TypeDocument>): Observable<ApiResponse<TypeDocument>> {
    return this.http.put<ApiResponse<TypeDocument>>(`${this.API_URL}/types/${id}`, project);
  }

  deleteTypes(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/types/${id}`);
  }
  // ============ PUBLIC DOCUMENTS ============
  /** Navigation paginée côté serveur : Règlementation / Stratégie, avec facettes par catégorie. */
  browseDocuments(typeDocument: string, category: string | null, query = '', page = 0, size = 9): Observable<ApiResponse<DocumentBrowse>> {
    let params = new HttpParams().set('typeDocument', typeDocument).set('page', page).set('size', size);
    if (category) params = params.set('category', category);
    if (query && query.trim()) params = params.set('query', query.trim());
    return this.http.get<ApiResponse<DocumentBrowse>>(`${this.API_URL}/documents/public/browse`, { params });
  }

  getPublicDocuments(page = 0, size = 10): Observable<ApiResponse<Page<Document>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Document>>>(`${this.API_URL}/public/documents`, { params });
  }

  searchDocuments(query: string, page = 0, size = 10): Observable<ApiResponse<Page<Document>>> {
    const params = new HttpParams().set('query', query).set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Document>>>(`${this.API_URL}/public/documents/search`, { params });
  }

downloadDocument(id: string) {
  return this.http.post(
    `${this.API_URL}/documents/public/${id}/download/`, // ID dans l'URL
    {}, // body vide (ou mets {} si backend exige POST)
    {
      responseType: 'blob' // IMPORTANT
    }
  );
}

//type rpojets

  // Admin Types document
  getAllTypeProjets(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<TypeDocument>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<TypeDocument>>>(`${this.API_URL}/projetcategories`, { params });
  }

  getTypes(): Observable<TypeDocument[]> {
  return this.http.get<TypeDocument[]>(`${this.API_URL}/projetcategories`);
}


getAllTypesProjets(): Observable<TypeDocument[]> {
  return this.http.get<TypeDocument[]>(`${this.API_URL}/projetcategories`);
}



  getypesByIdProjets(id: string): Observable<ApiResponse<TypeDocument>> {
    return this.http.get<ApiResponse<TypeDocument>>(`${this.API_URL}/projetcategories/${id}`);
  }

  createTypesProjets(project: Partial<TypeDocument>): Observable<ApiResponse<TypeDocument>> {
    return this.http.post<ApiResponse<TypeDocument>>(`${this.API_URL}/projetcategories`, project);
  }

  updateTypesProjets(id: string, project: Partial<TypeDocument>): Observable<ApiResponse<TypeDocument>> {
    return this.http.put<ApiResponse<TypeDocument>>(`${this.API_URL}/projetcategories/${id}`, project);
  }

  deleteTypesProjets(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/projetcategories/${id}`);
  }

  // ============ ARTICLE CATEGORIES ============
  getArticleCategories(): Observable<ArticleCategoryItem[]> {
    return this.http.get<ArticleCategoryItem[]>(`${this.API_URL}/article-categories`);
  }

  createArticleCategoryItem(category: Partial<ArticleCategoryItem>): Observable<ArticleCategoryItem> {
    return this.http.post<ArticleCategoryItem>(`${this.API_URL}/article-categories`, category);
  }

  updateArticleCategoryItem(id: string, category: Partial<ArticleCategoryItem>): Observable<ArticleCategoryItem> {
    return this.http.put<ArticleCategoryItem>(`${this.API_URL}/article-categories/${id}`, category);
  }

  deleteArticleCategoryItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/article-categories/${id}`);
  }

  // ============ Catégories de média (médiathèque) ============
  getMediaCategories(): Observable<MediaCategoryItem[]> {
    return this.http.get<MediaCategoryItem[]>(`${this.API_URL}/media-categories`);
  }

  createMediaCategory(category: Partial<MediaCategoryItem>): Observable<MediaCategoryItem> {
    return this.http.post<MediaCategoryItem>(`${this.API_URL}/media-categories`, category);
  }

  updateMediaCategory(id: string, category: Partial<MediaCategoryItem>): Observable<MediaCategoryItem> {
    return this.http.put<MediaCategoryItem>(`${this.API_URL}/media-categories/${id}`, category);
  }

  deleteMediaCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/media-categories/${id}`);
  }



  // Admin documents
  getAllDocuments(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<Document>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<Document>>>(`${this.API_URL}/documents`, { params });
  }

  getDocumentById(id: string): Observable<ApiResponse<Document>> {
    return this.http.get<ApiResponse<Document>>(`${this.API_URL}/documents/${id}`);
  }

  createDocument1(document: Partial<Document>): Observable<ApiResponse<Document>> {
    return this.http.post<ApiResponse<Document>>(`${this.API_URL}/documents`, document);
  }

  updateDocument1(id: string, document: Partial<Document>): Observable<ApiResponse<Document>> {
    return this.http.put<ApiResponse<Document>>(`${this.API_URL}/documents/${id}`, document);
  }

  // documents.service.ts ou api.service.ts
createDocument(formData: FormData): Observable<ApiResponse<Document>> {
  return this.http.post<ApiResponse<Document>>(`${this.API_URL}/documents`, formData);
}

updateDocument(id: string, formData: FormData): Observable<ApiResponse<Document>> {
  return this.http.put<ApiResponse<Document>>(`${this.API_URL}/documents/${id}`, formData);
}


  deleteDocument(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/documents/${id}`);
  }

  // ============ PUBLIC CONTACTS ============
  submitContact(contact: Partial<Contact>): Observable<ApiResponse<Contact>> {
    return this.http.post<ApiResponse<Contact>>(`${this.API_URL}/public/contacts`, contact);
  }

  // Admin contacts
  getAllContacts(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<Contact>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<Contact>>>(`${this.API_URL}/contacts`, { params });
  }

  getContactById(id: string): Observable<ApiResponse<Contact>> {
    return this.http.get<ApiResponse<Contact>>(`${this.API_URL}/contacts/${id}`);
  }

  updateContactStatus(id: string, status: string): Observable<ApiResponse<Contact>> {
    return this.http.put<ApiResponse<Contact>>(`${this.API_URL}/contacts/${id}/status`, { status });
  }

  respondToContact(id: string, response: string): Observable<ApiResponse<Contact>> {
    return this.http.post<ApiResponse<Contact>>(`${this.API_URL}/contacts/${id}/respond`, { response });
  }

  deleteContact(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/contacts/${id}`);
  }

  // ============ USERS ============
  getAllUsers(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<User>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<User>>>(`${this.API_URL}/users`, { params });
  }

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/users/me`);
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/users/${id}`);
  }

  createUser(user: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.API_URL}/users`, user);
  }

  updateUser(id: string, user: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.API_URL}/users/${id}`, user);
  }

  changePassword(id: string, oldPassword: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/users/${id}/password`, { oldPassword, newPassword });
  }

  toggleUserStatus(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/users/${id}/toggle-status`, {});
  }

  /** Réinitialisation par un administrateur (sans ancien mot de passe). */
  adminResetPassword(id: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/users/${id}/reset-password`, { newPassword });
  }

  /** Désactivation du compte (self-service ou admin). */
  deactivateUser(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/users/${id}/deactivate`, {});
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/users/${id}`);
  }

  // ============ DASHBOARD ============
  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.API_URL}/dashboard/stats`);
  }

  // ============ ANALYTICS ============
  getAnalyticsOverview(): Observable<ApiResponse<AnalyticsOverview>> {
    return this.http.get<ApiResponse<AnalyticsOverview>>(`${this.API_URL}/analytics/overview`);
  }

  // Alias methods for dashboard
  getArticles(page = 0, size = 10): Observable<ApiResponse<Page<Article>>> {
    return this.getAllArticles(page, size);
  }

  getContacts(page = 0, size = 10): Observable<ApiResponse<Page<Contact>>> {
    return this.getAllContacts(page, size);
  }


  //minsitère

  
   getAllMins(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<Page<Ministere>>> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<ApiResponse<Page<Ministere>>>(`${this.API_URL}/ministeres`, { params });
  }



  getminById(id: string): Observable<ApiResponse<Ministere>> {
    return this.http.get<ApiResponse<Ministere>>(`${this.API_URL}/ministeres/${id}`);
  }



 
  createmin(formData: FormData): Observable<ApiResponse<Ministere>> {
    return this.http.post<ApiResponse<Ministere>>(
      `${this.API_URL}/ministeres`,
      formData
    );
  }

  updatemin(id: string, formData: FormData): Observable<ApiResponse<Ministere>> {
    return this.http.put<ApiResponse<Ministere>>(
      `${this.API_URL}/ministeres/${id}`,
      formData
    );
  }

 
  deleteMin(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/ministeres/${id}`);
  }

  // ============ EVENTS ============
  getPublicEvents(page = 0, size = 10): Observable<Page<Events>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Events>>(`${this.API_URL}/events/public`, { params });
  }

  getUpcomingEvents(): Observable<ApiResponse<Events[]>> {
    return this.http.get<ApiResponse<Events[]>>(`${this.API_URL}/events/public/upcoming`);
  }

  getEventById(id: string): Observable<ApiResponse<Events>> {
    return this.http.get<ApiResponse<Events>>(`${this.API_URL}/events/public/${id}`);
  }

  getAllEvents1(page = 0, size = 10): Observable<ApiResponse<Page<Events>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Events>>>(`${this.API_URL}/events`, { params });
  }

getAllEvents(page = 0, size = 10): Observable<Page<Events>> {
  const token = localStorage.getItem('token');

  console.log('TOKEN =', token); // 👈 pour voir le token

  const params = new HttpParams()
    .set('page', page)
    .set('size', size);

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.get<Page<Events>>(`${this.API_URL}/events`, { params, headers });
}

  getAllEvents2(page = 0, size = 10) {
  const token = localStorage.getItem('token');

  const params = new HttpParams()
    .set('page', page)
    .set('size', size);

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.get(`${this.API_URL}/events`, { params, headers });
}

  createEven1t(event: Partial<Event>): Observable<ApiResponse<Events>> {
    return this.http.post<ApiResponse<Events>>(`${this.API_URL}/events`, event);
  }

  createEvent(formData: FormData): Observable<ApiResponse<Events>> {
    return this.http.post<ApiResponse<Events>>(
      `${this.API_URL}/events`,
      formData
    );
  }

  updateEvent(id: string, formData: FormData): Observable<ApiResponse<Events>> {
    return this.http.put<ApiResponse<Events>>(
      `${this.API_URL}/events/${id}`,
      formData
    );
  }

  updateEvent1(id: string, event: Partial<Events>): Observable<ApiResponse<Events>> {
    return this.http.put<ApiResponse<Events>>(`${this.API_URL}/events/${id}`, event);
  }

  deleteEvent(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/events/${id}`);
  }

  // ============ FLASH INFOS ============
  getActiveFlashInfos(): Observable<ApiResponse<FlashInfo[]>> {
    return this.http.get<ApiResponse<FlashInfo[]>>(`${this.API_URL}/flash-infos/public/active`);
  }

  /** Flash infos actives à faire défiler dans le bandeau public (endpoint public). */
  getPublicFlashInfos(): Observable<FlashInfo[]> {
    return this.http.get<FlashInfo[]>(`${this.API_URL}/flash-infos/public`);
  }

  /** Liste complète (actives + inactives) pour l'administration. */
  getAllFlashInfosList(): Observable<FlashInfo[]> {
    return this.http.get<FlashInfo[]>(`${this.API_URL}/flash-infos/all`);
  }

  /** Configuration du bandeau (durée de défilement) — public. */
  getTickerConfig(): Observable<TickerConfig> {
    return this.http.get<TickerConfig>(`${this.API_URL}/ticker-config/public`);
  }

  /** Met à jour la durée de défilement du bandeau (admin). */
  updateTickerConfig(config: Partial<TickerConfig>): Observable<TickerConfig> {
    return this.http.put<TickerConfig>(`${this.API_URL}/ticker-config`, config);
  }

  /** Document officiel mis en avant sur l'accueil — public. */
  getHomeDoc(): Observable<ApiResponse<HomeDocConfig>> {
    return this.http.get<ApiResponse<HomeDocConfig>>(`${this.API_URL}/home-doc/public`);
  }

  /** Met à jour le document officiel de l'accueil (admin). */
  updateHomeDoc(formData: FormData): Observable<ApiResponse<HomeDocConfig>> {
    return this.http.put<ApiResponse<HomeDocConfig>>(`${this.API_URL}/home-doc`, formData);
  }

  /** Liste des entreprises détentrices de l'agrément technique (TIC) — public. */
  getAgrementList(): Observable<ApiResponse<AgrementListConfig>> {
    return this.http.get<ApiResponse<AgrementListConfig>>(`${this.API_URL}/agrement-list/public`);
  }

  /** Met à jour la liste des entreprises agréées (admin). */
  updateAgrementList(formData: FormData): Observable<ApiResponse<AgrementListConfig>> {
    return this.http.put<ApiResponse<AgrementListConfig>>(`${this.API_URL}/agrement-list`, formData);
  }

  getAllFlashInfos(page = 0, size = 10): Observable<ApiResponse<Page<FlashInfo>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<FlashInfo>>>(`${this.API_URL}/flash-infos`, { params });
  }

  createFlashInfo(flashInfo: Partial<FlashInfo>): Observable<ApiResponse<FlashInfo>> {
    return this.http.post<ApiResponse<FlashInfo>>(`${this.API_URL}/flash-infos`, flashInfo);
  }

  updateFlashInfo(id: string, flashInfo: Partial<FlashInfo>): Observable<ApiResponse<FlashInfo>> {
    return this.http.put<ApiResponse<FlashInfo>>(`${this.API_URL}/flash-infos/${id}`, flashInfo);
  }

  deleteFlashInfo(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/flash-infos/${id}`);
  }

  // ============ BANNIÈRES (carousel accueil) ============
  /** Bannières actives à faire défiler sur la page d'accueil. */
  getActiveBanners(): Observable<Banner[]> {
    return this.http.get<Banner[]>(`${this.API_URL}/banners/public`);
  }

  getAllBanners(): Observable<Banner[]> {
    return this.http.get<Banner[]>(`${this.API_URL}/banners`);
  }

  createBanner(formData: FormData): Observable<Banner> {
    return this.http.post<Banner>(`${this.API_URL}/banners`, formData);
  }

  updateBanner(id: string, formData: FormData): Observable<Banner> {
    return this.http.put<Banner>(`${this.API_URL}/banners/${id}`, formData);
  }

  deleteBanner(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/banners/${id}`);
  }

  /** Réordonne les bannières : envoie la liste des ids dans le nouvel ordre. */
  reorderBanners(orderedIds: string[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/banners/reorder`, orderedIds);
  }

  // ============ CONSEILS (défilement horizontal accueil) ============
  /** Conseils actifs à faire défiler sur la page d'accueil. */
  getActiveConseils(): Observable<Conseil[]> {
    return this.http.get<Conseil[]>(`${this.API_URL}/conseils/public`);
  }

  getAllConseils(): Observable<Conseil[]> {
    return this.http.get<Conseil[]>(`${this.API_URL}/conseils`);
  }

  createConseil(formData: FormData): Observable<Conseil> {
    return this.http.post<Conseil>(`${this.API_URL}/conseils`, formData);
  }

  updateConseil(id: string, formData: FormData): Observable<Conseil> {
    return this.http.put<Conseil>(`${this.API_URL}/conseils/${id}`, formData);
  }

  deleteConseil(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/conseils/${id}`);
  }

  /** Réordonne les conseils : envoie la liste des ids dans le nouvel ordre. */
  reorderConseils(orderedIds: string[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/conseils/reorder`, orderedIds);
  }

  // ============ E-SERVICES ============
  getPublicServices(page = 0, size = 10): Observable<ApiResponse<Page<EService>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<EService>>>(`${this.API_URL}/services/public`, { params });
  }

  getServicesByCategory(category: string): Observable<ApiResponse<EService[]>> {
    return this.http.get<ApiResponse<EService[]>>(`${this.API_URL}/services/public/category/${category}`);
  }

  getServiceById(id: string): Observable<ApiResponse<EService>> {
    return this.http.get<ApiResponse<EService>>(`${this.API_URL}/services/public/${id}`);
  }

  getAllServices(page = 0, size = 10): Observable<ApiResponse<Page<EService>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<EService>>>(`${this.API_URL}/services`, { params });
  }

  createService(service: Partial<EService>): Observable<ApiResponse<EService>> {
    return this.http.post<ApiResponse<EService>>(`${this.API_URL}/services`, service);
  }

  updateService(id: string, service: Partial<EService>): Observable<ApiResponse<EService>> {
    return this.http.put<ApiResponse<EService>>(`${this.API_URL}/services/${id}`, service);
  }

  deleteService(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/services/${id}`);
  }

  // ============ FAQ ============
  getPublicFAQs(): Observable<ApiResponse<FAQ[]>> {
    return this.http.get<ApiResponse<FAQ[]>>(`${this.API_URL}/faqs/public`);
  }

  getFAQsByCategory(category: string): Observable<ApiResponse<FAQ[]>> {
    return this.http.get<ApiResponse<FAQ[]>>(`${this.API_URL}/faqs/public/category/${category}`);
  }

  searchFAQs(query: string): Observable<ApiResponse<FAQ[]>> {
    const params = new HttpParams().set('query', query);
    return this.http.get<ApiResponse<FAQ[]>>(`${this.API_URL}/faqs/public/search`, { params });
  }

  getAllFAQs(page = 0, size = 10): Observable<ApiResponse<Page<FAQ>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<FAQ>>>(`${this.API_URL}/faqs`, { params });
  }

  createFAQ(faq: Partial<FAQ>): Observable<ApiResponse<FAQ>> {
    return this.http.post<ApiResponse<FAQ>>(`${this.API_URL}/faqs`, faq);
  }

  updateFAQ(id: string, faq: Partial<FAQ>): Observable<ApiResponse<FAQ>> {
    return this.http.put<ApiResponse<FAQ>>(`${this.API_URL}/faqs/${id}`, faq);
  }

  deleteFAQ(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/faqs/${id}`);
  }

  // ============ NEWSLETTER ============
  subscribeNewsletter(subscription: Partial<NewsletterSubscription>): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/newsletter/public/subscribe`, subscription);
  }

  unsubscribeNewsletter(token: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/newsletter/public/unsubscribe`, { token });
  }

  getAllSubscriptions(page = 0, size = 10): Observable<ApiResponse<Page<NewsletterSubscription>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<NewsletterSubscription>>>(`${this.API_URL}/newsletter`, { params });
  }

  // ============ STRUCTURES (ANNUAIRE) ============
  getPublicStructures(): Observable<ApiResponse<Structure[]>> {
    return this.http.get<ApiResponse<Structure[]>>(`${this.API_URL}/structures/public`);
  }

  getStructuresByType(type: string): Observable<ApiResponse<Structure[]>> {
    return this.http.get<ApiResponse<Structure[]>>(`${this.API_URL}/structures/public/type/${type}`);
  }

  getAllStructures(page = 0, size = 10): Observable<ApiResponse<Page<Structure>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Structure>>>(`${this.API_URL}/structures`, { params });
  }

  createStructure(structure: Partial<Structure>): Observable<ApiResponse<Structure>> {
    return this.http.post<ApiResponse<Structure>>(`${this.API_URL}/structures`, structure);
  }

  updateStructure(id: string, structure: Partial<Structure>): Observable<ApiResponse<Structure>> {
    return this.http.put<ApiResponse<Structure>>(`${this.API_URL}/structures/${id}`, structure);
  }

  deleteStructure(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/structures/${id}`);
  }

  // ===================== Configuration Facebook =====================
  // Endpoints backend attendus (à exposer côté API, accès admin uniquement) :
  //   GET  /facebook-config        → config active (token masqué)
  //   PUT  /facebook-config        → créer / mettre à jour la config
  getFacebookConfig(): Observable<ApiResponse<FacebookConfig>> {
    return this.http.get<ApiResponse<FacebookConfig>>(`${this.API_URL}/facebook-config`);
  }

  saveFacebookConfig(config: FacebookConfig): Observable<ApiResponse<FacebookConfig>> {
    return this.http.put<ApiResponse<FacebookConfig>>(`${this.API_URL}/facebook-config`, config);
  }
}
