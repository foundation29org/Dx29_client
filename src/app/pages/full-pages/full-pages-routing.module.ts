import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserProfilePageComponent } from "./user-profile/user-profile-page.component";
import { SupportComponent } from './support/support.component';

import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

const routes: Routes = [
  {
    path: '',
    children: [

      {
        path: 'profile',
        component: UserProfilePageComponent,
        data: {
          title: 'menu.User Profile',
          expectedRole: ['Clinical', 'User', 'SuperAdmin', 'Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      }
    ]
  },
  {
    path: 'support',
    component: SupportComponent,
    data: {
      title: 'Support'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FullPagesRoutingModule { }
