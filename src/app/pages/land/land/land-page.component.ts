import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';
import { SearchService } from 'app/shared/services/search.service';
import { v4 as uuidv4 } from 'uuid';
import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';

declare let gtag: any;

@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
})

export class LandPageComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    

    constructor( public googleAnalyticsService: GoogleAnalyticsService, private searchService: SearchService, public translate: TranslateService) {
        this._startTime = Date.now();
        if(sessionStorage.getItem('uuid')!=null){
            this.myuuid = sessionStorage.getItem('uuid');
        }else{
            this.myuuid = uuidv4();
            sessionStorage.setItem('uuid', this.myuuid);
        }
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        var savedEvent = this.searchService.search(this.eventList, 'name', category);
        if(!savedEvent){
            this.eventList.push({name:category});
            gtag('event',this.myuuid,{"event_category":category, "event_label": secs});
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

}
