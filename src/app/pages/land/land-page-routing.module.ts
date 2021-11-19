import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from 'app/shared/auth/can-deactivate-guard.service';

import { LandPageComponent } from "./land/land-page.component";
import { AboutUsPageComponent } from "./about-us/about-us-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";
import { DiagnosedPageComponent } from "./diagnosed/diagnosed-page.component";

import { GtpPageComponent } from "./gtp/gtp-page.component";
import { GtpDonatePageComponent } from "./gtp-donate/gtp-donate-page.component";

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
        path: 'aboutus',
        component: AboutUsPageComponent,
        data: {
          title: 'menu.About us'
        }
      },
      {
        path: 'undiagnosed',
        component: UndiagnosedPageComponent,
        data: {
          title: 'land.Undiagnosed'
        },
        canDeactivate: [CanDeactivateGuard]
      },
      {
        path: 'diagnosed',
        component: DiagnosedPageComponent,
        data: {
          title: 'land.Diagnosed'
        },
        canDeactivate: [CanDeactivateGuard]
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
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandPageRoutingModule { }
