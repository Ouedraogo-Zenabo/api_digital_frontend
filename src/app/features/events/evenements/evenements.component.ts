import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Events } from '../../../core/models/event.model';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-evenements',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './evenements.component.html',
  styleUrls: ['./evenements.component.scss']
})
export class EvenementsComponent {

  events = signal<Events[]>([]);
  filteredEvents = signal<Events[]>([]);
  loading = signal(true);
  selectedStatus = 'all';

    currentPage = signal(0);
  totalPages = signal(0);
  pageSize = 4;
  searchQuery = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadEvents();
  }



  loadEvents() {
    this.loading.set(true);
    this.apiService.getPublicEvents().subscribe({
      next: (response) => {
        console.log(response);
        
          const eventsList = response.content || [];
          this.events.set(eventsList);
          this.filteredEvents.set(eventsList);
           //this.totalPages.set(response.totalPages);
        
        this.loading.set(false);
      },
      error: () => {
        // Données de démonstration
       
        this.loading.set(false);
      }
    });
  }





  




  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onSearch(value: string) {
    this.searchQuery = value;
    this.applyFilters();
  }

  /** Filtre combiné : statut (champ enum `status`) + recherche texte. */
  applyFilters() {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredEvents.set(
      this.events().filter(e => {
        const matchStatus = this.selectedStatus === 'all' || e.status === this.selectedStatus;
        const matchSearch = !q
          || (e.title || '').toLowerCase().includes(q)
          || this.stripHtml(e.description).toLowerCase().includes(q)
          || (e.location || '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
      })
    );
  }

  resetFilters() {
    this.selectedStatus = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  /** Compteur par statut pour les badges des onglets. */
  countByStatus(status: string): number {
    if (status === 'all') return this.events().length;
    return this.events().filter(e => e.status === status).length;
  }

  getDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString().padStart(2, '0');
  }

  getMonth(dateStr: string): string {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months[new Date(dateStr).getMonth()];
  }

  getYear(dateStr: string): string {
    return new Date(dateStr).getFullYear().toString();
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

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

   formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  // ===================== Décompte (J-) =====================

  /** Nombre de jours entiers avant le début de l'événement (négatif si déjà passé). */
  daysUntil(dateStr?: string): number {
    if (!dateStr) return NaN;
    const start = new Date(dateStr); start.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((start.getTime() - today.getTime()) / 86400000);
  }

  /** Un décompte n'est pertinent que pour un événement non terminé / non annulé. */
  showCountdown(e: Events): boolean {
    if (!e?.startDate || e.status === 'CANCELLED' || e.status === 'COMPLETED') return false;
    const d = this.daysUntil(e.startDate);
    if (isNaN(d)) return false;
    if (d >= 0) return true;
    // Début passé : encore « en cours » si la date de fin est dans le futur.
    const end = this.daysUntil(e.endDate);
    return !isNaN(end) && end >= 0;
  }

  /** Libellé du décompte : « J-5 », « Jour J » ou « En cours ». */
  countdownLabel(e: Events): string {
    const d = this.daysUntil(e.startDate);
    if (isNaN(d)) return '';
    if (d > 0) return `J-${d}`;
    if (d === 0) return 'Jour J';
    return 'En cours';
  }

  /** Couleur du badge selon l'imminence. */
  countdownClass(e: Events): string {
    const d = this.daysUntil(e.startDate);
    if (d === 0) return 'bg-[#E30613] text-white';                        // Jour J
    if (d > 0 && d <= 7) return 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'; // imminent
    if (d > 7) return 'bg-[#E6F5EB] text-[#00843B]';                      // à venir
    return 'bg-green-100 text-green-700';                                 // en cours
  }

  /** Retire les balises HTML pour l'aperçu du résumé/description. */
  stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

}
