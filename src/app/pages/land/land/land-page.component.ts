import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import {v4 as uuidv4} from 'uuid';
import{GoogleAnalyticsService} from 'app/shared/services/google-analytics.service';


declare let gtag:any;

@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
})

export class LandPageComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    lang: string = 'en';
    _startTime: any;
    role: string = '';

    myuuid: string = uuidv4();
    eventList: any = [];



    //private http: HttpClient, private apif29BioService: Apif29BioService, private apif29NcrService: Apif29NcrService, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private textTransform: TextTransform
    constructor(public googleAnalyticsService: GoogleAnalyticsService) {

        this.lang = sessionStorage.getItem('lang');
        this._startTime = Date.now();
        this.lauchEvent("Init");
    }

    getElapsedSeconds (){
        var endDate   = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
      };

      lauchEvent(category){
        //traquear
        var secs = this.getElapsedSeconds();
        gtag('event',this.myuuid,{"event_category":category, "event_label": secs});
      }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    selectRole(role){
        this.role = role;
    }

    restartVars(){
        this.role = '';
    }

    
      
}
