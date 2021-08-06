import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

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
    modalReference: NgbModalRef;

    constructor(public translate: TranslateService, private modalService: NgbModal) {
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

      showAboutUs(contentAboutUs){
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(contentAboutUs, ngbModalOptions);
      }
  

}
