import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type NavItem = {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  testId: string;
  child?: boolean;
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);

  readonly loggedUser = signal({
    name: 'Carlos Méndez',
    role: 'Super Administrador',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUVk7mvUPTC0qAe2nNZDQyQf_9gP74iHMWS9QgxPjQAaDTE-tivzO4q-HFq_d4etW_9XjqkV9F8CqdyymQ5KfWTzM7hKbWjbZongUpi1Q94yQkh5iYOl61k2s918CXJrTEFiDxZ28c43oNKl6IPsCx9R5bbOUN4hjc-dR9Po94q2hI-tiJLg_MQqm1CUObt0E9n8_6iVchABRpjxl1BfNXb2fffPGJPYpCnWcQHM_EazChi-OWv3ZmpZluuR9tXPeDpQ00EZcgSFo'
  });

  readonly navItems = signal<NavItem[]>([
    { label: 'Tablero', path: '/admin/dashboard', icon: 'dashboard', testId: 'nav-dashboard' },
    { label: 'Servicios', path: '/admin/services', icon: 'settings_suggest', testId: 'nav-services' },
    { label: 'Pedidos', path: '/admin/orders', icon: 'inventory_2', testId: 'nav-orders' },
    { label: 'Recolectores', path: '/admin/recollectors', icon: 'local_shipping', testId: 'nav-recollectors' },
    { label: 'Clientes', path: '/admin/clients', icon: 'group', testId: 'nav-clients' },
    { label: 'Branding', path: '/admin/settings/branding', icon: 'palette', testId: 'nav-branding' }
  ]);

  readonly year = computed(() => new Date().getFullYear());

  logout(): void {
    void this.router.navigateByUrl('/login');
  }
}


