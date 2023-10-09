import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { HomePageRoutingModule } from "./home-page-routing.module";
import { TranslateModule } from '@ngx-translate/core';
import { HomePageComponent } from "./home/home-page.component";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        HomePageRoutingModule,
        TranslateModule,
        NgbModule,
    ],
    declarations: [
        HomePageComponent
    ]
})
export class HomePageModule { }
