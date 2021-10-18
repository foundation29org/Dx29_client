import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Injectable  } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import { EventsService } from 'app/shared/services/events.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";

import { TextTransform } from 'app/shared/services/transform-text.service';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import { ApiExternalServices } from 'app/shared/services/api-external.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { SortService } from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { HighlightSearch } from 'app/shared/services/search-filter-highlight.service';
import { Clipboard } from "@angular/cdk/clipboard"
import { v4 as uuidv4 } from 'uuid';
import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';
import { SearchFilterPipe } from 'app/shared/services/search-filter.service';
import { DialogService  } from 'app/shared/services/dialog.service';
import {jsPDFService} from 'app/shared/services/jsPDF.service';
import {NgbTabset} from "@ng-bootstrap/ng-bootstrap";

//import { Observable } from 'rxjs/Observable';
import {Observable, of, OperatorFunction} from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexGrid, ApexDataLabels, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexLegend, ApexPlotOptions, ApexFill, ApexMarkers, ApexTheme, ApexNonAxisChartSeries, ApexResponsive } from "ng-apexcharts";
import { KeyValue } from '@angular/common';


export type ChartOptions = {
    series: ApexAxisChartSeries | ApexNonAxisChartSeries;
    colors: string[],
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis | ApexYAxis[],
    title: ApexTitleSubtitle;
    dataLabels: ApexDataLabels,
    stroke: ApexStroke,
    grid: ApexGrid,
    legend?: ApexLegend,
    tooltip?: ApexTooltip,
    plotOptions?: ApexPlotOptions,
    labels?: string[],
    fill: ApexFill,
    markers?: ApexMarkers,
    theme: ApexTheme,
    responsive: ApexResponsive[]
};

var $primary = "#975AFF",
    $success = "#40C057",
    $info = "#2F8BE6",
    $warning = "#F77E17",
    $danger = "#F55252",
    $label_color_light = "#E6EAEE";
var themeColors = [$primary, $warning, $success, $danger, $info];

declare var JSZipUtils: any;
declare var Docxgen: any;

//let phenotypesinfo = [];
declare let gtag: any;
/*
declare var device;
declare global {
    interface Navigator {
      app: {
          exitApp: () => any; // Or whatever is the type of the exitApp function
      },
      splashscreen:any
    }
}*/

@Injectable()
export class SearchTermService {
  constructor(private apiDx29ServerService: ApiDx29ServerService) {}

  search(term: string) {
    if (term === '') {
        return of([]);
      }
      var info = {
          "text": term,
          "lang": sessionStorage.getItem('lang')
      }
      return this.apiDx29ServerService.searchSymptoms(info).pipe(
        map(response => response)
      );
  }
}

@Component({
    selector: 'app-diagnosed-page',
    templateUrl: './diagnosed-page.component.html',
    styleUrls: ['./diagnosed-page.component.scss'],
    providers: [Apif29BioService, Apif29NcrService, ApiDx29ServerService, ApiExternalServices, SearchTermService, jsPDFService],
})

export class DiagnosedPageComponent implements OnInit, OnDestroy, AfterViewInit {

    private subscription: Subscription = new Subscription();
    private eventSubscription: Subscription = new Subscription();
    private subscriptionDiseasesCall: Subscription = new Subscription();
    private subscriptionDiseasesNotFound: Subscription = new Subscription();
    private timeSubscription: Subscription = new Subscription();
    parserObject: any = { parserStrategy: 'Auto', callingParser: false, file: undefined };
    showPanelExtractor: boolean = false;
    expanded: boolean = true;
    medicalText: string = '';
    resultTextNcrCopy: string = '';
    ncrResultView: boolean = false;
    searchTerm: string = '';
    loadingHpoExtractor: boolean = false;
    substepExtract: string = "0";
    langToExtract: string = '';
    resultSegmentation: any = {};
    temporalSymptoms: any = [];
    resultTextNcr: string = '';
    selectedInfoSymptomIndex: number = -1;
    selectedNoteSymptom = null;
    temporalDiseases: any = [];
    indexListRelatedConditions: number = 8;
    showNumerRelatedConditions: number = 8;
    langDetected: string = '';
    loadingCalculate: boolean = false;
    isFirstCalculate: boolean = true;
    lang: string = 'en';
    selectedInfoDiseaseIndex: number = -1;
    totalDiseasesLeft: number = -1;
    numberOfSymtomsChecked: number = 0;
    minSymptoms: number = 1;
    @ViewChild('input') inputEl;
    showButtonScroll: boolean = false;
    failAnnotate_batch: boolean = false;
    failSegmentation: boolean = false;
    lineChartIdealOptions: Partial<ChartOptions>;
    lineChartRuidoOptions: Partial<ChartOptions>;
    lucky: boolean = false;
    showErrorMsg: boolean = false;
    modelTemp: any;
    _startTime: any;
    role: string = '';
    sendSympTerms: boolean = false;

    searchDiseaseField: string = '';
    actualInfoOneDisease: any = {};
    listOfFilteredDiseases: any = [];
    listOfFilteredSymptoms: any = [];
    sendTerms: boolean = false;
    listOfDiseases: any = [];
    callListOfDiseases: boolean = false;
    callListOfSymptoms: boolean = false;
    selectedDiseaseIndex: number = -1;
    infoOneDisease: any = {};
    modalReference2: NgbModalRef;
    modalReference3: NgbModalRef;
    modalReference4: NgbModalRef;
    modalReference5: NgbModalRef;
    modalReference6: NgbModalRef;
    clinicalTrials: any = {};

    @ViewChild('f') donorDataForm: NgForm;
    sending: boolean = false;
    formOpen: any = { Answers: [], Free: '', Email: '', terms2: false };
    showErrorForm: boolean = false;
    showIntro: boolean = true;
    curatedLists: any = [];
    dontShowIntro: boolean = false;
    showAllDescrip: boolean = false;
    showDisease: boolean = false;
    loadingOneDisease: boolean = false;
    email: string = '';
    nothingFoundDisease: boolean = false;
    nothingFoundSymptoms: boolean = false;
    private activeRoute: string;

    @ViewChild("inputDisease") inputTextAreaElement: ElementRef;
    @ViewChild("inputManualSymptoms") inputManualSymptomsElement: ElementRef;

    myuuid: string = uuidv4();
    eventList: any = [];
    infoWiki: any = [];
    infoWikiGeneral: any = [];
    loadingArticle: boolean = false;
    viewArticle: boolean = false;
    actualArticle: any = {};
    secondToResponse: string = '';
    reloadDiseases: boolean = false;
    secondsInactive:number;
    inactiveSecondsToLogout:number = 900;
    openDiseases:number = 0;
    timeoutWait: number = 2000;

    patientGroups: any = []
    loadingPatientGroups = false;

    startTimeline = false;
    listSymptomsCheckedTimeline: any = []
    listSymptomsCheckedModified = false;
    donnorSet = false;
    step = 0;

    formatter1 = (x: { name: string }) => x.name;
    optionSymptomAdded: string = "textarea";
    @ViewChild('tabRef') ctdTabset : NgbTabset;

    steps = [
        { stepIndex: 1, isComplete: false, title: "Search disease"},
        { stepIndex: 2, isComplete: false, title: "Info disease"}
      ];
    currentStep: any = {};

    stepsTimeLine = [];
    currentStepTimeLine: any = {};
    paramsTimeLine: any = {};
    loadingPdf: boolean = false;
    symptomsCopy: any = [];
    identifyValue: string = '';

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private apif29BioService: Apif29BioService, private apif29NcrService: Apif29NcrService, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private textTransform: TextTransform, private eventsService: EventsService, private highlightSearch: HighlightSearch, public googleAnalyticsService: GoogleAnalyticsService, public searchFilterPipe: SearchFilterPipe, private apiExternalServices: ApiExternalServices, public dialogService: DialogService, public searchTermService: SearchTermService, public jsPDFService: jsPDFService) {
        
        this.lang = sessionStorage.getItem('lang');

        $.getScript("./assets/js/docs/jszip-utils.js").done(function (script, textStatus) {
            //console.log("finished loading and running jszip-utils.js. with a status of" + textStatus);
        });

        $.getScript("./assets/js/docs/docxtemplater.v2.1.5.js").done(function (script, textStatus) {
            //console.log("finished loading and running docxtemplater.js. with a status of" + textStatus);
        });
        this.selectedNoteSymptom = null;
        this.startTimeline = false;
        this.listSymptomsCheckedTimeline = [];
        this.listSymptomsCheckedModified = false;
        this.donnorSet = false;

        this.loadFilesLang();

        //this.googleAnalyticsService.eventEmitter("OpenDx - init: "+result, "general", this.myuuid);
        //this.googleAnalyticsService.eventEmitter("OpenDx - init", "general", this.myuuid, 'init', 5);
        this._startTime = Date.now();
        this.secondsInactive=0;
        this.timeSubscription =  Observable.interval(1000 * this.inactiveSecondsToLogout).subscribe(() => {
            this.secondsInactive+=this.inactiveSecondsToLogout;
            if(this.secondsInactive>=this.inactiveSecondsToLogout){
                this.openModarRegister('Time out');
              }
          });
          
        if(sessionStorage.getItem('uuid')!=null){
            this.myuuid = sessionStorage.getItem('uuid');
        }else{
            this.myuuid = uuidv4();
            sessionStorage.setItem('uuid', this.myuuid);
        }
        this.currentStep = this.steps[0];
        this.focusInputDisease();
    }

    setStep(index: number) {
        this.step = index;
      }

    focusInputDisease(){
        setTimeout(function () {
            this.inputTextAreaElement.nativeElement.focus();
        }.bind(this), 200);
    }

    openModarRegister(type){
        var titleEvent = "OpenModalRegister - " + type;
        this.lauchEvent(titleEvent);
        if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
            document.getElementById("openModalRegister").click();
        }else{
            document.getElementById("openModalRegister").click();
        }
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if(this.modalReference5 !=undefined){
            this.modalReference5.close()
            this.modalReference5 = undefined;
            return false;
        }else if (this.modalReference4 != undefined) {
            this.modalReference4.close();
            this.modalReference4 = undefined;
            return false;
        }else if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
            return false;
        }else if (this.modalReference2 != undefined) {
            this.modalReference2.close();
            this.modalReference2 = undefined;
            return false;
        }
        else if(this.modalReference6!=undefined){
            this.modalReference6.close();
            this.modalReference6 = undefined;
            return false;
        }
        else{
            if((this.startTimeline)&&(this.listSymptomsCheckedTimeline.length>0)){
                var obser =this.dialogService.confirm(this.translate.instant("land.Do you want to exit"), this.translate.instant("land.loseprogress"));
                return obser;
            }
            else{
                return true;
            }   
            
        }
        //return true;
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        //traquear
        var secs = this.getElapsedSeconds();
        var savedEvent = this.searchService.search(this.eventList, 'name', category);
        if (category == "Symptoms") {
            var subCategory = category + ' - ' + this.optionSymptomAdded;
            var savedSubEvent = this.searchService.search(this.eventList, 'name', subCategory);
            if (!savedSubEvent) {
                this.eventList.push({ name: subCategory });
                gtag('event', this.myuuid, { "event_category": subCategory, "event_label": secs });
            }
        }
        if (!savedEvent) {
            this.eventList.push({ name: category });
            gtag('event', this.myuuid, { "event_category": category, "event_label": secs });
        }
    }

    loadFilesLang() {
        this.searchDiseaseField = '';
        this.listOfFilteredDiseases = [];
        this.sendTerms = false;
        /*this.subscription.add(this.http.get('assets/jsons/phenotypes_' + this.lang + '.json')
            .subscribe((res: any) => {
                phenotypesinfo = res;
            }, (err) => {
                console.log(err);
            }));*/
    }

    ngOnInit() {
        this.activeRoute = this.router.url;
        this.selectedNoteSymptom = null;
        this.startTimeline = false;
        this.listSymptomsCheckedTimeline = [];
        this.listSymptomsCheckedModified = false;
        this.donnorSet = false;

        this.eventsService.on('changelang', function (lang) {
            if(lang!=this.lang){
                this.lang = lang;
                this.showDisease = false;
                this.infoOneDisease = {};
                this.actualInfoOneDisease = {};
                this.searchDiseaseField = '';
                this.listOfFilteredDiseases = [];
                this.step = 0;
                this.scrollToTop();
                this.startTimeline = false;
                this.listSymptomsCheckedTimeline = [];
                this.listSymptomsCheckedModified = false;
                this.donnorSet = false;
                this.selectedNoteSymptom = null;
                this.loadTranslations();
                this.currentStep = this.steps[0];
                this.focusInputDisease();
                this.currentStepTimeLine = this.stepsTimeLine[0];
            }
            
        }.bind(this));

        this.eventSubscription = Observable.fromEvent(window, "scroll").subscribe(e => {
            if($('#tabspills')){
                console.log($('#tabspills').height())
                if($('#tabspills').height()>720){
                    this.showButtonScroll = true;
                }else{
                    this.showButtonScroll = false;
                }
            }
            //console.log(window.innerHeight);
        });
        

        this.stepsTimeLine = [
            { stepIndex: 1, isComplete: false, title: this.translate.instant("land.step1")},
            { stepIndex: 2, isComplete: false, title: this.translate.instant("land.step2")},
            { stepIndex: 3, isComplete: false , title: this.translate.instant("land.step4")}
          ];

        this.currentStepTimeLine = this.stepsTimeLine[0];

        this.loadTranslations();
        
    }

    loadTranslations(){
        this.translate.get('land.step1').subscribe((res: string) => {
            this.stepsTimeLine[0].title=res;
        });
        this.translate.get('land.step2').subscribe((res: string) => {
            this.stepsTimeLine[1].title=res;
        });
        this.translate.get('land.step4').subscribe((res: string) => {
            this.stepsTimeLine[2].title=res;
        });
      }

    ngAfterViewInit() {
        //this.focusTextArea();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.eventSubscription.unsubscribe();

        if (this.subscriptionDiseasesCall) {
            this.subscriptionDiseasesCall.unsubscribe();
        }
        if (this.subscriptionDiseasesNotFound) {
            this.subscriptionDiseasesNotFound.unsubscribe();
        }
        if (this.timeSubscription) {
            this.timeSubscription.unsubscribe();
        }
        this.role = '';
    }

    selected($e) {
        $e.preventDefault();
        if (!$e.item.error) {
            var symptom = $e.item;
            var foundElement = this.searchService.search(this.infoOneDisease.symptoms, 'id', symptom.id);
            if (!foundElement) {
                console.log(symptom);
                this.infoOneDisease.symptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: true, percentile: -1, inputType: 'manual', importance: '1', polarity: '0', synonyms: symptom.synonyms, desc: symptom.desc });
                //this.infoOneDisease.symptoms.sort(this.sortService.GetSortOrder("name"));
                this.listSymptomsCheckedTimeline.push({ id: symptom.id, name: symptom.name, new: true, checked: true, percentile: -1, inputType: 'manual', importance: '1', polarity: '0', synonyms: symptom.synonyms, desc: symptom.desc });
                this.getNumberOfSymptomsDiseaseChecked();
                this.optionSymptomAdded = "Manual";
                this.lauchEvent("Symptoms");
            } else {
                var foundElementIndex = this.searchService.searchIndex(this.infoOneDisease.symptoms, 'id', symptom.id);
                if (!this.infoOneDisease.symptoms[foundElementIndex].checked) {
                    this.infoOneDisease.symptoms[foundElementIndex].checked = true;
                    this.listSymptomsCheckedTimeline.push(this.infoOneDisease.symptoms[foundElementIndex]);
                }
                //this.toastr.warning(this.translate.instant("generics.Name")+': '+symptom.name, this.translate.instant("phenotype.You already had the symptom"));
            }
            console.log(this.listSymptomsCheckedTimeline);
            console.log(this.infoOneDisease.symptoms);
        }
        this.modelTemp = '';
    }

    showSwal(text){
        Swal.fire({
            icon: 'success',
            html: text,
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        })
        setTimeout(function () {
            Swal.close();
        }, 2000);
    }

    showMoreInfoSymptomPopup(symptomIndex, contentInfoSymptomNcr) {
        this.ncrResultView = false;
        this.selectedInfoSymptomIndex = symptomIndex;
        let ngbModalOptions: NgbModalOptions = {
            keyboard: false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference4 = this.modalService.open(contentInfoSymptomNcr, ngbModalOptions);
    }

    showMoreInfoSymptomPopupTimeline(symptomId, contentInfoSymptomNcr) {
        this.ncrResultView = false;
        var foundElementIndex = this.searchService.searchIndex(this.infoOneDisease.symptoms, 'id', symptomId);
        this.selectedInfoSymptomIndex = foundElementIndex;
        let ngbModalOptions: NgbModalOptions = {
            keyboard: false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference4 = this.modalService.open(contentInfoSymptomNcr, ngbModalOptions);
    }
    
    showMoreInfoAndNotesSymptomPopup(symptom, contentInfoAndNotesSymptom){
        this.selectedNoteSymptom = symptom;
        let ngbModalOptions: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference4 = this.modalService.open(contentInfoAndNotesSymptom, ngbModalOptions);
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

    registerToDx29Swal(contentToDx29V2) {
        let ngbModalOptions: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        this.modalReference3 = this.modalService.open(contentToDx29V2, ngbModalOptions);
    }

    registerToDx29V2() {
        this.lauchEvent("Registration");
        this.lauchEvent("Registration Power Diagnosed - Event");
        if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
        }
        this.setSymptomsParams();
    }

    setSymptomsParams(){
        var listSymptoms=[];
        for(var i =0; i < this.listSymptomsCheckedTimeline.length;i++){
            var onsetdate = null;
            if((this.listSymptomsCheckedTimeline[i].onsetdate!=undefined)&&(this.listSymptomsCheckedTimeline[i].onsetdate!=null)){
                onsetdate = this.listSymptomsCheckedTimeline[i].onsetdate
            }
            var enddate = null;
            if((this.listSymptomsCheckedTimeline[i].finishdate!=undefined)&&(this.listSymptomsCheckedTimeline[i].finishdate!=null)){
                enddate = this.listSymptomsCheckedTimeline[i].finishdate
            }
            var isCurrentSymptom = null;
            if((this.listSymptomsCheckedTimeline[i].isCurrentSymptom!=undefined)&&(this.listSymptomsCheckedTimeline[i].isCurrentSymptom!=null)){
                isCurrentSymptom = this.listSymptomsCheckedTimeline[i].isCurrentSymptom
            }
            if(this.listSymptomsCheckedTimeline[i].onsetdate!=null){
                var tempDateonsetdate = new Date(this.listSymptomsCheckedTimeline[i].onsetdate)
                var diferenciahorario=tempDateonsetdate.getTimezoneOffset();
                tempDateonsetdate.setMinutes ( tempDateonsetdate.getMinutes() - diferenciahorario );
                onsetdate = tempDateonsetdate.toUTCString();
                onsetdate = new Date(Date.parse(onsetdate));
            }
            if(this.listSymptomsCheckedTimeline[i].finishdate!=null){
                var tempDateenddate = new Date(this.listSymptomsCheckedTimeline[i].finishdate)
                var diferenciahorario=tempDateenddate.getTimezoneOffset();
                tempDateenddate.setMinutes ( tempDateenddate.getMinutes() - diferenciahorario );
                enddate = tempDateenddate.toUTCString();
                enddate = new Date(Date.parse(enddate));
            }

            listSymptoms.push({"Id":this.listSymptomsCheckedTimeline[i].id,"StartDate":onsetdate,"EndDate":enddate,"IsCurrent":isCurrentSymptom, "Notes": this.listSymptomsCheckedTimeline[i].notes})
        }

        var info = {
            "Symptoms": listSymptoms
        }
        if (this.listSymptomsCheckedTimeline.length > 0) {
            this.subscription.add(this.apiDx29ServerService.createblobOpenDx29(info)
                .subscribe((res: any) => {
                    sessionStorage.removeItem('symptoms');
                    sessionStorage.removeItem('uuid');
                    if (res.message == 'Done') {
                        window.location.href = environment.urlDxv2 + "/Identity/Account/Register?opendata=" + res.token;
                    } else {
                        window.location.href = environment.urlDxv2 + "/Identity/Account/Register";
                    }
                }));
        } else {
            window.location.href = environment.urlDxv2 + "/Identity/Account/Register";
        }
    }

    selectRole() {
        //this.role = role;
        if(this.currentStep.stepIndex==1){
            this.router.navigate(['/']);
        }else if(this.currentStep.stepIndex==2){
            this.goToStep(0);
            this.focusInputDisease();
        }
        
    }

    searchSymptoms: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.callListOfSymptoms = true),
      switchMap(term =>
        this.searchTermService.search(term).pipe(
          tap(() => this.nothingFoundSymptoms = false),
          catchError(() => {
            this.nothingFoundSymptoms = true;
            return of([]);
          }))
      ),
      tap(() => this.callListOfSymptoms = false)
    )

    loadNameDiseasesEn(id) {

        var info = {
            "text": id,
            "lang": 'en'
        }
        this.subscription.add(this.apiDx29ServerService.searchDiseases(info)
            .subscribe((res: any) => {
                if (res.length > 0) {
                    var name = res[0].name;
                    this.getClinicalTrials(name);
                }
            }, (err) => {
                console.log(err);
            }));
    }

    clearsearchDiseaseField(){
        this.searchDiseaseField = "";
        this.listOfFilteredDiseases = [];
        this.callListOfDiseases = false;
    }
    

    onKey(event: KeyboardEvent) {
        if(event.key ==='ArrowLeft' || event.key ==='ArrowUp' || event.key ==='ArrowRight' || event.key ==='ArrowDown'){

        }else{
            this.nothingFoundDisease = false;
            if(!((this.startTimeline)&&(this.listSymptomsCheckedTimeline.length>0))){
                this.showDisease = false;
            }
            this.showIntro = true;
            if (this.searchDiseaseField.trim().length > 3) {
                if (this.subscriptionDiseasesCall) {
                    this.subscriptionDiseasesCall.unsubscribe();
                }
                if (this.subscriptionDiseasesNotFound) {
                    this.subscriptionDiseasesNotFound.unsubscribe();
                }
                this.callListOfDiseases = true;
                var tempModelTimp = this.searchDiseaseField.trim();
                var info = {
                    "text": tempModelTimp,
                    "lang": sessionStorage.getItem('lang')
                }
                this.subscriptionDiseasesCall= this.apiDx29ServerService.searchDiseases(info)
                    .subscribe((res: any) => {
                        this.callListOfDiseases = false;
                        if(res==null){
                            this.nothingFoundDisease = true;
                            this.listOfFilteredDiseases = [];
                        }else{
                            this.nothingFoundDisease = false;
                            this.listOfFilteredDiseases = res;
                            if(this.listOfFilteredDiseases.length == 0){
                                this.nothingFoundDisease = true;
                            }
                            if (this.listOfFilteredDiseases.length == 0 && !this.sendTerms) {
                                //send text
                                this.sendSympTerms = true;
                                var params: any = {}
                                params.uuid = this.myuuid;
                                params.Term = tempModelTimp;
                                params.Lang = sessionStorage.getItem('lang');
                                var d = new Date(Date.now());
                                var a = d.toString();
                                params.Date = a;
                                this.subscription.add(this.http.post('https://prod-112.westeurope.logic.azure.com:443/workflows/95df9b0148cf409f9a8f2b0853820beb/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OZyXnirC5JTHpc_MQ5IwqBugUqI853qek4o8qjNy7AA', params)
                                    .subscribe((res: any) => {
                                    }, (err) => {
                                    }));
                            }
                        }
                        
                    }, (err) => {
                        console.log(err);
                        this.nothingFoundDisease = false;
                        this.callListOfDiseases = false;
                    });
            } else {
                this.callListOfDiseases = false;
                this.listOfFilteredDiseases = [];
                this.sendTerms = false;
            }
        }
    }

    showMoreInfoDiagnosePopup(index) {
        if((this.startTimeline)&&(this.listSymptomsCheckedTimeline.length>0)){
            Swal.fire({
                title: this.translate.instant("generics.Are you sure?"),
                text: this.translate.instant("land.diagnosed.timeline.ExitDiscard"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#33658A',
                cancelButtonColor: '#B0B6BB',
                confirmButtonText: this.translate.instant("generics.Yes"),
                cancelButtonText: this.translate.instant("generics.No"),
                showLoaderOnConfirm: true,
                allowOutsideClick: false,
                reverseButtons: false
              }).then(result => {
                if (result.value) {
                    this.loadingOneDisease = true;
                    this.selectedDiseaseIndex = index;
                    this.actualInfoOneDisease = this.listOfFilteredDiseases[this.selectedDiseaseIndex];
                    this.getInfoOneDisease();
                    this.startTimeline = false;
                    this.listSymptomsCheckedTimeline = [];

                } else {
                    this.searchDiseaseField = "";
                    this.listOfFilteredDiseases = [];
                    this.callListOfDiseases = false;
                }
              });
        }
        else{
            this.loadingOneDisease = true;
            this.selectedDiseaseIndex = index;
            this.actualInfoOneDisease = this.listOfFilteredDiseases[this.selectedDiseaseIndex];
            this.getInfoOneDisease();
        }
    }

    getInfoOneDisease() {
        var nameEvent = 'Diagnosed - Select Disease - '+ this.actualInfoOneDisease.id;
        this.focusOutFunctionDiseases();
        this.lauchEvent(nameEvent);
        this.currentStepTimeLine = this.stepsTimeLine[0];
        this.symptomsCopy = [];
        this.goToStep(1);
        this.listOfFilteredDiseases = [];
        this.identifyValue = '';
        this.searchDiseaseField = '';
        this.infoOneDisease = {};
        this.getPatientGroups();
        var lang = sessionStorage.getItem('lang');
        var param = [this.actualInfoOneDisease.id];
        this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang, param, 0)
            .subscribe((res: any) => {
                var info = res[this.actualInfoOneDisease.id];
                if (info == undefined) {
                    this.subscription.add(this.apif29BioService.getInfoOfDiseasesLang(param, lang)
                        .subscribe((res1: any) => {
                            this.infoOneDisease = res1[this.actualInfoOneDisease.id];
                            if(this.infoOneDisease!=undefined){
                                
                                this.cleanxrefs();
                                if (this.lang == 'es') {
                                    this.loadNameDiseasesEn(this.actualInfoOneDisease.id);
    
                                } else {
                                    this.getClinicalTrials(this.actualInfoOneDisease.name);
                                }
    
                                this.showEffects();
                                this.getFromWiki(this.actualInfoOneDisease.name);
                                if(this.infoOneDisease.symptoms){
                                    for (var j = 0; i < this.infoOneDisease.symptoms.length; j++) {
                                        this.infoOneDisease.symptoms[j].checked = false;
                                    }
                                }
                            }else{
                                this.infoOneDisease = this.actualInfoOneDisease;
                                if (this.lang == 'es') {
                                    this.loadNameDiseasesEn(this.actualInfoOneDisease.id);
    
                                } else {
                                    this.getClinicalTrials(this.actualInfoOneDisease.name);
                                }
                                this.getFromWiki(this.actualInfoOneDisease.name);
                                this.loadingOneDisease = false;
                                this.showDisease = true;
                            }

                        }, (err) => {
                            console.log(err);
                        }));
                } else {
                    this.infoOneDisease = info;
                    this.cleanxrefs();
                    this.infoOneDisease.symptoms = [];
                    var tamano = Object.keys(info.phenotypes).length;
                    if (tamano > 0) {
                        var hposStrins = [];
                        for (var i in info.phenotypes) {
                            var frequency = info.phenotypes[i].frequency;
                            if (frequency != undefined) {
                                hposStrins.push(frequency);
                            } else {
                                info.phenotypes[i].Frequency = { name: this.translate.instant("land.Unknown"), id: 'HP:9999999' };
                            }
                            info.phenotypes[i].id = i;
                            this.infoOneDisease.symptoms.push(info.phenotypes[i]);
                        }
                        this.getfrequenciesSelectedDisease(hposStrins);
                    }
                    if (this.lang == 'es') {
                        this.loadNameDiseasesEn(this.actualInfoOneDisease.id);

                    } else {
                        this.getClinicalTrials(this.actualInfoOneDisease.name);
                    }
                    this.getFromWiki(this.actualInfoOneDisease.name);
                    if(this.infoOneDisease.symptoms){
                        for (var j = 0; i < this.infoOneDisease.symptoms.length; j++) {
                            this.infoOneDisease.symptoms[j].checked = false;
                        }
                    }
                }
                this.startTimeline = false;
                this.listSymptomsCheckedTimeline = [];
                this.listSymptomsCheckedModified = false;
                this.donnorSet = false;
                
                
            }, (err) => {
                console.log(err);
                this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
            }));
    }

    getPatientGroups(){
        this.loadingPatientGroups = true;
        this.patientGroups = [];
        var param = this.actualInfoOneDisease.id.split(':');
        this.subscription.add(this.apiDx29ServerService.getPatientGroups(param[1])
                .subscribe((res: any) => {
                    this.patientGroups = res;
                    this.loadingPatientGroups = false;
                }));
    }
    
    showAttentionPanel(contentInfoAttention){
        console.log(this.listSymptomsCheckedTimeline.length)
        if(this.listSymptomsCheckedTimeline.length>0) {
            let ngbModalOptions: NgbModalOptions = {
                backdrop: 'static',
                keyboard: false,
                windowClass: 'ModalClass-sm'// xl, lg, sm
            };
            this.modalReference2 = this.modalService.open(contentInfoAttention, ngbModalOptions);
        }
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
        this.infoOneDisease.name = this.textTransform.transform(this.actualInfoOneDisease.name);
        this.loadingOneDisease = false;
        this.showDisease = true;
    }

    getfrequenciesSelectedDisease(hposStrins) {
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
                                    this.infoOneDisease.symptoms[j].Frequency = { name: res[i].name, desc: res[i].desc, id: res[i].id };
                                }
                            }
                        }
                    }
                }
                for (var j = 0; j < this.infoOneDisease.symptoms.length; j++) {
                    if (this.infoOneDisease.symptoms[j].Frequency == undefined) {
                        this.infoOneDisease.symptoms[j].Frequency = { name: this.translate.instant("land.Unknown"), id: 'HP:9999999' };
                    }
                }
                this.infoOneDisease.symptoms.sort(this.sortService.GetSortTwoElementsLand("Frequency", "name"));
                if(this.symptomsCopy.length==0){
                    this.symptomsCopy = JSON.parse(JSON.stringify(this.infoOneDisease.symptoms));
                }
                this.showEffects();

            }, (err) => {
                console.log(err);
            });
    }

    changeStateSymptom(index) {
        this.infoOneDisease.symptoms[index].checked = !this.infoOneDisease.symptoms[index].checked;
        this.listSymptomsCheckedTimeline=[];
        this.getNumberOfSymptomsDiseaseChecked();
        if(this.numberOfSymtomsChecked>0){
            this.listSymptomsCheckedModified = true;
            for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
                if(this.infoOneDisease.symptoms[i].checked){
                    this.listSymptomsCheckedTimeline.push(this.infoOneDisease.symptoms[i]);
                }
            }
            this.listSymptomsCheckedModified = false;
        }

        /*if(!state){
            this.deleteSymptom(this.infoOneDisease.symptoms[index]);
        }*/
    }

    deleteSymptom(symptom){
        var index = -1;
        var found = false;
        for(var i=0;i<this.infoOneDisease.symptoms.length;i++)
          {
            if(symptom.id==this.infoOneDisease.symptoms[i].id){
              index= i;
              found = true;
              this.confirmDeletePhenotype2(index);
            }
          }
      }

      confirmDeletePhenotype2(index){
        Swal.fire({
            title: this.translate.instant("generics.Are you sure delete")+" "+this.infoOneDisease.symptoms[index].name+" ?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#33658A',
            cancelButtonColor: '#B0B6BB',
            confirmButtonText: this.translate.instant("generics.Accept"),
            cancelButtonText: this.translate.instant("generics.Cancel"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            reverseButtons:true
        }).then((result) => {
          if (result.value) {
            this.infoOneDisease.symptoms.splice(index, 1);
            this.lauchEvent("Delete symptoms");
            this.listSymptomsCheckedTimeline=[];
            this.getNumberOfSymptomsDiseaseChecked();
            if(this.numberOfSymtomsChecked>0){
                this.listSymptomsCheckedModified = true;
                for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
                    if(this.infoOneDisease.symptoms[i].checked){
                        this.listSymptomsCheckedTimeline.push(this.infoOneDisease.symptoms[i]);
                    }
                }
                this.listSymptomsCheckedModified = false;
            }
          }
        });
  
      }

    changeStateSymptomDisease(index) {
        
        if (this.infoOneDisease.symptoms[index].checked) {
            this.infoOneDisease.symptoms[index].checked = !this.infoOneDisease.symptoms[index].checked;            
        } else {
            this.infoOneDisease.symptoms[index].checked = true;
        }

        this.listSymptomsCheckedTimeline=[];
        this.getNumberOfSymptomsDiseaseChecked();
        if(this.numberOfSymtomsChecked>0){
            this.listSymptomsCheckedModified = true;
            for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
                if(this.infoOneDisease.symptoms[i].checked){
                    this.listSymptomsCheckedTimeline.push(this.infoOneDisease.symptoms[i]);
                }
            }
            this.listSymptomsCheckedModified = false;
        }
        
    }

    getNumberOfSymptomsDiseaseChecked() {
        this.numberOfSymtomsChecked = 0;
        for (var i = 0; i < this.infoOneDisease.symptoms.length; i++) {
            if (this.infoOneDisease.symptoms[i].checked) {
                this.numberOfSymtomsChecked++;
            }
        }
    }


    openTimelineAppHelp1(contentTimelineAppHelp1){
        if(this.modalReference5==undefined){
            let ngbModalOptions: NgbModalOptions = {
                keyboard: false,
                windowClass: 'ModalClass-sm'// xl, lg, sm
            };
            this.modalReference5 = this.modalService.open(contentTimelineAppHelp1, ngbModalOptions);
        }
        
    }
    closeTimelineAppHelp1(){
        if(this.modalReference5!=undefined){
            this.modalReference5.close();
            this.modalReference5=undefined;
        }
    }

    sendSymtomsChecked() {
        if (this.numberOfSymtomsChecked == 0) {
            Swal.fire('', this.translate.instant("land.diagnosed.symptoms.error1"), "error");
        } else {
            this.sending = true;
            var listChecked = {};
            for (var i = 0; i < this.infoOneDisease.symptoms.length; i++) {
                if (this.infoOneDisease.symptoms[i].checked) {
                    if(listChecked[this.infoOneDisease.symptoms[i].id]==undefined){
                        listChecked[this.infoOneDisease.symptoms[i].id]={}
                    }
                    if(this.infoOneDisease.symptoms[i].onsetdate==undefined){
                        this.infoOneDisease.symptoms[i].onsetdate=null
                    }
                    if(this.infoOneDisease.symptoms[i].finishdate==undefined){
                        this.infoOneDisease.symptoms[i].finishdate=null
                    }
                    if(this.infoOneDisease.symptoms[i].isCurrentSymptom==undefined){
                        this.infoOneDisease.symptoms[i].isCurrentSymptom=null
                    }
                    if(this.infoOneDisease.symptoms[i].notes==undefined){
                        this.infoOneDisease.symptoms[i].notes=null
                    }
                    listChecked[this.infoOneDisease.symptoms[i].id]={"onsetdate":this.infoOneDisease.symptoms[i].onsetdate,"finishdate":this.infoOneDisease.symptoms[i].finishdate,"isCurrentSymptom":this.infoOneDisease.symptoms[i].isCurrentSymptom,"notes":this.infoOneDisease.symptoms[i].notes}
                }
            }
            var infoChecked = { idClient: this.myuuid, diseaseId: this.actualInfoOneDisease.id, xrefs: this.infoOneDisease.xrefs, symptoms: listChecked, email: this.email};
            this.subscription.add(this.apiDx29ServerService.chekedSymptomsOpenDx29(infoChecked)
            .subscribe((res: any) => {
                    var info = { email: this.email, lang: this.lang};
                    this.subscription.add(this.apiDx29ServerService.sendEmailRevolution(info)
                        .subscribe((res: any) => {
                            this.sending = false;
                            this.donnorSet = true;
                            Swal.fire({
                                icon: 'success',
                                html: this.translate.instant("land.diagnosed.DonorData.msgform"),
                                showCancelButton: false,
                                showConfirmButton: false,
                                allowOutsideClick: false
                            })
                            setTimeout(function () {
                                Swal.close();
                                //window.location.href = 'https://foundation29.org/';
                            }, 2000);
                            this.email = '';
                            if (this.modalReference2 != undefined) {
                                this.modalReference2.close();
                                this.modalReference2 = undefined;
                            }
                            this.lauchEvent('Diagnosed - Send Symptoms');
                            document.getElementById('step1').scrollIntoView(true);
                            this.curatedLists.push({ id: this.actualInfoOneDisease.id });
                            this.dontShowIntro = true;
                            this.sending = false;
                        }, (err) => {
                            console.log(err);
                            this.sending = false;
                            this.toastr.error('', this.translate.instant("generics.error try again"));
                    }));
            }, (err) => {
                console.log(err);
                this.sending = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));
        }
    }

    getClinicalTrials(name) {
        this.subscription.add(this.apiExternalServices.getClinicalTrials(name)
            .subscribe((res: any) => {
                this.clinicalTrials = [];
                if (res.FullStudiesResponse.FullStudies != undefined) {
                    for (var i = 0; i < res.FullStudiesResponse.FullStudies.length; i++) {
                        if (res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.StatusModule.OverallStatus == 'Available'
                            || res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.StatusModule.OverallStatus == 'Recruiting') {
                            //clean countries
                            if (res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.ContactsLocationsModule.LocationList != undefined) {
                                var listCountries = res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.ContactsLocationsModule.LocationList.Location;
                                var listCountriesCleaned = [];
                                for (var j = 0; j < listCountries.length; j++) {
                                    var foundElement = this.searchService.search(listCountriesCleaned, 'LocationCountry', listCountries[j].LocationCountry);
                                    if (!foundElement) {
                                        listCountriesCleaned.push(listCountries[j]);
                                    }
                                }
                                res.FullStudiesResponse.FullStudies[i].Study.ProtocolSection.ContactsLocationsModule.listCountriesCleaned = listCountriesCleaned;
                            }
                            this.clinicalTrials.push(res.FullStudiesResponse.FullStudies[i]);
                        }
                    }
                }
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

    onSubmitDonorData() {
        this.showErrorForm = false;
        this.sending = true;
        this.formOpen.Email = (this.formOpen.Email).toLowerCase();
        var params: any = {}
        params.form = this.formOpen;
        var params: any = {}
        params.Email = this.formOpen.Email;
        params.Answers = this.formOpen.Answers.toString();
        params.Disease = this.actualInfoOneDisease.id + ", " +this.actualInfoOneDisease.name;
        params.Free = this.formOpen.Free;
        params.Lang = sessionStorage.getItem('lang');
        var d = new Date(Date.now());
        var a = d.toString();
        params.Date = a;
        this.subscription.add(this.http.post('https://prod-12.westeurope.logic.azure.com:443/workflows/183bc21bfa054c77ac44c297e1f3bd04/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rYHWLbMjZrv_q3yN8EezS5zA2Jmvyxc16-zKtn4zQz0', params)
            .subscribe((res: any) => {
                this.sending = false;
                Swal.fire('', this.translate.instant("land.diagnosed.DonorData.msgform"), "success");
                this.formOpen = { Answers: [], Free: '', Email: '', terms2: false };
            }, (err) => {
                console.log(err);
                this.sending = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));

    }

    showAllDesc() {
        this.showAllDescrip = true;
    }

    showEffects() {
        var foundElement = this.searchService.search(this.curatedLists, 'id', this.actualInfoOneDisease.id);
        if (foundElement) {
            this.showIntro = false;
        }

        this.showAllDescrip = false;
    }

    closeSymptom() {
        if (this.modalReference4 != undefined) {
            this.modalReference4.close();
            this.modalReference4 = undefined;
        }
    }

    letsGo() {
        if (this.modalReference2 != undefined) {
            this.modalReference2.close();
            this.modalReference2 = undefined;
        }
        this.showIntro = false;
    }

    onSubmitRevolution() {
        this.showErrorForm = false;
        this.sending = true;
        var params: any = {}
        params.Email = (this.email).toLowerCase();
        params.Lang = sessionStorage.getItem('lang');
        var d = new Date(Date.now());
        var a = d.toString();
        params.Date = a;
        this.subscription.add(this.http.post('https://prod-59.westeurope.logic.azure.com:443/workflows/2d7a82d83b4c4b92a8270a84540b0213/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fnADjHH0yXxYxonVtre2_yrUFyQ0LR4cX2PJSnPwmrM', params)
            .subscribe((res: any) => {
                this.sending = false;
                //Swal.fire('', this.translate.instant("land.diagnosed.general.msgSend"), "success");
                Swal.fire({
                    icon: 'success',
                    html: this.translate.instant("land.diagnosed.DonorData.msgform"),
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false
                })
                setTimeout(function () {
                    Swal.close();
                    //window.location.href = 'https://foundation29.org/';
                }, 2000);
                this.email = '';
                if (this.modalReference2 != undefined) {
                    this.modalReference2.close();
                    this.modalReference2 = undefined;
                }
            }, (err) => {
                console.log(err);
                this.sending = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));

    }

    closeDisease() {
        if((this.startTimeline)&&(this.listSymptomsCheckedTimeline.length>0)){
            Swal.fire({
                title: this.translate.instant("generics.Are you sure?"),
                text: this.translate.instant("land.diagnosed.timeline.ExitDiscard"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#33658A',
                cancelButtonColor: '#B0B6BB',
                confirmButtonText: this.translate.instant("generics.Yes"),
                cancelButtonText: this.translate.instant("generics.No"),
                showLoaderOnConfirm: true,
                allowOutsideClick: false,
                reverseButtons: false
              }).then(result => {
                if (result.value) {
                    this.showIntro = true;
                    this.listOfFilteredDiseases = []
                    this.showDisease = false;
                    this.searchDiseaseField = '';
                    this.startTimeline = false;
                    this.listSymptomsCheckedTimeline = [];
                    this.focusInputDisease();
                }
              });
        }
        else{
            this.showIntro = true;
            this.listOfFilteredDiseases = []
            this.showDisease = false;
            this.searchDiseaseField = '';
            this.focusInputDisease();
        }
    }

    focusOutFunctionDiseases(){
        //if (this.searchDiseaseField.trim().length > 3 && this.listOfFilteredDiseases.length==0 && !this.callListOfDiseases) {
        if (this.searchDiseaseField.trim().length > 3 && !this.callListOfDiseases) {
            //send text
            var tempModelTimp = this.searchDiseaseField.trim();
            this.sendTerms = true;
            var params: any = {}
            params.uuid = this.myuuid;
            params.Term = tempModelTimp;
            params.Lang = sessionStorage.getItem('lang');
            params.Found = "No";
            if(this.listOfFilteredDiseases.length>0){
                params.Found = "Yes";
            }

            var d = new Date(Date.now());
            var a = d.toString();
            params.Date = a;
            this.subscription.add(this.http.post('https://prod-246.westeurope.logic.azure.com:443/workflows/5af138b9f41f400f89ecebc580d7668f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PiYef1JHGPRDGhYWI0s1IS5a_9Dpz7HLjwfEN_M7TKY', params)
                .subscribe((res: any) => {
                }, (err) => {
                }));
        }
    }

    checkConsent(){
        this.formOpen.terms2 = !this.formOpen.terms2;
    }

    getFromWiki(name) {
        this.actualArticle = {};
        this.viewArticle = false;
        this.infoWiki = [];
        this.infoWikiGeneral = [];
        var lang = sessionStorage.getItem('lang');
        var info = {
            "text": name,//"text": 'Dravet syndrome',
            "lang": lang
        }
        this.subscription.add(this.apiDx29ServerService.searchwiki(info)
            .subscribe((res: any) => {
                if(res.length>0){
                    this.infoWiki = res;
                    for (let i = 0; i < this.infoWiki.length; i++) {
                        if(this.infoWiki[i].title=='Enlaces externos' || this.infoWiki[i].title=='External links'){
                            var urls = this.infoWiki[i].content.split("\n");
                            this.infoWiki[i].urls = urls;
                        }else{
                            var regex = /\[([0-9]+)\]​/;
                            this.infoWiki[i].content = this.infoWiki[i].content.replaceAll(new RegExp(regex, "g"), "");
                        }
                    }
                    //this.switchNgBTab('generaltab');
                }else{
                    var t0 = performance.now()
                    var lang = sessionStorage.getItem('lang');
                    var info = {
                        "text": name, //'Síndrome de Dravet',//"text": 'Dravet syndrome',
                        "lang": lang
                    }
                    this.subscription.add(this.apiDx29ServerService.searchwikiSearch(info)
                        .subscribe((res: any) => {
                            if(res.query.search.length>0){
                                this.infoWikiGeneral = res.query.search;
                                var t1 = performance.now();
                                this.secondToResponse = ((t1 - t0)/1000).toFixed(2);
                                //this.switchNgBTab('generaltab');
                            }
                            
                        }, (err) => {
                            console.log(err);
                        }));
                }
                
            }, (err) => {
                console.log(err);
            }));
    }

    switchNgBTab(id: string) {
        setTimeout(function () {
            console.log(id);
            this.ctdTabset.select(id);
        }.bind(this), 50);
        
      }

    goToArticle(article){
        this.actualArticle = article;
        this.viewArticle = true;
        this.loadingArticle = true;
        var lang = sessionStorage.getItem('lang');
        var info = {
            "text": article.title,//"text": 'Dravet syndrome',
            "lang": lang
        }
        this.subscription.add(this.apiDx29ServerService.searchwiki(info)
            .subscribe((res: any) => {
                this.loadingArticle = false;
                if(res.length>0){
                    this.infoWiki = res;
                    for (let i = 0; i < this.infoWiki.length; i++) {
                        if(this.infoWiki[i].title=='Enlaces externos' || this.infoWiki[i].title=='External links'){
                            var urls = this.infoWiki[i].content.split("\n");
                            this.infoWiki[i].urls = urls;
                        }
                    }
                }
        }, (err) => {
            console.log(err);
        }));
    }

    backToList(){
        this.actualArticle = {};
        this.viewArticle = false;
    }

    addSymptomsEvent($event){
        console.log($event);
        var listSymptoms = $event.listSymptoms;
        for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
            if(this.infoOneDisease.symptoms[i].checked){
                this.infoOneDisease.symptoms[i].checked= false;
            }
        }
        if(listSymptoms.length>0){
            for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
                for (var j =0; j<listSymptoms.length;j++){
                    if(listSymptoms[j].id==this.infoOneDisease.symptoms[i].id){
                        this.infoOneDisease.symptoms[i].checked= true;
                    }
                }
            }

            this.listSymptomsCheckedTimeline=[];
            this.getNumberOfSymptomsDiseaseChecked();
            if(this.numberOfSymtomsChecked>0){
                this.listSymptomsCheckedModified = true;
                for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
                    if(this.infoOneDisease.symptoms[i].checked){
                        this.listSymptomsCheckedTimeline.push(this.infoOneDisease.symptoms[i]);
                    }
                }
                this.listSymptomsCheckedModified = false;
            }
        }
        

        this.startTimeline=false;
    }
    
    startTimelineFunction(){
        if(this.listSymptomsCheckedTimeline.length>0) {
            this.startTimeline=true;
            //this.scrollToTop();
        }
        else{
            Swal.fire('', this.translate.instant("land.diagnosed.symptoms.error1"), "error");
        }
        
    }
    endTimeLineFunction(){
        this.listSymptomsCheckedTimeline=[];
        for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
            if(this.infoOneDisease.symptoms[i].checked){
                this.infoOneDisease.symptoms[i].checked= false;
            }
        }
        this.startTimeline=false;
    }
    
    endTimeLineFunctionWithConfirmation(){
        if(this.listSymptomsCheckedTimeline.length>0){
            Swal.fire({
                title: this.translate.instant("generics.Are you sure?"),
                text: this.translate.instant("land.diagnosed.timeline.ExitDiscard"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#33658A',
                cancelButtonColor: '#B0B6BB',
                confirmButtonText: this.translate.instant("generics.Yes"),
                cancelButtonText: this.translate.instant("generics.No"),
                showLoaderOnConfirm: true,
                allowOutsideClick: false,
                reverseButtons: false
            }).then((result) => {
                if (result.value) {
                    this.listSymptomsCheckedTimeline=[];
                    for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
                        if(this.infoOneDisease.symptoms[i].checked){
                            this.infoOneDisease.symptoms[i].checked= false;
                        }
                    }
                    this.startTimeline=false;
                }
            })
        }else{
            this.listSymptomsCheckedTimeline=[];
            for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
                if(this.infoOneDisease.symptoms[i].checked){
                    this.infoOneDisease.symptoms[i].checked= false;
                }
            }
            this.startTimeline=false;
        }
    }


    checkDonnorState(contentInfoAttention){
        if(!this.donnorSet){
            let ngbModalOptions: NgbModalOptions = {
                backdrop: 'static',
                keyboard: false,
                windowClass: 'ModalClass-sm'// xl, lg, sm
            };
            //this.modalReference2 = this.modalService.open(contentInfoAttention, ngbModalOptions);
        }
        else{
            this.sendSymtomsChecked();
        }
    }

    openSaveTimeLine(contentSaveTimeline){
        //this.registerToDx29V2Timeline();
        if(this.modalReference6==undefined){
            let ngbModalOptions: NgbModalOptions = {
                keyboard: false,
                windowClass: 'ModalClass-lg'// xl, lg, sm
            };
            this.modalReference6 = this.modalService.open(contentSaveTimeline, ngbModalOptions);
        }
    }

    closeSaveTimeLine(){
        if(this.modalReference6!=undefined){
            this.modalReference6.close();
            this.modalReference6 = undefined;
        }
    }

    registerToDx29V2Timeline(){
        this.lauchEvent("Registration");
        this.lauchEvent("Registration Power Diagnosed - Timeline");
        if (this.modalReference6 != undefined) {
            this.modalReference6.close();
            this.modalReference6 = undefined;
        }

        this.setSymptomsParams();
    }

    scrollToTop(){
        window.scroll(0,0);
    }

    goToStep(index){
        this.currentStep= this.steps[index];
    }

    goTopTabs(){
        document.getElementById('inittabs').scrollIntoView(true);
    }

    closeRegisterPanel(){
        if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
        }
    }

    goNext(){
        var isNext = false;
        if(this.currentStepTimeLine.stepIndex==1){
            if(this.listSymptomsCheckedTimeline.length>0) {
                this.startTimeline=true;
                isNext=true;
            }
            else{
                Swal.fire('', this.translate.instant("land.diagnosed.symptoms.error1"), "error");
            }
        }else if(this.currentStepTimeLine.stepIndex==2){
            var tamanoWithDate= Object.keys(this.paramsTimeLine.dictionaryTimeline).length;
            var tamanoWithOutDate= this.paramsTimeLine.listTimelineNull.length;
            if(tamanoWithDate==0){
                Swal.fire({
                    title: this.translate.instant("land.diagnosed.timeline.msValidationChrono3"),
                    text: this.translate.instant("land.diagnosed.timeline.msValidationChrono2"),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#33658A',
                    cancelButtonColor: '#B0B6BB',
                    confirmButtonText: this.translate.instant("generics.Yes"),
                    cancelButtonText: this.translate.instant("generics.No"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: false
                }).then((result) => {
                    if (result.value) {
                        var foundElementIndex = this.searchService.searchIndex(this.stepsTimeLine, 'stepIndex', this.currentStepTimeLine.stepIndex);
                        this.currentStepTimeLine= this.stepsTimeLine[foundElementIndex+1];
                        document.getElementById('initsteps').scrollIntoView(true);
                    }
                });
            }else if(tamanoWithOutDate>0){
                Swal.fire({
                    title: this.translate.instant("land.diagnosed.timeline.msValidationChrono1",{
                        value: tamanoWithOutDate
                      }),
                    text: this.translate.instant("land.diagnosed.timeline.msValidationChrono2"),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#33658A',
                    cancelButtonColor: '#B0B6BB',
                    confirmButtonText: this.translate.instant("generics.Yes"),
                    cancelButtonText: this.translate.instant("generics.No"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: false
                }).then((result) => {
                    if (result.value) {
                        var foundElementIndex = this.searchService.searchIndex(this.stepsTimeLine, 'stepIndex', this.currentStepTimeLine.stepIndex);
                        this.currentStepTimeLine= this.stepsTimeLine[foundElementIndex+1];
                        document.getElementById('initsteps').scrollIntoView(true);
                    }
                });
            }else{
                isNext=true;
            }
            
        }
        if(isNext){
            var foundElementIndex = this.searchService.searchIndex(this.stepsTimeLine, 'stepIndex', this.currentStepTimeLine.stepIndex);
            this.currentStepTimeLine= this.stepsTimeLine[foundElementIndex+1];
            document.getElementById('initsteps').scrollIntoView(true);
        }
        
    }

    goPrevious(){
        var foundElementIndex = this.searchService.searchIndex(this.stepsTimeLine, 'stepIndex', this.currentStepTimeLine.stepIndex);
        this.currentStepTimeLine= this.stepsTimeLine[foundElementIndex-1];
        document.getElementById('initsteps').scrollIntoView(true);
    }

    getParamsTimeLine(info){
        console.log(info);
        this.paramsTimeLine = info;
    }

    exportTimeline(){
        if(!this.loadingPdf){
            this.loadingPdf = true;
                Swal.fire({
                    title: this.translate.instant("land.diagnosed.timeline.Download"),
                    html: '<div class="col-md-12"><span><i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i></span></div><div class="col-md-12 mt-2"> <p> ' + this.translate.instant("land.diagnosed.timeline.WaitDownload") + '</p></div>',
                    allowEscapeKey: false,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: function () {
                        this.jsPDFService.generateTimelinePDF(this.paramsTimeLine.lang, this.paramsTimeLine.dictionaryTimeline, this.paramsTimeLine.listTimelineNull, this.paramsTimeLine.disease, this.paramsTimeLine.topRelatedConditions, true);
                        Swal.close();
                        this.loadingPdf = false;
                    }.bind(this)
                });
        }
    }

    focusOutFunctionSymptom(){
        if(this.showErrorMsg && this.modelTemp.length > 2){
                this.sendSympTerms = true;
                var params: any = {}
                params.uuid = this.myuuid;
                params.Term = this.modelTemp;
                params.Lang = sessionStorage.getItem('lang');
                var d = new Date(Date.now());
                var a = d.toString();
                params.Date = a;
                this.subscription.add(this.http.post('https://prod-112.westeurope.logic.azure.com:443/workflows/95df9b0148cf409f9a8f2b0853820beb/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OZyXnirC5JTHpc_MQ5IwqBugUqI853qek4o8qjNy7AA', params)
                    .subscribe((res: any) => {
                    }, (err) => {
                    }));
            
        }
        this.modelTemp = '';
        this.callListOfSymptoms = false;
    }

    directCalculate() {
        if (this.infoOneDisease.symptoms.length >= this.minSymptoms) {
            if(this.medicalText.length>5){
                this.startExtractor();
            }else{
                this.lauchEvent("Symptoms");
                this.goNext();
            }
            
        } else {
            if(this.medicalText.length>5){
                this.startExtractor();
            }else{
                Swal.fire('', this.translate.instant("land.diagnosed.symptoms.error1"), "error");
                this.loadingCalculate = false;
            }  
        }

    }

    startExtractor() {
        this.optionSymptomAdded = "Textarea";
        if (this.medicalText.length < 5) {
            Swal.fire('', this.translate.instant("land.placeholderError"), "error");
        } else {
            var testLangText = this.medicalText.substr(0, 4000)
            this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
                .subscribe((res: any) => {
                    this.langToExtract = res[0].language;
                    this.langDetected = this.langToExtract;
                    this.onSubmitToExtractor();
                }, (err) => {
                    console.log(err);
                    this.loadingHpoExtractor = false;
                    this.toastr.error('', this.translate.instant("generics.error try again"));
                }));
        }
    }

    onSubmitToExtractor() {
        //this.restartAllVars();
        this.failSegmentation = false;
        this.loadingHpoExtractor = true;
        this.substepExtract = '1';
        var lang = this.lang;
        if (this.langToExtract != '') {
            lang = this.langToExtract;
        }
        var jsontestLangText = { "text": this.medicalText };
        this.subscription.add(this.apif29BioService.getSegmentation(lang, jsontestLangText)
            .subscribe((res: any) => {
                this.resultSegmentation = res;
                this.prepareCallNCR();

            }, (err) => {
                console.log(err);
                this.failSegmentation = true;
                this.callNoSegmentation();
            }));
    }

    prepareCallNCR() {
        if (this.langToExtract != 'en') {
            this.substepExtract = '2';
            if (this.resultSegmentation.segments) {
                for (let i = 0; i < this.resultSegmentation.segments.length; i++) {
                    this.resultSegmentation.segments[i].language_source = this.langToExtract;
                }
            }
            this.resultSegmentation.language_source = this.langToExtract;
            this.subscription.add(this.apif29BioService.getTranslationDictionary('en', this.resultSegmentation)
                .subscribe((res: any) => {
                    res.language_source = this.langToExtract;
                    this.resultSegmentation = res;
                    this.callNCR();
                }, (err) => {
                    console.log(err);
                    setTimeout(function () {
                        this.prepareCallNCR();
                    }, this.timeoutWait);
                    this.timeoutWait = this.timeoutWait+2000;
                }));
        } else {
            this.callNCR();
        }
    }

    callNCR() {
        this.numberOfSymtomsChecked = 0;
        this.failAnnotate_batch = false;
        var temporal = [];
        if (this.resultSegmentation.segments) {
            for (let i = 0; i < this.resultSegmentation.segments.length; i++) {
                if (this.langToExtract != 'en') {
                    temporal.push({ text: this.resultSegmentation.segments[i].target, source: this.resultSegmentation.segments[i].source });
                } else {
                    temporal.push({ text: this.resultSegmentation.segments[i].source });
                }

            }
        }
        this.substepExtract = '3';
        this.subscription.add(this.apif29NcrService.getAnnotate_batch(temporal)
            .subscribe((res: any) => {
                var infoNcr = res;
                if (res.message == 'Replica closed connection before replying' || res == null) {
                    Swal.close();
                    Swal.fire(this.translate.instant("generics.Warning"), 'Replica closed connection before replying', "error");
                } else if (res.message == 'Too many requests for service ncr-gpu (overloaded)') {
                    Swal.close();
                    Swal.fire(this.translate.instant("generics.Warning"), 'Too many requests for service ncr-gpu (overloaded)', "error");
                } else {
                    if (infoNcr.length > 0) {
                        var countAddedSypmtoms = 0;
                        for (var i = 0; i < infoNcr.length; i++) {
                            if (infoNcr[i].phens.length > 0) {
                                infoNcr[i].phens.sort(this.sortService.GetSortOrderNumberInverse("characters"));
                            }

                            for (var j = 0; j < infoNcr[i].phens.length; j++) {
                                var positions = [];
                                infoNcr[i].phens[j].characters[0] = parseInt(infoNcr[i].phens[j].characters[0])
                                infoNcr[i].phens[j].characters[1] = parseInt(infoNcr[i].phens[j].characters[1])
                                positions.push(infoNcr[i].phens[j].characters);
                                var text = [];
                                if (infoNcr[i].source) {
                                    text = [{ positions: positions[0], text: infoNcr[i].text, source: infoNcr[i].source }];
                                } else {
                                    text = [{ positions: positions[0], text: infoNcr[i].text }];
                                }

                                var symptomExtractor = { id: infoNcr[i].phens[j].id, name: infoNcr[i].phens[j].concept, new: true, similarity: parseFloat(infoNcr[i].phens[j].probability), positions: positions, text: text };
                                var isAdded = this.addTemporalSymptom(symptomExtractor, 'ncr');
                                if (isAdded) {
                                    countAddedSypmtoms++;
                                }
                            }

                        }
                        if (countAddedSypmtoms > 0) {
                            console.log(countAddedSypmtoms);
                            Swal.fire('', this.translate.instant("land.diagnosed.symptoms.syptomsDetected", {
                                value: countAddedSypmtoms
                            }), "success");
                        }
                        this.resultTextNcr = this.medicalText;
                        this.resultTextNcrCopy = this.medicalText;
                        //this.sortBySimilarity();

                        this.medicalText = '';

                        //getInfo symptoms
                        var hposStrins = [];
                        this.infoOneDisease.symptoms.forEach(function (element) {
                            hposStrins.push(element.id);
                        });

                        //Swal.close();
                        if (hposStrins.length == 0) {
                            //Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                            //this.medicalText = '';
                            this.substepExtract = '0';
                            Swal.fire({
                                title: this.translate.instant("phenotype.No symptoms found"),
                                text: this.translate.instant("land.Do you want to add the symptoms manually"),
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#33658A',
                                cancelButtonColor: '#B0B6BB',
                                confirmButtonText: this.translate.instant("land.add the symptoms manually"),
                                cancelButtonText: this.translate.instant("land.try again"),
                                showLoaderOnConfirm: true,
                                allowOutsideClick: false,
                                reverseButtons: false
                            }).then((result) => {
                                if (result.value) {
                                    this.substepExtract = '4';
                                    this.lauchEvent("Symptoms");
                                    this.focusManualSymptoms();
                                } else {
                                    this.focusTextArea();
                                }
                            });
                        } else {
                            this.callGetInfoTempSymptomsJSON(hposStrins);
                        }

                    } else {
                        this.substepExtract = '4';
                        this.lauchEvent("Symptoms");
                        Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                        this.focusManualSymptoms();
                    }

                    this.loadingHpoExtractor = false;
                }

            }, (err) => {
                console.log(err);
                this.failAnnotate_batch = true;
                //fail getAnnotate_batch
                this.callNoSegmentation();
                Swal.close();
            }));
    }

    focusManualSymptoms() {
        setTimeout(function () {
            if (this.infoOneDisease.symptoms.length == 0) {
                this.inputManualSymptomsElement.nativeElement.focus();
            }
            this.getNumberOfSymptomsDiseaseChecked();
            //this.getNumberOfSymptomsChecked(false);
        }.bind(this), 200);
    }

    focusTextArea() {
        setTimeout(function () {
            this.inputTextAreaElement.nativeElement.focus();
        }.bind(this), 200);
    }

    callNoSegmentation() {
        this.subscription.add(this.apif29NcrService.getNoSegmentation(this.medicalText)
            .subscribe((res: any) => {
                var infoNcr = res.result;
                if (infoNcr != undefined) {
                    if (infoNcr.length > 0) {
                        var countAddedSypmtoms = 0;
                        for (var i = 0; i < infoNcr.length; i++) {
                            var positions = [];
                            infoNcr[i].characters[0] = parseInt(infoNcr[i].characters[0])
                            infoNcr[i].characters[1] = parseInt(infoNcr[i].characters[1])
                            positions.push(infoNcr[i].characters);
                            var text = [];
                            text = [{ positions: positions[0], text: infoNcr[i].concept }];
                            var symptomExtractor = { id: infoNcr[i].id, name: infoNcr[i].concept, new: true, similarity: parseFloat(infoNcr[i].probability), positions: positions, text: text };
                            var isAdded = this.addTemporalSymptom(symptomExtractor, 'ncrOld');
                            if (isAdded) {
                                countAddedSypmtoms++;
                            }
                        }
                        if (countAddedSypmtoms > 0) {
                            console.log(countAddedSypmtoms);
                            Swal.fire('', this.translate.instant("land.diagnosed.symptoms.syptomsDetected", {
                                value: countAddedSypmtoms
                            }), "success");
                        }
                        this.resultTextNcr = this.medicalText;
                        this.resultTextNcrCopy = this.medicalText;
                        //this.sortBySimilarity();

                        this.medicalText = '';

                        //getInfo symptoms
                        var hposStrins = [];
                        this.infoOneDisease.symptoms.forEach(function (element) {
                            hposStrins.push(element.id);
                        });

                        //Swal.close();
                        if (hposStrins.length == 0) {
                            Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                            this.medicalText = '';
                            this.substepExtract = '0';
                        } else {
                            this.callGetInfoTempSymptomsJSON(hposStrins);
                        }
                    } else {
                        this.substepExtract = '4';
                        this.lauchEvent("Symptoms");
                        Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                        this.focusManualSymptoms();
                    }
                } else {
                    this.substepExtract = '4';
                    this.lauchEvent("Symptoms");
                    Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                    this.focusManualSymptoms();
                }

            }, (err) => {
                console.log(err);
                //fail getNoSegmentation
                Swal.close();
            }));
    }

    callGetInfoTempSymptomsJSON(hposStrins) {
        //this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(hposStrins,this.listOfphenotypesinfo)
        var lang = this.lang;
        this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang, hposStrins)
            .subscribe((res: any) => {

                var tamano = Object.keys(res).length;
                if (tamano > 0) {
                    for (var i in res) {
                        for (var j = 0; j < this.infoOneDisease.symptoms.length; j++) {
                            if (res[i].id == this.infoOneDisease.symptoms[j].id) {
                                this.infoOneDisease.symptoms[j].name = res[i].name;
                                this.infoOneDisease.symptoms[j].def = res[i].desc;
                                this.infoOneDisease.symptoms[j].synonyms = res[i].synonyms;
                                this.infoOneDisease.symptoms[j].comment = res[i].comment;
                                if (this.infoOneDisease.symptoms[j].importance == undefined) {
                                    this.infoOneDisease.symptoms[j].importance = 1;
                                }
                            }
                        }
                    }
                    this.infoOneDisease.symptoms.sort(this.sortService.GetSortOrder("name"));
                    if(this.symptomsCopy.length==0){
                        this.symptomsCopy = JSON.parse(JSON.stringify(this.infoOneDisease.symptoms));
                    }
                }
                this.substepExtract = '4';
                this.lauchEvent("Symptoms");
                this.showSwalSelectSymptoms();
                this.focusManualSymptoms();


            }, (err) => {
                console.log(err);
                this.substepExtract = '4';
                this.lauchEvent("Symptoms");
                this.focusManualSymptoms();
            }));
    }

    addTemporalSymptom(symptom, inputType) {
        var foundElement = this.searchService.search(this.infoOneDisease.symptoms, 'id', symptom.id);
        if (!foundElement) {
            this.infoOneDisease.symptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: null, percentile: -1, inputType: inputType, importance: '1', polarity: '0', similarity: symptom.similarity, positions: symptom.positions, text: symptom.text });
            this.infoOneDisease.symptoms.sort(this.sortService.GetSortOrder("name"));
            return true;
        }else{
            return false;
        }
    }

    showSwalSelectSymptoms() {
        if (this.infoOneDisease.symptoms.length == 0) {
            this.inputManualSymptomsElement.nativeElement.focus();
        }
        /*var showSwalSelSymptoms = localStorage.getItem('showSwalSelSymptoms');
        if (showSwalSelSymptoms != 'false') {
            Swal.fire({
                icon: 'warning',
                html: '<p>' + this.translate.instant("land.you have to select") + '</p><p>' + this.translate.instant("land.When you have selected them") + '</p>',
                input: 'checkbox',
                inputPlaceholder: this.translate.instant("land.Do not show this message again"),
                focusConfirm: true
            }).then((result) => {
                if (result.isConfirmed) {
                    if (result.value) {
                        localStorage.setItem('showSwalSelSymptoms', 'false');
                    }
                } else {
                    console.log(`modal was dismissed by ${result.dismiss}`)
                }
                if (this.infoOneDisease.symptoms.length == 0) {
                    this.inputManualSymptomsElement.nativeElement.focus();
                }
            })
        }*/

    }

    onFileDropped(event) {
        var reader = new FileReader();
        reader.readAsDataURL(event[0]); // read file as data url
        reader.onload = (event2: any) => { // called once readAsDataURL is completed
            var the_url = event2.target.result
            var extension = (event[0]).name.substr((event[0]).name.lastIndexOf('.'));
            extension = extension.toLowerCase();
            this.langToExtract = '';
            this.optionSymptomAdded = "File";
            if (event[0].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension == '.docx') {
                this.loadFile(the_url, function (err, content) {
                    if (err) { console.log(err); };
                    var doc = new Docxgen(content);
                    var text = doc.getFullText();
                    this.detectLanguage(text, 'otherdocs');
                    this.medicalText = text;
                    this.showPanelExtractor = true;
                    this.expanded = true;
                }.bind(this))
            } else if (event[0].type == 'application/pdf' || extension == '.pdf' || extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif') {
                this.parserObject.file = event[0]
                if (extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif') {
                    this.parserObject.parserStrategy = 'OcrOnly';
                } else {
                    this.parserObject.parserStrategy = 'OcrOnly';//Auto
                }
                this.callParser();
            } else {
                Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "error");
            }

        }
    }

    onFileChangePDF(event) {
        if (event.target.files && event.target.files[0]) {
            var reader = new FileReader();
            reader.readAsDataURL(event.target.files[0]); // read file as data url
            reader.onload = (event2: any) => { // called once readAsDataURL is completed
                var the_url = event2.target.result

                var extension = (event.target.files[0]).name.substr((event.target.files[0]).name.lastIndexOf('.'));
                extension = extension.toLowerCase();
                this.langToExtract = '';
                this.optionSymptomAdded = "File";
                if (event.target.files[0].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension == '.docx') {
                    this.loadFile(the_url, function (err, content) {
                        if (err) { console.log(err); };
                        var doc = new Docxgen(content);
                        var text = doc.getFullText();
                        this.detectLanguage(text, 'otherdocs');
                        this.medicalText = text;
                        this.showPanelExtractor = true;
                        this.expanded = true;
                    }.bind(this))
                } else if (event.target.files[0].type == 'application/pdf' || extension == '.pdf' || extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif') {
                    this.parserObject.file = event.target.files[0]
                    if (extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif') {
                        this.parserObject.parserStrategy = 'OcrOnly';
                    } else {
                        this.parserObject.parserStrategy = 'OcrOnly';//Auto
                    }

                    this.callParser();

                } else {
                    Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "error");
                }

            }

        }
    }

    loadFile(url, callback) {
        JSZipUtils.getBinaryContent(url, callback);
    }

    callParser() {
        Swal.fire({
            title: this.translate.instant("generics.Please wait"),
            html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw info"></i>',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then((result) => {

        });

        this.parserObject.callingParser = true;
        var self = this;
        var oReq = new XMLHttpRequest();
        var lang = this.lang;
        if (this.langToExtract != '') {
            lang = this.langToExtract;
        }

        oReq.open("PUT", environment.f29api + '/api/Document/Parse?Timeout=5000&language=' + lang + '&Strategy=' + this.parserObject.parserStrategy, true);

        var self = this;
        oReq.onload = function (oEvent) {
            Swal.close();
            self.langToExtract = '';
            self.parserObject.callingParser = false;
            // Uploaded.
            let file = oEvent.target;
            var target: any = {};
            target = file;
            //target--> status, strategy, content
            if (target.response.content == undefined) {
                self.medicalText = '';
            } else {
                self.medicalText = target.response.content
                self.medicalText = self.medicalText.split("\n").join(" ");
            }

            self.showPanelExtractor = true;
            self.expanded = true;

            if (target.response.status == 'RequireOcr') {
                self.parserObject.parserStrategy = 'OcrOnly';
                Swal.fire({
                    title: self.translate.instant("parser.OcrOnlyTitle"),
                    text: self.translate.instant("parser.OcrOnlyText"),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#33658A',
                    cancelButtonColor: '#B0B6BB',
                    confirmButtonText: self.translate.instant("generics.Yes"),
                    cancelButtonText: self.translate.instant("generics.No"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: false
                }).then((result) => {
                    if (result.value) {
                        self.callParser();
                    } else {
                        var testLangText = self.medicalText.substr(0, 4000)
                        self.detectLanguage(testLangText, 'parser');
                    }
                });

            } else {
                self.parserObject.parserStrategy = 'Auto'
                var testLangText = self.medicalText.substr(0, 4000)
                self.detectLanguage(testLangText, 'parser');
            }
        };
        oReq.send(this.parserObject.file);
        const rt = "json";
        oReq.responseType = rt;
    }

    detectLanguage(testLangText, method) {
        this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
            .subscribe((res: any) => {
                var lang = this.lang;
                this.langDetected = res[0].language;
                if (this.langDetected != lang && this.parserObject.parserStrategy != 'Auto') {


                    Swal.fire({
                        title: this.translate.instant("patdiagdashboard.We have detected that the document is in another language"),
                        text: this.translate.instant("patdiagdashboard.Analyzed as") + '" "' + lang + '", "' + this.translate.instant("patdiagdashboard.detected as") + '" "' + res[0].language + '". "' + this.translate.instant("patdiagdashboard.do you want us to do it"),
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#33658A',
                        cancelButtonColor: '#B0B6BB',
                        confirmButtonText: this.translate.instant("generics.Yes"),
                        cancelButtonText: this.translate.instant("generics.No"),
                        showLoaderOnConfirm: true,
                        allowOutsideClick: false,
                        reverseButtons: false
                    }).then((result) => {
                        if (result.value) {
                            this.langToExtract = this.langDetected
                            if (method == 'parser') {
                                this.callParser();
                            }
                        } else {
                            this.langToExtract = this.langDetected
                            if (this.medicalText != '') {
                                this.onSubmitToExtractor();
                            } else {
                                Swal.fire(this.translate.instant("patdiagdashboard.No text has been detected in the file"), '', "error");
                            }
                        }
                    });

                } else {
                    if (this.langDetected != lang) {
                        this.langToExtract = this.langDetected
                    } else {
                        this.langToExtract = lang;
                    }
                    if (this.medicalText != '') {
                        this.onSubmitToExtractor();
                    } else {
                        Swal.fire(this.translate.instant("patdiagdashboard.No text has been detected in the file"), '', "error");
                    }

                }
            }, (err) => {
                console.log(err);
                this.loadingHpoExtractor = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));
    }

    restartInitVars(){
        console.log(this.symptomsCopy);
        this.infoOneDisease.symptoms = JSON.parse(JSON.stringify(this.symptomsCopy));
    }

    copySymptoms() {
        var infoSymptoms = this.getPlainInfoSymptoms();
        if (infoSymptoms != "") {
            this.clipboard.copy(this.getPlainInfoSymptoms());
            Swal.fire({
                icon: 'success',
                html: this.translate.instant("land.Symptoms copied to the clipboard"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false
            })
            setTimeout(function () {
                Swal.close();
            }, 2000);
            this.lauchEvent("Copy symptoms");

        } else {
            Swal.fire(this.translate.instant("land.To be able to copy the symptoms"), '', "warning");
        }
    }

    downloadSymptoms() {
        var infoSymptoms = this.getCheckedSymptoms();
        if (infoSymptoms.length!=0) {
            var infoSymptoms = this.getCheckedSymptoms();
            var infoDiseases = [];//this.getPlainInfoDiseases();
            this.jsPDFService.generateResultsPDF(infoSymptoms, infoDiseases, this.lang)
        } else {
            Swal.fire(this.translate.instant("land.In order to download the symptoms"), '', "warning");
        }
    }

    getPlainInfoSymptoms() {
        var resCopy = "";
        for (let i = 0; i < this.infoOneDisease.symptoms.length; i++) {
            if (this.infoOneDisease.symptoms[i].checked) {
                resCopy = resCopy + this.infoOneDisease.symptoms[i].id + " - " + this.infoOneDisease.symptoms[i].name;
                if (i + 1 < this.infoOneDisease.symptoms.length) {
                    resCopy = resCopy + "\n";
                }
            }
        }
        return resCopy;
    }

    getCheckedSymptoms() {
        var resCopy = [];
        for (let i = 0; i < this.infoOneDisease.symptoms.length; i++) {
            if (this.infoOneDisease.symptoms[i].checked) {
                resCopy.push(this.infoOneDisease.symptoms[i]);
            }
        }
        return resCopy;
    }

    sendIdentifySymptoms(para){
        this.identifyValue = para;
        console.log(para);
        this.sending = true;
        this.formOpen.Email = (this.formOpen.Email).toLowerCase();
        var params: any = {};
        params.Answer = para;
        params.Disease = this.actualInfoOneDisease.id + ", " +this.actualInfoOneDisease.name;
        params.uuid = this.myuuid;
        params.Lang = sessionStorage.getItem('lang');
        var d = new Date(Date.now());
        var a = d.toString();
        params.Date = a;
        console.log(params);
        this.subscription.add(this.http.post('https://prod-172.westeurope.logic.azure.com:443/workflows/e180fab9f19b438292832f43ada1c878/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=aXlHmQmCwQEolQ4dTSx1NLOfqsIoSis0cMLgphLJPu8', params)
            .subscribe((res: any) => {
                this.sending = false;
                Swal.fire('', this.translate.instant("dashboardpatient.You have completed all the steps"), "success");
            }, (err) => {
                console.log(err);
                this.sending = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));
    }

    sendEmail() {
        var infoSymptoms = this.getPlainInfoSymptomsEmail();
        var infoDisease = this.getPlainInfoDiseasesEmail();
        var pdfBase64 = this.jsPDFService.generateTimelinePDF(this.paramsTimeLine.lang, this.paramsTimeLine.dictionaryTimeline, this.paramsTimeLine.listTimelineNull, this.paramsTimeLine.disease, this.paramsTimeLine.topRelatedConditions, false);
        Swal.fire({
            title: this.translate.instant("land.Enter email address"),
            input: 'email',
            confirmButtonText: this.translate.instant("land.Next"),
            cancelButtonText: this.translate.instant("generics.Cancel"),
            showCancelButton: true,
            reverseButtons: false
        }).then(function (email) {
            if (email.value) {
                Swal.fire({
                    input: 'textarea',
                    inputLabel: this.translate.instant("land.Message"),
                    inputPlaceholder: this.translate.instant("land.Type your message here"),
                    confirmButtonText: this.translate.instant("land.Send"),
                    cancelButtonText: this.translate.instant("generics.Cancel"),
                    showCancelButton: true,
                    reverseButtons: false
                }).then(function (message) {
                    var actualDate = new Date();
                    var dateHeader = this.getFormatDate(actualDate);

                    var info = { email: email.value, msg: message.value, symptoms: infoSymptoms, disease: infoDisease, lang: this.lang, dateHeader: dateHeader, pdfBase64: pdfBase64 };
                    this.subscription.add(this.apiDx29ServerService.sendEmailResultsDiagnosed(info)
                        .subscribe((res: any) => {
                            Swal.fire({
                                icon: 'success',
                                html: this.translate.instant("land.Email sent to") + ' ' + email.value
                            })
                        }));
                }.bind(this))
            } else {
            }
        }.bind(this))
    }

    getFormatDate(date) {
        var localeLang = 'en-US';
        if (this.lang == 'es') {
            localeLang = 'es-ES'
        }
        var optionsdate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleString(localeLang, optionsdate);
      }

    getPlainInfoSymptomsEmail() {
        var resCopy = "";
        for (let i = 0; i < this.infoOneDisease.symptoms.length; i++) {
            if (this.infoOneDisease.symptoms[i].checked) {
                resCopy = resCopy + this.infoOneDisease.symptoms[i].name + " - " + '<a href="https://hpo.jax.org/app/browse/term/'+this.infoOneDisease.symptoms[i].id+'">'+this.infoOneDisease.symptoms[i].id+'</a>';
                if (i + 1 < this.infoOneDisease.symptoms.length) {
                    resCopy = resCopy + " <br> ";
                }
            }
        }
        return resCopy;
    }

    getPlainInfoDiseasesEmail() {
        var value = this.actualInfoOneDisease.id.split(':');
        var resCopy = this.actualInfoOneDisease.name + " - " + '<a href="https://www.orpha.net/consor/cgi-bin/OC_Exp.php?Expert='+value[1]+'&lng='+this.lang+'">'+this.actualInfoOneDisease.id+'</a>';
        return resCopy;
    }

}
