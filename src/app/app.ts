import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { TrackingService } from './core/services/tracking.service';
import { SeoService } from './core/services/seo.service';
import { ThemeService } from './core/services/theme.service';
import { NotificationComponent } from './shared/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationComponent],
  template: '<router-outlet /><app-notification />'
})
export class App implements OnInit {
  private tracking = inject(TrackingService);
  private seo = inject(SeoService);
  private theme = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Neutralise un éventuel mode sombre laissé par l'ancien sélecteur de thème
    // (classe posée sur <html> + état persisté). Le site est en clair partout.
    try {
      document.documentElement.classList.remove('p-dark', 'dark', 'app-dark');
      localStorage.removeItem('themeSwitcherState');
    } catch { /* SSR / stockage indisponible : rien à faire */ }

    this.tracking.init();
    this.seo.setOrganization();
    this.theme.loadAndApply();

    // SEO par route : lit `data.seo` de la route la plus profonde à chaque navigation.
    // Les pages de détail (article, projet, événement, agenda) écrasent ces valeurs
    // avec leurs propres métadonnées après chargement des données.
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let r = this.route.firstChild;
        while (r?.firstChild) r = r.firstChild;
        return r?.snapshot.data?.['seo'] ?? null;
      })
    ).subscribe((seo: any) => {
      const path = this.router.url.split('?')[0];
      // Les espaces privés (admin, authentification) ne doivent jamais être indexés.
      const privateZone = path.startsWith('/admin') || path.startsWith('/auth');
      this.seo.update({
        title: seo?.title ?? (privateZone ? 'Administration' : undefined),
        description: seo?.description,
        keywords: seo?.keywords,
        url: path,
        type: seo?.type,
        noindex: seo?.noindex ?? privateZone,
      });
    });
  }
}
