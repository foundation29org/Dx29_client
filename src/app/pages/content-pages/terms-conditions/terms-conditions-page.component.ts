import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-terms-conditions-page',
    templateUrl: './terms-conditions-page.component.html',
    styleUrls: ['./terms-conditions-page.component.scss']
})

export class TermsConditionsPageComponent{
  showSecurity: boolean = false;
  role: string = '';
  subrole: string = '';
  constructor(public activeModal: NgbActiveModal, public translate: TranslateService) {
    setTimeout(function () {
        this.goTo('initpos');
    }.bind(this), 500);

  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }

  openSecurity() {
    this.showSecurity = true;
    setTimeout(function () {
        this.goTo('initposSecurity');
    }.bind(this), 200);
  }

  back(){
    this.showSecurity = false;
    setTimeout(function () {
        this.goTo('stepback');
    }.bind(this), 500);

  }
}
