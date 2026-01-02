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
  const isAdmin = currentUser.role === 'admin';
  const hasTienda = currentUser.tiendaId !== undefined && currentUser.tiendaId !== null;

  const tryingToJoinStore = state.url.includes('/join-store');
  const tryingToCreateStore = state.url.includes('/create-store');
  const tryingToAccessAdmin = state.url.includes('/admin');
  
  if (isAdmin) {
    if (!hasTienda) {
      // Admin without a store MUST go to create-store page.
      if (tryingToCreateStore) {
        return true; // They are in the right place.
      }
      return router.createUrlTree(['/create-store']); // Force redirect for any other route.
    } else { // Admin WITH a store
      // They should not be on create or join pages.
      if (tryingToCreateStore || tryingToJoinStore) {
        return router.createUrlTree(['/admin']);
      }
      return true; // Admins with a store can go to admin or home.
    }
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
      // A vendor with a store should not be on the join-store page unless they want to change stores.
      // This logic allows them to access it, which is fine for now.
      return true;
    }
  }

  // Default fallback if roles are not admin/vendedor for some reason
  return router.createUrlTree(['/auth']);
};