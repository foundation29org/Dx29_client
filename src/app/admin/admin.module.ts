import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from "./admin-routing.module";

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

//Components
import { AdminGTPComponent } from "./dashboard/adminGTP/adminGTP.component";

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        AdminRoutingModule,
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
        MatCheckboxModule
    ],
    declarations: [
    ]
})
export class AdminModule { }
