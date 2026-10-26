import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ModerationService } from '../../core/services/moderation.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;       // SVG path "d"
  exact?: boolean;
  badge?: 'moderation';
}

interface NavGroup {
  title?: string;
  adminOnly?: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div class="flex items-center justify-between h-16 px-4 lg:px-6">
          <!-- Left: Toggles & Logo -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Hamburger (mobile) -->
            <button (click)="sidebarOpen.set(!sidebarOpen())" class="p-2 rounded-lg hover:bg-slate-100 lg:hidden transition-colors" aria-label="Menu">
              <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <!-- Collapse (desktop) -->
            <button (click)="collapsed.set(!collapsed())" class="p-2 rounded-lg hover:bg-slate-100 hidden lg:block transition-colors" [title]="collapsed() ? 'Agrandir le menu' : 'Réduire le menu'" aria-label="Réduire le menu">
              <svg class="w-6 h-6 text-slate-600 transition-transform duration-300" [class.rotate-180]="collapsed()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"></path>
              </svg>
            </button>

            <a routerLink="/admin" class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden">
                <img loading="lazy" src="assets/images/armoirie.png" alt="Logo" class="w-full h-full object-contain">
              </div>
              <span class="font-semibold text-slate-800 hidden sm:block">Administration</span>
            </a>
          </div>

          <!-- Right: User menu -->
          <div class="flex items-center gap-2 sm:gap-4">
            <a routerLink="/" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600 transition-all" title="Voir le site">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </a>

            <div class="relative">
              <button (click)="userMenuOpen.set(!userMenuOpen())" class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <div class="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span class="text-primary-600 font-semibold text-sm">
                    {{ authService.currentUser()?.firstName?.charAt(0) || 'U' }}
                  </span>
                </div>
                <span class="hidden sm:block text-sm font-medium text-slate-700">
                  {{ authService.currentUser()?.firstName || 'Utilisateur' }}
                </span>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              @if (userMenuOpen()) {
                <div class="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-soft border border-slate-100 py-1 z-50">
                  <a routerLink="/admin/profile" (click)="userMenuOpen.set(false)" class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Mon profil
                  </a>
                  <hr class="my-1 border-slate-100">
                  <button (click)="logout()" class="flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-slate-50 w-full">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Déconnexion
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </header>

      <div class="flex">
        <!-- Sidebar -->
        <aside
          class="fixed lg:sticky top-16 lg:top-16 inset-y-0 lg:inset-y-auto left-0 z-40 bg-white border-r border-slate-100 transform transition-all duration-300 lg:translate-x-0 lg:h-[calc(100vh-64px)] overflow-y-auto"
          [ngClass]="[
            collapsed() ? 'w-64 lg:w-20' : 'w-64',
            sidebarOpen() ? 'translate-x-0' : '-translate-x-full'
          ]"
          style="top: 64px;">
          <nav class="p-3 space-y-1">
            @for (group of menuGroups; track $index) {
              @if (!group.adminOnly || authService.isAdmin()) {
                <div class="pt-3 first:pt-1">
                  @if (group.title) {
                    <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5"
                       [class.lg:hidden]="collapsed()">{{ group.title }}</p>
                    <div class="hidden mx-3 mb-2 border-t border-slate-100" [class.lg:block]="collapsed()"></div>
                  }

                  @for (item of group.items; track item.route) {
                    <a [routerLink]="item.route"
                       routerLinkActive="bg-primary-50 text-primary-600 font-medium"
                       [routerLinkActiveOptions]="{ exact: !!item.exact }"
                       (click)="onNavClick()"
                       [attr.title]="collapsed() ? item.label : null"
                       class="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                       [class.lg:justify-center]="collapsed()">
                      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon"></path>
                      </svg>
                      <span class="truncate flex-1" [class.lg:hidden]="collapsed()">{{ item.label }}</span>
                      @if (item.badge === 'moderation' && moderation.pendingCount() > 0) {
                        <span class="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[11px] font-bold text-white bg-danger-500 rounded-full"
                              [class.lg:hidden]="collapsed()">{{ moderation.pendingCount() }}</span>
                      }
                    </a>
                  }
                </div>
              }
            }
          </nav>
        </aside>

        <!-- Overlay for mobile -->
        @if (sidebarOpen()) {
          <div (click)="sidebarOpen.set(false)" class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden" style="top: 64px;"></div>
        }

        <!-- Main content -->
        <main class="flex-1 min-w-0 p-4 lg:p-8 min-h-[calc(100vh-64px)]">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  sidebarOpen = signal(false);   // tiroir mobile
  collapsed = signal(false);     // mode réduit (icônes seules) sur desktop
  userMenuOpen = signal(false);

  // Chaque onglet possède une icône Heroicons distincte et représentative.
  menuGroups: NavGroup[] = [
    {
      items: [
        { label: 'Tableau de bord', route: '/admin/dashboard', exact: true,
          icon: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z' },
      ]
    },
    {
      title: 'Contenu',
      items: [
        { label: 'Articles', route: '/admin/articles',
          icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z' },
        { label: 'Communiqués', route: '/admin/communiques',
          icon: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46' },
        { label: 'Services Publics', route: '/admin/services',
          icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' },
        { label: 'Document officiel', route: '/admin/document-accueil',
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Entreprises agréées (TIC)', route: '/admin/agrement-tic',
          icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-4m-6 0H3m4 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { label: 'Bannières d\'accueil', route: '/admin/banners',
          icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
        { label: 'Conseils', route: '/admin/conseils',
          icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { label: 'Agendas', route: '/admin/agendas',
          icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
        { label: 'Projets', route: '/admin/projects',
          icon: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z' },
        { label: 'Documents', route: '/admin/documents',
          icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
        { label: 'Evènements', route: '/admin/evenements',
          icon: 'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z' },
      ]
    },
    {
      title: 'Communication',
      items: [
        { label: 'Messages', route: '/admin/contacts',
          icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
        { label: 'Flash Infos', route: '/admin/flash-infos',
          icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
        { label: 'Médiathèque', route: '/admin/mediatheque',
          icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
      ]
    },
    {
      title: 'Administration',
      adminOnly: true,
      items: [
        { label: 'Validation', route: '/admin/validation', badge: 'moderation',
          icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Utilisateurs', route: '/admin/users',
          icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
        { label: 'Catégories & Types', route: '/admin/parametres',
          icon: 'M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122' },
        { label: 'Historique', route: '/admin/historique',
          icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Intégration Facebook', route: '/admin/facebook',
          icon: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.988h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z' },
        { label: 'Thème du site', route: '/admin/themes',
          icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
      ]
    },
    {
      title: 'Ministère',
      adminOnly: true,
      items: [
        { label: 'Ministère & Ministre', route: '/admin/ministere-gestion',
          icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
        { label: 'Organigramme', route: '/admin/organigramme',
          icon: 'M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z' },
        { label: 'Domaines', route: '/admin/domains',
          icon: 'M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5' },
        { label: 'Structures Rattachées', route: '/admin/structures',
          icon: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z' },
        { label: 'Attributions', route: '/admin/missions',
          icon: 'M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5' },
        { label: 'Etats', route: '/admin/etats',
          icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
      ]
    },
  ];

  constructor(public authService: AuthService, public moderation: ModerationService) {}

  ngOnInit(): void {
    this.moderation.refreshCount();

    // Charge la feuille de style de l'éditeur (Quill) uniquement dans l'espace admin,
    // évitant ~30 kB de CSS inutile pour les visiteurs publics.
    const id = 'quill-editor-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'quill-editor.css';
      document.head.appendChild(link);
    }
  }

  // Ferme le tiroir mobile après navigation
  onNavClick(): void {
    if (window.innerWidth < 1024) {
      this.sidebarOpen.set(false);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1024) {
      this.sidebarOpen.set(false);
    }
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.authService.logout();
  }
}
