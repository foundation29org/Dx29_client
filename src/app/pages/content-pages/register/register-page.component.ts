import { Component, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { sha512 } from "js-sha512";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge } from 'rxjs/operators'

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TermsConditionsPageComponent } from "../terms-conditions/terms-conditions-page.component";
import { DataProcessingAgreementComponent } from "../data-processing-agreement/data-processing-agreement.component";
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-register-page',
    templateUrl: './register-page.component.html',
    styleUrls: ['./register-page.component.scss'],
})

export class RegisterPageComponent implements OnDestroy{

    @ViewChild('f') registerForm: NgForm;
    sending: boolean = false;

    isVerifyemail: boolean = false;
    isEmailBusy: boolean = false;
    isFailEmail: boolean = false;

    termso: boolean = false;
    openedTerms: boolean = false;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    role: string = 'Clinical';
    subrole: string = 'null';

    emailpar1: string = null;
    emailpar2: string = null;
    urlV2: string = environment.urlDxv2;

    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private route: ActivatedRoute) {

      this.subscription.add( this.route.params.subscribe(params => {
        if(params['role']!=undefined){
          this.role = params['role'];
        }
        if(params['subrole']!=undefined){
          this.subrole = params['subrole'];
        }
      }));

      var paramurlinit = this.router.parseUrl(this.router.url).queryParams;
      if(paramurlinit.email){
        this.emailpar1 = paramurlinit.email;
        this.emailpar2 = paramurlinit.email;
      }

    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    // Open content Privacy Policy
    openTerms() {
      this.openedTerms = true;
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl'
      };
      const modalRef = this.modalService.open(TermsConditionsPageComponent, ngbModalOptions);
      modalRef.componentInstance.role = this.role;
      modalRef.componentInstance.subrole = this.subrole;
    }

    openDataProcessingAgreement() {
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl'
      };
      const modalRef = this.modalService.open(DataProcessingAgreementComponent, ngbModalOptions);
    }

    submitInvalidForm() {
      if (!this.registerForm) { return; }
      const base = this.registerForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    //  On submit click, reset field value
    onSubmit() {
      if(this.registerForm.value.role=='User' && (this.registerForm.value.subrole=='null' || this.registerForm.value.subrole==null)){
        Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("registration.select the type of patient1"), "error");
      }else{
        this.sending = true;
        this.isVerifyemail = false;
        this.isEmailBusy = false;
        this.isFailEmail = false;
        //codificar el password
        this.registerForm.value.password = sha512(this.registerForm.value.password);
        this.registerForm.value.password2 = sha512(this.registerForm.value.password2);
        this.registerForm.value.email = (this.registerForm.value.email).toLowerCase();
        this.registerForm.value.lang=this.translate.store.currentLang;

        var params = this.registerForm.value;
        params.permissions = {};
        if(params.role=='Clinical'){
          params.subrole= null
        }
        this.subscription.add( this.http.post(environment.api+'/api/signup',params)
          .subscribe( (res : any) => {
            if(res.message == 'Account created'){
              this.isVerifyemail = true;
              Swal.fire('', this.translate.instant("registration.Check the email"), "success");
            }else if(res.message == 'Fail sending email'){
              console.log("email fallido");
              this.isFailEmail = true;
              Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("registration.could not be sent to activate"), "error");
            }else if(res.message == 'user exists'){
              this.isEmailBusy = true;
              Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("registration.email already exists"), "error");
            }
            this.registerForm.reset();
            this.sending = false;
           }, (err) => {
             console.log(err);
             Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
             this.registerForm.reset();
             this.sending = false;
           }));
      }


    }

    goToLogin(){
      this.router.navigate(['/login']);
    }

    roleChange(role){
      this.subrole = "null";
    }

}
