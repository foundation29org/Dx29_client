import { Component, OnDestroy, OnInit, ViewChild, Output, EventEmitter, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
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
import { LayoutService } from "app/shared/services/layout.service";
import { ConfigService } from "app/shared/services/config.service";

declare let gtag: any;

@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
    providers: [Apif29BioService, ApiDx29ServerService, ApiClinicalTrialsService],
})

export class LandPageComponent implements OnInit, AfterViewInit,  OnDestroy {

    private subscription: Subscription = new Subscription();
    lang: string = 'en';
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    searchDiseaseField: string = '';
    listOfFilteredDiseases: any = [];
    sendTerms: boolean = false;
    listOfDiseases: any = [];
    loadedListOfDiseases: boolean = false;
    selectedDiseaseIndex: number = -1;
    infoOneDisease: any = {};
    modalReference: NgbModalRef;
    modalReference2: NgbModalRef;
    numberOfSymtomsChecked: number = 0;
    clinicalTrials: any = {};

    @ViewChild('f') donorDataForm: NgForm;
    sending: boolean = false;
    formOpen: any = {Answers:[], Free: '', Email: '', terms2: false};
    showErrorForm: boolean = false;
    selectedInfoSymptomIndex: number = -1;
    showIntro =true;

    //colors
    options = {
        direction: "ltr",
        bgColor: "black",
        transparentColor: "",
        bgImage: "assets/img/sidebar-bg/01.jpg",
        bgImageDisplay: true,
        compactMenu: false,
        sidebarSize: "sidebar-md",
        layout: "Light"
      };
      size = "sidebar-md";
      isOpen = true;
      public config: any = {};
      layoutSub: Subscription;
      isBgImageDisplay = true;
      selectedBgColor: string = "black";
      selectedBgImage: string = "assets/img/sidebar-bg/01.jpg";
      selectedTLBgColor: string = "";
      selectedTLBgImage: string = "";
      email: string = '';

    constructor(public googleAnalyticsService: GoogleAnalyticsService, private searchService: SearchService, private eventsService: EventsService, private http: HttpClient, public searchFilterPipe: SearchFilterPipe, private apif29BioService: Apif29BioService, private modalService: NgbModal, public translate: TranslateService, public toastr: ToastrService, private textTransform: TextTransform, private sortService: SortService, private apiDx29ServerService: ApiDx29ServerService, private apiClinicalTrialsService: ApiClinicalTrialsService,private elRef: ElementRef,
        private renderer: Renderer2,
        private layoutService: LayoutService,
        private configService: ConfigService) {

        this.lang = sessionStorage.getItem('lang');
        this._startTime = Date.now();
        this.lauchEvent("Init");

        this.layoutSub = layoutService.customizerChangeEmitted$.subscribe(
            options => {
              if (options) {
                if (options.bgColor) {
                  this.selectedBgColor = options.bgColor;
                  this.selectedBgImage = options.bgImage;
                }
              }
            }
          );
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
        this.eventsService.on('changelang', function (lang) {
            this.loadFilesLang();
        }.bind(this));

        this.config = this.configService.templateConf;
        this.isOpen = !this.config.layout.customizer.hidden;

        if (this.config.layout.sidebar.size) {
        this.options.sidebarSize = this.config.layout.sidebar.size;
        this.size = this.config.layout.sidebar.size;
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
          if (this.config.layout.dir) {
            this.options.direction = this.config.layout.dir;
          }
    
          if (this.config.layout.variant) {
            this.options.layout = this.config.layout.variant;
          }
          if (this.config.layout.sidebar.collapsed != undefined) {
            this.options.compactMenu = this.config.layout.sidebar.collapsed;
          }
    
          if (
            this.config.layout.sidebar.backgroundColor &&
            this.config.layout.sidebar.backgroundColor != ""
          ) {
            this.options.bgColor = this.config.layout.sidebar.backgroundColor;
            this.selectedBgColor = this.config.layout.sidebar.backgroundColor;
          } else {
            this.options.bgColor = "black";
            this.selectedBgColor = "black";
          }
    
          if (this.config.layout.sidebar.backgroundImage != undefined) {
            this.options.bgImageDisplay = this.config.layout.sidebar.backgroundImage;
            this.isBgImageDisplay = this.config.layout.sidebar.backgroundImage;
          }
    
          if (this.config.layout.sidebar.backgroundImageURL) {
            this.options.bgImage = this.config.layout.sidebar.backgroundImageURL;
            this.selectedBgImage = this.config.layout.sidebar.backgroundImageURL;
          }
    
          if (this.options.layout === "Transparent") {
            this.options.bgColor = "black";
            this.selectedBgColor = "black";
            this.options.bgImageDisplay = false;
            this.selectedTLBgColor = "";
            this.selectedBgImage = "";
            this.options.bgImage = "";
            this.isBgImageDisplay = false;
    
            if (this.config.layout.sidebar.backgroundColor) {
              if (this.config.layout.sidebar.backgroundColor === "bg-glass-1") {
                this.selectedTLBgImage = "assets/img/gallery/bg-glass-1.jpg";
                this.options.transparentColor = "bg-glass-1";
              } else if (
                this.config.layout.sidebar.backgroundColor === "bg-glass-2"
              ) {
                this.selectedTLBgImage = "assets/img/gallery/bg-glass-2.jpg";
                this.options.transparentColor = "bg-glass-2";
              } else if (
                this.config.layout.sidebar.backgroundColor === "bg-glass-3"
              ) {
                this.selectedTLBgImage = "assets/img/gallery/bg-glass-3.jpg";
                this.options.transparentColor = "bg-glass-3";
              } else if (
                this.config.layout.sidebar.backgroundColor === "bg-glass-4"
              ) {
                this.selectedTLBgImage = "assets/img/gallery/bg-glass-4.jpg";
                this.options.transparentColor = "bg-glass-4";
              } else {
                this.options.transparentColor = this.config.layout.sidebar.backgroundColor;
                this.selectedTLBgColor = this.config.layout.sidebar.backgroundColor;
              }
            } else {
              this.options.bgColor = "black";
              this.selectedBgColor = "black";
              this.options.bgImageDisplay = false;
              this.selectedBgColor = "";
              this.selectedTLBgColor = "";
              this.selectedTLBgImage = "assets/img/gallery/bg-glass-1.jpg";
              this.options.transparentColor = "bg-glass-1";
            }
          }
        }, 0);
      }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        if (this.layoutSub) {
            this.layoutSub.unsubscribe();
          }
    }

    selectRole(role) {
        this.role = role;
        if(this.role=='diagnosed'){
            this.loadListOfDiseases();
        }
    }

    restartVars() {
        this.role = '';
    }

    loadFilesLang() {
        this.searchDiseaseField = '';
        this.listOfFilteredDiseases = [];
        this.sendTerms= false;
        this.loadListOfDiseases();
    }

    loadListOfDiseases(){
        this.loadedListOfDiseases = false;
        var lang = sessionStorage.getItem('lang');
        this.subscription.add( this.http.get('assets/jsons/diseases_'+lang+'.json')
        //this.subscription.add( this.http.get('https://f29bio.northeurope.cloudapp.azure.com/api/BioEntity/diseases/'+lang+'/all')
         .subscribe( (res : any) => {
           this.listOfDiseases = res;
           this.loadedListOfDiseases = true;
          }, (err) => {
            console.log(err);
            this.loadedListOfDiseases = true;
          }));
      }

      loadListOfDiseases2(id){
        this.subscription.add( this.http.get('assets/jsons/diseases_en.json')
        //this.subscription.add( this.http.get('https://f29bio.northeurope.cloudapp.azure.com/api/BioEntity/diseases/'+lang+'/all')
         .subscribe( (res : any) => {
            var foundElementIndex = this.searchService.searchIndex(res, 'id', id);
            var name = res[foundElementIndex].name;
            this.getClinicalTrials(name);
          }, (err) => {
            console.log(err);
          }));
      }

      onKey(event){
        if( this.searchDiseaseField.trim().length > 3){
          var tempModelTimp = this.searchDiseaseField.trim();
          this.listOfFilteredDiseases = this.searchFilterPipe.transformDiseases(this.listOfDiseases, 'name', tempModelTimp);
          if(this.listOfFilteredDiseases.length==0 && !this.sendTerms){
              //send text
              this.sendTerms= true;
              var params:any = {}
              params.uuid= this.myuuid;
              params.Term = tempModelTimp;
              params.Lang = sessionStorage.getItem('lang');
              var d = new Date(Date.now());
              var a = d.toString();
              params.Date = a;
              this.subscription.add( this.http.post('https://prod-246.westeurope.logic.azure.com:443/workflows/5af138b9f41f400f89ecebc580d7668f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PiYef1JHGPRDGhYWI0s1IS5a_9Dpz7HLjwfEN_M7TKY', params)
              .subscribe( (res : any) => {
               }, (err) => {
               }));
          }
        }else{
          this.listOfFilteredDiseases = [];
          this.sendTerms= false;
        }
      }

      showMoreInfoDisease(diseaseIndex){
        if(this.selectedDiseaseIndex == diseaseIndex ){
          this.selectedDiseaseIndex = -1;
        }else{
          this.selectedDiseaseIndex = diseaseIndex;
        }
      }

      showMoreInfoDiagnosePopup(index,contentInfoDiagnose){
        this.selectedDiseaseIndex = index;
        this.getInfoOneDisease(contentInfoDiagnose);
      }

    getInfoOneDisease(contentInfoDiagnose){
        this.infoOneDisease = {};
        var lang = sessionStorage.getItem('lang');
        var param = [this.listOfFilteredDiseases[this.selectedDiseaseIndex].id];
        this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang, param, 0)
            .subscribe((res: any) => {
                var info = res[this.listOfFilteredDiseases[this.selectedDiseaseIndex].id];
                if(info==undefined){
                    //Swal.fire(this.translate.instant("land.diagnosed.diseases.error1")+ ' ' +this.listOfFilteredDiseases[this.selectedDiseaseIndex].name, this.translate.instant("land.diagnosed.diseases.error2"), "error");
                    this.subscription.add(this.apif29BioService.getInfoOfDiseasesLang(param, lang)
                    .subscribe((res1: any) => {
                        this.infoOneDisease = res1[this.listOfFilteredDiseases[this.selectedDiseaseIndex].id];
                        this.cleanxrefs();
                        if(this.lang == 'es'){
                            this.loadListOfDiseases2(this.infoOneDisease.id);
                            
                        }else{
                            this.getClinicalTrials(this.infoOneDisease.name);
                        }

                        this.showEffects(contentInfoDiagnose);
                        
                    }, (err) => {
                        console.log(err);
                    }));
                }else{
                    this.infoOneDisease = info;
                    this.cleanxrefs();
                    this.infoOneDisease.symptoms = [];
                    var tamano = Object.keys(info.phenotypes).length;
                    if (tamano > 0) {
                        var hposStrins = [];
                        for (var i in info.phenotypes) {
                            var frequency =info.phenotypes[i].frequency;
                            if(frequency!=undefined){
                                hposStrins.push(frequency); 
                            }else{
                                info.phenotypes[i].Frequency = {name:this.translate.instant("land.Unknown"),id:'HP:9999999'};
                            }
                            info.phenotypes[i].id = i;
                            this.infoOneDisease.symptoms.push(info.phenotypes[i]);
                        }
                        this.getfrequenciesSelectedDisease(hposStrins, contentInfoDiagnose);
                    }
                    if(this.lang == 'es'){
                        this.loadListOfDiseases2(this.infoOneDisease.id);
                        
                    }else{
                        this.getClinicalTrials(this.infoOneDisease.name);
                    }
                }
                
            }, (err) => {
                console.log(err);
                this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
            }));
    }

    cleanxrefs() {
            if (this.infoOneDisease.xrefs != undefined) {
                if (this.infoOneDisease.xrefs.length == 0) {
                    this.infoOneDisease.xrefs.push(this.infoOneDisease.id);
                }
                this.infoOneDisease.xrefs.sort((one, two) => (one > two ? -1 : 1));
                var xrefs = this.cleanOrphas(this.infoOneDisease.xrefs)
                this.infoOneDisease.xrefs = xrefs;
            }
            this.infoOneDisease.name = this.textTransform.transform(this.infoOneDisease.name);
        
    }

    getfrequenciesSelectedDisease(hposStrins, contentInfoDiagnose) {
        //getInfo symptoms
        
        var lang = sessionStorage.getItem('lang');
        this.apif29BioService.getInfoOfSymptoms(lang, hposStrins)
            .subscribe((res: any) => {
                var tamano = Object.keys(res).length;
                if (tamano > 0) {
                    for (var i in res) {
                        for (var j = 0; j < this.infoOneDisease.symptoms.length; j++) {
                            if (res[i].id == this.infoOneDisease.symptoms[j].frequency) {
                                if (this.infoOneDisease.symptoms[j].Frequency == undefined) {
                                    this.infoOneDisease.symptoms[j].Frequency = {name:res[i].name,desc:res[i].desc, id: res[i].id};
                                }
                            }
                        }
                    }
                }
                for (var j = 0; j < this.infoOneDisease.symptoms.length; j++) {
                    if (this.infoOneDisease.symptoms[j].Frequency == undefined) {
                        console.log('Rare frequencie');
                        console.log(this.infoOneDisease.symptoms[j].frequency);
                        this.infoOneDisease.symptoms[j].Frequency = {name:this.translate.instant("land.Unknown"),id:'HP:9999999'};
                    }
                }
                this.infoOneDisease.symptoms.sort(this.sortService.GetSortTwoElementsLand("Frequency", "name"));

                this.showEffects(contentInfoDiagnose);

            }, (err) => {
                console.log(err);
            });
    }

    /*changeStateSymptomDisease(index, state) {
        this.infoOneDisease.symptoms[index].checked = state;
        this.getNumberOfSymptomsDiseaseChecked();
    }*/

    changeStateSymptomDisease(index) {
        console.log(this.infoOneDisease.symptoms[index].checke);
        if(this.infoOneDisease.symptoms[index].checked){
            this.infoOneDisease.symptoms[index].checked= !this.infoOneDisease.symptoms[index].checked;
        }else{
            this.infoOneDisease.symptoms[index].checked = true;
        }
        this.getNumberOfSymptomsDiseaseChecked();
    }

    getNumberOfSymptomsDiseaseChecked() {
        this.numberOfSymtomsChecked = 0;
        for (var i = 0; i < this.infoOneDisease.symptoms.length; i++) {
            if (this.infoOneDisease.symptoms[i].checked) {
                this.numberOfSymtomsChecked++;
            }
        }
    }

    sendSymtomsChecked(){
        if(this.numberOfSymtomsChecked==0){
            Swal.fire('', this.translate.instant("land.diagnosed.symptoms.error1"), "error");
        }else{
            this.lauchEvent('Diagnosed - Send Symptoms');
            var listChecked = [];
            for (var i = 0; i < this.infoOneDisease.symptoms.length; i++) {
                if (this.infoOneDisease.symptoms[i].checked) {
                    listChecked.push(this.infoOneDisease.symptoms[i].id);
                }
            }
            var info = {idClient: this.myuuid, diseaseId: this.infoOneDisease.id, xrefs:this.infoOneDisease.xrefs, symptoms: listChecked};
            this.subscription.add(this.apiDx29ServerService.chekedSymptomsOpenDx29(info)
                .subscribe((res: any) => {       
                    Swal.fire(this.translate.instant("land.diagnosed.symptoms.Nice"), this.translate.instant("land.diagnosed.symptoms.msgCheckedSymptoms"), "success"); 
                }));
        }
    }

    getClinicalTrials(name){
        this.subscription.add(this.apiClinicalTrialsService.getClinicalTrials(name)
            .subscribe((res: any) => {
                this.clinicalTrials = [];
                if(res.FullStudiesResponse.FullStudies!=undefined){
                    for (var i = 0; i < res.FullStudiesResponse.FullStudies.length; i++) {
                        if(res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.StatusModule.OverallStatus=='Available' 
                        || res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.StatusModule.OverallStatus=='Recruiting'){
                            //clean countries
                            if(res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.ContactsLocationsModule.LocationList!=undefined){
                                var listCountries = res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.ContactsLocationsModule.LocationList.Location;
                                var listCountriesCleaned = [];
                                for (var j = 0; j < listCountries.length; j++) {
                                    var foundElement = this.searchService.search(listCountriesCleaned, 'LocationCountry', listCountries[j].LocationCountry);
                                    if(!foundElement){
                                        listCountriesCleaned.push(listCountries[j]);
                                    }
                                }
                                res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.ContactsLocationsModule.listCountriesCleaned = listCountriesCleaned;
                            }
                            this.clinicalTrials.push(res.FullStudiesResponse.FullStudies[i]);
                        }
                    }
                }
                console.log(this.clinicalTrials);
                //this.clinicalTrials = res.FullStudiesResponse.FullStudies;
            }, (err) => {
                console.log(err);
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

    onSubmitDonorData(){
        this.showErrorForm = false;
        this.sending = true;
        this.formOpen.Email = (this.formOpen.Email).toLowerCase();
            var params:any = {}
            params.form= this.formOpen;
            var params:any = {}
            params.Email= this.formOpen.Email;
            params.Answers = this.formOpen.Answers.toString();
            params.Free = this.formOpen.Free;
            params.Lang = sessionStorage.getItem('lang');
            var d = new Date(Date.now());
            var a = d.toString();
            params.Date = a;
            this.subscription.add( this.http.post('https://prod-12.westeurope.logic.azure.com:443/workflows/183bc21bfa054c77ac44c297e1f3bd04/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rYHWLbMjZrv_q3yN8EezS5zA2Jmvyxc16-zKtn4zQz0', params)
            .subscribe( (res : any) => {
              this.sending = false;
              Swal.fire('', this.translate.instant("land.diagnosed.DonorData.msgform"), "success"); 
              this.formOpen= {Answers:[], Free: '', Email: '', terms2: false};
             }, (err) => {
               console.log(err);
               this.sending = false;
               this.toastr.error('', this.translate.instant("generics.error try again"));
             }));
        
    }

    cleanOrphas(xrefs) {
        var res = [];
        var count = 0;
        for (var i = 0; i < xrefs.length; i++) {
            if (xrefs[i].indexOf('ORPHA') != -1 || xrefs[i].indexOf('ORPHANET') != -1 || xrefs[i].indexOf('OMIM') != -1) {
                if (xrefs[i].indexOf('ORPHA') != -1 || xrefs[i].indexOf('ORPHANET') != -1) {
                    count++;
                }
                if (count <= 1) {
                    var value = xrefs[i].split(':');
                    if (xrefs[i].indexOf('ORPHA') != -1 || xrefs[i].indexOf('ORPHANET') != -1) {
                        res.push({ name: 'Orphanet', id: value[1] });
                    } else if (xrefs[i].indexOf('OMIM') != -1) {
                        res.push({ name: 'OMIM', id: value[1] });
                    }
                    count++;
                }
            }
        }
        return res;
    }

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    showMoreInfoSymptomPopup(symptomIndex, contentInfoSymptomNcr) {
        this.selectedInfoSymptomIndex = symptomIndex;
        let ngbModalOptions: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(contentInfoSymptomNcr, ngbModalOptions);
    }

    showEffects(contentInfoDiagnose){
        if(this.infoOneDisease.symptoms!=undefined){
            this.onDarkLayout();
        }else{
            this.showIntro = false;
        }
        
        
        let ngbModalOptions: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        if (this.modalReference2 != undefined) {
            this.modalReference2.close();
        }
        this.modalReference2 = this.modalService.open(contentInfoDiagnose, ngbModalOptions);
    }

    onDarkLayout() {
        this.options.layout = "Dark";
        this.options.bgColor = "black";
        this.selectedBgColor = "black";
        if (this.isBgImageDisplay) {
          this.options.bgImageDisplay = true;
        }
        //emit event to FUll Layout
        this.layoutService.emitCustomizerChange(this.options);
      }

      closeSymptom(){
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
      }

      closeDisease(){
        if (this.modalReference2 != undefined) {
            this.modalReference2.close();
            this.showIntro = true;
        }
        this.onLightLayout();
      }

      onLightLayout() {
        this.options.layout = "Light";
        this.options.bgColor = "man-of-steel";
        this.selectedBgColor = "man-of-steel";
        if (this.isBgImageDisplay) {
          this.options.bgImageDisplay = true;
        }
    
        //emit event to FUll Layout
        this.layoutService.emitCustomizerChange(this.options);
      }

      letsGo(){
          this.showIntro = false;
      }

      onSubmitRevolution(){
        this.showErrorForm = false;
        this.sending = true;
        var params:any = {}
        params.Email= (this.email).toLowerCase();
        params.Lang = sessionStorage.getItem('lang');
        var d = new Date(Date.now());
        var a = d.toString();
        params.Date = a;
        this.subscription.add( this.http.post('https://prod-59.westeurope.logic.azure.com:443/workflows/2d7a82d83b4c4b92a8270a84540b0213/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fnADjHH0yXxYxonVtre2_yrUFyQ0LR4cX2PJSnPwmrM', params)
        .subscribe( (res : any) => {
            this.sending = false;
            Swal.fire('', this.translate.instant("land.diagnosed.general.msgSend"), "success");
            this.email = ''; 
            }, (err) => {
            console.log(err);
            this.sending = false;
            this.toastr.error('', this.translate.instant("generics.error try again"));
            }));
        
    }

}
