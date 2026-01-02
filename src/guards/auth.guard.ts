import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router) as Router;
  const currentUser = authService.currentUser();
  
  if (!currentUser) {
    return router.createUrlTree(['/auth']);
  }

  const isVendedor = currentUser.role === 'vendedor';
  const hasTienda = currentUser.tiendaId !== undefined && currentUser.tiendaId !== null;
  const isAdmin = currentUser.role === 'admin';

  const tryingToJoinStore = state.url.includes('/join-store');
  const tryingToAccessAdmin = state.url.includes('/admin');

  if (isAdmin) {
    // Admins should not be on the join store page.
    if (tryingToJoinStore) {
      return router.createUrlTree(['/home']);
    }
    return true; // Admins can go anywhere else.
  }

  if (isVendedor) {
    if (!hasTienda) {
      // Vendor without a store MUST go to join-store page.
      if (tryingToJoinStore) {
        return true; // They are in the right place.
      }
      return router.createUrlTree(['/join-store']); // Force redirect for any other route.
    } else { // Vendor WITH a store
      // They should not be on the admin page.
      if (tryingToAccessAdmin) {
        return router.createUrlTree(['/home']);
      }
      // A vendor with a store is allowed to access /join-store (to select a store)
      // and /home (after selecting a store).
      return true;
    }
  }

  // Default fallback if roles are not admin/vendedor for some reason
  return router.createUrlTree(['/auth']);
};