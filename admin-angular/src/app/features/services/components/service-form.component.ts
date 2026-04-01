import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import {
  CatalogService,
  ServiceFormValue,
  ServiceOptionCatalogItem,
  ServicePricingOption,
  ServicePricingOptionName,
  ServicePricingOptionUom
} from '../../../core/catalogs/catalogs.models';

type FormMode = 'create' | 'edit';
type PricingOptionFormGroup = FormGroup;

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
  @Output() saveRequested = new EventEmitter<ServiceFormValue>();

  readonly pricingCatalog: ServiceOptionCatalogItem[] = [
    { optionName: 'Por kilo', uoM: 'KG' },
    { optionName: 'Por pieza', uoM: 'PZ' },
    { optionName: 'Por docena', uoM: 'DOC' },
    { optionName: 'Bulto pequeño', uoM: 'BULTO' },
    { optionName: 'Bulto mediano', uoM: 'BULTO' },
    { optionName: 'Bulto grande', uoM: 'BULTO' },
    { optionName: 'Bulto jumbo', uoM: 'BULTO' }
  ];

  readonly serviceForm = this.formBuilder.nonNullable.group({
    id: [''],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    isActive: [true, [Validators.required]],
    icon: ['local_laundry_service', [Validators.required, Validators.maxLength(80)]],
    themeIcon: ['w-12 h-12 bg-soft-blue rounded-xl flex items-center justify-center text-mint-dark', [Validators.required]],
    pricingOptions: this.formBuilder.array([], [this.pricingOptionsValidator.bind(this)])
  });

  get pricingOptions(): FormArray<PricingOptionFormGroup> {
    return this.serviceForm.controls.pricingOptions as unknown as FormArray<PricingOptionFormGroup>;
  }

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

    const value = this.serviceForm.getRawValue() as ServiceFormValue;
    this.saveRequested.emit({
      id: value.id,
      name: value.name,
      description: value.description,
      isActive: value.isActive,
      icon: value.icon,
      themeIcon: value.themeIcon,
      pricingOptions: value.pricingOptions.map((option) => ({
        id: option.id,
        serviceId: option.serviceId,
        optionName: option.optionName,
        price: Number(option.price),
        uoM: option.uoM,
        isActive: option.isActive
      }))
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

  addPricingOption(): void {
    const nextCatalogItem = this.pricingCatalog.find(
      (item) =>
        !this.pricingOptions.controls.some((control) => control.controls['optionName'].value === item.optionName)
    );

    if (!nextCatalogItem) {
      return;
    }

    this.pricingOptions.push(this.createPricingOptionGroup({ optionName: nextCatalogItem.optionName, uoM: nextCatalogItem.uoM }));
    this.syncPricingOptionUnits();
  }

  removePricingOption(index: number): void {
    this.pricingOptions.removeAt(index);
    this.syncPricingOptionUnits();
    this.pricingOptions.markAsTouched();
    this.pricingOptions.updateValueAndValidity();
  }

  syncOptionUom(index: number): void {
    const control = this.pricingOptions.at(index);
    if (!control) {
      return;
    }

    const catalogItem = this.findCatalogItem(control.controls['optionName'].value);
    if (!catalogItem) {
      return;
    }

    control.controls['uoM'].setValue(catalogItem.uoM);
    control.controls['uoM'].disable({ emitEvent: false });
    this.pricingOptions.updateValueAndValidity();
  }

  allowedCatalogItems(currentIndex: number): ServiceOptionCatalogItem[] {
    const selectedNames = this.pricingOptions.controls
      .map((control, index) => (index === currentIndex ? null : control.controls['optionName'].value))
      .filter((value): value is ServicePricingOptionName => value !== null);

    return this.pricingCatalog.filter((item) => !selectedNames.includes(item.optionName));
  }

  pricingOptionSummary(option: ServicePricingOption): string {
    return `${this.displayOptionName(option.optionName)} · ${option.uoM} · $${option.price.toFixed(2)}`;
  }

  displayOptionName(optionName: ServicePricingOptionName): string {
    return optionName.replace('Bulto', 'Carga');
  }

  hasPricingOptionsError(errorKey: string): boolean {
    return Boolean(this.pricingOptions.touched && this.pricingOptions.errors?.[errorKey]);
  }

  private hydrateForm(): void {
    this.serviceForm.patchValue({
      id: this.initialValue?.id ?? '',
      name: this.initialValue?.name ?? '',
      description: this.initialValue?.description ?? '',
      isActive: this.initialValue?.isActive ?? true,
      icon: this.initialValue?.icon ?? 'local_laundry_service',
      themeIcon:
        this.initialValue?.themeIcon ?? 'w-12 h-12 bg-soft-blue rounded-xl flex items-center justify-center text-mint-dark'
    });

    this.pricingOptions.clear();
    const options = this.initialValue?.pricingOptions?.length
      ? this.initialValue.pricingOptions
      : this.mode === 'create'
        ? [{ optionName: 'Por kilo' as const, uoM: 'KG' as const, price: 0, isActive: true, id: '', serviceId: '' }]
        : [];

    options.forEach((option) => {
      this.pricingOptions.push(this.createPricingOptionGroup(option));
    });

    this.syncPricingOptionUnits();
    this.serviceForm.markAsPristine();
  }

  private createPricingOptionGroup(option?: Partial<ServicePricingOption>) {
    const catalogItem =
      this.findCatalogItem(option?.optionName ?? null) ??
      this.pricingCatalog[0];

    const group = this.formBuilder.nonNullable.group({
      id: [option?.id ?? ''],
      serviceId: [option?.serviceId ?? ''],
      optionName: [catalogItem.optionName, [Validators.required]],
      price: [Number(option?.price ?? 0), [Validators.required, Validators.min(0.01)]],
      uoM: [option?.uoM ?? catalogItem.uoM, [Validators.required]],
      isActive: [option?.isActive ?? true, [Validators.required]]
    });

    group.controls.uoM.disable({ emitEvent: false });
    return group;
  }

  private syncPricingOptionUnits(): void {
    this.pricingOptions.controls.forEach((control) => {
      const catalogItem = this.findCatalogItem(control.controls['optionName'].value);
      if (!catalogItem) {
        return;
      }

      control.controls['uoM'].setValue(catalogItem.uoM, { emitEvent: false });
      control.controls['uoM'].disable({ emitEvent: false });
    });

    this.pricingOptions.updateValueAndValidity();
  }

  private pricingOptionsValidator(control: AbstractControl): ValidationErrors | null {
    const formArray = control as FormArray<PricingOptionFormGroup>;
    const values = formArray.getRawValue() as ServicePricingOption[];

    if (values.length === 0) {
      return { missingOptions: true };
    }

    const activeOptions = values.filter((option) => option.isActive);
    if (activeOptions.length === 0) {
      return { missingActiveOption: true };
    }

    const seen = new Set<string>();
    for (const option of values) {
      if (seen.has(option.optionName)) {
        return { duplicateOptionName: true };
      }
      seen.add(option.optionName);

      const catalogItem = this.findCatalogItem(option.optionName);
      if (!catalogItem || catalogItem.uoM !== option.uoM) {
        return { invalidOptionUom: true };
      }
    }

    return null;
  }

  private findCatalogItem(optionName: ServicePricingOptionName | null): ServiceOptionCatalogItem | undefined {
    return this.pricingCatalog.find((item) => item.optionName === optionName);
  }
}
