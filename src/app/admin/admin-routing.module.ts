import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
// Components
import { AdminGTPComponent } from "./dashboard/adminGTP/adminGTP.component";


const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard-admin.module').then(m => m.DashboardAdminModule)
  },
  {
    path: 'adminGTP',
    component: AdminGTPComponent,
    data: {
      title: 'menu.Dashboard'
    },
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
