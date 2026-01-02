

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    // Update URL for better user experience
    const view = isLogin ? 'login' : 'register';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge',
    });
  }

  async onLogin(form: NgForm) {
    if (form.invalid) return;
    const { contact, password } = form.value;
    const result = await this.authService.login(contact, password);
    if (result.success && result.user) {
      this.authError.set(null);
      this.authSuccess.set(result.message);

      // Redirect based on role
      const user = result.user;
      if (user.role === 'vendedor') {
        const hasTienda = user.tiendaId !== undefined && user.tiendaId !== null;
        if (hasTienda) {
            setTimeout(() => this.router.navigate(['/home']), 1000);
        } else {
            const queryParams = { 'first-visit': 'true' };
            setTimeout(() => this.router.navigate(['/join-store'], { queryParams }), 1000);
        }
      } else {
        // Admins go directly to home/dashboard.
        setTimeout(() => this.router.navigate(['/home']), 1000);
      }
    } else {
      this.authError.set(result.message);
    }
  }

  async onRegister(form: NgForm) {
    if (form.invalid) return;
    const { name, phone, email, password } = form.value;
    const result = await this.authService.register(name, phone, email, password);

    if (result.success) {
        this.authSuccess.set(result.message);
        this.toggleView(true);
    } else {
        this.authError.set(result.message);
    }
  }
}
