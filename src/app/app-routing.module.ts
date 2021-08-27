import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { FullLayoutComponent } from "./layouts/full/full-layout.component";
import { ContentLayoutComponent } from "./layouts/content/content-layout.component";
import { LandPageLayoutComponent } from "./layouts/land-page/land-page-layout.component";

import { Full_ROUTES } from "./shared/routes/full-layout.routes";
import { CONTENT_ROUTES } from "./shared/routes/content-layout.routes";

import { Land_Pages_ROUTES } from "./shared/routes/land-page-layout.routes"

import { AuthGuard } from './shared/auth/auth-guard.service';
import { CanDeactivateGuard } from './shared/auth/can-deactivate-guard.service';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '.',
    pathMatch: 'full',
  },
  { path: '', component: LandPageLayoutComponent, data: { title: 'Land Page' }, children: Land_Pages_ROUTES },
  { path: '', component: ContentLayoutComponent, data: { title: 'content Views' }, children: CONTENT_ROUTES },
  { path: '', component: FullLayoutComponent, data: { title: 'full Views' }, children: Full_ROUTES, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '.'}
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule],
  providers: [
    CanDeactivateGuard
  ]
})

export class AppRoutingModule {

}
