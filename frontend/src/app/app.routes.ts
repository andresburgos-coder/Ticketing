import { Routes } from '@angular/router';
import { EventList } from './components/event-list/event-list';
import { EventDetail } from './components/event-detail/event-detail';
import { EventForm } from './components/event-form/event-form';
import { Checkout } from './components/checkout/checkout';
import { Confirmation } from './components/confirmation/confirmation';
import { AuthComponent } from './features/auth/components/auth/auth';
import { MyTicketsComponent } from './features/tickets/my-tickets';
import { ProfileComponent } from './features/profile/profile';
import { authGuard } from './core/guards/auth.guard';
import { checkoutGuard } from './core/guards/checkout.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    { path: '', component: EventList },
    { path: 'auth', component: AuthComponent },
    { path: 'login', redirectTo: 'auth', pathMatch: 'full' },
    { path: 'register', redirectTo: 'auth', pathMatch: 'full' },
    { path: 'event/:id', component: EventDetail },
    { path: 'event/:id/edit', component: EventForm, canActivate: [authGuard] },
    { path: 'create-event', component: EventForm, canActivate: [authGuard] },
    { path: 'checkout', component: Checkout, canActivate: [checkoutGuard] },
    { path: 'confirmation', component: Confirmation },
    { path: 'my-tickets', component: MyTicketsComponent, canActivate: [authGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    {
        path: 'admin',
        canActivate: [AdminGuard],
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
    },
    { path: '**', redirectTo: '' }
];
