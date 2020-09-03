import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { NodiagnosisComponent } from './nodiagnosis/nodiagnosis.component';
import { WithdiagnosisComponent } from './withdiagnosis/withdiagnosis.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'nodiagnosis',
        component: NodiagnosisComponent,
        data: {
          title: 'menu.Dashboard',
          expectedRole: ['User'],
          expectedSubRole: ['NoDiagnosis', 'UncertainDiagnosis']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'withdiagnosis',
        component: WithdiagnosisComponent,
        data: {
          title: 'menu.Dashboard',
          expectedRole: ['User'],
          expectedSubRole: ['HaveDiagnosis']
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
