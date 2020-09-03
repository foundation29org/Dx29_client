import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { DashboardSuperAdminComponent } from "./dashboard-superadmin/dashboard-superadmin.component";
import { LangsComponent } from "./langs/langs.component";
import { TranslationsComponent } from "./translations/translations.component";
import { DiagnosisSuperAdminComponent } from './diagnosis-super-admin/diagnosis-super-admin.component';
import { SupportComponent } from './support/support.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard-superadmin',
        component: DashboardSuperAdminComponent,
        data: {
          title: 'menu.Dashboard Super Admin',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'langs',
        component: LangsComponent,
        data: {
          title: 'menu.Languages',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'translations',
        component: TranslationsComponent,
        data: {
          title: 'menu.Translations',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'diagnosis-super-admin',
        component: DiagnosisSuperAdminComponent,
        data: {
          title: 'Diagnosis',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'support',
        component: SupportComponent,
        data: {
          title: 'Support'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuperAdminRoutingModule { }
