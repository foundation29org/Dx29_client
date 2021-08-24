import { Component, OnDestroy, OnInit, ViewChild, Output, EventEmitter, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs/Subscription';
import { SearchService } from 'app/shared/services/search.service';
import { v4 as uuidv4 } from 'uuid';
import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { SortService } from 'app/shared/services/sort.service';
import { EventsService } from 'app/shared/services/events.service';
import { TextTransform } from 'app/shared/services/transform-text.service';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { ApiClinicalTrialsService } from 'app/shared/services/api-clinicaltrials.service';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

declare let gtag: any;

@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
    providers: [Apif29BioService, ApiDx29ServerService, ApiClinicalTrialsService],
})

export class LandPageComponent implements OnInit,  OnDestroy {

    private subscription: Subscription = new Subscription();
    lang: string = 'en';
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    

    constructor(private router: Router, private route: ActivatedRoute, public googleAnalyticsService: GoogleAnalyticsService, private searchService: SearchService, private eventsService: EventsService, private http: HttpClient, public searchFilterPipe: SearchFilterPipe, private apif29BioService: Apif29BioService, private modalService: NgbModal, public translate: TranslateService, public toastr: ToastrService, private textTransform: TextTransform, private sortService: SortService, private apiDx29ServerService: ApiDx29ServerService, private apiClinicalTrialsService: ApiClinicalTrialsService,private elRef: ElementRef) {

        this.lang = sessionStorage.getItem('lang');
        this._startTime = Date.now();
        this.lauchEvent("Init");

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
        /*if(this.role=='diagnosed'){
            this.loadListOfDiseases();
        }*/
    }

    restartVars() {
        this.role = '';
    }

}
