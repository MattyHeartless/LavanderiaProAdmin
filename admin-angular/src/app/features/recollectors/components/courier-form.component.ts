import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Courier } from '../../../core/catalogs/catalogs.models';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-courier-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './courier-form.component.html'
})
export class CourierFormComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) mode: FormMode = 'create';
  @Input() submitting = false;
  @Input() initialValue: Courier | null = null;

  @Output() cancelRequested = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<Courier>();

  readonly courierForm = this.formBuilder.nonNullable.group({
    id: [''],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    middleName: ['', [Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    vehicle: ['', [Validators.required, Validators.maxLength(80)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    neighborhood: ['', [Validators.required, Validators.maxLength(120)]],
    zipCode: ['', [Validators.required, Validators.maxLength(12)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    phoneNumber: ['', [Validators.required, Validators.maxLength(20)]],
    authUserId: [''],
    isActive: [true, [Validators.required]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] || changes['mode']) {
      this.hydrateForm();
    }
  }

  submit(): void {
    if (this.courierForm.invalid) {
      this.courierForm.markAllAsTouched();
      return;
    }

    this.saveRequested.emit(this.courierForm.getRawValue());
  }

  focusNameInput(): void {
    const input = this.nameInput?.nativeElement;
    if (!input) {
      return;
    }
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
  }

  resetForCreate(): void {
    this.initialValue = null;
    this.hydrateForm();
  }

  private hydrateForm(): void {
    if (this.initialValue) {
      this.courierForm.reset({
        id: this.initialValue.id,
        name: this.initialValue.name,
        middleName: this.initialValue.middleName,
        lastName: this.initialValue.lastName,
        vehicle: this.initialValue.vehicle,
        address: this.initialValue.address,
        neighborhood: this.initialValue.neighborhood,
        zipCode: this.initialValue.zipCode,
        city: this.initialValue.city,
        phoneNumber: this.initialValue.phoneNumber,
        authUserId: this.initialValue.authUserId ?? '',
        isActive: this.initialValue.isActive
      });
      return;
    }

    this.courierForm.reset({
      id: '',
      name: '',
      middleName: '',
      lastName: '',
      vehicle: '',
      address: '',
      neighborhood: '',
      zipCode: '',
      city: '',
      phoneNumber: '',
      authUserId: '',
      isActive: true
    });
  }
}
