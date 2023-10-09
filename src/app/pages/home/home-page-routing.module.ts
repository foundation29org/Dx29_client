import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePageComponent } from "./home/home-page.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '.',
        component: HomePageComponent,
        data: {
          title: 'Dx29'
        },
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule { }
