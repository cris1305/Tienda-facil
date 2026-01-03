
import { ChangeDetectionStrategy, Component, inject, signal, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models';

declare const google: any; // Declare google global variable

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent implements AfterViewInit {
  authService = inject(AuthService);
  router = inject(Router) as Router;
  route = inject(ActivatedRoute) as ActivatedRoute;
  ngZone = inject(NgZone);

  isLoginView = signal(true);
  isVerificationStep = signal(false); // New state for verification view
  verificationEmail = signal(''); // Store email for verification step
  
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

  ngAfterViewInit(): void {
    // It's possible this component is destroyed and re-initialized.
    // Ensure we don't try to initialize multiple times if the script is already loaded.
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        // TODO: Replace with your own Google Client ID
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        callback: this.handleGoogleSignIn
      });
      google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: '350', text: 'continue_with', shape: 'pill' } 
      );
    }
  }

  handleGoogleSignIn = (response: any) => {
    // The callback from Google happens outside of Angular's zone.
    // We need to run the login logic inside the zone to trigger change detection.
    this.ngZone.run(async () => {
      const result = await this.authService.loginWithGoogle(response.credential);
      this.handleAuthResponse(result);
    });
  }

  toggleView(isLogin: boolean) {
    this.isLoginView.set(isLogin);
    this.isVerificationStep.set(false); // Reset verification step
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
    this.handleAuthResponse(result);
  }

  private handleAuthResponse(result: { success: boolean; message: string; user?: any; }) {
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
        this.authSuccess.set(result.message);
        this.verificationEmail.set(email); // Save email for the next step
        this.isVerificationStep.set(true); // Switch to verification view
    } else {
        this.authError.set(result.message);
    }
  }
  
  async onVerifyEmail(form: NgForm) {
    if (form.invalid) return;
    this.authError.set(null);
    this.authSuccess.set(null);

    const email = this.verificationEmail();
    const code = form.value.code;
    
    const result = await this.authService.verifyEmail(email, code);

    if (result.success) {
      this.authSuccess.set(result.message);
      // After successful verification, switch to login view so they can log in
      setTimeout(() => {
          this.toggleView(true);
      }, 2000);
    } else {
      this.authError.set(result.message);
    }
  }
}
