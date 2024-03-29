import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

import { EventsService} from 'app/shared/services/events.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-gtp-donate-page',
    templateUrl: './gtp-donate-page.component.html',
    styleUrls: ['./gtp-donate-page.component.scss'],
})

export class GtpDonatePageComponent implements OnInit, OnDestroy{

    @ViewChild('f') gtpRegisterForm: NgForm;
    sending: boolean = false;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    lang: string = 'en';
    phoneCodes:any=[];
    phoneCodeSelected:String="";
    seleccionado: string = null;
    private subscription: Subscription = new Subscription();

    constructor(public translate: TranslateService, public toastr: ToastrService, private eventsService: EventsService) {
    }

    ngOnInit(){
      this.lang = sessionStorage.getItem('lang');
      this.eventsService.on('changelang', function(lang) {
        this.lang=lang;
      }.bind(this));
    }


    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

}
