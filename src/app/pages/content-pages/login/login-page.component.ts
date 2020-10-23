import { Component, ViewChild, OnDestroy, OnInit, ElementRef  } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from '../../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { sha512 } from "js-sha512";
import { AuthService } from '../../../../app/shared/auth/auth.service';
import { AuthGuard } from '../../../../app/shared/auth/auth-guard.service';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import { PatientService } from '../../../../app/shared/services/patient.service';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    providers: [PatientService]
})

export class LoginPageComponent implements OnDestroy, OnInit{

    @ViewChild('f') loginForm: NgForm;
    //loginForm: FormGroup;
    sending: boolean = false;

    isBlockedAccount: boolean = false;
    isLoginFailed: boolean = false;
    errorAccountActivated: boolean = false;
    emailResent: boolean = false;
    supportContacted: boolean = false;
    isAccountActivated: boolean = false;
    isActivationPending: boolean = false;
    isBlocked: boolean = false;
    email: string;
    userEmail: string;
    patient: any;
    haveMsg: boolean = false;
    parts: any = null;
    secondsNextRelease: number = -1;
    versionServer:any = {};
    private subscription: Subscription = new Subscription();
    private subscriptionIntervals: Subscription = new Subscription();
    private subscriptionTestForce: Subscription = new Subscription();
    startTime: Date = null;
    finishTime: Date = null;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    @ViewChild('recaptcha', {static: true }) recaptchaElement: ElementRef;
    captchaToken: string = "";
    needCaptcha: boolean = false;

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public authService: AuthService, private authGuard: AuthGuard,  public translate: TranslateService, private patientService: PatientService, private inj: Injector) {
      //var param = router.parseUrl(router.url).queryParams["email","key"];
      var param = router.parseUrl(router.url).queryParams;
      console.log("Extracted value: ")
      console.log(param);
      if(param.email && param.key){
        //activar la cuenta
        this.subscription.add( this.http.post(environment.api+'/api/activateuser',param)
          .subscribe( (res : any) => {
            if(res.message=='activated'){
              this.isAccountActivated = true;
              this.email = param.email;
              this.loginForm.controls['email'].setValue(param.email);
            }else if(res.message=='error'){
              this.errorAccountActivated = true;
            }
           }, (err) => {
             console.log(err);
             this.errorAccountActivated = true;
           }
         ));

         this.authService.logout()
      }else{
        if(this.authService.getEnvironment()){
          this.translate.use(this.authService.getLang());
          sessionStorage.setItem('lang', this.authService.getLang());
          let url =  this.authService.getRedirectUrl();
          console.log('Redirect Url:'+ url);
          this.router.navigate([ url ]);
        }
      }
      this.loadVersion();
     }

     loadVersion(){
       this.startTime = null;
       this.finishTime = null;
       var date = Date.now();
       this.subscription.add( this.http.get(environment.settingsAccessToken.blobAccountUrl+'version.json'+environment.settingsAccessToken.sasToken+'&'+date)
        .subscribe( (res : any) => {
           //if(res.actualCodeVersion==0.000){
           if(res.launchTime!=null){
             this.versionServer = res;
             this.finishTime = res.launchTime;
             this.startTime= new Date(res.launchTime);
             this.startTime.setHours(this.startTime.getHours() - res.maintenanceHours);
             this.secondsNextRelease = this.getSecondsToNextRelease(res.launchTime);
             this.doTimer();
             this.testIfForceLoadVersion();
             this.haveMsg = true;
           }else{
             if(environment.version.actualCodeVersion<res.actualCodeVersion){
               this.authGuard.reload();
             }
           }
         }, (err) => {
           console.log(err);
         }
       ));
     }

     updateTime(secondsNextRelease){
       var difference = secondsNextRelease;
       this.parts = {
          days: Math.floor(difference / (60 * 60 * 24)),
          hours: Math.floor((difference / (60 * 60)) % 24),
          minutes: Math.floor((difference / 60) % 60),
          seconds: Math.floor((difference) % 60),
        };
     }

     getSecondsToNextRelease(launchTime){
       var launchTimeTemp= new Date(launchTime);//'06/19/2020 13:41:00'
        var actualdate = new Date(); // get current date
        var getactualdate = actualdate;
        var secondsNextRelease = launchTimeTemp.getTime()-getactualdate.getTime();
        secondsNextRelease = Math.round(secondsNextRelease/1000);
        return secondsNextRelease;
     }

     async doTimer() {
         this.subscriptionIntervals = Observable.interval(1000 ).subscribe(() => {
           this.secondsNextRelease = this.secondsNextRelease-1;
           this.updateTime(this.secondsNextRelease);
           if(this.secondsNextRelease<=0){
             this.subscriptionIntervals.unsubscribe();
             this.authGuard.reload();
           }
         });
     }

     async testIfForceLoadVersion() {
       var date = Date.now();
         this.subscriptionTestForce = Observable.interval(1000 * 60 * 60 ).subscribe(() => {
           this.subscription.add( this.http.get(environment.settingsAccessToken.blobAccountUrl+'version.json'+environment.settingsAccessToken.sasToken+'&'+date)
            .subscribe( (res : any) => {
               if(this.versionServer.versionFile<res.versionFile){
                 this.loadVersion();
                 if (this.subscriptionIntervals) {
                   this.subscriptionIntervals.unsubscribe();
                 }
                 if(this.subscriptionTestForce) {
                     this.subscriptionTestForce.unsubscribe();
                  }
               }
             }, (err) => {
               console.log(err);
             }
           ));
         });

     }

     ngOnInit() {
       if (!this.isApp){
         //this.addRecaptchaScript();
       }
      }

      renderReCaptch() {
        this.needCaptcha = true;
        window['grecaptcha'].render(this.recaptchaElement.nativeElement, {
          'sitekey' : environment.captcha,
          'callback': (response) => {
            this.captchaToken = response;
            console.log(response);
            this.subscription.add( this.http.get(environment.api+'/api/verifyingcaptcha/'+this.captchaToken)
              .subscribe( (res : any) => {
                console.log(res);
                this.needCaptcha = false;
              }, (err) => {
                this.needCaptcha = true;
                this.addRecaptchaScript();
                console.log(err);
              }));

          }
        });

      }

      addRecaptchaScript() {

        window['grecaptchaCallback'] = () => {
          this.renderReCaptch();
        }

        (function(d, s, id, obj){
          var js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) { obj.renderReCaptch(); return;}
          js = d.createElement(s); js.id = id;
          js.src = "https://www.google.com/recaptcha/api.js?onload=grecaptchaCallback&amp;render=explicit";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'recaptcha-jssdk', this));

      }

     ngOnDestroy() {
       if(this.subscription) {
            this.subscription.unsubscribe();
        }
       if(this.subscriptionIntervals) {
            this.subscriptionIntervals.unsubscribe();
        }
        if(this.subscriptionTestForce) {
            this.subscriptionTestForce.unsubscribe();
         }
     }

     submitInvalidForm() {
       if (!this.loginForm) { return; }
       const base = this.loginForm;
       for (const field in base.form.controls) {
         if (!base.form.controls[field].valid) {
             base.form.controls[field].markAsTouched()
         }
       }
     }

    // On submit button click
    onSubmit() {
      if(this.needCaptcha && !this.isApp){
        if(!this.isApp){

        }
      }else{
        this.sending = true;
        this.isBlockedAccount = false;
        this.isLoginFailed = false;
        this.isActivationPending = false;
        this.isBlocked = false;
        console.log(this.loginForm.value)
        this.userEmail = this.loginForm.value.email
        this.loginForm.value.password= sha512(this.loginForm.value.password)
    	   this.subscription.add( this.authService.signinUser(this.loginForm.value).subscribe(
    	       authenticated => {
              this.loginForm.reset();
      		    if(authenticated) {
                 //this.translate.setDefaultLang( this.authService.getLang() );
                 this.translate.use(this.authService.getLang());
                 sessionStorage.setItem('lang', this.authService.getLang());
                 this.testHotjarTrigger(this.authService.getLang());
          			 let url =  this.authService.getRedirectUrl();
                 if(this.authService.getRole()=='User'){
                   this.subscription.add( this.patientService.getPatientId()
                   .subscribe( (res : any) => {
                     console.log(res);
                     if(res==null){
                       //crear el paciente, y mostrar mensaje de bienvenida, e invitarle a completar los datos básicos
                       this.createPatient();

                     }else{
                       this.authService.setCurrentPatient(res);
                       console.log('Redirect Url:'+ url);
                			 this.router.navigate([ url ]);
                     }
                     this.sending = false;
                    }, (err) => {
                      console.log(err);
                      this.sending = false;
                    }));
                 }else if(this.authService.getRole()=='Clinical'){
                   this.sending = false;
                   console.log('entra');
                     console.log('Redirect Url:'+ url);
                    this.router.navigate([ url ]);
                 }
                 else if(this.authService.getRole()=='Admin'){
                  this.sending = false;
                  console.log('entra');
                  console.log('Redirect Url:'+ url);
                  this.router.navigate([ url ]);
                 }
                 else{
                    this.sending = false;
                   console.log(url);
                   this.router.navigate([ url ]);
                 }

      		    }else {
                this.sending = false;
                console.log("ha fallado");
                let message =  this.authService.getMessage();
                 if(message == "Login failed" || message == "Not found"){
                     console.log("Login failed");
                     this.isLoginFailed = true;
                   }else if(message == "Account is temporarily locked"){
                     console.log("Account is temporarily locked");
                     this.isBlockedAccount = true;
                   }else if(message == "Account is unactivated"){
                     this.isActivationPending = true;

                    Swal.fire({
                      title: this.translate.instant("login.This account has not been activated yet"),
                      text:this.translate.instant("login.Swal resend email text"),
                      icon: "warning",
                      showCloseButton: true,
                      showConfirmButton: true,
                      showCancelButton: true,
                      focusConfirm: false,
                      confirmButtonText:this.translate.instant("login.resendEmail"),
                      cancelButtonText:this.translate.instant("login.contactSupport"),
                      confirmButtonColor: '#3085d6',
                      cancelButtonColor: '#3085d6',
                    }).then((result) => {
                      //console.log(result)
                      if (result.value) {
                        //console.log(this.userEmail)
                        var param = {"email": this.userEmail, "lang": this.translate.store.currentLang, "type": "resendEmail"};
                        this.subscription.add( this.http.post(environment.api+'/api/sendEmail',param)
                        .subscribe( (res : any) => {
                          console.log(res.message)
                          if(res.message=='Email resent'){
                            this.emailResent = true;
                            this.errorAccountActivated = false;
                            this.supportContacted = false
                            this.isActivationPending= false
                          }
                        }, (err) => {
                          console.log(err);
                          this.errorAccountActivated = true;
                        }
                      ));
                    }else{
                      //console.log("support")
                      //console.log(this.userEmail)
                      var param = {"email": this.userEmail, "lang": this.translate.store.currentLang, "type": "contactSupport"};
                      this.subscription.add( this.http.post(environment.api+'/api/sendEmail',param)
                      .subscribe( (res : any) => {
                        console.log(res.message)
                        if(res.message=='Support contacted'){
                          this.supportContacted = true
                          this.errorAccountActivated = false;
                          this.emailResent = false;
                          this.isActivationPending= false
                        }
                      }, (err) => {
                        console.log(err);
                        this.errorAccountActivated = true;
                      }
                    ));
                    }

                    });

                     //Swal.fire(this.translate.instant("generics.Warning"),this.translate.instant("login.The account is not activated"), "error");
                   }else if(message == "Account is blocked"){
                     this.isBlocked = true;
                   }
      		    }
    	       }
    	   ));
      }

    }

    createPatient(){
      if(this.authGuard.testtoken()){
        this.sending = true;

        var random_name = Math.random().toString(36).substr(2, 9);

        this.patient = {
          patientName: 'case-'+random_name,
          surname: '',
          street: '',
          postalCode: '',
          citybirth: '',
          provincebirth: '',
          countrybirth: null,
          city: '',
          province: '',
          country: null,
          phone1: '',
          phone2: '',
          birthDate: null,
          gender: null,
          siblings: [],
          parents: [],
          actualStep: '0.0',
          stepClinic: '5.0'
        };

        if(this.authService.getSubRole()=='HaveDiagnosis'){
          this.callSwalName();
        }else{
          this.saveNewPatient();
        }
      }
    }

    callSwalName(){
      Swal.fire({
          title: this.translate.instant("patnodiagdashboard.step1-0.field1.title"),
          input: 'text',
          inputAttributes: {
            autocapitalize: 'off'
          },
          showCancelButton: false,
          confirmButtonText: 'Ok',
          showLoaderOnConfirm: true,
          allowOutsideClick: false
        }).then((result) => {
          if (result.value) {
            this.patient.patientName = result.value;
            this.saveNewPatient();
          }else{
            Swal.close();
            this.callSwalName();
          }
        })
    }

    saveNewPatient(){
      this.subscription.add( this.http.post(environment.api+'/api/patients/'+this.authService.getIdUser(), this.patient)
      .subscribe( (res : any) => {
        this.authService.setCurrentPatient(res.patientInfo);
        this.sending = false;
        //this.toastr.success('', this.msgDataSavedOk);
        if(this.authService.getCurrentPatient()!=null){
          //ir a la página para meter si tiene diganóstico o no
          var msg = this.translate.instant("dashboardpatient.msgIntro");
          if(this.authService.getSubRole()=='HaveDiagnosis'){
            msg = '<div class="text-left"><ol><li>'+this.translate.instant("welcome.diagnosismsg1")+'</li><li>'+this.translate.instant("welcome.diagnosismsg2")+'</li><li>'+this.translate.instant("welcome.diagnosismsg3")+'</li><li>'+this.translate.instant("welcome.diagnosismsg4")+'​</li><li>'+this.translate.instant("welcome.diagnosismsg5")+'​</li></ol></div>';
            Swal.fire({
              title: this.translate.instant("generics.Welcome to dx29"),
              html: msg,
              imageUrl: "assets/img/heartswal.jpg",
              width: "75%",
              confirmButtonText: 'OK'
            });

            let url =  this.authService.getRedirectUrl();
            this.router.navigate([ url ]);
          //}else if(this.authService.getSubRole()=='NoDiagnosis'){
          }else{
            //subrole NoDiagnosis y UncertainDiagnosis
            let url =  this.authService.getRedirectUrl();
            this.router.navigate([ url ], { queryParams: { actualStep: "0.0" } });
          }


          //this.router.navigate(['/clinical/diagnosis']);
        }
        //this.loadPatients();
       }, (err) => {
         console.log(err);
         this.sending = false;
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           console.log('error');
           //this.toastr.error('', this.msgDataSavedFail);
         }
       }));
    }

    launchDemo(){
      this.loginForm.value.email = 'demo@duchenne.org';
      this.loginForm.value.password = 'dddddddd';
      this.onSubmit();
    }

    // On Forgot password link click
    onForgotPassword() {
        this.router.navigate(['/forgotpassword']);
    }
    // On registration link click
    onRegister() {
        this.router.navigate(['/register']);
    }

    testHotjarTrigger(lang){
      var scenarioHotjar = 'generalincoming_en'
      if(lang=='es'){
        scenarioHotjar = 'generalincoming_es'
      }
      var eventsLang = this.inj.get(EventsService);
      var ojb = {lang: lang, scenario: scenarioHotjar};
      eventsLang.broadcast('changeEscenarioHotjar', ojb);
    }
}
