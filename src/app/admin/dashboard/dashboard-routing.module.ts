import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { AdminGTPComponent } from "./adminGTP/adminGTP.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'admingtp',
        component: AdminGTPComponent,
        data: {
          title: 'menu.Dashboard',
          expectedRole: ['Admin'],
          expectedSubRole: ['AdminGTP']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule { }
