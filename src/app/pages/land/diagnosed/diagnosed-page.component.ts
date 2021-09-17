import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Injectable } from '@angular/core';
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
import {jsPDFService} from 'app/shared/services/jsPDF.service'

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

@Component({
    selector: 'app-diagnosed-page',
    templateUrl: './diagnosed-page.component.html',
    styleUrls: ['./diagnosed-page.component.scss'],
    providers: [Apif29BioService, Apif29NcrService, ApiDx29ServerService, ApiExternalServices, jsPDFService],
})

export class DiagnosedPageComponent implements OnInit, OnDestroy, AfterViewInit {

    private subscription: Subscription = new Subscription();
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
    originalLang: string = 'en';
    selectedInfoDiseaseIndex: number = -1;
    totalDiseasesLeft: number = -1;
    numberOfSymtomsChecked: number = 0;
    minSymptoms: number = 2;
    @ViewChild('input') inputEl;
    showButtonScroll: boolean = false;
    failAnnotate_batch: boolean = false;
    failSegmentation: boolean = false;
    lineChartIdealOptions: Partial<ChartOptions>;
    lineChartRuidoOptions: Partial<ChartOptions>;
    refLangs: string = "https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support";
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
    modalReference7: NgbModalRef;
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

    //@ViewChild("inputTextArea") inputTextAreaElement: ElementRef;
    @ViewChild("inputManualSymptoms") inputTextAreaElement: ElementRef;
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

    startCheckSymptoms = false;
    startTimeline = false;
    listSymptomsCheckedTimeline: any = []
    listSymptomsCheckedModified = false;
    donnorSet = false;

    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

    formatter1 = (x: { name: string }) => x.name;
    optionSymptomAdded: string = "textarea";

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private apif29BioService: Apif29BioService, private apif29NcrService: Apif29NcrService, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private textTransform: TextTransform, private eventsService: EventsService, private highlightSearch: HighlightSearch, public googleAnalyticsService: GoogleAnalyticsService, public searchFilterPipe: SearchFilterPipe, private apiExternalServices: ApiExternalServices, public dialogService: DialogService, public jsPDFService: jsPDFService) {

        this.lang = sessionStorage.getItem('lang');
        this.selectedNoteSymptom = null;
        this.startCheckSymptoms = false;
        this.startTimeline = false;
        this.listSymptomsCheckedTimeline = [];
        this.listSymptomsCheckedModified = false;
        this.donnorSet = false;

        this.originalLang = sessionStorage.getItem('lang');
        if (this.lang == 'es') {
            this.refLangs = "https://docs.microsoft.com/es-es/azure/cognitive-services/translator/language-support";
        } else {
            this.refLangs = "https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support";
        }

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
        }else if(this.modalReference7!=undefined){
            this.modalReference7.close();
            this.modalReference7 = undefined;
            return false;
        }
        else{
            if((this.startCheckSymptoms||this.startTimeline)&&(this.listSymptomsCheckedTimeline.length>0)){
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
        this.startCheckSymptoms = false;
        this.startTimeline = false;
        this.listSymptomsCheckedTimeline = [];
        this.listSymptomsCheckedModified = false;
        this.donnorSet = false;

        /*this.subscription.add(this.route.params.subscribe(params => {
            if (params['role'] != undefined) {
                this.role = params['role'];
                if (this.role == 'undiagnosed' || this.role == 'clinician') {
                    this.focusTextArea();
                }
            } else {
                this.router.navigate(['/']);
            }
        }));*/

        this.eventsService.on('changelang', function (lang) {
            this.lang = lang;
            if (this.lang == 'es') {
                this.refLangs = "https://docs.microsoft.com/es-es/azure/cognitive-services/translator/language-support";
            } else {
                this.refLangs = "https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support";
            }
            if(this.actualInfoOneDisease.id!=undefined){
                this.getInfoOneDisease();
            }
            this.searchDiseaseField = '';
            this.listOfFilteredDiseases = [];
        }.bind(this));
    }

    ngAfterViewInit() {
        //this.focusTextArea();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();

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
        this.lauchEvent("Registration Power");
        if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
        }
        var info = {
            "Symptoms": []
        }
        for (var index in this.temporalSymptoms) {
            if (this.temporalSymptoms[index].checked) {
                info.Symptoms.push(this.temporalSymptoms[index].id);
            }
        }
        if (info.Symptoms.length > 0) {
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

    selectRole(role) {
        //this.role = role;
        this.router.navigate(['/']);
    }

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

    onKey() {
        this.nothingFoundDisease = false;
        if(!((this.startCheckSymptoms||this.startTimeline)&&(this.listSymptomsCheckedTimeline.length>0))){
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

    showMoreInfoDiagnosePopup(index) {
        if((this.startCheckSymptoms||this.startTimeline)&&(this.listSymptomsCheckedTimeline.length>0)){
            Swal.fire({
                title: this.translate.instant("land.Do you want to exit"),
                text: this.translate.instant("land.loseprogress"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#0CC27E',
                cancelButtonColor: '#f9423a',
                confirmButtonText: this.translate.instant("generics.Yes"),
                cancelButtonText: this.translate.instant("generics.No, cancel"),
                showLoaderOnConfirm: true,
                allowOutsideClick: false
              }).then(result => {
                if (result.value) {
                    this.loadingOneDisease = true;
                    this.selectedDiseaseIndex = index;
                    this.actualInfoOneDisease = this.listOfFilteredDiseases[this.selectedDiseaseIndex].id;
                    this.getInfoOneDisease();
                    this.startCheckSymptoms = false;
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
        this.listOfFilteredDiseases = [];
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
                                    this.loadNameDiseasesEn(this.infoOneDisease.id);
    
                                } else {
                                    this.getClinicalTrials(this.infoOneDisease.name);
                                }
    
                                this.showEffects();
                                this.getFromWiki(this.infoOneDisease.name);
                                if(this.infoOneDisease.symptoms){
                                    for (var j = 0; i < this.infoOneDisease.symptoms.length; j++) {
                                        this.infoOneDisease.symptoms[j].checked = false;
                                    }
                                }
                            }else{
                                this.infoOneDisease = this.actualInfoOneDisease;
                                if (this.lang == 'es') {
                                    this.loadNameDiseasesEn(this.infoOneDisease.id);
    
                                } else {
                                    this.getClinicalTrials(this.infoOneDisease.name);
                                }
                                this.getFromWiki(this.infoOneDisease.name);
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
                        this.loadNameDiseasesEn(this.infoOneDisease.id);

                    } else {
                        this.getClinicalTrials(this.infoOneDisease.name);
                    }
                    this.getFromWiki(this.infoOneDisease.name);
                    if(this.infoOneDisease.symptoms){
                        for (var j = 0; i < this.infoOneDisease.symptoms.length; j++) {
                            this.infoOneDisease.symptoms[j].checked = false;
                        }
                    }
                }
                
                
                this.startCheckSymptoms = false;
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
        this.infoOneDisease.name = this.textTransform.transform(this.infoOneDisease.name);
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

                this.showEffects();

            }, (err) => {
                console.log(err);
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

    openTimelineAppHelp2(contentTimelineAppHelp2){
        if(this.modalReference7==undefined){
            let ngbModalOptions: NgbModalOptions = {
                keyboard: false,
                windowClass: 'ModalClass-sm'// xl, lg, sm
            };
            this.modalReference7 = this.modalService.open(contentTimelineAppHelp2, ngbModalOptions);
        }
        
    }
    closeTimelineAppHelp2(){
        if(this.modalReference7!=undefined){
            this.modalReference7.close();
            this.modalReference7=undefined;
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
            var infoChecked = { idClient: this.myuuid, diseaseId: this.infoOneDisease.id, xrefs: this.infoOneDisease.xrefs, symptoms: listChecked, email: this.email};
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
                            this.curatedLists.push({ id: this.infoOneDisease.id });
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
        console.log(params);
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
        var foundElement = this.searchService.search(this.curatedLists, 'id', this.infoOneDisease.id);
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
        if((this.startCheckSymptoms||this.startTimeline)&&(this.listSymptomsCheckedTimeline.length>0)){
            Swal.fire({
                title: this.translate.instant("land.Do you want to exit"),
                text: this.translate.instant("land.loseprogress"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#0CC27E',
                cancelButtonColor: '#f9423a',
                confirmButtonText: this.translate.instant("generics.Yes"),
                cancelButtonText: this.translate.instant("generics.No, cancel"),
                showLoaderOnConfirm: true,
                allowOutsideClick: false
              }).then(result => {
                if (result.value) {
                    this.showIntro = true;
                    this.listOfFilteredDiseases = []
                    this.showDisease = false;
                    this.searchDiseaseField = '';
                    this.startCheckSymptoms = false;
                    this.startTimeline = false;
                    this.listSymptomsCheckedTimeline = [];
                }
              });
        }
        else{
            this.showIntro = true;
            this.listOfFilteredDiseases = []
            this.showDisease = false;
            this.searchDiseaseField = '';
        }
    }

    focusOutFunctionDiseases(){
        if (this.searchDiseaseField.trim().length > 3 && this.listOfFilteredDiseases.length==0 && !this.callListOfDiseases) {
            //send text
            var tempModelTimp = this.searchDiseaseField.trim();
            this.sendTerms = true;
            var params: any = {}
            params.uuid = this.myuuid;
            params.Term = tempModelTimp;
            params.Lang = sessionStorage.getItem('lang');
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
                        }
                    }
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
                            }
                            
                        }, (err) => {
                            console.log(err);
                        }));
                }
                
            }, (err) => {
                console.log(err);
            }));
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
    startCheckSymptomsFunction(){
        this.startCheckSymptoms = true;
    }

    endCheckSymptomsFunction(){
        this.startCheckSymptoms = false;
    }
    
    startTimelineFunction(){
        if(this.listSymptomsCheckedTimeline.length>0) {
            this.endCheckSymptomsFunction();
            this.startTimeline=true;
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
        this.endCheckSymptomsFunction();
    }
    
    endTimeLineFunctionWithConfirmation(){
        if(this.listSymptomsCheckedTimeline.length>0){
            Swal.fire({
                title: this.translate.instant("generics.Are you sure?"),
                text: this.translate.instant("land.diagnosed.timeline.ExitDiscard"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#0CC27E',
                cancelButtonColor: '#f9423a',
                confirmButtonText: this.translate.instant("generics.Yes"),
                cancelButtonText: this.translate.instant("generics.No"),
                showLoaderOnConfirm: true,
                allowOutsideClick: false,
                reverseButtons: true
            }).then((result) => {
                if (result.value) {
                    this.listSymptomsCheckedTimeline=[];
                    for (var i =0; i<this.infoOneDisease.symptoms.length;i++){
                        if(this.infoOneDisease.symptoms[i].checked){
                            this.infoOneDisease.symptoms[i].checked= false;
                        }
                    }
                    this.startTimeline=false;
                    this.endCheckSymptomsFunction();
                }
            })
        }
    }


    checkDonnorState(contentInfoAttention){
        if(!this.donnorSet){
            let ngbModalOptions: NgbModalOptions = {
                backdrop: 'static',
                keyboard: false,
                windowClass: 'ModalClass-sm'// xl, lg, sm
            };
            this.modalReference2 = this.modalService.open(contentInfoAttention, ngbModalOptions);
        }
        else{
            this.sendSymtomsChecked();
        }
    }

    openSaveTimeLine(contentSaveTimeline){
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
        this.lauchEvent("Registration Power");
        if (this.modalReference6 != undefined) {
            this.modalReference6.close();
            this.modalReference6 = undefined;
        }
        var listSymptoms=[]
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
            listSymptoms.push({"Id":this.listSymptomsCheckedTimeline[i].id,"OnsetDate":onsetdate,"EndDate":enddate,"IsCurrent":isCurrentSymptom})
        }

        var info = {
            "Symptoms": listSymptoms
        }
        
        if (this.listSymptomsCheckedTimeline.length > 0) {
            this.subscription.add(this.apiDx29ServerService.createblobOpenDx29Timeline(info)
                .subscribe((res: any) => {
                    sessionStorage.removeItem('symptoms');
                    sessionStorage.removeItem('uuid');
                    if (res.message == 'Done') {
                        window.location.href = environment.urlDxv2 + "/Identity/Account/Register?opendatatimeline=" + res.token;
                    } else {
                        window.location.href = environment.urlDxv2 + "/Identity/Account/Register";
                    }
                }));
        } else {
            window.location.href = environment.urlDxv2 + "/Identity/Account/Register";
        }
    }

}
