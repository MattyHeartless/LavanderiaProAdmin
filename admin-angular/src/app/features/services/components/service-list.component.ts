import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { CatalogService } from '../../../core/catalogs/catalogs.models';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './service-list.component.html'
})
export class ServiceListComponent {
  @Input({ required: true }) services: CatalogService[] = [];
  @Input() loading = false;

  @Output() createRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<CatalogService>();
  @Output() deleteRequested = new EventEmitter<CatalogService>();

  trackById(_index: number, item: CatalogService): string {
    return item.id;
  }

  resolveThemeIcon(themeIcon: string): string {
    const normalized = themeIcon.trim();
    if (normalized.length > 0) {
      return normalized;
    }

    return 'w-12 h-12 bg-soft-blue rounded-xl flex items-center justify-center text-mint-dark';
  }
}
