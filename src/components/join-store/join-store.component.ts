import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TiendaService } from '../../services/tienda.service';
import { AuthService } from '../../services/auth.service';
import { Tienda } from '../../models';

interface SearchResult {
  tienda: Tienda;
  ownerName: string;
}

@Component({
  selector: 'app-join-store',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-store.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinStoreComponent {
  tiendaService = inject(TiendaService);
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  searchTerm = signal('');
  searchResults = signal<SearchResult[]>([]);
  isLoading = signal(false);
  
  selectedTienda = signal<Tienda | null>(null);
  pinError = signal<string | null>(null);

  isFirstVisit = signal(this.route.snapshot.queryParamMap.get('first-visit') === 'true');

  async searchTiendas() {
    if (this.searchTerm().trim().length === 0) {
      this.searchResults.set([]);
      return;
    }
    this.isLoading.set(true);
    const results = await this.tiendaService.searchTiendas(this.searchTerm());
    this.searchResults.set(results);
    this.isLoading.set(false);
  }

  selectTienda(tienda: Tienda) {
    this.selectedTienda.set(tienda);
    this.pinError.set(null);
  }

  cancelPinEntry() {
    this.selectedTienda.set(null);
  }

  async submitPin(form: NgForm) {
    if (form.invalid || !this.selectedTienda()) return;

    this.pinError.set(null);
    const pin = form.value.pin;
    const tiendaId = this.selectedTienda()!.id;
    
    const isPinValid = await this.tiendaService.verifyPin(tiendaId, pin);

    if (isPinValid) {
      await this.authService.assignTiendaToCurrentUser(tiendaId);
      this.router.navigate(['/home']);
    } else {
      this.pinError.set('PIN incorrecto. Inténtalo de nuevo.');
    }
  }
}
