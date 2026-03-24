import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Coupon } from '../../../core/catalogs/catalogs.models';

type FormMode = 'create' | 'edit';

export interface CouponFormValue {
  id: string;
  code: string;
  name: string;
  description: string;
  benefitType: string;
  benefitValue: number;
  eventType: string;
  isActive: boolean;
  expiresAt: string;
  usageLimit: number;
}

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './coupon-form.component.html'
})
export class CouponFormComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  @ViewChild('codeInput') private codeInput?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) mode: FormMode = 'create';
  @Input() submitting = false;
  @Input() loadingInitialValue = false;
  @Input() initialValue: Coupon | null = null;

  @Output() cancelRequested = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<CouponFormValue>();

  readonly eventTypeOptions = [
    'first_order',
    'birthday',
    'referral',
    'reactivation',
    'seasonal_campaign'
  ];

  readonly couponForm = this.formBuilder.nonNullable.group({
    id: [''],
    code: ['', [Validators.required, Validators.maxLength(40)]],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    benefitType: ['percentage', [Validators.required, Validators.maxLength(40)]],
    benefitValue: [10, [Validators.required, Validators.min(0.01)]],
    eventType: ['first_order', [Validators.required]],
    isActive: [true, [Validators.required]],
    expiresAt: ['', [Validators.required]],
    usageLimit: [100, [Validators.required, Validators.min(1)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] || changes['mode']) {
      this.hydrateForm();
    }
  }

  submit(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    const value = this.couponForm.getRawValue();
    this.saveRequested.emit({
      ...value,
      code: value.code.trim().toUpperCase(),
      name: value.name.trim(),
      description: value.description.trim(),
      benefitType: value.benefitType.trim(),
      benefitValue: Number(value.benefitValue),
      expiresAt: this.toUtcIsoString(value.expiresAt),
      usageLimit: Number(value.usageLimit)
    });
  }

  focusPrimaryInput(): void {
    const input = this.codeInput?.nativeElement;
    if (!input) {
      return;
    }
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
  }

  private hydrateForm(): void {
    if (this.initialValue) {
      this.couponForm.reset({
        id: this.initialValue.id,
        code: this.initialValue.code,
        name: this.initialValue.name,
        description: this.initialValue.description ?? '',
        benefitType: this.initialValue.benefitType,
        benefitValue: this.initialValue.benefitValue,
        eventType: this.initialValue.eventType,
        isActive: this.initialValue.isActive,
        expiresAt: this.toLocalDateTimeInputValue(this.initialValue.expiresAt),
        usageLimit: this.initialValue.usageLimit
      });
      return;
    }

    this.couponForm.reset({
      id: '',
      code: '',
      name: '',
      description: '',
      benefitType: 'percentage',
      benefitValue: 10,
      eventType: 'first_order',
      isActive: true,
      expiresAt: this.toLocalDateTimeInputValue(this.getDefaultExpirationIso()),
      usageLimit: 100
    });
  }

  private getDefaultExpirationIso(): string {
    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 30);
    defaultExpiration.setHours(23, 59, 0, 0);
    return defaultExpiration.toISOString();
  }

  private toLocalDateTimeInputValue(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private toUtcIsoString(localDateTime: string): string {
    const date = new Date(localDateTime);
    if (Number.isNaN(date.getTime())) {
      return localDateTime;
    }

    return date.toISOString();
  }
}
