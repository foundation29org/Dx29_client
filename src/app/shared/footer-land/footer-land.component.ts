import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

declare let gtag: any;

@Component({
    selector: 'app-footer-land',
    templateUrl: './footer-land.component.html',
    styleUrls: ['./footer-land.component.scss']
})

export class FooterLandComponent{
    //Variables
    currentDate : Date = new Date();
    _startTime: any;

    constructor(public translate: TranslateService, public toastr: ToastrService) {
        this._startTime = Date.now();
    }

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        gtag('event', sessionStorage.getItem('uuid'), { "event_category": category, "event_label": secs });
      }
    
      getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
      };
  

}
