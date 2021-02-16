import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandPageComponent } from "./land/land-page.component";
import { ClinicianPageComponent } from "./clinician/clinician-page.component";
import { DiagnosedPatientPageComponent } from "./diagnosedpatient/diagnosedpatient-page.component";
import { UndiagnosedPatientPageComponent } from "./undiagnosedpatient/undiagnosedpatient-page.component";
import { EdHubPageComponent } from "./ed-hub/ed-hub-page.component";
import { AttributionsComponent } from "./attributions/attributions.component";
import { GtpPageComponent } from "./gtp/gtp-page.component";
import { GtpDonatePageComponent } from "./gtp-donate/gtp-donate-page.component";
import { KnowMePageComponent } from "./know-me/know-me-page.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '.',
        component: LandPageComponent,
        data: {
          title: 'Dx29'
        },
      },
      {
        path: 'clinician',
        component: ClinicianPageComponent,
        data: {
          title: 'menu.Physicians'
        }
      },
      {
        path: 'diagnosedpatient',
        component: DiagnosedPatientPageComponent,
        data: {
          title: 'menu.DiagnosedPatients'
        }
      },
      {
        path: 'undiagnosedpatient',
        component: UndiagnosedPatientPageComponent,
        data: {
          title: 'menu.UndiagnosedPatients'
        }
      },
      {
        path: 'education',
        component: EdHubPageComponent,
        data: {
          title: 'menu.Ed Hub'
        }
      },
      {
        path: 'attributions',
        component: AttributionsComponent,
        data: {
          title: 'menu.Attributions'
        }
      },
      {
        path: 'juntoshaciaeldiagnostico',
        component: GtpPageComponent,
        data: {
          title: 'menu.Genetic testing program'
        }
      },
      {
        path: 'juntoshaciaeldiagnostico/donar',
        component: GtpDonatePageComponent,
        data: {
          title: 'homedx.Donate'
        }
      },
      {
        path: 'juntoshaciaeldiagnostico/conoceme',
        component: KnowMePageComponent,
        data: {
          title: 'know-me.title-page'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandPageRoutingModule { }
