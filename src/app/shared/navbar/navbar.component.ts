import { Component, Output, EventEmitter, OnDestroy, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { NgForm } from '@angular/forms';
import { AuthService } from 'app/shared/auth/auth.service';
import { SortService} from 'app/shared/services/sort.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { PatientService } from 'app/shared/services/patient.service';
import { Data } from 'app/shared/services/data.service';
import Swal from 'sweetalert2';
import { EventsService} from 'app/shared/services/events.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { SearchService } from 'app/shared/services/search.service';
import { ExomiserService } from 'app/shared/services/exomiser.service';
import { Subscription } from 'rxjs/Subscription';

import { LayoutService } from '../services/layout.service';
import { ConfigService } from '../services/config.service';

declare var device;
declare global {
    interface Navigator {
      app: {
          exitApp: () => any; // Or whatever is the type of the exitApp function
      }
    }
}

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
  providers: [PatientService, ExomiserService, ApiDx29ServerService]
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  currentLang = "en";
  toggleClass = "ft-maximize";
  placement = "bottom-right";
  public isCollapsed = true;
  layoutSub: Subscription;
  @Output()
  toggleHideSidebar = new EventEmitter<Object>();

  public config: any = {};

  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    isAndroid: boolean = false;
    patients: any;
    currentPatient: any = {};
    redirectUrl: string = '';
    actualUrl: string = '';
    email: string = '';
    role: string = 'User';
    roleShare: string = 'Clinical';
    modalReference: NgbModalRef;
    @ViewChild('f') sendForm: NgForm;
    sending: boolean = false;
    revonking: boolean = false;
    listOfSharingAccounts: any = [];
    permissions: any = {};
    selectedPatient: any = {};
    shareWithObject: any = {};
    isMine: boolean = false;
    message: string = '';
    indexPermissions: number = -1;
    loading: boolean = true;
    myUserId: string = '';
    myEmail: string = '';
    actualStep: string = "0.0";
    maxStep: string = "0.0";
    isHomePage: boolean = false;
    isClinicalPage: boolean = false;
    age: any = {};
    showintrowizard: boolean = true;
    tasks: any = [];
    private subscription: Subscription = new Subscription();

  constructor(public translate: TranslateService, private layoutService: LayoutService, private configService:ConfigService, private authService: AuthService, private router: Router, private route: ActivatedRoute, private patientService: PatientService, private modalService: NgbModal, private http: HttpClient, private sortService: SortService, private dataservice: Data, private eventsService: EventsService, public exomiserService:ExomiserService, private apiDx29ServerService: ApiDx29ServerService, private searchService: SearchService) {
    if (this.isApp){
        if(device.platform == 'android' || device.platform == 'Android'){
          this.isAndroid = true;
        }
      }

    this.role = this.authService.getRole();
    this.redirectUrl = this.authService.getRedirectUrl();

    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(
      event => {
        var tempUrl= (event.url).toString().split('?');
        this.actualUrl = tempUrl[0];
        var tempUrl1 = (this.actualUrl).toString();
        console.log(tempUrl1);
        if(tempUrl1.indexOf('/dashboard')!=-1){
          this.isHomePage = true;
          this.isClinicalPage = false;
        }else{
          if(tempUrl1.indexOf('/clinical/diagnosis')!=-1){
            this.isClinicalPage = true;
          }else{
            this.isClinicalPage = false;
          }
          this.isHomePage = false;
        }

      }
    );
    console.log(this.role);
    if(this.role != 'SuperAdmin' && this.role != 'Admin'){
      this.initVars();
    }

    this.layoutSub = layoutService.changeEmitted$.subscribe(
    direction => {
      const dir = direction.direction;
      if (dir === "rtl") {
        this.placement = "bottom-left";
      } else if (dir === "ltr") {
        this.placement = "bottom-right";
      }
    });

  }

  ngOnInit() {
    this.config = this.configService.templateConf;
    this.loadMyEmail();
    if(sessionStorage.getItem('lang')){
      this.currentLang = sessionStorage.getItem('lang');
    }
    this.eventsService.on('changelang', function(lang) {
      this.currentLang = lang;
    }.bind(this));

    this.eventsService.on('selectedPatient', function(selectedPatient) {
      this.selectedPatient= selectedPatient;
      console.log(this.selectedPatient);
      var dateRequest2=new Date(this.selectedPatient.birthDate);
      this.ageFromDateOfBirthday(dateRequest2);
    }.bind(this));

    this.eventsService.on('actualStep', function(actualStep) {
      this.actualStep= this.dataservice.steps.actualStep;
    }.bind(this));

    this.eventsService.on('maxStep', function(maxStep) {
      this.maxStep= this.dataservice.steps.maxStep;
    }.bind(this));

    this.eventsService.on('showIntroWizard', function(showintrowizard) {
      this.showintrowizard= showintrowizard;
    }.bind(this));
    this.eventsService.on('exoservice', function(exoservice) {
      var foundElement = this.searchService.search(this.tasks,'token', exoservice.token);
      if(!foundElement){
        this.tasks.push({token:exoservice.token, status: 'Created', patientName: exoservice.patientName});
      }
      this.checkExomiser(exoservice.patientId, exoservice.token, exoservice.patientName);
    }.bind(this));
  }

  ageFromDateOfBirthday(dateOfBirth: any){
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    var months;
    var age =0;
    age = today.getFullYear() - birthDate.getFullYear();
    months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months -= birthDate.getMonth();
    months += today.getMonth();
    var res = months <= 0 ? 0 : months;
    var m=res % 12;
    /*var age =0;
    if(res>0){
      age= Math.abs(Math.round(res/12));
    }*/
    this.age = {years:age, months:m }
  }

  loadMyEmail(){
    this.subscription.add( this.http.get(environment.api+'/api/users/email/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        this.myEmail = res.email;
      }, (err) => {
        console.log(err);
      }));
  }

  ngAfterViewInit() {
    if(this.config.layout.dir) {
      const dir = this.config.layout.dir;
        if (dir === "rtl") {
          this.placement = "bottom-left";
        } else if (dir === "ltr") {
          this.placement = "bottom-right";
        }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  ToggleClass() {
    if (this.toggleClass === "ft-maximize") {
      this.toggleClass = "ft-minimize";
    } else {
      this.toggleClass = "ft-maximize";
    }
  }

  toggleNotificationSidebar() {
    this.layoutService.emitChange(true);
  }

  toggleSidebar() {
    const appSidebar = document.getElementsByClassName("app-sidebar")[0];
    if (appSidebar.classList.contains("hide-sidebar")) {
      this.toggleHideSidebar.emit(false);
    } else {
      this.toggleHideSidebar.emit(true);
    }
  }

  logout() {
      this.authService.logout();
      this.router.navigate([this.authService.getLoginUrl()]);
  }

  exit() {
      navigator.app.exitApp();
  }

  initVars(){
      //coger parámetros por si viene de modulo de visitas
      this.subscription.add( this.route.params.subscribe(params => {
        if(this.dataservice.storage!=undefined){
          if(this.dataservice.storage.roleShare!=undefined){
            this.roleShare = this.dataservice.storage.roleShare;
          }
        }
      }));

      this.email = '';
      this.permissions.shareEmr = true;
      this.permissions.askFirst = false;
      this.permissions.shareWithAll = false;
      this.loadPatients();
      this.myUserId= this.authService.getIdUser()
    }

    shareApp(shareTo){
      this.initVars();
      if(this.authService.getCurrentPatient()==null){
        this.loadPatientId(shareTo);
      }else{
        this.openModal(shareTo);
      }
    }

    loadPatientId(shareTo){
      this.subscription.add( this.patientService.getPatientId()
      .subscribe( (res : any) => {
        this.authService.setCurrentPatient(res);

        this.openModal(shareTo);
        //.sub
       }, (err) => {
         console.log(err);
       }));
    }

    openModal(shareTo){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl'
      };
      console.log(this.authService.getCurrentPatient());
      if(this.authService.getCurrentPatient()!=null){
        this.selectedPatient = this.authService.getCurrentPatient();
        this.isMine = false;
        for (var i = 0; i < this.patients.length; i++) {
          if(this.selectedPatient.sub==this.patients[i].sub){
            if(this.patients[i].permissions!=undefined){
              this.permissions = this.patients[i].permissions
            }else{
              this.permissions.shareEmr = true;
              this.permissions.askFirst = false;
              this.permissions.shareWithAll = false;
            }
          }

          if(this.patients[i].sub == this.selectedPatient.sub){
            this.isMine = this.patients[i].ismine;
          }
        }
      }
      this.modalReference = this.modalService.open(shareTo, ngbModalOptions);
    }

    submitInvalidForm() {
      if (!this.sendForm) { return; }
      const base = this.sendForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    loadDataFromSharingAccounts(){
      this.listOfSharingAccounts = [];
      if(this.patients.length>0){
        this.subscription.add( this.http.post(environment.api+'/api/sharingaccountsclinical/'+this.authService.getIdUser(), this.patients)
        .subscribe( (res2 : any) => {
          res2.sort(this.sortService.DateSort("date"));
          console.log(res2);
          this.listOfSharingAccounts = res2;
          this.loading = false;
         }, (err) => {
           console.log(err);
           this.listOfSharingAccounts = [];
           this.loading = false;
         }));
      }else{
        this.loading = false;
      }

    }

    confirmRevokePermission(i){
      Swal.fire({
          title: this.translate.instant("generics.Are you sure?"),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("generics.Delete"),
          cancelButtonText: this.translate.instant("generics.No, cancel"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false,
          reverseButtons:true
      }).then((result) => {
        if (result.value) {
          this.revokePermission(i);
        }
      });
    }

    revokePermission(i){
      this.revonking = true;
      console.log(this.listOfSharingAccounts[i]);

      var patientId = this.listOfSharingAccounts[i].patientid;
      var userId = this.listOfSharingAccounts[i]._id;
      var objectData = { userId: userId};
      console.log(objectData);
      this.subscription.add( this.http.post(environment.api+'/api/revokepermission/'+patientId, objectData)
      .subscribe( (res : any) => {
        this.revonking = false;
        console.log(res);
        this.loadDataFromSharingAccounts();
       }, (err) => {
         console.log(err);
         this.revonking = false;
       }));
    }

    inviteShare(){
      if(this.email == this.myEmail){
        Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("permissions.Notsharewithyourself"), "warning");
      }else{
        this.sending = true;
        var params:any = {};
        //params.userId = this.authService.getIdUser();
        params.lang = this.authService.getLang()
        params.email = this.email;
        params.role = this.roleShare;

        params.account = {};
        var patientparams = this.authService.getCurrentPatient();
        console.log(this.selectedPatient);

        this.patients.forEach(function(element) {
          if(element.sub  == this.selectedPatient.sub){
            if(element.alias){
              element.patientName = element.alias;
            }
            params.account.patientName = element.patientName;
            params.account.sub = element.sub;
          }
        }.bind(this));

        params.permissions = this.permissions;
        if((!this.isMine && !params.permissions.shareWithAll) || (!this.isMine && params.permissions.askFirst)){
          params.state = 'Pending'
        }else{
          params.state = '';
        }

        params.message=this.message

        if(this.isMine){
          //params.message =''
          params.isMine = true;
        }else{
          params.isMine = false;
        }
        params.ownerID = this.authService.getIdUser()
        if(params.role=='User'){
          params.state = '';
        }
        var alreadyShared = false;
        for (var i = 0; i < this.listOfSharingAccounts.length; i++) {
          if(this.listOfSharingAccounts[i].patientid==params.account.sub && this.listOfSharingAccounts[i].email==params.email){
            alreadyShared = true;
          }
        }
        if(!alreadyShared){
          this.subscription.add( this.http.post(environment.api+'/api/shareorinvite',params)
            .subscribe( (res : any) => {
              console.log(res);
              if(params.role == 'User'){
                if(res.message == 'Email sent'){
                  this.initVars();
                  //this.modalReference.close();
                  Swal.fire('Done', this.translate.instant("dashboardpatient.The invitation has been sent successfully"), "success");
                }else if(res.message == 'Data sharing has been requested'){
                  this.initVars();
                  Swal.fire('Done', this.translate.instant("permissions.Request completed"), "success");
                }else if(res.message == 'There is already an account with that email'){
                  Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("dashboardpatient.There is already an account with that email"), "warning");
                }else{
                  Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
                }
              }else{
                if(res.message == 'A request has been submitted for the creation of a new account at Dx29'){
                  Swal.fire('Done', this.translate.instant("permissions.A request has been submitted"), "success");
                }else if(res.message == 'Patient sharing done and email sent'){
                  Swal.fire('Done', this.translate.instant("permissions.Patient sharing done"), "success");
                }else{
                  Swal.fire('Done', res.message, "success");
                }
                this.initVars();
               // this.modalReference.close();
              }
              this.loadDataFromSharingAccounts();


              this.sending = false;
             }, (err) => {
               console.log(err);
               Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");

               this.sending = false;
             }));
        }else{
          this.sending = false;
            var msg= this.translate.instant("GeneticProgram.msgresult5.1")+ " "+params.account.patientName+ " "+ this.translate.instant("GeneticProgram.msgresult5.2")+ " "+params.email;
            Swal.fire(this.translate.instant("generics.Warning"), msg, "error");


        }
      }
    }

    resend(i){
      console.log('test');
      console.log(this.listOfSharingAccounts[i]);
      this.sending = true;
      var params:any = {};
      //params.userId = this.authService.getIdUser();
      params.lang = this.authService.getLang()
      params.email = this.listOfSharingAccounts[i].email;
      params.role = this.listOfSharingAccounts[i].role;
      params.account = {};
      var patientparams = this.authService.getCurrentPatient();
      params.account.patientName = patientparams.patientName;
      params.account.sub = patientparams.sub;

      params.internalmessage = this.listOfSharingAccounts[i].internalmessage;

      this.subscription.add( this.http.post(environment.api+'/api/resendshareorinvite',params)
        .subscribe( (res : any) => {
          console.log(res);
          if(params.role == 'User'){
            if(res.message == 'Email sent'){
              this.initVars();
              //this.modalReference.close();
              Swal.fire('Done', this.translate.instant("dashboardpatient.The invitation has been sent successfully"), "success");
            }else if(res.message == 'There is already an account with that email'){
              Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("dashboardpatient.There is already an account with that email"), "warning");
            }else{
              Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
            }
          }else{
            Swal.fire('Done', res.message, "success");
            this.initVars();
           // this.modalReference.close();
          }
          this.loadDataFromSharingAccounts();


          this.sending = false;
         }, (err) => {
           console.log(err);
           Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");

           this.sending = false;
         }));
    }

    loadPatients(){
      this.loading = true;
      this.subscription.add( this.patientService.getPatientsClinical()
      .subscribe( (res : any) => {
        res.sort(this.sortService.GetSortOrderNames("patientName"));
        this.patients = [];
        res.forEach(function(element) {
          if(!element.isArchived){
            element.ismine = true;
            this.patients.push(element);
          }
        }.bind(this));
        this.loadSharedPatients();
      }, (err) => {
        console.log(err);
      }));
    }

    loadSharedPatients(){
      this.subscription.add( this.http.get(environment.api+'/api/sharedcase/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        (res.listpatients).forEach(function(element) {
          element.ismine = false;
          this.patients.push(element);
        }.bind(this));
        this.patients.sort(this.sortService.GetSortOrderNames("patientName"));
        this.loadDataFromSharingAccounts();
        this.checkStatusServices();
      }, (err) => {
        console.log(err);
      }));
    }

    onChangePatient(value){
      this.isMine = false;
      for (var i = 0; i < this.patients.length; i++) {
        if(value.sub==this.patients[i].sub){
          if(this.patients[i].permissions!=undefined){
            this.permissions = this.patients[i].permissions
          }else{
            this.permissions.shareEmr = true;
            this.permissions.askFirst = false;
            this.permissions.shareWithAll = false;
          }
          this.isMine = this.patients[i].ismine;
        }
      }
    }

    changePermissions(index, contentChangePermissions){
      this.shareWithObject = this.listOfSharingAccounts[index];
      //this.permissions = this.listOfSharingAccounts[index].permissions;
      this.indexPermissions = index;
      console.log(this.indexPermissions);
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl'
      };
      this.modalReference = this.modalService.open(contentChangePermissions, ngbModalOptions);

    }

    setPermissions(type){
      if(type=='askFirst'){
        if(this.listOfSharingAccounts[this.indexPermissions].permissions.shareWithAll){
          this.listOfSharingAccounts[this.indexPermissions].permissions.shareWithAll = false
        }
      }else if(type=='shareWithAll'){
        if(this.listOfSharingAccounts[this.indexPermissions].permissions.askFirst){
          this.listOfSharingAccounts[this.indexPermissions].permissions.askFirst = false
        }
      }
      var patientparams = this.authService.getCurrentPatient();
      var patientId = patientparams.sub;
      //var patientId = this.currentPatient.sub;
       this.subscription.add( this.http.post(environment.api+'/api/setpermission/'+patientId, this.listOfSharingAccounts)
       .subscribe( (res : any) => {
         console.log(res)
       }))
   }

   setPermissionsForm(type){
     if(type=='askFirst'){
       if(this.permissions.shareWithAll){
         this.permissions.shareWithAll = false
       }
     }else if(type=='shareWithAll'){
       if(this.permissions.askFirst){
         this.permissions.askFirst = false
       }
     }
   }

   closeContentChangePermissions(shareTo){
     if(this.modalReference!=undefined){
       this.modalReference.close();
     }
     let ngbModalOptions: NgbModalOptions = {
           backdrop : 'static',
           keyboard : false,
           windowClass: 'ModalClass-xl'
     };

     this.modalReference = this.modalService.open(shareTo, ngbModalOptions);
   }

   resizeTextArea(){

     setTimeout(() =>
     {
       $('.autoajustable').each(function () {
         document.getElementById("textarea1").setAttribute( "style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden; width: 100%;");

      }).on('input', function () {
          this.style.height = 'auto';
          this.style.height = (this.scrollHeight) + 'px';
      });

     },
     100);
   }

   acceptReject(index, type){
     var actualLang = this.authService.getLang()
     var paramssend = { patient: this.listOfSharingAccounts[index].patientid, email: this.listOfSharingAccounts[index].email, state: type, lang: actualLang };

     this.subscription.add( this.http.post(environment.api+'/api/updatepermissions',paramssend)
     .subscribe( (res : any) => {
       if(res.message == 'Patient not found'){
         Swal.fire('', 'Patient not found', "success");
       }else if(res.message == 'UserId not found'){
         Swal.fire('', 'The user to whom you give permission, no longer exists.', "success");
       }else{
         if(res.message == 'Accepted'){
           Swal.fire('', this.translate.instant("generics.Accept"), "success");
         }else{
           Swal.fire('', this.translate.instant("generics.Reject"), "warning");
         }
       }
       this.loadDataFromSharingAccounts();
      }, (err) => {
        //errores de fallos
        Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
      }));

   }

   startWizardAgain(){
     Swal.fire({
         title: this.translate.instant("diagnosis.wizardquestionlaunch"),
         icon: 'warning',
         showCancelButton: true,
         confirmButtonColor: '#0CC27E',
         cancelButtonColor: '#f9423a',
         confirmButtonText: this.translate.instant("generics.Yes"),
         cancelButtonText: this.translate.instant("generics.No"),
         showLoaderOnConfirm: true,
         allowOutsideClick: false,
         reverseButtons:true
     }).then((result) => {
       if (result.value) {

         if(this.showintrowizard){
           this.goToStep('0.0', true, '0.0')
         }else{
           this.goToStep('1.0', true, '1.0')
         }
       }
     });

   }

   goToStep(index, save, maxStep){
     var info = {step: index, save: save, maxStep: maxStep}
     this.eventsService.broadcast('infoStep', info);
   }

   goToReports(){
     this.eventsService.broadcast('setStepWizard', 'reports');
   }

   checkStatusServices(){
     for(var i = 0; i < this.patients.length; i++){
       this.checkServices(this.patients[i].sub, this.patients[i].patientName);
     }
   }

   checkServices(patientId, patientName){
     // Find if the patient has pending works
     this.subscription.add( this.apiDx29ServerService.getPendingJobs(patientId)
     .subscribe( (res : any) => {
       if(res.exomiser!=undefined){
         if(res.exomiser.length>0){
           console.log("Check services... true")
           var actualToken=res.exomiser[res.exomiser.length-1]
           this.checkExomiser(patientId, actualToken, patientName);
         }
       }
     }, (err) => {
       console.log(err);
     }));
   }

   checkExomiser(patientId, actualToken, patientName){
     // Llamar al servicio
     this.subscription.add( this.exomiserService.checkExomiserStatusNavBar(patientId, actualToken)
       .subscribe( async (res2 : any) => {
         if(res2.res.status=='Running'){

         }
         var foundElement = this.searchService.search(this.tasks,'token', res2.res.token);
         if(!foundElement){
           this.tasks.push({token:res2.res.token, status: res2.res.status, patientName: patientName, patientId: patientId});
         }else{
           var found=false;
           for(var i = 0; i < this.tasks.length && !found; i++){
             if(this.tasks[i].token==res2.res.token){
               if(res2.res.status=='Running'){
                 this.tasks[i].status =res2.res.status;
               }else if(res2.res.status=='Succeeded' || res2.res.status=='Failed'){
                 found=true;
                 this.tasks.push({token:res2.res.token, status: res2.res.status, patientName: patientName, patientId: patientId});
                 //this.deleteTask(i);
               }

             }

           }
         }

         if(res2.message=="something pending"){
           await this.delay(5000);
           this.checkExomiser(patientId, actualToken, patientName);
         }
        }, (err) => {
          console.log(err);
          //this.manageErrorsExomiser("type1",err);
        }));
   }

   delay(ms: number) {
       return new Promise( resolve => setTimeout(resolve, ms) );
   }

   deleteTask(index){
     var res = [];
     for(var i = 0; i < this.tasks.length; i++){
       if(i!=index){
         res.push(this.tasks[i]);
       }
      }
    this.tasks = res;
   }

   clearNotifications(){
     this.tasks = [];
   }

   goToPatient(patientId, index){
     var found = false;
     for(var i = 0; i < this.patients.length && !found; i++){
       if(this.patients[i].sub==patientId){
         this.authService.setCurrentPatient(this.patients[i]);
         this.router.navigate(['/clinical/diagnosis2']);
         this.deleteTask(index);
       }
     }
   }

}
