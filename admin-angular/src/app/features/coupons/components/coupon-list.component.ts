import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Coupon } from '../../../core/catalogs/catalogs.models';

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coupon-list.component.html'
})
export class CouponListComponent {
  @Input({ required: true }) coupons: Coupon[] = [];
  @Input() loading = false;

  @Output() createRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<Coupon>();
  @Output() deleteRequested = new EventEmitter<Coupon>();

  trackById(_index: number, item: Coupon): string {
    return item.id;
  }

  formatBenefit(coupon: Coupon): string {
    if (coupon.benefitType.toLowerCase() === 'percentage') {
      return `${coupon.benefitValue}%`;
    }

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(coupon.benefitValue);
  }
}
