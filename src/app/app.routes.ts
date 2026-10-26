import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes with layout
  {
    path: '',
    loadComponent: () => import('./layouts/public/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/home/home/home.component').then(m => m.HomeComponent),
        data: { seo: { title: 'Accueil', description: "Site officiel du Ministère de la Transition Digitale, des Postes et des Communications Électroniques, des Postes et des Communications Électroniques du Burkina Faso. Actualités, projets numériques, services en ligne et communiqués.", keywords: 'MTDPCE, transition digitale, Burkina Faso, numérique, gouvernement, e-services, postes, communications électroniques' } } },
      { path: 'recherche', loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
        data: { seo: { title: 'Recherche', description: 'Recherchez parmi les actualités, projets, documents et événements du ministère.', noindex: true } } },
      { path: 'actualites', loadComponent: () => import('./features/articles/articles/articles.component').then(m => m.ArticlesComponent),
        data: { seo: { title: 'Actualités', description: "Toutes les actualités, communiqués et événements du Ministère de la Transition Digitale, des Postes et des Communications Électroniques du Burkina Faso.", keywords: 'actualités, communiqués, numérique, Burkina Faso, MTDPCE' } } },
      { path: 'actualites/:id', loadComponent: () => import('./features/articles/detail-articles/detail-articles.component').then(m => m.DetailArticlesComponent) },
      { path: 'projets', loadComponent: () => import('./features/projects/projets/projets.component').then(m => m.ProjetsComponent),
        data: { seo: { title: 'Grands Chantiers', description: "Les projets et programmes du ministère pour la transformation digitale du Burkina Faso : fibre optique, e-services, datacenter, formation.", keywords: 'projets, grands chantiers, transformation digitale, fibre optique, e-services, Burkina Faso' } } },
      { path: 'projets/:id', loadComponent: () => import('./features/projects/detail-projets/detail-projets.component').then(m => m.DetailProjetsComponent) },
      { path: 'ressources', loadComponent: () => import('./features/documents/ressources-hub/ressources-hub.component').then(m => m.RessourcesHubComponent),
        data: { seo: { title: 'Ressources', description: "Textes réglementaires, stratégies, politiques publiques et foire aux questions du ministère.", keywords: 'ressources, règlementation, stratégie, politiques, FAQ, MTDPCE' } } },
      { path: 'ressources/documents', loadComponent: () => import('./features/documents/documents/documents.component').then(m => m.DocumentsComponent),
        data: { seo: { title: 'Règlementation', description: "Textes réglementaires, décrets, arrêtés et documents officiels du ministère.", keywords: 'règlementation, décret, arrêté, documents officiels, Burkina Faso' } } },
      { path: 'ressources/politiques', loadComponent: () => import('./features/documents/politiques/politiques.component').then(m => m.PolitiquesComponent),
        data: { seo: { title: 'Stratégie & Politiques', description: "Stratégies nationales et documents de politique publique de la transformation digitale.", keywords: 'stratégie, politique numérique, transformation digitale, Burkina Faso' } } },
      { path: 'contact', loadComponent: () => import('./features/contact/contact/contact.component').then(m => m.ContactComponent),
        data: { seo: { title: 'Contactez-nous', description: "Contactez le Ministère de la Transition Digitale, des Postes et des Communications Électroniques : adresse, téléphone, email et formulaire de contact.", keywords: 'contact, MTDPCE, ministère, Ouagadougou, Burkina Faso' } } },
      { path: 'mediatheque', loadComponent: () => import('./features/mediatheque/mediatheque.component').then(m => m.MediathequeComponent),
        data: { seo: { title: 'Médiathèque', description: "Photos, vidéos et documents officiels du ministère : couvrez les événements et réalisations en images.", keywords: 'médiathèque, photos, vidéos, documents, galerie, MTDPCE' } } },
      { path: 'ministere', loadComponent: () => import('./features/ministere/ministere-hub/ministere-hub.component').then(m => m.MinistereHubComponent),
        data: { seo: { title: 'Le Ministère', description: "Organisation, missions, structures rattachées et anciens ministres du Ministère de la Transition Digitale, des Postes et des Communications Électroniques.", keywords: 'ministère, organisation, missions, structures, MTDPCE, Burkina Faso' } } },
      { path: 'ministere/ministre', loadComponent: () => import('./features/ministere/ministre/ministre.component').then(m => m.MinistreComponent),
        data: { seo: { title: 'Le Ministre', description: "Présentation du Ministre de la Transition Digitale, des Postes et des Communications Électroniques.", keywords: 'ministre, MTDPCE, biographie, Burkina Faso' } } },
      { path: 'ministere/anciens-ministres', loadComponent: () => import('./features/ministere/anciens-ministres/anciens-ministres.component').then(m => m.AnciensMinistresComponent),
        data: { seo: { title: 'Anciens Ministres', description: "Les Anciens Ministres de la Transition Digitale, des Postes et des Communications Électroniques et la période de leur mandat.", keywords: 'Anciens Ministres, mandats, historique, MTDPCE, Burkina Faso' } } },
      { path: 'ministere/missions', loadComponent: () => import('./features/ministere/mission/mission.component').then(m => m.MissionComponent),
        data: { seo: { title: 'Missions & Attributions', description: "Missions et attributions du Ministère de la Transition Digitale, des Postes et des Communications Électroniques du Burkina Faso.", keywords: 'missions, attributions, ministère, numérique, Burkina Faso' } } },
      { path: 'ministere/organigramme', loadComponent: () => import('./features/ministere/organigramme/organigramme.component').then(m => m.OrganigrammeComponent),
        data: { seo: { title: 'Organigramme', description: "Structure et organigramme hiérarchique du ministère et de ses directions.", keywords: 'organigramme, structure, directions, ministère, MTDPCE' } } },
      { path: 'ministere/structures', loadComponent: () => import('./features/ministere/structurerattaches/structurerattaches.component').then(m => m.StructurerattachesComponent),
        data: { seo: { title: 'Structures rattachées', description: "Les structures et organismes rattachés au ministère.", keywords: 'structures rattachées, organismes, ministère, Burkina Faso' } } },
      { path: 'faq', loadComponent: () => import('./features/faq/faq.component').then(m => m.FAQComponent),
        data: { seo: { title: 'Foire aux questions', description: "Réponses aux questions fréquentes sur les services et démarches du ministère.", keywords: 'FAQ, questions, aide, démarches, services, MTDPCE' } } },
      { path: 'services', loadComponent: () => import('./features/services/service/service.component').then(m => m.ServiceComponent),
        data: { seo: { title: 'Services publics', description: "Les services publics et e-services proposés par le ministère aux citoyens et entreprises.", keywords: 'services publics, e-services, démarches en ligne, numérique, Burkina Faso' } } },
      { path: 'evenements', loadComponent: () => import('./features/events/evenements/evenements.component').then(m => m.EvenementsComponent),
        data: { seo: { title: 'Agenda des événements', description: "Les événements organisés par le ministère : forums, ateliers, salons et conférences du numérique.", keywords: 'événements, agenda, forum, atelier, salon, numérique, Burkina Faso' } } },
      { path: 'evenements/:id', loadComponent: () => import('./features/events/detail-event/detail-event.component').then(m => m.DetailEventComponent) },
      { path: 'agendas', loadComponent: () => import('./features/agendas/agendas.component').then(m => m.AgendasComponent),
        data: { seo: { title: 'Agenda', description: "Les rendez-vous et agendas officiels du Ministère de la Transition Digitale, des Postes et des Communications Électroniques.", keywords: 'agenda, rendez-vous, ministère, MTDPCE' } } },
      { path: 'agendas/:id', loadComponent: () => import('./features/agendas/detail-agenda/detail-agenda.component').then(m => m.DetailAgendaComponent) },
     { path: 'communiques', loadComponent: () => import('./features/communiques/communiques.component').then(m => m.CommuniquesComponent),
        data: { seo: { title: 'Communiqués', description: "Les communiqués officiels du Ministère de la Transition Digitale, des Postes et des Communications Électroniques du Burkina Faso.", keywords: 'communiqués, presse, officiel, MTDPCE, Burkina Faso' } } },

      // Redirections pour compatibilité
      { path: 'articles', redirectTo: 'actualites', pathMatch: 'full' },

      { path: 'articles/:id', redirectTo: 'actualites/:id', pathMatch: 'full' },
      { path: 'projects', redirectTo: 'projets', pathMatch: 'full' },
      { path: 'projects/:id', redirectTo: 'projets/:id', pathMatch: 'full' },
      { path: 'documents', redirectTo: 'ressources/documents', pathMatch: 'full' },
       { path: 'politiques', redirectTo: 'ressources/politiques', pathMatch: 'full' },
       { path: 'services', redirectTo: 'services', pathMatch: 'full' },

    ]
  },

  // Auth routes (no layout)
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent)
  },

  // Admin routes
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashbord/dashbord.component').then(m => m.DashbordComponent) },
      { path: 'profile', loadComponent: () => import('./features/admin/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'articlest', loadComponent: () => import('./features/admin/articles/admin-articles.component').then(m => m.AdminArticlesComponent) },
      { path: 'project', loadComponent: () => import('./features/admin/projects/admin-projects.component').then(m => m.AdminProjectsComponent) },
      { path: 'projects', loadComponent: () => import('./features/admin/projet/projet.component').then(m => m.ProjetComponent) },
      { path: 'documentst', loadComponent: () => import('./features/admin/documents/admin-documents.component').then(m => m.AdminDocumentsComponent) },
      { path: 'contacts', loadComponent: () => import('./features/admin/contacts/contacts/contacts.component').then(m => m.ContactsComponent) },
      { path: 'mediatheque', loadComponent: () => import('./features/admin/mediatheque/mediatheque.component').then(m => m.MediathequeComponent) },
      { path: 'validation', loadComponent: () => import('./features/admin/validation/validation.component').then(m => m.ValidationComponent) },
      { path: 'historique', loadComponent: () => import('./features/admin/historique/historique.component').then(m => m.HistoriqueComponent) },
      { path: 'facebook', loadComponent: () => import('./features/admin/facebook/facebook-config.component').then(m => m.FacebookConfigComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/users/users.component').then(m => m.UsersComponent) },
      { path: 'articles', loadComponent: () => import('./features/admin/article/article.component').then(m => m.ArticleComponent) },
      { path: 'communiques', loadComponent: () => import('./features/admin/communiques/communiques.component').then(m => m.CommuniquesComponent) },
      { path: 'document-accueil', loadComponent: () => import('./features/admin/home-doc/home-doc.component').then(m => m.HomeDocComponent) },
      { path: 'agrement-tic', loadComponent: () => import('./features/admin/agrement-list/agrement-list.component').then(m => m.AgrementListComponent) },
      { path: 'Articles/:id', loadComponent: () => import('./features/admin/article/detail-article/detail-article.component').then(m => m.DetailArticleComponent) },
      { path: 'documents', loadComponent: () => import('./features/admin/documents/documents/documents.component').then(m => m.DocumentsComponent) },
      { path: 'parametres', loadComponent: () => import('./features/admin/parametres/parametres.component').then(m => m.ParametresComponent) },
      { path: 'types', loadComponent: () => import('./features/admin/types/types.component').then(m => m.TypesComponent) },
      { path: 'types-projets', loadComponent: () => import('./features/admin/projet/types/types.component').then(m => m.TypesComponent) },
     { path: 'agendas', loadComponent: () => import('./features/admin/article/agenda/agenda.component').then(m => m.AgendaComponent) },
     { path: 'services', loadComponent: () => import('./features/admin/services/services.component').then(m => m.ServicesComponent) },
     { path: 'banners', loadComponent: () => import('./features/admin/banners/banners.component').then(m => m.BannersComponent) },
     { path: 'conseils', loadComponent: () => import('./features/admin/conseils/conseils.component').then(m => m.ConseilsComponent) },
     { path: 'themes', loadComponent: () => import('./features/admin/themes/themes.component').then(m => m.ThemesComponent) },
     { path: 'flash-infos', loadComponent: () => import('./features/admin/flash-infos/flash-infos.component').then(m => m.FlashInfosComponent) },
     { path: 'evenements', loadComponent: () => import('./features/admin/evenements/evenements.component').then(m => m.EvenementsComponent) },
     { path: 'ministère', loadComponent: () => import('./features/admin/ministere/ministere.component').then(m => m.MinistereComponent) },
     { path: 'ministere-gestion', loadComponent: () => import('./features/admin/ministere/management/management.component').then(m => m.ManagementComponent) },
     { path: 'ministere-gestion/ministere/:id', loadComponent: () => import('./features/admin/ministere/management/ministere-form/ministere-form.component').then(m => m.MinistereFormComponent) },
     { path: 'ministere-gestion/ministre/:id', loadComponent: () => import('./features/admin/ministere/management/ministre-form/ministre-form.component').then(m => m.MinistreFormComponent) },
     { path: 'organigramme', loadComponent: () => import('./features/admin/organigramme/organigramme.component').then(m => m.OrganigrammeComponent) },
     { path: 'missions', loadComponent: () => import('./features/admin/mission/mission.component').then(m => m.MissionComponent) },
     { path: 'domains', loadComponent: () => import('./features/admin/domains/domains.component').then(m => m.DomainsComponent) },
     { path: 'ministre', loadComponent: () => import('./features/admin/ministere/ministre/ministre.component').then(m => m.MinistreComponent) },
     { path: 'etats', loadComponent: () => import('./features/admin/ministere/etats/etats.component').then(m => m.EtatsComponent) },

     { path: 'structures', loadComponent: () => import('./features/admin/structure-rattaches/structure-rattaches.component').then(m => m.StructureRattachesComponent) },

    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
