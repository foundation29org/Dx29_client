import { Component, ViewChild, OnDestroy } from '@angular/core';
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
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-gtp-page',
    templateUrl: './gtp-page.component.html',
    styleUrls: ['./gtp-page.component.scss'],
})

export class GtpPageComponent implements OnDestroy{

    @ViewChild('f') gtpRegisterForm: NgForm;
    sending: boolean = false;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    modalReference: NgbModalRef;

    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private route: ActivatedRoute, public toastr: ToastrService) {

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

    onSubmit(){
        this.sending = true;
        //this.gtpRegisterForm.value.email = (this.gtpRegisterForm.value.email).toLowerCase();
        //this.gtpRegisterForm.value.lang=this.translate.store.currentLang;
        console.log(this.gtpRegisterForm.value);
        var params:any = {}
        params.form= this.gtpRegisterForm.value;
        params.programName = "Genetic Program 1";
        params.lang = sessionStorage.getItem('lang');
        this.subscription.add( this.http.post(environment.api+'/api/programs/externalRequest/', params)
        .subscribe( (res : any) => {
          this.sending = false;
          if(res.message=='You are already registered in the program with that email.'){
            this.toastr.error('', this.translate.instant("gtp.formMsgAlreadyRegistered"));
          }else{
            this.toastr.success('', this.translate.instant("gtp.formMsgRegistered"));
          }

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
