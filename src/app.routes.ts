
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AuthComponent } from './components/auth/auth.component';
import { AdminComponent } from './components/admin/admin.component';
import { authGuard } from './guards/auth.guard';
import { JoinStoreComponent } from './components/join-store/join-store.component';
import { CreateStoreComponent } from './components/create-store/create-store.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { 
    path: 'home', 
    component: HomeComponent,
    canActivate: [authGuard] 
  },
  { path: 'auth', component: AuthComponent },
  { 
    path: 'admin', 
    component: AdminComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'join-store',
    component: JoinStoreComponent,
    canActivate: [authGuard]
  },
  {
    path: 'create-store',
    component: CreateStoreComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'home' }
];