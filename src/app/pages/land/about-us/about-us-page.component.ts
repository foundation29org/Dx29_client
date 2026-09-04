import { Component, OnDestroy, ViewChild, signal } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SearchService } from 'app/shared/services/search.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';

declare let gtag: any;

@Component({
    standalone: false,
    selector: 'app-about-us-page',
    templateUrl: './about-us-page.component.html',
    styleUrls: ['./about-us-page.component.scss'],
})

export class AboutUsPageComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    email: string = '';
    showErrorForm: boolean = false;
    sending = signal(false);
    @ViewChild('f') donorDataForm: NgForm;

    constructor( private searchService: SearchService, public translate: TranslateService, private http: HttpClient, public toastr: ToastrService) {
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

    onSubmitRevolution() {
        this.showErrorForm = false;
        this.sending.set(true);
        var params: any = {}
        params.Email = (this.email).toLowerCase();
        params.Lang = sessionStorage.getItem('lang');
        var d = new Date(Date.now());
        var a = d.toString();
        params.Date = a;
        // Power Automate often returns 202/empty body; text avoids JSON parse failures
        this.subscription.add(this.http.post(
            'https://default163d001a45914200a300b9062d2e31.ec.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2d7a82d83b4c4b92a8270a84540b0213/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Lx4pWct3FrUvsh36OLIWzXlGV6RT9n3moDFoDk_mKvA',
            params,
            { responseType: 'text' }
        ).pipe(
            finalize(() => this.sending.set(false))
        ).subscribe({
            next: () => {
                this.email = '';
                Swal.fire({
                    icon: 'success',
                    html: this.translate.instant("land.diagnosed.DonorData.msgform"),
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
                setTimeout(() => Swal.close(), 2000);
            },
            error: (err) => {
                console.log(err);
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }
        }));

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
