import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { TiendaService } from '../../services/tienda.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-store',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-store.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateStoreComponent {
  tiendaService = inject(TiendaService);
  authService = inject(AuthService);
  router = inject(Router);

  error = signal<string | null>(null);
  isLoading = signal(false);

  currentUser = this.authService.currentUser;

  async createStore(form: NgForm) {
    if (form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    
    const tiendaName = form.value.tiendaName;
    const newTienda = await this.tiendaService.createTienda(tiendaName);

    if (newTienda) {
      // The backend has created the store and assigned it to the user.
      // Now, we refresh the user's data in the frontend to get the new tiendaId.
      await this.authService.refreshCurrentUser();
      // The auth guard will then see the user has a tiendaId and allow access to the admin panel.
      this.router.navigate(['/admin']);
    } else {
      this.error.set('No se pudo crear la tienda. Por favor, inténtalo de nuevo.');
      this.isLoading.set(false);
    }
  }
}
