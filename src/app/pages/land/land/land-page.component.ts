import { Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs/Subscription';
import { SearchService } from 'app/shared/services/search.service';
import { v4 as uuidv4 } from 'uuid';
import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';
import { EventsService } from 'app/shared/services/events.service';

declare let gtag: any;

@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
})

export class LandPageComponent implements OnInit,  OnDestroy {

    private subscription: Subscription = new Subscription();
    lang: string = 'en';
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    

    constructor(private router: Router, private route: ActivatedRoute, public googleAnalyticsService: GoogleAnalyticsService, private searchService: SearchService, private eventsService: EventsService, private http: HttpClient, public translate: TranslateService, public toastr: ToastrService) {

        this.lang = sessionStorage.getItem('lang');
        this._startTime = Date.now();
        //this.lauchEvent("Init");

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

    @Output() directionEvent = new EventEmitter<Object>();

    ngOnInit() {
        var param = this.router.parseUrl(this.router.url).queryParams;
        if(param.role){
            this.role = param.role;
        }

        this.eventsService.on('changelang', function (lang) {
            this.lang = lang;
        }.bind(this));

    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    selectRole(role) {
        this.role = role;
    }

    restartVars() {
        this.role = '';
    }

}
