import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Courier } from '../../../core/catalogs/catalogs.models';

@Component({
  selector: 'app-courier-list',
  standalone: true,
  templateUrl: './courier-list.component.html'
})
export class CourierListComponent {
  @Input({ required: true }) couriers: Courier[] = [];
  @Input() loading = false;

  @Output() createRequested = new EventEmitter<void>();
  @Output() createAccessRequested = new EventEmitter<Courier>();
  @Output() editRequested = new EventEmitter<Courier>();
  @Output() deleteRequested = new EventEmitter<Courier>();

  trackById(_index: number, item: Courier): string {
    return item.id;
  }
}
