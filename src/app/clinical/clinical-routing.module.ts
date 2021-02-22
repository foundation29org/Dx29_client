import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';
import { DiagnosisComponent } from './diagnosis/diagnosis.component';

import { AboutComponent } from './about/about.component';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard-clinical.module').then(m => m.DashboardClinicalModule)
  },
  {
    path: 'diagnosis',
    component: DiagnosisComponent,
    data: {
      title: 'clinicalinfo.Diagnosis',
      expectedRole: ['Clinical']
    },
    canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'about',
    component: AboutComponent,
    data: {
      title: 'about.title'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClinicalRoutingModule { }
