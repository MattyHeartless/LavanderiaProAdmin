import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./core/layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/reports/reports-page.component').then((m) => m.ReportsPageComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders-page.component').then((m) => m.OrdersPageComponent)
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./features/services/services-page.component').then((m) => m.ServicesPageComponent)
      },
      {
        path: 'recollectors',
        loadComponent: () =>
          import('./features/recollectors/recollectors-page.component').then((m) => m.RecollectorsPageComponent)
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/clients-page.component').then((m) => m.ClientsPageComponent)
      },
      {
        path: 'reports',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page.component').then((m) => m.SettingsPageComponent)
      },
      {
        path: 'settings/branding',
        loadComponent: () =>
          import('./features/branding/branding-page.component').then((m) => m.BrandingPageComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
