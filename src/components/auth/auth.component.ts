

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  authService = inject(AuthService);
  router = inject(Router) as Router;
  route = inject(ActivatedRoute) as ActivatedRoute;

  isLoginView = signal(true);
  selectedRole = signal<UserRole>('vendedor');
  authError = signal<string | null>(null);
  authSuccess = signal<string | null>(null);

  constructor() {
    this.route.queryParams.subscribe(params => {
        const view = params['view'];
        if (view === 'register') {
            this.isLoginView.set(false);
        } else {
            this.isLoginView.set(true);
        }
    });
  }

  toggleView(isLogin: boolean) {
    this.isLoginView.set(isLogin);
    this.authError.set(null);
    this.authSuccess.set(null);
    const view = isLogin ? 'login' : 'register';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge',
    });
  }

  async onLogin(form: NgForm) {
    if (form.invalid) return;
    this.authError.set(null);
    this.authSuccess.set(null);
    const { contact, password } = form.value;
    const result = await this.authService.login(contact, password);

    if (result.success && result.user) {
      this.authSuccess.set('¡Inicio de sesión exitoso!');
      const user = result.user;

      if (user.role === 'vendedor') {
        const hasTienda = user.tiendaId !== undefined && user.tiendaId !== null;
        if (hasTienda) {
            setTimeout(() => this.router.navigate(['/home']), 1000);
        } else {
            const queryParams = { 'first-visit': 'true' };
            setTimeout(() => this.router.navigate(['/join-store'], { queryParams }), 1000);
        }
      } else if (user.role === 'admin') {
        const hasTienda = user.tiendaId !== undefined && user.tiendaId !== null;
        if (hasTienda) {
            setTimeout(() => this.router.navigate(['/admin']), 1000);
        } else {
            setTimeout(() => this.router.navigate(['/create-store']), 1000);
        }
      } else {
        setTimeout(() => this.router.navigate(['/home']), 1000);
      }
    } else {
      this.authError.set(result.message);
    }
  }

  async onRegister(form: NgForm) {
    if (form.invalid) return;
    this.authError.set(null);
    this.authSuccess.set(null);
    const { name, phone, email, password } = form.value;
    const role = this.selectedRole();
    const result = await this.authService.register(name, phone, email, password, role);

    if (result.success) {
        this.authSuccess.set(result.message + ' Ahora, por favor inicia sesión.');
        this.toggleView(true);
    } else {
        this.authError.set(result.message);
    }
  }
}