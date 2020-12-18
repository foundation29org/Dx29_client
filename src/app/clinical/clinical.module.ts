import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClinicalRoutingModule } from "./clinical-routing.module";

import { CustomFormsModule } from 'ngx-custom-validators';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import { TagInputModule } from 'ngx-chips';
import { UiSwitchModule } from 'ngx-ui-switch';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MatExpansionModule} from '@angular/material/expansion';
import {MatRadioModule} from '@angular/material/radio';
import {MatCheckboxModule} from '@angular/material/checkbox';

import { DiagnosisComponent } from './diagnosis/diagnosis.component';
import { DiagnosisComponent2 } from './diagnosis2/diagnosis2.component';
import { AboutComponent } from './about/about.component';
import {MatTableModule} from '@angular/material/table';
import {MatFormFieldModule} from '@angular/material/form-field';
@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        ClinicalRoutingModule,
        FormsModule,
        CustomFormsModule,
        NgbModule,
        TranslateModule,
        MatSelectModule,
        MatTooltipModule,
        TagInputModule,
        ReactiveFormsModule,
        UiSwitchModule,
        NgxDatatableModule,
        MatExpansionModule,
        MatRadioModule,
        MatCheckboxModule,
        MatTableModule,
        MatFormFieldModule
    ],
    declarations: [
        DiagnosisComponent,
        DiagnosisComponent2,
        AboutComponent
    ]
})
export class ClinicalModule { }
