import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModerationService } from '../../../core/services/moderation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModerationItem } from '../../../core/models';

/**
 * File de validation : tous les contenus soumis par les modérateurs.
 * Un admin peut les valider (→ publication) ou les refuser (motif obligatoire,
 * renvoyés au modérateur en brouillon).
 */
@Component({
  selector: 'app-admin-validation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="max-w-5xl mx-auto space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Validation des contenus</h1>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">
        Tout ce qu'un <b>modérateur</b> crée ou modifie reste hors ligne jusqu'à votre validation.
      </p>
    </div>

    @if (loading()) {
      <div class="space-y-3">
        @for (i of [1,2,3]; track i) { <div class="h-16 rounded-xl bg-white border border-slate-100 animate-pulse"></div> }
      </div>
    } @else if (items().length === 0) {
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-16 text-center">
        <div class="w-12 h-12 mx-auto rounded-xl bg-[#E6F5EB] text-[#00843B] flex items-center justify-center mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <p class="text-slate-500 font-medium">Rien à valider pour le moment.</p>
      </div>
    } @else {
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        @for (it of items(); track it.id) {
          <div class="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase tracking-wide">{{ it.typeLabel }}</span>
                @if (it.status === 'REJECTED') {
                  <span class="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-semibold">Refusé — à corriger</span>
                } @else {
                  <span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold">En attente</span>
                }
              </div>
              <p class="font-semibold text-slate-800 truncate mt-1">{{ it.title || '(sans titre)' }}</p>
              <p class="text-xs text-slate-400 mt-0.5">
                Soumis par <b class="text-slate-500">{{ it.submittedByName }}</b>
                <span *ngIf="it.submittedAt"> · {{ it.submittedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </p>
              @if (it.status === 'REJECTED' && it.reviewNote) {
                <p class="text-xs text-red-600 mt-1">Motif du refus : {{ it.reviewNote }}</p>
              }
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <a *ngIf="routeFor(it.type) as r" [routerLink]="r"
                 class="px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100">Voir</a>
              <button (click)="reject(it)" [disabled]="busy()"
                      class="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">Refuser</button>
              <button (click)="approve(it)" [disabled]="busy()"
                      class="px-3 py-1.5 text-sm font-medium text-white bg-[#00843B] rounded-lg hover:bg-[#0a6e35] disabled:opacity-50">Valider</button>
            </div>
          </div>
        }
      </div>
    }
  </div>

  <!-- Modale de refus -->
  @if (rejecting(); as it) {
    <div class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" (click)="rejecting.set(null)">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-semibold text-slate-800">Refuser « {{ it.title }} »</h3>
        <p class="text-sm text-slate-500">Le contenu repasse en brouillon. Le modérateur verra ce motif.</p>
        <textarea [(ngModel)]="note" rows="3" placeholder="Motif du refus (obligatoire)…"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"></textarea>
        <div class="flex justify-end gap-3">
          <button (click)="rejecting.set(null)" class="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100">Annuler</button>
          <button (click)="confirmReject()" [disabled]="!note.trim() || busy()"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">Refuser</button>
        </div>
      </div>
    </div>
  }
  `,
})
export class ValidationComponent implements OnInit {
  private moderation = inject(ModerationService);
  private notify = inject(NotificationService);

  items = signal<ModerationItem[]>([]);
  loading = signal(true);
  busy = signal(false);
  rejecting = signal<ModerationItem | null>(null);
  note = '';

  private readonly ROUTES: Record<string, string> = {
    ARTICLE: '/admin/articles', DOCUMENT: '/admin/documents', AGENDA: '/admin/agendas',
    EVENT: '/admin/evenements', MEDIA: '/admin/mediatheque', ALBUM: '/admin/mediatheque',
    CONSEIL: '/admin/conseils', BANNER: '/admin/banners', FLASH_INFO: '/admin/flash-infos',
    FAQ: '/admin/parametres', ESERVICE: '/admin/services', PAGE: '/admin/pages',
  };
  routeFor(type: string): string | null { return this.ROUTES[type] ?? null; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.moderation.getPending().subscribe({
      next: d => { this.items.set(d); this.loading.set(false); this.moderation.refreshCount(); },
      error: () => this.loading.set(false),
    });
  }

  approve(it: ModerationItem): void {
    this.busy.set(true);
    this.moderation.approve(it.id).subscribe({
      next: () => { this.busy.set(false); this.notify.success(`« ${it.title} » validé et publié.`); this.load(); },
      error: () => { this.busy.set(false); },
    });
  }

  reject(it: ModerationItem): void { this.note = ''; this.rejecting.set(it); }

  confirmReject(): void {
    const it = this.rejecting();
    if (!it || !this.note.trim()) return;
    this.busy.set(true);
    this.moderation.reject(it.id, this.note.trim()).subscribe({
      next: () => { this.busy.set(false); this.rejecting.set(null); this.notify.success(`« ${it.title} » refusé, renvoyé au modérateur.`); this.load(); },
      error: () => { this.busy.set(false); },
    });
  }
}
