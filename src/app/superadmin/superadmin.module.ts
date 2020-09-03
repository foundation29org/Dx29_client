import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ngx-custom-validators';

import { SuperAdminRoutingModule } from "./superadmin-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MatchHeightModule } from "../shared/directives/match-height.directive";

import { DashboardSuperAdminComponent } from "./dashboard-superadmin/dashboard-superadmin.component";
import { TranslationsComponent } from "./translations/translations.component";
import { LangsComponent } from "./langs/langs.component";
import { DiagnosisSuperAdminComponent } from './diagnosis-super-admin/diagnosis-super-admin.component';
import { SupportComponent } from './support/support.component';

import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip'; 
import { TagInputModule } from 'ngx-chips';
import { UiSwitchModule } from 'ngx-ui-switch';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MatExpansionModule} from '@angular/material/expansion';

@NgModule({
    imports: [
        CommonModule,
        SuperAdminRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        MatSelectModule,
        MatTooltipModule,
        TagInputModule,
        ReactiveFormsModule,
        FormsModule,
        CustomFormsModule,
        UiSwitchModule,
        NgxDatatableModule,
        MatExpansionModule
    ],
    exports: [TranslateModule],
    declarations: [
        DashboardSuperAdminComponent,
        TranslationsComponent,
        LangsComponent,
        DiagnosisSuperAdminComponent,
        SupportComponent
    ],
    providers: [],
})
export class SuperAdminModule { }
