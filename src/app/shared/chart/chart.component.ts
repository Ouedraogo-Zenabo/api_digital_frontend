import {
  Component, ElementRef, Input, OnChanges, OnDestroy, AfterViewInit, ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * Petit wrapper réutilisable autour de Chart.js.
 * Usage : <app-chart [type]="'line'" [data]="data" [options]="options"></app-chart>
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: '<canvas #canvas></canvas>',
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() type: ChartType = 'line';
  @Input() data!: ChartConfiguration['data'];
  @Input() options: ChartConfiguration['options'] = {};

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    if (this.chart) this.render();
  }

  private render(): void {
    if (!this.canvas) return;
    this.chart?.destroy();
    this.chart = new Chart(this.canvas.nativeElement, {
      type: this.type,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...this.options,
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
