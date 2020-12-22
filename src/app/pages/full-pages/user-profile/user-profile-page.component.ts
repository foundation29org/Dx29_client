import { Component, ViewChild, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { Router } from '@angular/router';
import { User } from './user.interface';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { PatientService } from 'app/shared/services/patient.service';
import { LangService } from 'app/shared/services/lang.service';
import Swal from 'sweetalert2';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
import { sha512 } from "js-sha512";
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-user-profile-page',
    templateUrl: './user-profile-page.component.html',
    styleUrls: ['./user-profile-page.component.scss'],
    providers: [LangService, PatientService]
})

@Injectable()
export class UserProfilePageComponent implements OnInit, OnDestroy {
    //Variable Declaration
    @ViewChild('f') userForm: NgForm;
    @ViewChild('fPass') passwordForm: NgForm;

    public user: User;
    private userCopy: User;
    langs: any;
    private msgDataSavedOk: string;
    private msgDataSavedFail: string;
    private msgDownload: string;
    loading: boolean = false;
    sending: boolean = false;
    activeTittleMenu: string = 'General';
    msgActiveTittleMenu: string = '';
    item: number = 0;
    tittleGeneral: string = '';
    tittlePassword: string = '';
    tittleExportData: string = '';
    tittlePermissions: string = '';
    credentials: any = {};
    role: string = '';
    subrole: string = '';
    symptomsPermissions:any = {shareWithCommunity:false};
    phenotype_id: string = '';
    private subscription: Subscription = new Subscription();

    constructor(private http: HttpClient, private authService: AuthService, public toastr: ToastrService, public translate: TranslateService, private authGuard: AuthGuard, private langService:LangService, private elRef: ElementRef, private router: Router, private dateService: DateService, private inj: Injector, private patientService: PatientService) {
      //obter las lista de idiomas
      this.loadLanguages();
     }

     ngOnDestroy() {
       this.subscription.unsubscribe();
     }

     loadLanguages() {
       this.subscription.add( this.langService.getLangs()
       .subscribe( (res : any) => {
         this.langs=res;
       }));
     }

    ngOnInit() {
      //cargar los datos del usuario
      this.loading = true;
      this.subscription.add( this.http.get(environment.api+'/api/users/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        console.log(res);
        this.user = res.user;
        this.userCopy = JSON.parse(JSON.stringify(res.user));
        this.role = res.user.role;
        this.subrole = res.user.subrole;
        this.loading = false;
        if(this.subrole == 'HaveDiagnosis'){
          //load the patient to get the shareWithCommunity value
          this.loadPatientId();
        }
       }, (err) => {
         console.log(err);
         this.loading = false;
       }));

       this.subscription.add( this.translate.onLangChange.subscribe((event: { lang: string, translations: any }) => {
         this.loadTranslations();
       }));

       this.loadTranslations();

       this.credentials = {
         password: '',
         password2: '',
         actualpassword: ''
       };
    }

    loadPatientId(){
      this.subscription.add( this.patientService.getPatientId()
      .subscribe( (res : any) => {
        //get data of permissions
        var para= this.authService.getCurrentPatient().sub;
        //cargar el fenotipo del usuario
        this.subscription.add( this.http.get(environment.api+'/api/symptoms/permissions/'+para)
        .subscribe( (res : any) => {
          if(res.message){

          }else{
            if(res.permissions!=undefined){
              if(res.permissions.length==0){
                this.symptomsPermissions = {shareWithCommunity:false};
              }else{
                this.symptomsPermissions = res.permissions[0];
              }
            }else{
              this.symptomsPermissions = {shareWithCommunity:false};
            }
            this.phenotype_id = res._id;
          }

        }, (err) => {
          console.log(err);
        }));
       }, (err) => {
         console.log(err);
       }));
    }

    changeStatePermissions(param){
      if(param == 'shareWithCommunity'){
        this.symptomsPermissions.shareWithCommunity = !this.symptomsPermissions.shareWithCommunity;
      }
      console.log(this.symptomsPermissions);
      this.setPermissions();
    }

    setPermissions(){
      this.subscription.add( this.http.put(environment.api+'/api/symptoms/changesharewithcommunity/'+this.phenotype_id, this.symptomsPermissions)
      .subscribe( (res : any) => {
        console.log(res);
       }, (err) => {
         console.log(err.error);
       }));
    }

    //traducir cosas
    loadTranslations(){
      this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
        this.msgDataSavedOk=res;
      });
      this.translate.get('generics.Data saved fail').subscribe((res: string) => {
        this.msgDataSavedFail=res;
      });
      this.translate.get('profile.General').subscribe((res: string) => {
        this.tittleGeneral=res;
        this.msgActiveTittleMenu = res;
      });
      this.translate.get('generics.Password').subscribe((res: string) => {
        this.tittlePassword=res;
      });
      this.translate.get('generics.ExportData').subscribe((res: string) => {
        this.tittleExportData=res;
      });
      this.translate.get('generics.Download').subscribe((res: string) => {
        this.msgDownload=res;
      });
      this.translate.get('permissions.Permissions').subscribe((res: string) => {
        this.tittlePermissions=res;
      });
    }

    onChangeLang(newValue, index) {
      this.translate.use(newValue);
      var eventsLang = this.inj.get(EventsService);
      eventsLang.broadcast('changelang', newValue);
      if(newValue=='es'){
        Swal.fire({ title: 'Los textos en este idioma pueden contener errores', text:  "Este idioma está en desarrollo. Los nombres de los síntomas y las enfermedades, así como sus descripciones y sinónimos pueden contener errores. Para mejorar las traducciones, por favor, envíanos cualquier error a support@foundation29.org", confirmButtonText: this.translate.instant("generics.Accept"),icon:"warning" })
      }
    }

    resetForm() {
      this.user= JSON.parse(JSON.stringify(this.userCopy));
      this.translate.use(this.user.lang);
      var eventsLang = this.inj.get(EventsService);
      eventsLang.broadcast('changelang', this.user.lang);
      this.toastr.warning('', this.translate.instant("generics.Restored data"));
    }

    submitInvalidForm() {
      if (!this.userForm) { return; }
      const base = this.userForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    onSubmit() {
      if(this.authGuard.testtoken()){
        this.sending = true;
        this.subscription.add( this.http.put(environment.api+'/api/users/'+this.authService.getIdUser(), this.user)
        .subscribe( (res : any) => {
          this.user = res.user;
          this.userCopy = JSON.parse(JSON.stringify(res.user));
          this.authService.setLang(this.user.lang);
          this.translate.use(this.user.lang);
          var eventsLang = this.inj.get(EventsService);
          eventsLang.broadcast('changelang', this.authService.getLang());
          this.sending = false;
          this.toastr.success('', this.msgDataSavedOk);
         }, (err) => {
           console.log(err);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail);
           }
         }));
       }
    }


  SetActive(event, panelId: string) {
      var hElement: HTMLElement = this.elRef.nativeElement;
      //now you can simply get your elements with their class name
      var allAnchors = hElement.getElementsByClassName('list-group-item');
      //do something with selected elements
      [].forEach.call(allAnchors, function (item: HTMLElement) {
        item.setAttribute('class', 'list-group-item no-border');
      });
      //set active class for selected item
      event.currentTarget.setAttribute('class', 'list-group-item bg-blue-grey bg-lighten-5 border-right-primary border-right-2');

      if (panelId === 'panelGeneral') {
        this.activeTittleMenu = "General";
        this.msgActiveTittleMenu = this.tittleGeneral;
      }else if (panelId === 'panelPassword') {
        this.activeTittleMenu = "Password";
        this.msgActiveTittleMenu = this.tittlePassword;
      }else if (panelId === 'PanelExportData') {
        this.activeTittleMenu = "ExportData";
        this.msgActiveTittleMenu = this.tittleExportData;
      }else if (panelId === 'PanelPermissions') {
        this.activeTittleMenu = "Permissions";
        this.msgActiveTittleMenu = this.tittlePermissions;
      }



      $('.content-overlay').removeClass('show');
      $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
      $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');

    }

    toggleMenu(){
      if($('.chat-app-sidebar-toggle').hasClass('ft-align-justify')){
        $('.chat-app-sidebar-toggle').removeClass('ft-align-justify').addClass('ft-x');
        $('.chat-sidebar').removeClass('d-none d-sm-none').addClass('d-block d-sm-block');
        $('.content-overlay').addClass('show');
      }else{
        $('.content-overlay').removeClass('show');
        $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
        $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');
      }
    }

    submitInvalidPassForm() {
      if (!this.passwordForm) { return; }
      const base = this.passwordForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched();
        }
      }
    }

    onSubmitPass(){
      this.sending = true;

      this.passwordForm.value.actualpassword=sha512(this.passwordForm.value.actualpassword);
        this.passwordForm.value.password=sha512(this.passwordForm.value.password);
        var paramssend = { email: this.user.email, actualpassword: this.passwordForm.value.actualpassword, newpassword: this.passwordForm.value.password};

        this.subscription.add( this.http.post(environment.api+'/api/newpass',paramssend)
        .subscribe( (res : any) => {


            if(res.message == "password changed"){
              Swal.fire('', this.translate.instant("recoverpass.Password changed"), "success");
            }else if(res.message == "Login failed" || res.message == "Not found"){
              Swal.fire('', this.translate.instant("profile.The current password is incorrect"), "error");
            }else if(res.message == "Account is temporarily locked"){
              Swal.fire('', this.translate.instant("login.Account is temporarily locked"), "error");
              this.authService.logout();
              this.router.navigate([this.authService.getLoginUrl()]);
            }else if(res.message == "Account is unactivated"){
              Swal.fire('', this.translate.instant("login.The account is not activated"), "error");
            }
            this.sending = false;
            this.passwordForm.reset();
         }, (err) => {
           //errores de fallos
           var errormsg=err.error.message;
           Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again")+' error: '+ errormsg, "error");
           this.sending = false;
           this.passwordForm.reset();
         }));

    }

    exportData(){
      //cargar los datos del usuario
      this.loading = true;
      document.getElementById('content').innerHTML = "";
      this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        console.log(res.listpatients)
        if(res.listpatients.length>0){
          this.authService.setPatientList(res.listpatients);
          this.authService.setCurrentPatient(res.listpatients[0]);
          this.subscription.add( this.http.get(environment.api+'/api/exportdata/'+res.listpatients[0].sub)
          .subscribe( (res : any) => {
            console.log(res);
            var json = JSON.stringify(res);
      			var blob = new Blob([json], {type: "application/json"});
      			var url  = URL.createObjectURL(blob);
            var p = document.createElement('p');
            var t = document.createTextNode(this.msgDownload+":");
            p.appendChild(t);
            document.getElementById('content').appendChild(p);

            var a = document.createElement('a');
            var dateNow = new Date();
            var stringDateNow = this.dateService.transformDate(dateNow);
      			a.download    = "dataHealth29_"+stringDateNow+".json";
      			a.href        = url;
      			a.textContent = "dataHealth29_"+stringDateNow+".json";

      			document.getElementById('content').appendChild(a);
            this.loading = false;
           }, (err) => {
             console.log(err);
             this.loading = false;
           }));
        }else{
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.There is no patient data to export"), "warning");
          this.loading = false;
        }
       }, (err) => {
         console.log(err);
         this.loading = false;
       }));
    }

}
