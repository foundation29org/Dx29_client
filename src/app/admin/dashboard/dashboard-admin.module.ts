import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from 'app/shared/directives/match-height.directive';

import { Ng2SmartTableModule } from 'ng2-smart-table';

import { NgxChartsModule } from '@swimlane/ngx-charts';

import {MatExpansionModule} from '@angular/material/expansion';
import { AdminGTPComponent } from './adminGTP/adminGTP.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        DashboardRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        NgxChartsModule,
        Ng2SmartTableModule,
        MatExpansionModule
    ],
    exports: [TranslateModule],
    declarations: [
        AdminGTPComponent
    ],
    providers: [],
})
export class DashboardAdminModule { }
