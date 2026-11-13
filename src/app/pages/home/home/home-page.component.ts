import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { SearchService } from 'app/shared/services/search.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';

declare let gtag: any;

@Component({
    standalone: false,
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
})

export class HomePageComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    email: string = '';
    showErrorForm: boolean = false;
    sending: boolean = false;
    @ViewChild('f') donorDataForm: NgForm;

    constructor(private searchService: SearchService, public translate: TranslateService, private http: HttpClient, public toastr: ToastrService) {
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
            gtag('event', category, { 'myuuid': sessionStorage.getItem('uuid'), 'event_label': secs });
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    registerToDx29(){
        this.lauchEvent("Registration");
        this.lauchEvent("Registration Home - Event");
        window.location.href = environment.urlDxv2 + "/Identity/Account/Register";
    }

    openWeb(){
        var lang = sessionStorage.getItem('lang');
        if(lang=='es'){
            window.open('https://www.foundation29.org', '_blank');
        }else{
            window.open('https://www.foundation29.org/en/', '_blank');
        }
    }

    submitInvalidForm() {
        this.showErrorForm = true;
        if (!this.donorDataForm) { return; }
        const base = this.donorDataForm;
        for (const field in base.form.controls) {
            if (!base.form.controls[field].valid) {
                base.form.controls[field].markAsTouched()
            }
        }
    }

}
