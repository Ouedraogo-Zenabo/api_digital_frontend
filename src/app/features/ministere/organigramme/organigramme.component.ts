import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Organigramme, Ministere } from '../../../core/models/event.model';
import { MinistereService } from '../../../core/services/ministere.service';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

/** Nœud de l'arbre : un poste + ses subordonnés. */
interface OrgNode extends Organigramme {
  children: OrgNode[];
  collapsed?: boolean;
}

@Component({
  selector: 'app-organigramme',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organigramme.component.html',
  styleUrls: ['./organigramme.component.scss']
})
export class OrganigrammeComponent {
  private readonly API_URL = environment.FileUrl;

  loading = signal(true);
  organigrammes = signal<Organigramme[]>([]);

  /** Racines de l'arbre (postes sans parent). */
  roots = signal<OrgNode[]>([]);
  total = computed(() => this.organigrammes().length);

  /** Nœud sélectionné : ouvre le panneau de détails complet. */
  selected = signal<OrgNode | null>(null);

  /** Ministère courant : sert à afficher le texte de présentation du ministère. */
  ministere = signal<Ministere | null>(null);

  constructor(private apiService: MinistereService, private minService: ApiService) {}

  ngOnInit(): void {
    this.loadOrgas();
    this.loadMinistere();
  }

  /** Charge le premier ministère pour récupérer son texte de présentation. */
  loadMinistere(): void {
    this.minService.getAllMins(0, 1).subscribe({
      next: (response) => {
        const list = (response.data as any)?.content ?? [];
        if (list.length > 0) {
          this.minService.getminById(list[0].id).subscribe({
            next: (res) => { if (res.success) this.ministere.set(res.data); }
          });
        }
      },
      error: (err) => console.error(err)
    });
  }

  /** Convertit un texte brut (sauts de ligne) en paragraphes HTML ; laisse tel quel si déjà du HTML. */
  formatContent(content: string): string {
    if (!content) return '';
    if (/<[a-z][\s\S]*>/i.test(content)) return content; // déjà du HTML (éditeur riche)
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return normalized.split(/\n+/).map(p => `<p>${p.trim()}</p>`).join('');
  }

  loadOrgas(): void {
    this.loading.set(true);
    this.apiService.getAllOrgPub().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data: Organigramme[] = (response.data as any).content ?? response.data;
          const active = data.filter(o => o.isActive !== false);
          this.organigrammes.set(active);
          this.roots.set(this.buildTree(active));
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  private sortNodes = (a: OrgNode, b: OrgNode) =>
    (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
    (a.name || '').localeCompare(b.name || '', 'fr');

  /** Construit l'arbre : priorité au parentId, repli sur le niveau si aucun lien parent. */
  private buildTree(items: Organigramme[]): OrgNode[] {
    if (!items.length) return [];

    const byId = new Map<string, OrgNode>();
    items.forEach(i => byId.set(i.id, { ...i, children: [], collapsed: false }));

    const roots: OrgNode[] = [];
    byId.forEach(node => {
      const pid = node.parentId;
      const parent = pid != null && pid !== "" ? byId.get(pid) : undefined;
      if (parent && parent !== node) parent.children.push(node);
      else roots.push(node);
    });

    // Aucun lien parent renseigné → on dérive la hiérarchie depuis le niveau.
    const hasRealParents = roots.length < items.length;
    if (!hasRealParents) {
      return this.buildFromNiveau(items);
    }

    const sortRec = (nodes: OrgNode[]) => { nodes.sort(this.sortNodes); nodes.forEach(n => sortRec(n.children)); };
    sortRec(roots);
    return roots;
  }

  /**
   * Hiérarchie approximative à partir du champ niveau (Niveau 1, 2, 3),
   * sous une racine « ministère » synthétique. Les directions (niveau ≥ 2)
   * sont rattachées au Secrétariat Général s'il existe.
   */
  private buildFromNiveau(items: Organigramme[]): OrgNode[] {
    const nodes: OrgNode[] = items.map(i => ({ ...i, children: [], collapsed: false }));
    const levelOf = (o: OrgNode) => parseInt((o.niveau || '').replace(/\D/g, ''), 10) || 999;

    const byLevel = new Map<number, OrgNode[]>();
    nodes.forEach(n => {
      const l = levelOf(n);
      if (!byLevel.has(l)) byLevel.set(l, []);
      byLevel.get(l)!.push(n);
    });
    byLevel.forEach(g => g.sort(this.sortNodes));
    const levels = [...byLevel.keys()].sort((a, b) => a - b);

    const root: OrgNode = {
      id: -1,
      name: items[0]?.ministereName || 'Ministère',
      title: '', acronym: '', parentId: "", photo: '',
      children: [], collapsed: false,
    } as unknown as OrgNode;

    const level1 = byLevel.get(levels[0]) ?? [];
    // Coordinateur des directions : le Secrétariat Général si présent, sinon le 1er nœud du niveau 1.
    const coordinator = level1.find(p => /\bsg\b|secr[ée]tariat/i.test(`${p.acronym || ''} ${p.name || ''}`)) || level1[0];

    levels.forEach((lvl, idx) => {
      const group = byLevel.get(lvl)!;
      if (idx === 0) root.children.push(...group);          // niveau 1 sous le ministère
      else if (coordinator) coordinator.children.push(...group); // niveaux suivants sous le SG
      else root.children.push(...group);
    });

    return [root];
  }

  toggle(node: OrgNode): void {
    if (node.children.length) {
      node.collapsed = !node.collapsed;
      this.roots.set([...this.roots()]);
    }
  }

  /** Ouvre le panneau de détails de la structure/organisation. */
  openDetails(node: OrgNode): void {
    if (String(node.id) === '-1') return; // racine synthétique « Ministère » : pas de fiche
    this.selected.set(node);
  }

  closeDetails(): void {
    this.selected.set(null);
  }

  /** Tout déplier / replier. */
  private setCollapsedAll(value: boolean): void {
    const walk = (nodes: OrgNode[]) => nodes.forEach(n => { n.collapsed = value; walk(n.children); });
    walk(this.roots());
    this.roots.set([...this.roots()]);
  }
  expandAll(): void { this.setCollapsedAll(false); }
  collapseAll(): void { this.setCollapsedAll(true); }

  initials(node: OrgNode): string {
    const src = (node.name || node.acronym || '?').trim();
    const parts = src.split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  }

  getImageUrl(path?: string): string | null {
    return path ? this.API_URL + path : null;
  }
}
