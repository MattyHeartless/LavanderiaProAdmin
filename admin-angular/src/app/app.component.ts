import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationCenterComponent } from './core/notifications/notification-center.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationCenterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
