import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from './auth.service';

export const adminAuthGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  if (authService.hasActiveSession()) {
    return true;
  }

  const router = inject(Router);
  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url
    }
  });
};
