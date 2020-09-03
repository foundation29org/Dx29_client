import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-data-privacy-security',
    templateUrl: './data-privacy-security.component.html',
    styleUrls: ['./data-privacy-security.component.scss']
})

export class DataPrivacySecurityPageComponent {
  constructor(public translate: TranslateService) {
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }

  back(){
    window.history.back();
  }

}
