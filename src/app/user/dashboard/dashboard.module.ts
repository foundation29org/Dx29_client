import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from 'app/shared/directives/match-height.directive';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { UiSwitchModule } from 'ngx-ui-switch';

import {MatSelectModule} from '@angular/material/select';
import {MatExpansionModule} from '@angular/material/expansion';

import { NodiagnosisComponent } from './nodiagnosis/nodiagnosis.component';
import { WithdiagnosisComponent } from './withdiagnosis/withdiagnosis.component';
import { PatientCloudComponent } from './patient-cloud/patient-cloud.component';
import { VennchartComponent } from './vennchart/vennchart.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatStepperModule} from '@angular/material/stepper';
import {MatIconModule} from '@angular/material/icon';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        DashboardRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        NgxChartsModule,
        UiSwitchModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatStepperModule,
        MatIconModule
    ],
    exports: [TranslateModule],
    declarations: [
        NodiagnosisComponent,
        WithdiagnosisComponent,
        PatientCloudComponent,
        VennchartComponent
    ],
    providers: [],
})
export class DashboardModule { }
