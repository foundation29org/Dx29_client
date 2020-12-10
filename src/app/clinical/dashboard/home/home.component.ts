import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { SortService} from 'app/shared/services/sort.service';
import { PatientService } from 'app/shared/services/patient.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { DateService } from 'app/shared/services/date.service';
import Swal from 'sweetalert2';
import * as chartsData from 'app/shared/configs/steps-fitbit-charts.config';
import { ToastrService } from 'ngx-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { LocalDataSource } from 'ng2-smart-table';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

let listOfDiseasesFilter = [];

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    providers: [PatientService]
})

export class HomeComponent implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild('newPatientform') newPatientform: NgForm;
  group: string;
  nameundiagnosed: string = 'Undiagnosed';
  oneTime: boolean= false;
  loadingPatients: boolean = false;
  //variables para el fenotipo
  numSymptoms: number = 0;
  loadingPhenotype: boolean = false;
  relatedConditions: any = {};
  gettingRelatedConditions: boolean = false;

  //variables para el genotipo
  numVariants: number = 0;
  loadingGenotype: boolean = false;
  actualLang: string = '';
  patients: any = [];
  patientsCopy: any = [];
  listOfArchivedCases: any = [];
  selectedPatient: any = {};
  patient: any;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  sending: boolean = false;
  role: string = '';
  alertSource: LocalDataSource;
  alertSourceCasesArchived: LocalDataSource;
  alertsettings: any = {};
  alertsettingsCasesArchived: any = {};
  modalReference: NgbModalRef;

  accessToken: IBlobAccessToken = {
     // tslint:disable-next-line:max-line-length
     sasToken: environment.blobAccessToken.sasToken,
     blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
     containerName: '',
     patientId: ''
  };
  changeName: any = {};
  changeNameShared: any = {};
  panelOpenState: boolean = false;

  listOfSharedCases: any = [];
  loadingSharedCases: boolean = false;
  alertSourceCasesShared: LocalDataSource;
  alertsettingsCasesShared: any = {};
  myEmail: string = '';
  moreInfoCaseEvent: any = {};
  moreInfoCaseData: any = {};
  loadedInfoPatient: boolean = false;
  patientEmail: string = '';

  countries: any;
  listOfDiseases: any = [];
  loadedListOfDiseases: boolean = false;
  modelTemp: any;
  formatter1 = (x: { name: string }) => x.name;
  // Flag search
  searchDisease = (text$: Observable<string>) =>
  text$.pipe(
    debounceTime(200),
    map(term => term === '' ? []
      : ((listOfDiseasesFilter.filter(
        v =>  {
          var finish = false;
          if((v.id.toLowerCase().indexOf(term.toLowerCase().trim()) > -1)){
            finish = true;
            return v;
          }
          if((v.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()) > -1) && !finish){
            finish = true;
            return v;
          }
          for (var i = 0; i <  v.synonyms.length && !finish; i++) {
            if((v.synonyms[i].toLowerCase().indexOf(term.toLowerCase().trim()) > -1)){
              return v;
              break;
            }
          }
        })))
    )
  );
  isNewPatient: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private sanitizer: DomSanitizer, private router: Router, private dateService: DateService,  private patientService: PatientService, public searchFilterPipe: SearchFilterPipe, public toastr: ToastrService, private authGuard: AuthGuard,
    private sortService: SortService, private blob: BlobStorageService, private modalService: NgbModal){
      this.actualLang = this.authService.getLang();
      this.group = this.authService.getGroup();
      this.role = this.authService.getRole();
      this.loadInfo();
      this.loadSharedPatients();
      this.loadMyEmail();
    }

    loadCountries(){
      this.subscription.add( this.http.get('assets/jsons/countries.json')
      .subscribe( (res : any) => {
        this.countries=res;
      }, (err) => {
        console.log(err);
      }));
    }

    loadListOfDiseases(){
      this.loadedListOfDiseases = false;
      this.subscription.add( this.http.get('assets/jsons/diseases_'+this.actualLang+'.json')
      //this.subscription.add( this.http.get('https://f29bio.northeurope.cloudapp.azure.com/api/BioEntity/diseases/'+lang+'/all')
       .subscribe( (res : any) => {
         this.listOfDiseases = res;
         listOfDiseasesFilter = res;
         this.loadedListOfDiseases = true;
        }, (err) => {
          console.log(err);
          this.loadedListOfDiseases = true;
        }));
    }

    selected2(i) {
      console.log(i.item.id);
      this.patient.previousDiagnosis = i.item.id;
      this.modelTemp = '';
    }

    loadSharedPatients(){
      this.loadingSharedCases = true;
      this.subscription.add( this.http.get(environment.api+'/api/sharedcase/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        res.listpatients.sort(this.sortService.GetSortOrderNames("alias"));
        this.listOfSharedCases = res.listpatients;
        console.log(this.listOfSharedCases);

        for (var i = 0; i <  this.listOfSharedCases.length; i++) {
          //this.listOfSharedCases[i].patientName = '<span class="spantolink primary">'+this.listOfSharedCases[i].patientName+'</span>'
          if(this.listOfSharedCases[i].status == 'analyzed'){
             this.listOfSharedCases[i].status = '<span class="success">'+this.translate.instant("diagnosis.Analyzed")+'</span>';
          }else if(this.listOfSharedCases[i].status == 'new'){
             this.listOfSharedCases[i].status = '<span class="danger">'+this.translate.instant("generics.New")+'</span>';
          }

          if(this.listOfSharedCases[i].hasvcf){
             this.listOfSharedCases[i].hasvcf = '<span class="success">'+this.translate.instant("generics.Yes")+'</span>';
          }else{
             this.listOfSharedCases[i].hasvcf = '<span class="danger">'+this.translate.instant("generics.No")+'</span>';
          }

          if(this.listOfSharedCases[i].symptoms<2){
            this.listOfSharedCases[i].symptoms = '<span class="danger">'+this.translate.instant("diagnosis.Poor")+' ('+this.listOfSharedCases[i].symptoms+')'+'</span>';
          }else if(this.listOfSharedCases[i].symptoms>=2 && this.listOfSharedCases[i].symptoms<5){
            this.listOfSharedCases[i].symptoms = '<span class="warning">'+this.translate.instant("diagnosis.Low")+' ('+this.listOfSharedCases[i].symptoms+')'+'</span>';;
          }else if(this.listOfSharedCases[i].symptoms>=5 && this.listOfSharedCases[i].symptoms<10){
            this.listOfSharedCases[i].symptoms = '<span class="info">'+this.translate.instant("diagnosis.Medium")+' ('+this.listOfSharedCases[i].symptoms+')'+'</span>';;
          }else if(this.listOfSharedCases[i].symptoms>=10){
            this.listOfSharedCases[i].symptoms = '<span class="success">'+this.translate.instant("diagnosis.High")+' ('+this.listOfSharedCases[i].symptoms+')'+'</span>';;
          }
        }

        this.alertSourceCasesShared = new LocalDataSource(this.listOfSharedCases);
        this.alertsettingsCasesShared = {
          //actions: { columnTitle: '', add: false, edit: false , delete: true, position:'right'},<i title='+this.translate.instant("dashboardpatient.Rename")+' class="fa fa-info primary"></i> <i title='+this.translate.instant("dashboardpatient.Rename")+' class="fa fa-archive primary"></i>
          //actions: { columnTitle: '', add: false, edit: false , delete: true, position:'right', custom: [{ name: 'editShared', title: '<span class="primary mr-3">'+this.translate.instant("dashboardpatient.Rename")+'</span>'}, { name: 'moreInfoShared', title: '<span class="info mr-3">'+this.translate.instant("generics.More information")+'</span>'}]},
          actions: { columnTitle: this.translate.instant("generics.Options"), add: false, edit: false , delete: true, position:'right', custom: [{ name: 'moreInfoShared', title: '<i title='+this.translate.instant("generics.More information")+' class="fa fa-info fa-1_5x primary mr-3"></i>'},{ name: 'editShared', title: '<i title='+this.translate.instant("dashboardpatient.Rename")+' class="fa fa-pencil fa-1_5x primary mr-3"></i>'}, { name: 'share', title: '<i title='+this.translate.instant("generics.Share")+' class="fas fa-share fa-1_5x primary mr-3"></i>'}]},
          delete: {
            confirmDelete: true,
            deleteButtonContent: '<i title='+this.translate.instant("generics.Delete")+' class="fa fa-trash fa-1_5x danger"></i>'
            //deleteButtonContent: '<span class="danger">'+this.translate.instant("generics.Delete")+'</span>'
          },
          add: {
          confirmCreate: false,
          },
          edit: {
            confirmSave: false,
            editButtonContent: '<i class="ft-edit-2 info font-medium-1 mr-3"></i>'
          },
          columns: {
            alias: {
              title: 'Alias',
              placeholder: 'Alias',
              type: "html",
            },
            patientName: {
              title: this.translate.instant("diagnosis.Case"),
              placeholder: this.translate.instant("diagnosis.Case"),
              type: "html",
            },
            /*userName: {
              title: this.translate.instant("generics.Account name"),
              placeholder: this.translate.instant("generics.Account name"),
              type: "html",
            },*/
            date: {
              title: this.translate.instant("generics.Sharing date"),
              placeholder: this.translate.instant("generics.Sharing date"),
              type: "text",
              valuePrepareFunction: (value) => {
                return this.transformDate(value);
              },
              filterFunction: (value, search) => {
                let match = this.transformDate(value).indexOf(search) > -1
                if (match || search === '') { return true; }
                else { return false; }
              }
            },
            hasvcf: {
              title: this.translate.instant("diagnosis.Genetic information"),
              placeholder: this.translate.instant("generics.Yes")+'/'+this.translate.instant("generics.No"),
              type: "html",
            },
            symptoms: {
              title: this.translate.instant("phenotype.Number of symptoms"),
              placeholder: this.translate.instant("phenotype.Number of symptoms"),
              type: "html",
            },
            status: {
              title: this.translate.instant("generics.Status"),
              placeholder: this.translate.instant("generics.Yes")+'/'+this.translate.instant("generics.No"),
              type: "html"
            },
          },
          pager : {
              display : false
          },
          attr: {
            class: "table table-responsive"
          },
        };

        this.loadingSharedCases = false;
        console.log(res);
      }, (err) => {
        console.log(err);
        this.loadingSharedCases = false;
      }));
    }

    transformDate(value) {
      let newValue;
      var format = 'yyyy-MM-dd';
      if(this.actualLang == 'es'){
        format = 'dd-MM-yyyy'
      }
      newValue = this.dateService.transformFormatDate(value, format);
      return newValue;
    }

    loadInfo(){
      this.loadingPatients = true;
      this.patients = [];
      this.patientsCopy = [];
      this.subscription.add( this.http.get(environment.api+'/api/case/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        res.listpatients.sort(this.sortService.GetSortOrderNames("patientName"));
        this.listOfArchivedCases = [];

        res.listpatients.forEach(function(element) {
          if(element.isArchived){
            this.listOfArchivedCases.push(element);
          }else{
            this.patients.push(element);
            this.patientsCopy.push(element);
          }
        }.bind(this));

        //this.patients = JSON.parse(JSON.stringify(this.patientsCopy));
        //tratar los datos para la tabla
        for (var i = 0; i <  this.patientsCopy.length; i++) {
          //this.patientsCopy[i].patientName = '<span class="spantolink primary">'+this.patientsCopy[i].patientName+'</span>'
          if(this.patientsCopy[i].status == 'analyzed'){
             this.patientsCopy[i].status = '<span class="success">'+this.translate.instant("diagnosis.Analyzed")+'</span>';
          }else if(this.patientsCopy[i].status == 'new'){
             this.patientsCopy[i].status = '<span class="danger">'+this.translate.instant("generics.New")+'</span>';
          }

          if(this.patientsCopy[i].hasvcf){
             this.patientsCopy[i].hasvcf = '<span class="success">'+this.translate.instant("generics.Yes")+'</span>';
          }else{
             this.patientsCopy[i].hasvcf = '<span class="danger">'+this.translate.instant("generics.No")+'</span>';
          }

          if(this.patientsCopy[i].symptoms<2){
            this.patientsCopy[i].symptoms = '<span class="danger">'+this.translate.instant("diagnosis.Poor")+' ('+this.patientsCopy[i].symptoms+')'+'</span>';
          }else if(this.patientsCopy[i].symptoms>=2 && this.patientsCopy[i].symptoms<5){
            this.patientsCopy[i].symptoms = '<span class="warning">'+this.translate.instant("diagnosis.Low")+' ('+this.patientsCopy[i].symptoms+')'+'</span>';;
          }else if(this.patientsCopy[i].symptoms>=5 && this.patientsCopy[i].symptoms<10){
            this.patientsCopy[i].symptoms = '<span class="info">'+this.translate.instant("diagnosis.Medium")+' ('+this.patientsCopy[i].symptoms+')'+'</span>';;
          }else if(this.patientsCopy[i].symptoms>=10){
            this.patientsCopy[i].symptoms = '<span class="success">'+this.translate.instant("diagnosis.High")+' ('+this.patientsCopy[i].symptoms+')'+'</span>';;
          }
        }

        for (var i = 0; i <  this.listOfArchivedCases.length; i++) {
          //this.listOfArchivedCases[i].patientName = '<span class="spantolink primary">'+this.listOfArchivedCases[i].patientName+'</span>'
          if(this.listOfArchivedCases[i].status == 'analyzed'){
             this.listOfArchivedCases[i].status = '<span class="success">'+this.translate.instant("diagnosis.Analyzed")+'</span>';
          }else if(this.listOfArchivedCases[i].status == 'new'){
             this.listOfArchivedCases[i].status = '<span class="danger">'+this.translate.instant("generics.New")+'</span>';
          }

          if(this.listOfArchivedCases[i].hasvcf){
             this.listOfArchivedCases[i].hasvcf = '<span class="success">'+this.translate.instant("generics.Yes")+'</span>';
          }else{
             this.listOfArchivedCases[i].hasvcf = '<span class="danger">'+this.translate.instant("generics.No")+'</span>';
          }

          if(this.listOfArchivedCases[i].symptoms<2){
            this.listOfArchivedCases[i].symptoms = '<span class="danger">'+this.translate.instant("diagnosis.Poor")+' ('+this.listOfArchivedCases[i].symptoms+')'+'</span>';
          }else if(this.listOfArchivedCases[i].symptoms>=2 && this.listOfArchivedCases[i].symptoms<5){
            this.listOfArchivedCases[i].symptoms = '<span class="warning">'+this.translate.instant("diagnosis.Low")+' ('+this.listOfArchivedCases[i].symptoms+')'+'</span>';;
          }else if(this.listOfArchivedCases[i].symptoms>=5 && this.listOfArchivedCases[i].symptoms<10){
            this.listOfArchivedCases[i].symptoms = '<span class="info">'+this.translate.instant("diagnosis.Medium")+' ('+this.listOfArchivedCases[i].symptoms+')'+'</span>';;
          }else if(this.listOfArchivedCases[i].symptoms>=10){
            this.listOfArchivedCases[i].symptoms = '<span class="success">'+this.translate.instant("diagnosis.High")+' ('+this.listOfArchivedCases[i].symptoms+')'+'</span>';;
          }
        }

        //this.patientsCopy = res.listpatients;
        this.alertSourceCasesArchived = new LocalDataSource(this.listOfArchivedCases);
        this.alertSource = new LocalDataSource(this.patientsCopy);
        this.alertsettings = {
          //actions: { columnTitle: '', add: false, edit: false , delete: true, position:'right'},
          //actions: { columnTitle: '', add: false, edit: false , delete: true, position:'right', custom: [{ name: 'edit', title: '<span class="primary mr-3">'+this.translate.instant("dashboardpatient.Rename")+'</span>'}, { name: 'archive', title: '<span class="info mr-3">'+this.translate.instant("dashboardpatient.Archive")+'</span>'}]},
          actions: { columnTitle: this.translate.instant("generics.Options"), add: false, edit: false , delete: true, position:'right', custom: [{ name: 'edit', title: '<i title='+this.translate.instant("dashboardpatient.Rename")+' class="fa fa-pencil fa-1_5x primary mr-3"></i>'}, { name: 'archive', title: '<i title='+this.translate.instant("dashboardpatient.Archive")+' class="fa fa-archive fa-1_5x primary mr-3"></i>'}, { name: 'share', title: '<i title='+this.translate.instant("generics.Share")+' class="fas fa-share fa-1_5x primary mr-3"></i>'}]},
          //actions: { columnTitle: '', add: false, edit: false , delete: true, position:'right', custom: [{ name: 'edit', title: '<span class="primary">'+this.translate.instant("generics.Edit")+'</span>'}]},
          delete: {
            confirmDelete: true,
            deleteButtonContent: '<i title='+this.translate.instant("generics.Delete")+' class="fa fa-trash fa-1_5x danger"></i>'
            //deleteButtonContent: '<span class="danger">'+this.translate.instant("generics.Delete")+'</span>'
          },
          add: {
          confirmCreate: false,
          },
          edit: {
            confirmSave: false,
            editButtonContent: '<i class="ft-edit-2 info font-medium-1 mr-3"></i>'
          },
          columns: {
            patientName: {
            title: this.translate.instant("diagnosis.Case"),
            placeholder: this.translate.instant("diagnosis.Case"),
            type: "html",
            },
            hasvcf: {
            title: this.translate.instant("diagnosis.Genetic information"),
            placeholder: this.translate.instant("generics.Yes")+'/'+this.translate.instant("generics.No"),
            type: "html",
            },
            symptoms: {
            title: this.translate.instant("phenotype.Number of symptoms"),
            placeholder: this.translate.instant("phenotype.Number of symptoms"),
            type: "html",
            },
            status: {
              title: this.translate.instant("generics.Status"),
              placeholder: this.translate.instant("generics.Yes")+'/'+this.translate.instant("generics.No"),
              type: "html"
            },
          },
          pager : {
              display : false
          },
          attr: {
            class: "table table-responsive"
          },
        };

        this.alertsettingsCasesArchived = {
          //actions: { columnTitle: '', add: false, edit: false , delete: true, position:'right'},
          //actions: { columnTitle: '', add: false, edit: false , delete: true, position:'right', custom: [{ name: 'edit', title: '<span class="primary mr-3">Rename</span>'}, { name: 'restore', title: '<span class="info mr-3">Restore</span>'}]},
          actions: { columnTitle: this.translate.instant("generics.Options"), add: false, edit: false , delete: true, position:'right', custom: [{ name: 'edit', title: '<i title='+this.translate.instant("dashboardpatient.Rename")+' class="fa fa-pencil fa-1_5x primary mr-3"></i>'}, { name: 'restore', title: '<i title='+this.translate.instant("dashboardpatient.Restore")+' class="fa fa-undo fa-1_5x primary mr-3"></i>'}, { name: 'share', title: '<i title='+this.translate.instant("generics.Share")+' class="fas fa-share fa-1_5x primary mr-3"></i>'}]},
          //actions: { columnTitle: '', add: false, edit: false , delete: true, position:'right', custom: [{ name: 'edit', title: '<span class="primary">'+this.translate.instant("generics.Edit")+'</span>'}]},
          delete: {
            confirmDelete: true,
            deleteButtonContent: '<i title='+this.translate.instant("generics.Delete")+' class="fa fa-trash fa-1_5x danger"></i>'
            //deleteButtonContent: '<span class="danger">'+this.translate.instant("generics.Delete")+'</span>'
          },
          add: {
          confirmCreate: false,
          },
          edit: {
            confirmSave: false,
            editButtonContent: '<i class="ft-edit-2 info font-medium-1 mr-3"></i>'
          },
          columns: {
            patientName: {
            title: this.translate.instant("diagnosis.Case"),
            placeholder: this.translate.instant("diagnosis.Case"),
            type: "html",
            },
            hasvcf: {
            title: this.translate.instant("diagnosis.Genetic information"),
            placeholder: this.translate.instant("generics.Yes")+'/'+this.translate.instant("generics.No"),
            type: "html",
            },
            symptoms: {
            title: this.translate.instant("phenotype.Number of symptoms"),
            placeholder: this.translate.instant("phenotype.Number of symptoms"),
            type: "html",
            },
            status: {
              title: this.translate.instant("generics.Status"),
              placeholder: this.translate.instant("generics.Yes")+'/'+this.translate.instant("generics.No"),
              type: "html"
            },
          },
          pager : {
              display : false
          },
          attr: {
            class: "table table-responsive"
          },
        };

        if(this.patients.length==0){
          this.loadTutorialNoPatient();
        }
        if(this.authService.getCurrentPatient()!=null){
          this.selectedPatient = this.authService.getCurrentPatient();
        }
        this.loadingPatients = false;

       }, (err) => {
         console.log(err);
         this.loadingPatients = false;
       }));
    }

    loadMyEmail(){
      this.subscription.add( this.http.get(environment.api+'/api/users/email/'+this.authService.getIdUser())
        .subscribe( (res : any) => {
          this.myEmail = res.email;
        }, (err) => {
          console.log(err);
        }));
    }
    onCustom(event, contentTemplate) {
      if(event.action=="archive"){
        Swal.fire({
            title: this.translate.instant("generics.Are you sure?"),
            text:  this.translate.instant("dashboardpatient.Case to be archived")+': '+ event.data.patientName,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#f9423a',
            confirmButtonText: this.translate.instant("dashboardpatient.Archive"),
            cancelButtonText: this.translate.instant("generics.No, cancel"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            reverseButtons:true
        }).then((result) => {
          if (result.value) {
            var enc = false;
            for (var i = 0; i <  this.patients.length && !enc; i++) {
              if(this.patients[i].sub == event.data.sub){
                enc = true;
                this.archiveCase(i);
              }
            }

          }

        });
      }else if(event.action=="restore"){
        Swal.fire({
            title: this.translate.instant("generics.Are you sure?"),
            text:  this.translate.instant("dashboardpatient.Case to be restored")+': '+ event.data.patientName,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#f9423a',
            confirmButtonText: this.translate.instant("dashboardpatient.Restore"),
            cancelButtonText: this.translate.instant("generics.No, cancel"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            reverseButtons:true
        }).then((result) => {
          if (result.value) {
            var enc = false;
            for (var i = 0; i <  this.listOfArchivedCases.length && !enc; i++) {
              if(this.listOfArchivedCases[i].sub == event.data.sub){
                enc = true;
                this.restoreCase(i);
              }
            }

          }

        });
      }else if(event.action=="edit"){
        this.changeName = JSON.parse(JSON.stringify(event.data));
        //alert(`Custom event '${event.action}' fired on row №: ${event.data.sub}`)
        this.modalReference = this.modalService.open(contentTemplate);
      }else if(event.action=="editShared"){
        this.changeNameShared = JSON.parse(JSON.stringify(event.data));
        //alert(`Custom event '${event.action}' fired on row №: ${event.data.sub}`)
        this.modalReference = this.modalService.open(contentTemplate);
      }else if(event.action=="moreInfoShared"){
        console.log(event.data);
        this.moreInfoCaseEvent = JSON.parse(JSON.stringify(event.data));
        document.getElementById("openModalMoreInfoShared").click();
      }else if(event.action=="share"){
        var temp = JSON.parse(JSON.stringify(event.data));
       var hasvcf = temp.hasvcf
        var status = temp.status
        var symptoms = temp.symptoms
        var htmlObjecthasvcf = $(hasvcf); // jquery call
        var htmlObjectstatus = $(status); // jquery call
        var htmlObjectsymptoms = $(symptoms); // jquery call
        temp.hasvcf =htmlObjecthasvcf[0].textContent
        temp.status =htmlObjectstatus[0].textContent
        temp.symptoms =htmlObjectsymptoms[0].textContent
        this.authService.setCurrentPatient(temp);
        document.getElementById("buttonShareTo").click();
      }


    }

    showPanelMoreInfoShared(contentTemplate){
      this.moreInfoCaseData = {};
      this.loadedInfoPatient = false;
      this.subscription.add( this.http.get(environment.api+'/api/patient/email/'+this.moreInfoCaseEvent.sub)
        .subscribe( (res : any) => {
          this.patientEmail = res.email;
        }, (err) => {
          console.log(err);
        }));

      this.subscription.add( this.http.get(environment.api+'/api/patients/'+this.moreInfoCaseEvent.sub)
          .subscribe( (res : any) => {
            var datares = res.patient;
            datares.birthDate=this.dateService.transformDate(res.patient.birthDate);
            this.loadedInfoPatient = true;
            this.moreInfoCaseData = datares;
            this.modalReference = this.modalService.open(contentTemplate);
           }, (err) => {
             console.log(err);
             this.loadedInfoPatient = true;
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));

    }

    archiveCase(index){
      console.log(this.patients[index]);
      if(this.authGuard.testtoken()){
        //cargar los datos del usuario
        //var paramssend = this.authService.getIdUser()+'-code-'+this.patients[index];
        this.subscription.add( this.http.get(environment.api+'/api/case/archive/'+this.patients[index].sub)
        .subscribe( (res : any) => {
          if(res.message=="The case has been archived"){
            this.toastr.success('', this.translate.instant("dashboardpatient.Case archived"));

            this.listOfArchivedCases.push(this.patients[index]);
            this.listOfArchivedCases.sort(this.sortService.GetSortOrderNames("patientName"));
            this.alertSourceCasesArchived = new LocalDataSource(this.listOfArchivedCases)

            this.patients.splice(index, 1);
            this.patientsCopy.splice(index, 1);
            this.alertSource = new LocalDataSource(this.patientsCopy);


          }

         }, (err) => {
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"));
           }
         }));
       }

    }

    restoreCase(index){
      console.log(this.patients[index]);
      if(this.authGuard.testtoken()){
        //cargar los datos del usuario
        //var paramssend = this.authService.getIdUser()+'-code-'+this.patients[index];
        this.subscription.add( this.http.get(environment.api+'/api/case/restore/'+this.patients[index].sub)
        .subscribe( (res : any) => {
          if(res.message=="The case has been restored"){
            this.toastr.success('', this.translate.instant("dashboardpatient.Case restored"));

            this.patients.push(this.listOfArchivedCases[index]);
            this.patientsCopy.push(this.listOfArchivedCases[index]);
            this.patientsCopy.sort(this.sortService.GetSortOrderNames("patientName"));
            this.alertSource = new LocalDataSource(this.patientsCopy);

            this.listOfArchivedCases.splice(index, 1);
            this.listOfArchivedCases.sort(this.sortService.GetSortOrderNames("patientName"));
            this.alertSourceCasesArchived = new LocalDataSource(this.listOfArchivedCases)

          }

         }, (err) => {
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.translate.instant("generics.Data saved fail"));
           }
         }));
       }

    }

    saveChangeCaseName(){
      //guardar en bd!
      var found = false;
      for (var i = 0; i <  this.patients.length && !found; i++) {
        if(this.patients[i].patientName == this.changeName.patientName){
          found = true;
        }
      }
      if(this.changeName.patientName==''){
          Swal.fire(this.translate.instant("diagnosis.name empty"), '', "warning");
      }else if(found){
         Swal.fire(this.translate.instant("diagnosis.There is already a case with that name"), this.translate.instant("diagnosis.Please write a different name"), "warning");
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/case/changename/'+this.changeName.sub, this.changeName)
        .subscribe( (res : any) => {
          this.loadInfo();
          /*this.patients = this.patientsCopy;
          this.patientsCopy.sort(this.sortService.GetSortOrderNames("patientName"));
          this.alertSource = new LocalDataSource(this.patientsCopy);

          this.alertSourceCasesArchived = new LocalDataSource(this.listOfArchivedCases);*/
          //this.diagnosisInfo = res.diagnosis;
          this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
         }, (err) => {
           console.log(err.error);
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));


        if(this.modalReference!=undefined){
          this.modalReference.close();
        }
      }

    }

    saveChangeCaseNameShared(){
      //guardar en bd!
      var found = false;
      for (var i = 0; i <  this.listOfSharedCases.length && !found; i++) {
        if(this.listOfSharedCases[i].alias == this.changeNameShared.alias){
          found = true;
        }
      }
      if(this.changeNameShared.alias==''){
          Swal.fire(this.translate.instant("diagnosis.name empty"), '', "warning");
      }else if(found){
         Swal.fire(this.translate.instant("diagnosis.There is already a case with that alias"), this.translate.instant("diagnosis.Please write a different alias"), "warning");
      }else{
        var paramssend = { patientName: this.changeNameShared.alias, email: this.myEmail };
        this.subscription.add( this.http.put(environment.api+'/api/case/changesharedname/'+this.changeNameShared.sub, paramssend)
        .subscribe( (res : any) => {
          if(res.message=='alias changed'){
            var enc = false;
            for (var i = 0; i <  this.listOfSharedCases.length && !enc; i++) {
              if(this.listOfSharedCases[i].sub == this.changeNameShared.sub){
                this.listOfSharedCases[i].alias = this.changeNameShared.alias;
              }
            }
            this.alertSourceCasesShared = new LocalDataSource(this.listOfSharedCases);
          }
          //this.loadSharedPatients();

         }, (err) => {
           console.log(err.error);
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));


        if(this.modalReference!=undefined){
          this.modalReference.close();
        }
      }

    }

    handleGridSelected(e){
      console.log(e);
      this.selectCase(e);
    }

    handleGridSelectedShared(e){
      console.log(e);
      var enc = false;
      for (var i = 0; i <  this.listOfSharedCases.length && !enc; i++) {
        if(this.listOfSharedCases[i].sub == e.data.sub){
          enc = true;
          this.onChangePatient(this.listOfSharedCases[i]);
        }
      }
    }

    onChangePatient(value){
      var temp = JSON.parse(JSON.stringify(value));
     var hasvcf = temp.hasvcf
      var status = temp.status
      var symptoms = temp.symptoms
      var htmlObjecthasvcf = $(hasvcf); // jquery call
      var htmlObjectstatus = $(status); // jquery call
      var htmlObjectsymptoms = $(symptoms); // jquery call
      temp.hasvcf =htmlObjecthasvcf[0].textContent
      temp.status =htmlObjectstatus[0].textContent
      temp.symptoms =htmlObjectsymptoms[0].textContent
      if(temp.birthDate==null || temp.gender == null){
          temp.birthDate=this.dateService.transformDate(temp.birthDate);
          //request data
          this.isNewPatient=false;
          this.patient = {
            id: temp.sub,
            patientName: value.patientName,
            surname: temp.surname,
            country: temp.country,
            birthDate: temp.birthDate,
            gender: temp.gender,
            previousDiagnosis: temp.previousDiagnosis
          };
          document.getElementById("updatepatient").click();
      }else{
        this.authService.setCurrentPatient(temp);
        if(this.authService.getCurrentPatient()!=null){
          this.goToPatientPage();
        }
      }
    }

    callUpdatePatient(contentNewCaseName){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false
      };
      this.modalReference = this.modalService.open(contentNewCaseName, ngbModalOptions);
    }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.loadTranslations();
  }

  ngAfterViewInit(){

  }


  loadTutorialNoPatient(){
    //lanzar
    console.log('no patients, launch tutorial');
  }

  //traducir cosas
  loadTranslations(){
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk=res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail=res;
    });
  }

  callNewPatient(contentNewCaseName){
    this.loadCountries();
    this.loadListOfDiseases();
    var tagPatient = 'Patient-';
    if(this.actualLang=='es'){
      tagPatient = 'Paciente-';
    }
      var posNewPatient = 1;
      if(this.patients.length>0){
        var maxIndexCase = 0;
        for (var i = 0; i <  this.patients.length; i++) {
          var patientName = this.patients[i].patientName;
          var splitNumberName = patientName.split(tagPatient);
          var posActualPatient = parseInt(splitNumberName[1]);
          if(!(isNaN(posActualPatient))){
            if(maxIndexCase<posActualPatient){
              maxIndexCase = posActualPatient;
            }
          }
        }
        if(maxIndexCase>0){
          posNewPatient = maxIndexCase+1;
        }
      }
      this.isNewPatient = true;
      this.patient = {
        patientName: tagPatient+posNewPatient,
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
        previousDiagnosis: null,
        stepClinic: '0.0'
      };

      this.changeName = this.patient;
      //alert(`Custom event '${event.action}' fired on row №: ${event.data.sub}`)
      console.log(event);
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false
      };
      this.modalReference = this.modalService.open(contentNewCaseName, ngbModalOptions);
  }

  goToPatientPage(){
    this.updateLastAccess();
    this.router.navigate(['/clinical/diagnosis2']);
  }

  updateLastAccess(){
      this.subscription.add( this.http.get(environment.api+'/api/case/updateLastAccess/'+this.authService.getCurrentPatient().sub)
      .subscribe( (res : any) => {
       }, (err) => {
         console.log(err);
       }));
  }

  submitInvalidForm() {
    console.log('Invalid form');
    this.toastr.warning('', this.translate.instant("generics.fieldsRequired"));
    if (!this.newPatientform) { return; }
    const base = this.newPatientform;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
          console.log('Invalid form');
      }
    }
  }

  saveNewCase(){
    var found = false;
    for (var i = 0; i <  this.patients.length && !found; i++) {
      if(this.patients[i].patientName == this.patient.patientName){
        found = true;
      }
    }
    if(this.patient.patientName==''){
        Swal.fire(this.translate.instant("diagnosis.name empty"), '', "warning");
    }else if(found){
       Swal.fire(this.translate.instant("diagnosis.There is already a case with that name"), this.translate.instant("diagnosis.Please write a different name"), "warning");
    }else{
      if(this.authGuard.testtoken()){
        this.sending = true;
        this.subscription.add( this.http.post(environment.api+'/api/patients/'+this.authService.getIdUser(), this.patient)
        .subscribe( (res : any) => {
          console.log(res);
          if(this.modalReference!=undefined){
            this.modalReference.close();
          }
          this.authService.setCurrentPatient(res.patientInfo);
          this.sending = false;
          //this.toastr.success('', this.msgDataSavedOk);
          if(this.authService.getCurrentPatient()!=null){
            //this.loadData();
            this.goToPatientPage();
          }
          //this.loadPatients();
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

  }

  updateCase(){
    if(this.patient.patientName==''){
        Swal.fire(this.translate.instant("diagnosis.name empty"), '', "warning");
    }else{
      if(this.authGuard.testtoken()){
        this.sending = true;
        this.subscription.add( this.http.put(environment.api+'/api/patients/'+this.patient.id, this.patient)
        .subscribe( (res : any) => {
          console.log(res);
          if(this.modalReference!=undefined){
            this.modalReference.close();
          }
          this.authService.setCurrentPatient(res.patientInfo);
          this.sending = false;
          //this.toastr.success('', this.msgDataSavedOk);
          if(this.authService.getCurrentPatient()!=null){
            //this.loadData();
            this.goToPatientPage();
          }
          //this.loadPatients();
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

  }


  onDeleteConfirm(event) {
    console.log(event);
    var enc = false;
    for (var i = 0; i <  this.patients.length && !enc; i++) {
      if(this.patients[i].sub == event.data.sub){
        enc = true;
        this.confirmDeleteCase(i);
      }
    }
  }

  selectCase(event) {
    console.log(event);
    var enc = false;
    for (var i = 0; i <  this.patients.length && !enc; i++) {
      if(this.patients[i].sub == event.data.sub){
        enc = true;
        this.onChangePatient(this.patients[i]);
      }
    }
    if(!enc){
      for (var i = 0; i <  this.listOfArchivedCases.length && !enc; i++) {
        if(this.listOfArchivedCases[i].sub == event.data.sub){
          enc = true;
          this.onChangePatient(this.listOfArchivedCases[i]);
        }
      }
    }
  }

  confirmDeleteCase(index) {

    Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        text:  this.translate.instant("diagnosis.Case to be delete")+': '+ this.patients[index].patientName,
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
        this.deleteCase(index);
      }

    });

  }

  deleteCase(index){
    console.log(this.patients[index]);
    if(this.authGuard.testtoken()){
      //cargar los datos del usuario
      //var paramssend = this.authService.getIdUser()+'-code-'+this.patients[index];
      this.subscription.add( this.http.delete(environment.api+'/api/case/'+this.patients[index].sub)
      .subscribe( (res : any) => {
        if(res.message=="The case has been eliminated"){
          this.toastr.success('', this.translate.instant("diagnosis.Case deleted"));
          this.patients.splice(index, 1);
          this.patientsCopy.splice(index, 1);
          this.alertSource = new LocalDataSource(this.patientsCopy);
        }

       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"));
         }
       }));
     }
  }

  onDeleteConfirmArchive(event) {
    console.log(event);
    var enc = false;
    for (var i = 0; i <  this.listOfArchivedCases.length && !enc; i++) {
      if(this.listOfArchivedCases[i].sub == event.data.sub){
        enc = true;
        this.confirmDeleteArchiveCase(i);
      }
    }
  }

  confirmDeleteArchiveCase(index) {

    Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        text:  this.translate.instant("diagnosis.Case to be delete")+': '+ this.listOfArchivedCases[index].patientName,
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
        this.deleteArchiveCase(index);
      }

    });

  }

  deleteArchiveCase(index){
    console.log(this.listOfArchivedCases[index]);
    if(this.authGuard.testtoken()){
      //cargar los datos del usuario
      //var paramssend = this.authService.getIdUser()+'-code-'+this.patients[index];
      this.subscription.add( this.http.delete(environment.api+'/api/case/'+this.listOfArchivedCases[index].sub)
      .subscribe( (res : any) => {
        if(res.message=="The case has been eliminated"){
          this.toastr.success('', this.translate.instant("diagnosis.Case deleted"));
          this.listOfArchivedCases.splice(index, 1);
          this.alertSourceCasesArchived = new LocalDataSource(this.listOfArchivedCases);
        }

       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"));
         }
       }));
     }
  }


  onDeleteSharedCaseConfirm(event) {
    console.log(event);
    var enc = false;
    for (var i = 0; i <  this.listOfSharedCases.length && !enc; i++) {
      if(this.listOfSharedCases[i].sub == event.data.sub){
        enc = true;
        this.confirmDeleteSharedCase(i);
      }
    }
  }

  confirmDeleteSharedCase(index) {

    Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        text:  this.translate.instant("diagnosis.Case to be delete")+': '+ this.listOfSharedCases[index].patientName,
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
        this.deleteSharedCase(index);
      }

    });

  }

  deleteSharedCase(index){
    console.log(this.listOfSharedCases[index]);
    if(this.authGuard.testtoken()){
      //cargar los datos del usuario
      var params:any = {};
      params.userId = this.authService.getIdUser();
      this.subscription.add( this.http.post(environment.api+'/api/rejectpermission/'+this.listOfSharedCases[index].sub, params)
      .subscribe( (res : any) => {
        if(res.message=="Rejected"){
          this.toastr.success('', this.translate.instant("diagnosis.Case deleted"));
          this.listOfSharedCases.splice(index, 1);
          this.alertSourceCasesShared = new LocalDataSource(this.listOfSharedCases);
        }

       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"));
         }
       }));
     }
  }

}
