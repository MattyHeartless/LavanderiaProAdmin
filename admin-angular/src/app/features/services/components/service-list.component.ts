import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { CatalogService, ServicePricingOptionName } from '../../../core/catalogs/catalogs.models';

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

  readonly pricingOptionsModalService = signal<CatalogService | null>(null);

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

  activePricingOptions(service: CatalogService) {
    return service.pricingOptions.filter((option) => option.isActive);
  }

  pricingOptions(service: CatalogService) {
    return [...service.pricingOptions].sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }

      return left.optionName.localeCompare(right.optionName, 'es');
    });
  }

  primaryPricingOption(service: CatalogService) {
    return this.pricingOptions(service)[0] ?? null;
  }

  additionalPricingOptionsCount(service: CatalogService): number {
    return Math.max(this.pricingOptions(service).length - 1, 0);
  }

  openPricingOptionsModal(service: CatalogService): void {
    this.pricingOptionsModalService.set(service);
  }

  closePricingOptionsModal(): void {
    this.pricingOptionsModalService.set(null);
  }

  displayOptionName(optionName: ServicePricingOptionName): string {
    return optionName.replace('Bulto', 'Carga');
  }
}
