import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { DashboardStats, AnalyticsOverview } from '../../../../core/models';
import { ApiService } from '../../../../core/services/api.service';
import { ChartComponent } from '../../../../shared/chart/chart.component';

@Component({
  selector: 'app-dashbord',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartComponent],
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.scss']
})
export class DashbordComponent {
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  analytics = signal<AnalyticsOverview | null>(null);
  analyticsLoading = signal(true);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadAnalytics();
  }

  loadStats(): void {
    this.apiService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success) this.stats.set(response.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadAnalytics(): void {
    this.apiService.getAnalyticsOverview().subscribe({
      next: (response) => {
        if (response.success) this.analytics.set(response.data);
        this.analyticsLoading.set(false);
      },
      error: () => this.analyticsLoading.set(false)
    });
  }

  /* ============ Graphiques ============ */

  // Courbe d'évolution (visiteurs + pages vues) sur 90 jours
  visitsLineData = computed<ChartConfiguration<'line'>['data']>(() => {
    const a = this.analytics();
    const series = a?.dailySeries ?? [];
    const labels = series.map(p => {
      const [, m, d] = p.date.split('-');
      return `${d}/${m}`;
    });
    return {
      labels,
      datasets: [
        {
          label: 'Visiteurs',
          data: series.map(p => p.visitors),
          borderColor: '#00843B',
          backgroundColor: 'rgba(0,132,59,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Pages vues',
          data: series.map(p => p.pageViews),
          borderColor: '#E74C3C',
          backgroundColor: 'rgba(231,76,60,0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };
  });

  lineOptions: ChartConfiguration<'line'>['options'] = {
    plugins: { legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 8 } } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12, autoSkip: true, font: { size: 10 } } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
    },
    interaction: { mode: 'index', intersect: false },
  };

  // Heures de pointe (barres 0-23h)
  hourlyBarData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const a = this.analytics();
    const hourly = a?.hourly ?? [];
    return {
      labels: hourly.map(h => `${h.hour}h`),
      datasets: [{
        label: 'Visites',
        data: hourly.map(h => h.count),
        backgroundColor: '#00843B',
        borderRadius: 4,
        maxBarThickness: 18,
      }],
    };
  });

  barOptions: ChartConfiguration<'bar'>['options'] = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 24 } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
    },
  };

  // Pic d'affluence (heure la plus active)
  peakHour = computed(() => {
    const hourly = this.analytics()?.hourly ?? [];
    if (!hourly.length) return null;
    return hourly.reduce((max, h) => (h.count > max.count ? h : max), hourly[0]);
  });

  // Barre relative pour les listes top pages/clics
  pct(count: number, list: { count: number }[]): number {
    const max = Math.max(1, ...list.map(i => i.count));
    return Math.round((count / max) * 100);
  }

  // Barre relative pour la liste des contenus les plus lus
  viewPct(views: number): number {
    const list = this.stats()?.topReadArticles ?? [];
    const max = Math.max(1, ...list.map(i => i.viewCount));
    return Math.round((views / max) * 100);
  }
}
