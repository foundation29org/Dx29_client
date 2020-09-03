import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-attributions',
    templateUrl: './attributions.component.html',
    styleUrls: ['./attributions.component.scss']
})

export class AttributionsComponent{


    constructor(public translate: TranslateService) {
    }

}
