import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CatalogService } from '../../../core/catalogs/catalogs.models';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './service-form.component.html'
})
export class ServiceFormComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) mode: FormMode = 'create';
  @Input() submitting = false;
  @Input() initialValue: CatalogService | null = null;

  @Output() cancelRequested = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<CatalogService>();

  readonly serviceForm = this.formBuilder.nonNullable.group({
    id: [''],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    price: [0, [Validators.required, Validators.min(0)]],
    uoM: ['', [Validators.required, Validators.maxLength(20)]],
    isActive: [true, [Validators.required]],
    icon: ['local_laundry_service', [Validators.required, Validators.maxLength(80)]],
    themeIcon: ['w-12 h-12 bg-soft-blue rounded-xl flex items-center justify-center text-mint-dark', [Validators.required]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] || changes['mode']) {
      this.hydrateForm();
    }
  }

  submit(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const value = this.serviceForm.getRawValue();
    this.saveRequested.emit({
      ...value,
      price: Number(value.price)
    });
  }

  focusNameInput(): void {
    const input = this.nameInput?.nativeElement;
    if (!input) {
      return;
    }
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
  }

  private hydrateForm(): void {
    if (this.initialValue) {
      this.serviceForm.reset(this.initialValue);
      return;
    }

    this.serviceForm.reset({
      id: '',
      name: '',
      description: '',
      price: 0,
      uoM: 'KG',
      isActive: true,
      icon: 'local_laundry_service',
      themeIcon: 'w-12 h-12 bg-soft-blue rounded-xl flex items-center justify-center text-mint-dark'
    });
  }
}
