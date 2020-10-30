import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge } from 'rxjs/operators'

import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { EventsService} from 'app/shared/services/events.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-know-me-page',
    templateUrl: './know-me-page.component.html',
    styleUrls: ['./know-me-page.component.scss'],
})

export class KnowMePageComponent implements OnInit, OnDestroy{

    @ViewChild('f') gtpRegisterForm: NgForm;
    sending: boolean = false;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    modalReference: NgbModalRef;
    lang: string = 'en';
    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private route: ActivatedRoute, public toastr: ToastrService, private eventsService: EventsService) {

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

    submitInvalidForm() {
      if (!this.gtpRegisterForm) { return; }
      const base = this.gtpRegisterForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    keyPress(event: any) {
       const pattern = /[0-9\+\-\(\)\ \ ]/;

       let inputChar = String.fromCharCode(event.charCode);
       if (event.keyCode != 8 && !pattern.test(inputChar)) {
         event.preventDefault();
       }
     }

    onSubmit(){
        this.sending = true;
        //this.gtpRegisterForm.value.email = (this.gtpRegisterForm.value.email).toLowerCase();
        //this.gtpRegisterForm.value.lang=this.translate.store.currentLang;
        console.log(this.gtpRegisterForm.value);
        var params:any = {}
        params.form= this.gtpRegisterForm.value;
        params.programName = "Genetic Program 1";
        params.lang = sessionStorage.getItem('lang');
        var params:any = {}
        params.Email= this.gtpRegisterForm.value.Email;
        params.Name = this.gtpRegisterForm.value.Name;
        params.Option = this.gtpRegisterForm.value.Option;
        params.Lang = sessionStorage.getItem('lang');
        params.Comments =  this.gtpRegisterForm.value.Comments;

        this.subscription.add( this.http.post('https://prod-160.westeurope.logic.azure.com:443/workflows/f3edf7191e19488bb44d8f26ace98608/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=t2pLwX67mGz8GM5IaBB4PPO2LsbKDW1dTfAVz6ZC2eo', params)
        .subscribe( (res : any) => {
          this.sending = false;
          this.toastr.success('', this.translate.instant("gtp.formMsgRegistered"));

          this.gtpRegisterForm.reset();
         }, (err) => {
           console.log(err);
           this.sending = false;
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));
    }

    showPanelMoreInfo(content){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl',
            centered: true
      };
      this.modalReference = this.modalService.open(content, ngbModalOptions);
    }

}
