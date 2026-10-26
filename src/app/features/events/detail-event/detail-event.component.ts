import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Events } from '../../../core/models/event.model';
import { ApiService } from '../../../core/services/api.service';
import { SeoService } from '../../../core/services/seo.service';
import { environment } from '../../../../environments/environment';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-detail-event',
  standalone: true,
  imports: [SafeHtmlPipe, CommonModule, RouterModule],
  templateUrl: './detail-event.component.html',
  styleUrls: ['./detail-event.component.scss']
})
export class DetailEventComponent implements OnDestroy {
  private readonly API_URL = environment.FileUrl;
  private routeSub?: Subscription;

  event = signal<Events | null>(null);
  loading = signal(true);
  upcoming = signal<Events[]>([]);

  constructor(private route: ActivatedRoute, private api: ApiService, private seo: SeoService) {}

  ngOnInit(): void {
    // Recharge à chaque changement d'`id` (le composant est réutilisé lorsqu'on
    // clique sur un autre événement à venir depuis la barre latérale).
    this.routeSub = this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (id) {
        this.loading.set(true);
        this.event.set(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadEvent(id);
      }
    });
    this.loadUpcoming();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadEvent(id: string): void {
    this.loading.set(true);
    this.api.getEventById(id).subscribe({
      next: (res) => { if (res.success) { this.event.set(res.data); this.applySeo(res.data); } this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  /** SEO spécifique à l'événement (titre, description, image, JSON-LD Event, fil d'ariane). */
  private applySeo(e: Events): void {
    const desc = this.stripHtml(e.description || e.content).slice(0, 200);
    const img = this.getImageUrl(e.imageUrl) || undefined;
    const url = `/evenements/${e.id}`;
    this.seo.update({ title: e.title, description: desc, image: img, url, type: 'article' });
    this.seo.setBreadcrumb([
      { name: 'Accueil', url: '/' },
      { name: 'Événements', url: '/evenements' },
      { name: e.title, url },
    ]);
    this.seo.setJsonLd('event', {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: e.title,
      description: desc,
      image: img ? this.seo.absolute(img) : undefined,
      startDate: e.startDate,
      endDate: e.endDate,
      eventStatus: e.status === 'CANCELLED' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
      eventAttendanceMode: e.isOnline ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
      location: e.isOnline
        ? { '@type': 'VirtualLocation', url: e.onlineUrl }
        : { '@type': 'Place', name: e.location, address: e.address },
      organizer: { '@type': 'Organization', name: e.organizerName || this.seo.siteName },
    });
  }

  loadUpcoming(): void {
    this.api.getUpcomingEvents().subscribe({
      next: (res) => { if (res.success) this.upcoming.set((res.data ?? []).slice(0, 5)); },
      error: () => {},
    });
  }

  // ---- Helpers ----
  getStatusClass(status?: string): string {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-700';
      case 'ONGOING': return 'bg-green-100 text-green-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'UPCOMING': return 'À venir';
      case 'ONGOING': return 'En cours';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      default: return status ?? '';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatDateTime(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  getDay(dateStr?: string): string { return dateStr ? new Date(dateStr).getDate().toString().padStart(2, '0') : ''; }
  getMonth(dateStr?: string): string {
    return dateStr ? new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short' }) : '';
  }

  // ===================== Décompte (J-) =====================

  daysUntil(dateStr?: string): number {
    if (!dateStr) return NaN;
    const start = new Date(dateStr); start.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((start.getTime() - today.getTime()) / 86400000);
  }

  showCountdown(e: Events | null): boolean {
    if (!e?.startDate || e.status === 'CANCELLED' || e.status === 'COMPLETED') return false;
    const d = this.daysUntil(e.startDate);
    if (isNaN(d)) return false;
    if (d >= 0) return true;
    const end = this.daysUntil(e.endDate);
    return !isNaN(end) && end >= 0;
  }

  countdownLabel(e: Events | null): string {
    const d = this.daysUntil(e?.startDate);
    if (isNaN(d)) return '';
    if (d > 0) return `J-${d}`;
    if (d === 0) return 'Jour J';
    return 'En cours';
  }

  countdownClass(e: Events | null): string {
    const d = this.daysUntil(e?.startDate);
    if (d === 0) return 'bg-[#E30613] text-white';
    if (d > 0 && d <= 7) return 'bg-amber-100 text-amber-700 ring-1 ring-amber-300';
    if (d > 7) return 'bg-[#E6F5EB] text-[#00843B]';
    return 'bg-green-100 text-green-700';
  }

  /** Rendu d'un champ riche : HTML tel quel, sinon paragraphes (ancien texte brut). */
  formatContent(content?: string): string {
    if (!content) return '';
    if (/<[a-z][\s\S]*>/i.test(content)) return content;
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return content.split(/\n+/).map(p => `<p>${p.trim()}</p>`).join('');
  }

  stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  getImageUrl(path?: string): string | null {
    return path ? (/^(https?:|data:|blob:)/i.test(path) ? path : this.API_URL + path) : null;
  }
}
