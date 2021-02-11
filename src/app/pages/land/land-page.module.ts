import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ngx-custom-validators';
import { LandPageRoutingModule } from "./land-page-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { LandPageComponent } from "./land/land-page.component";
import { ClinicianPageComponent } from "./clinician/clinician-page.component";
import { DiagnosedPatientPageComponent } from "./diagnosedpatient/diagnosedpatient-page.component";
import { UndiagnosedPatientPageComponent } from "./undiagnosedpatient/undiagnosedpatient-page.component";
import { EdHubPageComponent } from "./ed-hub/ed-hub-page.component";
import { AttributionsComponent } from "./attributions/attributions.component";
import { GtpPageComponent } from "./gtp/gtp-page.component";
import { GtpDonatePageComponent } from "./gtp-donate/gtp-donate-page.component";
import { KnowMePageComponent } from "./know-me/know-me-page.component";

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        LandPageRoutingModule,
        FormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatCheckboxModule,
        MatRadioModule
    ],
    declarations: [
        LandPageComponent,
        ClinicianPageComponent,
        DiagnosedPatientPageComponent,
        UndiagnosedPatientPageComponent,
        EdHubPageComponent,
        AttributionsComponent,
        GtpPageComponent,
        GtpDonatePageComponent,
        KnowMePageComponent
    ]
})
export class LandPageModule { }
