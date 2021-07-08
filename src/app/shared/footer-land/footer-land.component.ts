import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-footer-land',
    templateUrl: './footer-land.component.html',
    styleUrls: ['./footer-land.component.scss']
})

export class FooterLandComponent{
    //Variables
    currentDate : Date = new Date();


    constructor(public translate: TranslateService, public toastr: ToastrService) {
    }

  

}
