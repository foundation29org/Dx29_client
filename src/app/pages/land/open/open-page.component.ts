import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { ApiClinicalTrialsService } from 'app/shared/services/api-clinicaltrials.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { SortService } from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { HighlightSearch } from 'app/shared/services/search-filter-highlight.service';
import { Clipboard } from "@angular/cdk/clipboard"
import { v4 as uuidv4 } from 'uuid';
import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';
import { SearchFilterPipe } from 'app/shared/services/search-filter.service';
import { DialogService  } from 'app/shared/services/dialog.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexGrid, ApexDataLabels, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexLegend, ApexPlotOptions, ApexFill, ApexMarkers, ApexTheme, ApexNonAxisChartSeries, ApexResponsive } from "ng-apexcharts";

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
let phenotypesinfo = [];
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
    selector: 'app-open-page',
    templateUrl: './open-page.component.html',
    styleUrls: ['./open-page.component.scss'],
    providers: [Apif29BioService, Apif29NcrService, ApiDx29ServerService, ApiClinicalTrialsService],
})

export class OpenPageComponent implements OnInit, OnDestroy, AfterViewInit {

    private subscription: Subscription = new Subscription();
    private subscriptionDiseasesCall: Subscription = new Subscription();
    private subscriptionDiseasesNotFound: Subscription = new Subscription();
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
    modalReference: NgbModalRef;
    temporalDiseases: any = [];
    topRelatedConditions: any = [];
    indexListRelatedConditions: number = 8;
    showNumerRelatedConditions: number = 8;
    langDetected: string = '';
    loadingCalculate: boolean = false;
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
    listOfFilteredDiseases: any = [];
    sendTerms: boolean = false;
    listOfDiseases: any = [];
    callListOfDiseases: boolean = false;
    selectedDiseaseIndex: number = -1;
    infoOneDisease: any = {};
    modalReference2: NgbModalRef;
    modalReference3: NgbModalRef;
    clinicalTrials: any = {};

    @ViewChild('f') donorDataForm: NgForm;
    sending: boolean = false;
    formOpen: any = { Answers: [], Free: '', Email: '', terms2: false };
    showErrorForm: boolean = false;
    showIntro: boolean = true;
    symtomsSent: boolean = false;
    sendEmailvar: boolean = false;
    curatedLists: any = [];
    dontShowIntro: boolean = false;
    showAllDescrip: boolean = false;
    showDisease: boolean = false;
    loadingOneDisease: boolean = false;
    email: string = '';
    nothingFoundDisease: boolean = false;
    private activeRoute: string;

    @ViewChild("inputTextArea") inputTextAreaElement: ElementRef;
    @ViewChild("inputManualSymptoms") inputManualSymptomsElement: ElementRef;

    myuuid: string = uuidv4();
    eventList: any = [];

    formatter1 = (x: { name: string }) => x.name;
    optionSymptomAdded: string = "textarea";

    // Flag search
    searchSymptom = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            map(term => {
                if (term.length < 2) {
                    return [];
                }
                const searchResults = ((phenotypesinfo.filter(v => v.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()) > -1).slice(0, 100))).concat((phenotypesinfo.filter(v => v.id.toLowerCase().indexOf(term.toLowerCase().trim()) > -1).slice(0, 100)))
                if (searchResults.length == 0) {
                    this.showErrorMsg = true;

                    if (!this.sendSympTerms) {
                        //send text
                        this.sendSympTerms = true;
                        var params: any = {}
                        params.uuid = this.myuuid;
                        params.Term = term;
                        params.Lang = sessionStorage.getItem('lang');
                        var d = new Date(Date.now());
                        var a = d.toString();
                        params.Date = a;
                        this.subscription.add(this.http.post('https://prod-112.westeurope.logic.azure.com:443/workflows/95df9b0148cf409f9a8f2b0853820beb/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OZyXnirC5JTHpc_MQ5IwqBugUqI853qek4o8qjNy7AA', params)
                            .subscribe((res: any) => {
                            }, (err) => {
                            }));
                    }

                } else {
                    this.sendSympTerms = false;
                    this.showErrorMsg = false;
                }
                return searchResults.length > 0 ? searchResults : [{ name: this.translate.instant("land.We have not found anything"), desc: this.translate.instant("land.Please try a different search"), error: true }];
            })
        );

    /*searchSymptom = (text$: Observable<string>) => {
        return text$.pipe(
          debounceTime(200),
          distinctUntilChanged(),
          map(term => {
            if (term.length < 2) {
              return [];
            }
            const searchResults = ((phenotypesinfo.filter(v => v.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()) > -1).slice(0, 100))).concat((phenotypesinfo.filter(v => v.id.toLowerCase().indexOf(term.toLowerCase().trim()) > -1).slice(0, 100)))
            return searchResults.length > 0 ? searchResults : [{name:"not found", desc: "Try again"}];
          })
        );
      };*/

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private apif29BioService: Apif29BioService, private apif29NcrService: Apif29NcrService, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private textTransform: TextTransform, private eventsService: EventsService, private highlightSearch: HighlightSearch, public googleAnalyticsService: GoogleAnalyticsService, public searchFilterPipe: SearchFilterPipe, private apiClinicalTrialsService: ApiClinicalTrialsService, public dialogService: DialogService) {

        this.lang = sessionStorage.getItem('lang');
        this.originalLang = sessionStorage.getItem('lang');
        if (this.lang == 'es') {
            this.refLangs = "https://docs.microsoft.com/es-es/azure/cognitive-services/translator/language-support";
        } else {
            this.refLangs = "https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support";
        }

        this.loadFilesLang();

        $.getScript("./assets/js/docs/jszip-utils.js").done(function (script, textStatus) {
            //console.log("finished loading and running jszip-utils.js. with a status of" + textStatus);
        });

        $.getScript("./assets/js/docs/docxtemplater.v2.1.5.js").done(function (script, textStatus) {
            //console.log("finished loading and running docxtemplater.js. with a status of" + textStatus);
        });

        //this.googleAnalyticsService.eventEmitter("OpenDx - init: "+result, "general", this.myuuid);
        //this.googleAnalyticsService.eventEmitter("OpenDx - init", "general", this.myuuid, 'init', 5);
        this._startTime = Date.now();

    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
            return false;
        }else if (this.modalReference2 != undefined) {
            this.modalReference2.close();
            this.modalReference2 = undefined;
            return false;
        }else if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
            return false;
        }else{            
            if(this.activeRoute.indexOf("open;role=undiagnosed")!=-1 || this.activeRoute.indexOf("open;role=clinician")!=-1){
                console.log(this.temporalSymptoms.length);
                if(this.temporalSymptoms.length>0){
                    var obser =this.dialogService.confirm(this.translate.instant("land.Do you want to exit"), this.translate.instant("land.loseprogress"));
                    return obser;
                }else{
                    return true;
                }
            }else{
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

    initGraphs() {
        var dataIdeal = [80.4, 85.6, 88, 89.2, 90.1, 90.6, 90.9, 91.3, 91.6, 91.9, 92.2, 92.3, 92.6, 92.7, 92.9, 93, 93.3, 93.4, 93.5, 93.6, 93.7, 93.8, 93.8, 93.8, 93.9, 93.9, 94, 94.1, 94.1, 94.1, 94.2, 94.2, 94.3, 94.3, 94.3, 94.3, 94.3, 94.4, 94.4, 94.4, 94.5, 94.5, 94.5, 94.5, 94.5, 94.5, 94.5, 94.6, 94.6, 94.6];

        this.lineChartIdealOptions = {
            chart: {
                height: 350,
                type: 'line',
                zoom: {
                    enabled: false
                }
            },
            colors: themeColors,
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            series: [{
                name: this.translate.instant("land.InfoDx29.Percentage of success of the disease"),
                data: dataIdeal,
            }],
            grid: {
                row: {
                    colors: ['#F5F5F5', 'transparent'], // takes an array which will be repeated on columns
                    opacity: 0.5
                },
            },
            xaxis: {
                tickAmount: 10,
                title: {
                    text: this.translate.instant("land.InfoDx29.Position of the disease"),
                },
            },
            yaxis: {
                tickAmount: 5,
            }
        }

        var dataRuido = [19.9, 27.8, 34.3, 38.5, 41.4, 44, 46.1, 47.8, 49.5, 51.1, 52.7, 53.7, 54.9, 56, 56.9, 57.7, 58.4, 59, 59.9, 60.7, 61.4, 61.9, 62.5, 63.1, 63.6, 64.1, 64.6, 65, 65.5, 65.7, 66.1, 66.4, 66.9, 67.3, 67.6, 68.1, 68.5, 69, 69.4, 69.8, 70.2, 70.7, 71, 71.2, 71.6, 71.8, 72.2, 72.4, 72.8, 73];
        this.lineChartRuidoOptions = {
            chart: {
                height: 350,
                type: 'line',
                zoom: {
                    enabled: false
                }
            },
            colors: themeColors,
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            series: [{
                name: this.translate.instant("land.InfoDx29.Percentage of success of the disease"),
                data: dataRuido,
            }],
            grid: {
                row: {
                    colors: ['#F5F5F5', 'transparent'], // takes an array which will be repeated on columns
                    opacity: 0.5
                },
            },
            xaxis: {
                tickAmount: 10,
                title: {
                    text: this.translate.instant("land.InfoDx29.Position of the disease"),
                },
            },
            yaxis: {
                tickAmount: 5,
            }
        }
    }

    loadFilesLang() {
        this.searchDiseaseField = '';
        this.listOfFilteredDiseases = [];
        this.sendTerms = false;
        this.subscription.add(this.http.get('assets/jsons/phenotypes_' + this.lang + '.json')
            .subscribe((res: any) => {
                phenotypesinfo = res;
            }, (err) => {
                console.log(err);
            }));
    }

    ngOnInit() {
        this.activeRoute = this.router.url;
        this.subscription.add(this.route.params.subscribe(params => {
            if (params['role'] != undefined) {
                this.role = params['role'];
                if (this.role == 'undiagnosed' || this.role == 'clinician') {
                    this.focusTextArea();
                }
            } else {
                this.router.navigate(['/']);
            }
        }));

        this.eventsService.on('changelang', function (lang) {
            this.lang = lang;
            if (this.lang == 'es') {
                this.refLangs = "https://docs.microsoft.com/es-es/azure/cognitive-services/translator/language-support";
            } else {
                this.refLangs = "https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support";
            }

            this.loadFilesLang();
            if (this.temporalSymptoms.length > 0 && this.originalLang != lang) {
                Swal.fire({
                    title: this.translate.instant("land.Language has changed"),
                    text: this.translate.instant("land.Do you want to start over"),
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
                        this.originalLang = lang;
                        this.restartInitVars();
                    } else {

                    }
                });
            }

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
    }

    selected($e) {
        $e.preventDefault();
        if (!$e.item.error) {
            var symptom = $e.item;
            var foundElement = this.searchService.search(this.temporalSymptoms, 'id', symptom.id);
            if (!foundElement) {
                this.temporalSymptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: true, percentile: -1, inputType: 'manual', importance: '1', polarity: '0', synonyms: symptom.synonyms, def: symptom.desc });
                this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
                this.numberOfSymtomsChecked++;
                this.optionSymptomAdded = "Manual";
                this.lauchEvent("Symptoms");
            } else {
                var foundElementIndex = this.searchService.searchIndex(this.temporalSymptoms, 'id', symptom.id);
                if (!this.temporalSymptoms[foundElementIndex].checked) {
                    this.temporalSymptoms[foundElementIndex].checked = true;
                }
                //this.toastr.warning(this.translate.instant("generics.Name")+': '+symptom.name, this.translate.instant("phenotype.You already had the symptom"));
            }
            this.getNumberOfSymptomsChecked();
        }
        this.modelTemp = '';
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
                    confirmButtonColor: '#0CC27E',
                    cancelButtonColor: '#f9423a',
                    confirmButtonText: self.translate.instant("generics.Yes"),
                    cancelButtonText: self.translate.instant("generics.No"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: true
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
                        confirmButtonColor: '#0CC27E',
                        cancelButtonColor: '#f9423a',
                        confirmButtonText: this.translate.instant("generics.Yes"),
                        cancelButtonText: this.translate.instant("generics.No"),
                        showLoaderOnConfirm: true,
                        allowOutsideClick: false,
                        reverseButtons: true
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
        this.restartAllVars();
        this.failSegmentation = false;
        this.loadingHpoExtractor = true;
        this.substepExtract = '1';
        var lang = this.lang;
        if (this.langToExtract != '') {
            lang = this.langToExtract;
        }

        /*var invalid = /[°"§%()\[\]{}=\\?´`'#<>|,;.’–—:+_-]+/g;
        this.medicalText = this.medicalText.replace(invalid, " ");*/
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
                }));
        } else {
            this.callNCR();
        }
    }

    callNCR() {
        this.numberOfSymtomsChecked = 0;
        //this.temporalSymptoms = [];
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
                                this.addTemporalSymptom(symptomExtractor, 'ncr');
                            }

                        }
                        this.resultTextNcr = this.medicalText;
                        this.resultTextNcrCopy = this.medicalText;
                        //this.sortBySimilarity();

                        this.medicalText = '';

                        //getInfo symptoms
                        var hposStrins = [];
                        this.temporalSymptoms.forEach(function (element) {
                            hposStrins.push(element.id);
                        });

                        Swal.close();
                        if (hposStrins.length == 0) {
                            //Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                            //this.medicalText = '';
                            this.substepExtract = '0';
                            Swal.fire({
                                title: this.translate.instant("phenotype.No symptoms found"),
                                text: this.translate.instant("land.Do you want to add the symptoms manually"),
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#0CC27E',
                                cancelButtonColor: '#f9423a',
                                confirmButtonText: this.translate.instant("land.add the symptoms manually"),
                                cancelButtonText: this.translate.instant("land.try again"),
                                showLoaderOnConfirm: true,
                                allowOutsideClick: false,
                                reverseButtons: true
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
            if (this.temporalSymptoms.length == 0) {
                this.inputManualSymptomsElement.nativeElement.focus();
            }
            /*var showSwalSelSymptoms = localStorage.getItem('showSwalSelSymptoms');
            if (showSwalSelSymptoms != 'false') {
                if(this.temporalSymptoms.length==0){
                    this.inputManualSymptomsElement.nativeElement.focus();
                }
            }*/
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
                        for (var i = 0; i < infoNcr.length; i++) {
                            var positions = [];
                            infoNcr[i].characters[0] = parseInt(infoNcr[i].characters[0])
                            infoNcr[i].characters[1] = parseInt(infoNcr[i].characters[1])
                            positions.push(infoNcr[i].characters);
                            var text = [];
                            text = [{ positions: positions[0], text: infoNcr[i].concept }];
                            var symptomExtractor = { id: infoNcr[i].id, name: infoNcr[i].concept, new: true, similarity: parseFloat(infoNcr[i].probability), positions: positions, text: text };
                            this.addTemporalSymptom(symptomExtractor, 'ncrOld');
                        }
                        this.resultTextNcr = this.medicalText;
                        this.resultTextNcrCopy = this.medicalText;
                        //this.sortBySimilarity();

                        this.medicalText = '';

                        //getInfo symptoms
                        var hposStrins = [];
                        this.temporalSymptoms.forEach(function (element) {
                            hposStrins.push(element.id);
                        });

                        Swal.close();
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

    addTemporalSymptom(symptom, inputType) {
        var foundElement = this.searchService.search(this.temporalSymptoms, 'id', symptom.id);
        if (!foundElement) {
            this.temporalSymptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: null, percentile: -1, inputType: inputType, importance: '1', polarity: '0', similarity: symptom.similarity, positions: symptom.positions, text: symptom.text });
            this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
        } else {
            //buscar el sintoma, mirar si tiene mejor prababilidad, y meter la nueva aparicion en posiciones
            var enc = false;
            for (var z = 0; z < this.temporalSymptoms.length && !enc; z++) {
                if (this.temporalSymptoms[z].id == symptom.id && this.temporalSymptoms[z].inputType != "manual") {
                    if (this.temporalSymptoms[z].similarity < symptom.similarity) {
                        this.temporalSymptoms[z].similarity = symptom.similarity;
                    }
                    this.temporalSymptoms[z].positions.push(symptom.positions[0]);
                    enc = true;
                }
            }
        }
    }

    sortBySimilarity() {
        this.temporalSymptoms.sort(this.sortService.GetSortOrderInverse("similarity"));
    }

    callGetInfoTempSymptomsJSON(hposStrins) {
        //this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(hposStrins,this.listOfphenotypesinfo)
        var lang = this.lang;
        this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang, hposStrins)
            .subscribe((res: any) => {

                var tamano = Object.keys(res).length;
                if (tamano > 0) {
                    for (var i in res) {
                        for (var j = 0; j < this.temporalSymptoms.length; j++) {
                            if (res[i].id == this.temporalSymptoms[j].id) {
                                this.temporalSymptoms[j].name = res[i].name;
                                this.temporalSymptoms[j].def = res[i].desc;
                                this.temporalSymptoms[j].synonyms = res[i].synonyms;
                                this.temporalSymptoms[j].comment = res[i].comment;
                                if (this.temporalSymptoms[j].importance == undefined) {
                                    this.temporalSymptoms[j].importance = 1;
                                }
                            }
                        }
                    }
                    this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
                }
                this.substepExtract = '4';
                this.lauchEvent("Symptoms");
                if (this.lucky) {
                    this.checkSymptoms();
                } else {
                    this.showSwalSelectSymptoms();
                }
                this.focusManualSymptoms();


            }, (err) => {
                console.log(err);
                this.substepExtract = '4';
                this.lauchEvent("Symptoms");
                this.focusManualSymptoms();
            }));
    }

    showSwalSelectSymptoms() {
        var showSwalSelSymptoms = localStorage.getItem('showSwalSelSymptoms');
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
                if (this.temporalSymptoms.length == 0) {
                    this.inputManualSymptomsElement.nativeElement.focus();
                }
            })
        }

    }

    changeStateSymptom(index, state) {
        this.temporalSymptoms[index].checked = state;
        this.getNumberOfSymptomsChecked();
    }

    checkSymptoms() {
        for (var i = 0; i < this.temporalSymptoms.length; i++) {
            this.temporalSymptoms[i].checked = true;
            this.numberOfSymtomsChecked++;
        }
        this.calculate();
    }

    changeLucky() {
        this.lucky = !this.lucky;
    }

    getNumberOfSymptomsChecked() {
        this.numberOfSymtomsChecked = 0;
        for (var i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                this.numberOfSymtomsChecked++;
            }
        }
        if (this.numberOfSymtomsChecked >= this.minSymptoms && this.temporalDiseases.length > 0) {
            this.calculate();
        } else if (this.numberOfSymtomsChecked < this.minSymptoms) {
            this.topRelatedConditions = [];
        }
    }

    showMoreInfoSymptomPopup(symptomIndex, contentInfoSymptomNcr) {
        this.ncrResultView = false;
        this.selectedInfoSymptomIndex = symptomIndex;
        let ngbModalOptions: NgbModalOptions = {
            keyboard: false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(contentInfoSymptomNcr, ngbModalOptions);
    }

    calculate() {

        if (this.numberOfSymtomsChecked >= this.minSymptoms) {
            this.topRelatedConditions = [];
            this.temporalDiseases = [];
            this.indexListRelatedConditions = this.showNumerRelatedConditions;
            this.loadingCalculate = true;
            var info = {
                "symptoms": []
            }
            for (var index in this.temporalSymptoms) {
                if (this.temporalSymptoms[index].checked) {
                    info.symptoms.push(this.temporalSymptoms[index].id);
                }
            }
            var lang = this.lang;
            this.subscription.add(this.apiDx29ServerService.calculate(info, lang)
                .subscribe((res: any) => {
                    console.log(res);
                    if (res == null) {
                        this.calculate()
                    } else {
                        if (res.length == 0) {
                            this.loadingCalculate = false;
                            Swal.fire(this.translate.instant("land.we have not found any disease"), this.translate.instant("land.Please try again adding more symptoms"), "error");
                        } else {
                            this.temporalDiseases = res;
                            var listOfDiseases = [];
                            res.forEach(function (element) {
                                listOfDiseases.push(element.id);
                            });
                            this.getInfoDiseases(listOfDiseases);
                        }

                    }
                }));
        } else {
            if (this.temporalSymptoms.length < this.minSymptoms) {
                Swal.fire(this.translate.instant("land.addMoreSymp"), this.translate.instant("land.remember"), "error");
                this.loadingCalculate = false;
            } else {
                Swal.fire(this.translate.instant("land.You need to select more symptoms"), this.translate.instant("land.remember"), "error");
                this.loadingCalculate = false;
            }

        }

    }

    getInfoDiseases(listOfDiseases) {
        var lang = this.lang;
        this.subscription.add(this.apif29BioService.getInfoOfDiseasesLang(listOfDiseases, lang)
            .subscribe((res1: any) => {
                for (var i = 0; i < this.temporalDiseases.length; i++) {
                    var valtemp = this.temporalDiseases[i].id;
                    if (res1[valtemp] != undefined) {
                        //this.temporalDiseases[i].name = res1[valtemp].name;
                        //this.temporalDiseases[i].id = res1[valtemp].id;
                        if (res1[valtemp].desc != "") {
                            this.temporalDiseases[i].desc = res1[valtemp].desc;
                        } else if (res1[valtemp].comment != "") {
                            this.temporalDiseases[i].desc = res1[valtemp].comment;
                        }
                        this.temporalDiseases[i].xRefs = res1[valtemp].xrefs;
                    } else {
                        //this.temporalDiseases[i].name = this.temporalDiseases[i].id;
                    }
                }
                this.cleanDiseases();
                this.totalDiseasesLeft = this.temporalDiseases.length - this.showNumerRelatedConditions;
                this.topRelatedConditions = this.temporalDiseases.slice(0, this.indexListRelatedConditions)
                this.loadingCalculate = false;
                this.lauchEvent("Diseases");
                this.saveSymptomsSession();
            }, (err) => {
                console.log(err);
                this.loadingCalculate = false;
            }));
    }

    cleanDiseases() {
        for (var i = 0; i < this.temporalDiseases.length; i++) {
            var actualDisease = this.temporalDiseases[i];
            if (actualDisease.xRefs != undefined) {
                if (actualDisease.xRefs.length == 0) {
                    actualDisease.xRefs.push(actualDisease.id);
                }
                actualDisease.xRefs.sort((one, two) => (one > two ? -1 : 1));
                var xrefs = this.cleanOrphas(actualDisease.xRefs)
                this.temporalDiseases[i].xRefs = xrefs;
            }
            this.temporalDiseases[i].name = this.textTransform.transform(actualDisease.name);
        }
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



    loadMore() {
        this.indexListRelatedConditions = this.indexListRelatedConditions + this.showNumerRelatedConditions;
        this.topRelatedConditions = this.temporalDiseases.slice(0, this.indexListRelatedConditions)
        this.totalDiseasesLeft = this.temporalDiseases.length - this.topRelatedConditions.length;
    }

    restartAllVars() {
        this.indexListRelatedConditions = this.showNumerRelatedConditions;
        //this.temporalSymptoms = [];
        this.numberOfSymtomsChecked = 0;
        this.topRelatedConditions = [];
        this.temporalDiseases = [];
    }

    restartInitVars() {
        this.temporalSymptoms = [];
        this.medicalText = '';
        this.substepExtract = '0';
        this.restartAllVars();
        this.focusTextArea();
    }

    getPlainInfoSymptoms() {
        var resCopy = "";
        for (let i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                resCopy = resCopy + this.temporalSymptoms[i].id + " - " + this.temporalSymptoms[i].name;
                if (i + 1 < this.temporalSymptoms.length) {
                    resCopy = resCopy + "\n";
                }
            }
        }
        return resCopy;
    }

    getPlainInfoSymptoms2() {
        var resCopy = "";
        for (let i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                resCopy = resCopy + this.temporalSymptoms[i].id + " - " + this.temporalSymptoms[i].name;
                if (i + 1 < this.temporalSymptoms.length) {
                    resCopy = resCopy + "\n";
                }
            }
        }
        return resCopy;
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
        var infoSymptoms = this.getPlainInfoSymptoms2();
        if (infoSymptoms != "") {
            infoSymptoms = infoSymptoms + "\n\n" + "Dx29.ai";
            let link = document.createElement('a');
            var actualDate = Date.now();
            link.download = 'Dx29_Symptoms_' + actualDate + '.txt';
            let blob = new Blob([infoSymptoms], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        } else {
            Swal.fire(this.translate.instant("land.In order to download the symptoms"), '', "warning");
        }
    }

    showMoreInfoDiseasePopup(diseaseIndex, contentInfoDisease) {
        this.selectedInfoDiseaseIndex = diseaseIndex;
        if (this.topRelatedConditions[this.selectedInfoDiseaseIndex].loaded) {
            let ngbModalOptions: NgbModalOptions = {
                keyboard: true,
                windowClass: 'ModalClass-lg'// xl, lg, sm
            };
            this.modalReference = this.modalService.open(contentInfoDisease, ngbModalOptions);
        } else {
            this.topRelatedConditions[this.selectedInfoDiseaseIndex].loaded = true;
            if (this.topRelatedConditions[this.selectedInfoDiseaseIndex].changed) {
                console.log('Ha cambiado');
                this.getSymptomsOneDisease(this.topRelatedConditions[this.selectedInfoDiseaseIndex].id, contentInfoDisease);
            } else {
                this.callGetInfoDiseaseSymptomsJSON(contentInfoDisease);
            }
        }
    }

    getSymptomsOneDisease(id, contentInfoDisease) {
        //get symtoms
        var lang = this.lang;
        this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang, [id], 0)
            .subscribe((res: any) => {
                var info = res[id];
                var listOfSymptoms = info.phenotypes
                if (Object.keys(listOfSymptoms).length > 0) {
                    for (var k in listOfSymptoms) {
                        var foundElement = this.searchService.search(this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms, 'id', k);
                        if (foundElement) {
                            for (var j = 0; j < this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms.length; j++) {
                                if (foundElement) {
                                    var indexElement = this.searchService.searchIndex(this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms, 'id', k);
                                    this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[indexElement].frequency.id = listOfSymptoms[k].frequency;
                                }
                            }
                        }
                    }
                }
                this.callGetInfoDiseaseSymptomsJSON(contentInfoDisease);

            }, (err) => {
                console.log(err);
                this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
            }));

    }

    callGetInfoDiseaseSymptomsJSON(contentInfoDisease) {
        //getInfo symptoms
        var hposStrins = [];
        this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms.forEach(function (element) {
            hposStrins.push(element.id);
        });
        var lang = this.lang;
        this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang, hposStrins)
            .subscribe((res: any) => {
                var tamano = Object.keys(res).length;
                if (tamano > 0) {
                    for (var i in res) {
                        for (var j = 0; j < this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms.length; j++) {
                            if (res[i].id == this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].id) {
                                this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].name = res[i].name;
                                if (res[i].desc != "") {
                                    this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].desc = res[i].desc;
                                } else if (res[i].comment != "") {
                                    this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].desc = res[i].comment;
                                }
                                this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].synonyms = res[i].synonyms;
                                if (this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].importance == undefined) {
                                    this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].importance = 1;
                                }
                            }
                        }
                    }
                    for (var i in res) {
                        for (var j = 0; j < this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms.length; j++) {
                            if (res[i].id == this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].id) {
                                if (this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].relationship == 'Successor') {
                                    // Search realted Symptom
                                    for (var z = 0; z < this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms.length; z++) {
                                        if (this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[z].id == this.topRelatedConditions[this.selectedInfoDiseaseIndex].Symptoms[j].RelatedId) {
                                            var Name = this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[z].name;
                                            this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[j].relatedName = name;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                let ngbModalOptions: NgbModalOptions = {
                    keyboard: true,
                    windowClass: 'ModalClass-lg'// xl, lg, sm
                };
                this.getfrequencies(this.selectedInfoDiseaseIndex);
                this.modalReference = this.modalService.open(contentInfoDisease, ngbModalOptions);

            }, (err) => {
                console.log(err);
            }));
    }

    getfrequencies(index) {
        //getInfo symptoms
        var symptoms = this.topRelatedConditions[index].symptoms;
        var hposStrins = [];
        symptoms.forEach(function (element) {
            if (element.frequency != null) {
                hposStrins.push(element.frequency.id);
            }
        });
        var lang = this.lang;
        this.apif29BioService.getInfoOfSymptoms(lang, hposStrins)
            .subscribe((res: any) => {
                var tamano = Object.keys(res).length;
                if (tamano > 0) {
                    for (var i in res) {
                        for (var j = 0; j < this.topRelatedConditions[index].symptoms.length; j++) {
                            if (res[i].id == this.topRelatedConditions[index].symptoms[j].frequency.id) {
                                if (this.topRelatedConditions[index].symptoms[j].frequency.name == '' || this.topRelatedConditions[index].symptoms[j].frequency.name == null) {
                                    this.topRelatedConditions[index].symptoms[j].frequency.name = res[i].name;
                                    this.topRelatedConditions[index].symptoms[j].frequency.desc = res[i].desc;
                                }
                            }
                        }
                    }
                    for (var ki = 0; ki < this.topRelatedConditions[index].symptoms.length; ki++) {
                        if (this.topRelatedConditions[index].symptoms[ki].frequency.id == 'HP:9999999' || this.topRelatedConditions[index].symptoms[ki].frequency.name == '' || this.topRelatedConditions[index].symptoms[ki].frequency.name == null) {
                            this.topRelatedConditions[index].symptoms[ki].frequency.name = this.translate.instant("land.Unknown");
                            this.topRelatedConditions[index].symptoms[ki].frequency.id = 'HP:9999999';
                        }
                    }
                    this.topRelatedConditions[index].symptoms.sort(this.sortService.GetSortTwoElementsLand("frequency", "name"));
                    this.topRelatedConditions[index].symptoms.sort(this.sortService.GetSortSymptomsLand());
                    this.topRelatedConditions[index].symptoms.sort(this.sortService.GetSortSymptoms2Land());
                }

            }, (err) => {
                console.log(err);
            });
    }

    downloadResults() {
        var resul = "";
        var infoSymptoms = this.getPlainInfoSymptoms2();
        if (infoSymptoms != "") {
            resul = this.translate.instant("diagnosis.Symptoms") + "\n" + infoSymptoms + "\n";
        }
        var infoDiseases = this.getPlainInfoDiseases();
        resul = resul + this.translate.instant("land.Diseases") + "\n" + infoDiseases + "\n\n\n" + "Dx29.ai";
        let link = document.createElement('a');
        var actualDate = Date.now();
        link.download = 'Dx29_Results_' + actualDate + '.txt';

        let blob = new Blob([resul], { type: 'text/plain' });
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }

    getPlainInfoDiseases() {
        var resCopy = "";
        for (let i = 0; i < this.topRelatedConditions.length; i++) {
            resCopy = resCopy + this.topRelatedConditions[i].name + " (" + this.topRelatedConditions[i].id + ")";
            if (i + 1 < this.topRelatedConditions.length) {
                resCopy = resCopy + "\n";
            }
        }
        return resCopy;
    }

    getPlainInfoSymptomsEmail() {
        var resCopy = "";
        for (let i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                resCopy = resCopy + this.temporalSymptoms[i].id + " - " + this.temporalSymptoms[i].name;
                if (i + 1 < this.temporalSymptoms.length) {
                    resCopy = resCopy + " <br> ";
                }
            }
        }
        return resCopy;
    }

    getPlainInfoDiseasesEmail() {
        var resCopy = "";
        for (let i = 0; i < this.topRelatedConditions.length; i++) {
            resCopy = resCopy + this.topRelatedConditions[i].name + " (" + this.topRelatedConditions[i].id + ")";
            if (i + 1 < this.topRelatedConditions.length) {
                resCopy = resCopy + " <br> ";
            }
        }
        return resCopy;
    }

    sendEmail() {
        var infoSymptoms = this.getPlainInfoSymptomsEmail();
        var infoDiseases = this.getPlainInfoDiseasesEmail();

        Swal.fire({
            title: this.translate.instant("land.Enter email address"),
            input: 'email',
            confirmButtonText: this.translate.instant("land.Next"),
            cancelButtonText: this.translate.instant("generics.Cancel"),
            showCancelButton: true
        }).then(function (email) {
            if (email.value) {
                Swal.fire({
                    input: 'textarea',
                    inputLabel: this.translate.instant("land.Message"),
                    inputPlaceholder: this.translate.instant("land.Type your message here"),
                    confirmButtonText: this.translate.instant("land.Send"),
                    cancelButtonText: this.translate.instant("generics.Cancel"),
                    showCancelButton: true
                }).then(function (message) {
                    var info = { email: email.value, msg: message.value, symptoms: infoSymptoms, diseases: infoDiseases, lang: this.lang };
                    this.subscription.add(this.apiDx29ServerService.sendCustomsEmail(info)
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

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    showCompleteNcrResultView(symptom) {
        this.ncrResultView = !this.ncrResultView;
        if (symptom != null) {
            this.markAllText(symptom)
        }
    }

    showCompleteNcrOldResultView(symptom) {
        this.ncrResultView = !this.ncrResultView;
        if (symptom != null) {
            this.markText(this.resultTextNcr, symptom.positions[0][0], symptom.positions[0][1]);
        }
    }

    markText(text, pos1, pos2) {
        this.ncrResultView = true;
        this.searchTerm = text.substring(pos1, pos2);
        console.log(this.searchTerm);
        this.resultTextNcrCopy = this.highlightSearch.transform(this.resultTextNcr, this.searchTerm);
        this.showScrollButton();
    }

    markAllText(symptom) {
        this.resultTextNcrCopy = this.medicalText;
        var text = symptom.text[0].text;
        if (this.langToExtract != 'en' || this.langDetected != 'en') {
            text = symptom.text[0].source;
            this.resultTextNcrCopy = this.highlightSearch.transform(this.resultTextNcr, text);
        } else {
            var hpo = symptom;
            var words = [];
            for (var j = 0; j < hpo.positions.length; j++) {
                var value = text.substring(hpo.positions[j][0], hpo.positions[j][1]);
                words.push({ args: value })
            }
            this.resultTextNcrCopy = this.highlightSearch.transformAll(this.resultTextNcr, words);
        }
        this.showScrollButton();
    }

    showScrollButton() {
        setTimeout(() => {
            var el = document.getElementsByClassName("actualPosition")[0];
            if (el != undefined) {
                el.scrollIntoView(true);
                var height = document.getElementById('idBody').offsetHeight;
                var docHeight = $(document).height();
                if (height > docHeight) {
                    this.showButtonScroll = true;
                    this.myFunction();
                } else {
                    this.showButtonScroll = false;
                }
            }
        }, 100);
    }

    closeModal() {
        document.getElementsByClassName("ModalClass-sm")[0].removeEventListener("scroll", this.myFunction);
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
    }

    myFunction() {
        console.log("certrando");
        document.getElementsByClassName("ModalClass-sm")[0]
            .addEventListener('scroll', function () {
                var height = document.getElementById('idBody').offsetHeight;
                var docHeight = $(document).height();
                var sizeele = $(".ModalClass-sm").scrollTop();
                if (height > docHeight) {
                    if (sizeele <= (docHeight / 2)) {
                        this.showButtonScroll = false;
                    } else {
                        this.showButtonScroll = true;
                    }
                } else {
                    this.showButtonScroll = false;
                }
            }.bind(this));
    }

    goToTop() {
        setTimeout(() => {
            var el = document.getElementsByClassName("modal-header")[0];
            el.scrollIntoView(true);
        }, 100);
    }


    showInfoSponsored(contentInfoSponsored) {
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(contentInfoSponsored, ngbModalOptions);
    }

    showInfoDx29(contentInfoDx29) {
        this.lauchEvent("ShowInfoDx29");
        this.initGraphs();
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(contentInfoDx29, ngbModalOptions);
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

    registerToDx29Swal(contentToDx29V2) {
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(contentToDx29V2, ngbModalOptions);
    }

    registerToDx29V2() {
        this.lauchEvent("Registration");
        this.lauchEvent("Registration Power");
        if (this.modalReference != undefined) {
            this.modalReference.close();
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
            console.log(info);
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

    goto(url) {
        document.getElementById(url).scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }

    saveSymptomsSession() {
        var info = {
            "Symptoms": []
        }
        for (var index in this.temporalSymptoms) {
            if (this.temporalSymptoms[index].checked) {
                info.Symptoms.push(this.temporalSymptoms[index].id);
            }
        }
        sessionStorage.setItem('symptoms', JSON.stringify(info));
        sessionStorage.setItem('uuid', this.myuuid);
    }

    directCalculate() {
        if (this.temporalSymptoms.length >= this.minSymptoms) {
            if(this.medicalText.length>5){
                this.startExtractor();
            }else{
                this.substepExtract = '4';
                this.lauchEvent("Symptoms");
                this.calculate();
            }
            
        } else {
            if(this.medicalText.length>5){
                this.startExtractor();
            }else{
                Swal.fire(this.translate.instant("land.addMoreSymp"), this.translate.instant("land.remember"), "error");
                this.loadingCalculate = false;
            }  
        }

    }

    selectRole(role) {
        this.role = role;
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

    onKey(event) {
        this.nothingFoundDisease = false;
        this.showDisease = false;
        this.showIntro = true;
        this.symtomsSent = false;
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
                            this.sendTerms = true;
                            var params: any = {}
                            params.uuid = this.myuuid;
                            params.Term = tempModelTimp;
                            params.Lang = sessionStorage.getItem('lang');
                            var d = new Date(Date.now());
                            var a = d.toString();
                            params.Date = a;
                            this.subscriptionDiseasesNotFound = this.http.post('https://prod-246.westeurope.logic.azure.com:443/workflows/5af138b9f41f400f89ecebc580d7668f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PiYef1JHGPRDGhYWI0s1IS5a_9Dpz7HLjwfEN_M7TKY', params)
                                .subscribe((res: any) => {
                                }, (err) => {
                                });
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

    showMoreInfoDisease(diseaseIndex) {
        if (this.selectedDiseaseIndex == diseaseIndex) {
            this.selectedDiseaseIndex = -1;
        } else {
            this.selectedDiseaseIndex = diseaseIndex;
        }
    }

    showMoreInfoDiagnosePopup(index, contentInfoAttention) {
        this.loadingOneDisease = true;
        this.selectedDiseaseIndex = index;
        this.getInfoOneDisease(contentInfoAttention);
    }

    getInfoOneDisease(contentInfoAttention) {
        var idDisease = this.listOfFilteredDiseases[this.selectedDiseaseIndex].id;
        this.listOfFilteredDiseases = [];
        this.searchDiseaseField = '';
        this.infoOneDisease = {};
        var lang = sessionStorage.getItem('lang');
        var param = [idDisease];
        this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang, param, 0)
            .subscribe((res: any) => {
                var info = res[idDisease];
                if (info == undefined) {
                    this.subscription.add(this.apif29BioService.getInfoOfDiseasesLang(param, lang)
                        .subscribe((res1: any) => {
                            this.infoOneDisease = res1[idDisease];
                            this.cleanxrefs();
                            if (this.lang == 'es') {
                                this.loadNameDiseasesEn(this.infoOneDisease.id);

                            } else {
                                this.getClinicalTrials(this.infoOneDisease.name);
                            }

                            this.showEffects();

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
                }
                if(this.showIntro && this.infoOneDisease.symptoms!=undefined){
                    let ngbModalOptions: NgbModalOptions = {
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'ModalClass-sm'// xl, lg, sm
                    };
                    this.modalReference2 = this.modalService.open(contentInfoAttention, ngbModalOptions);
                }
                
            }, (err) => {
                console.log(err);
                this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
            }));
    }

    showAttentionPanel(contentInfoAttention){
            let ngbModalOptions: NgbModalOptions = {
                backdrop: 'static',
                keyboard: false,
                windowClass: 'ModalClass-sm'// xl, lg, sm
            };
            this.modalReference2 = this.modalService.open(contentInfoAttention, ngbModalOptions);
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
                        console.log('Rare frequencie');
                        console.log(this.infoOneDisease.symptoms[j].frequency);
                        this.infoOneDisease.symptoms[j].Frequency = { name: this.translate.instant("land.Unknown"), id: 'HP:9999999' };
                    }
                }
                this.infoOneDisease.symptoms.sort(this.sortService.GetSortTwoElementsLand("Frequency", "name"));

                this.showEffects();

            }, (err) => {
                console.log(err);
            });
    }

    /*changeStateSymptomDisease(index, state) {
        this.infoOneDisease.symptoms[index].checked = state;
        this.getNumberOfSymptomsDiseaseChecked();
    }*/

    changeStateSymptomDisease(index) {
        if (this.infoOneDisease.symptoms[index].checked) {
            this.infoOneDisease.symptoms[index].checked = !this.infoOneDisease.symptoms[index].checked;
        } else {
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

    sendSymtomsChecked(contentInfoSendSymptoms) {
        if (this.numberOfSymtomsChecked == 0) {
            Swal.fire('', this.translate.instant("land.diagnosed.symptoms.error1"), "error");
        } else {

            var listChecked = [];
            for (var i = 0; i < this.infoOneDisease.symptoms.length; i++) {
                if (this.infoOneDisease.symptoms[i].checked) {
                    listChecked.push(this.infoOneDisease.symptoms[i].id);
                }
            }
            var info = { idClient: this.myuuid, diseaseId: this.infoOneDisease.id, xrefs: this.infoOneDisease.xrefs, symptoms: listChecked };
            this.subscription.add(this.apiDx29ServerService.chekedSymptomsOpenDx29(info)
                .subscribe((res: any) => {
                    this.lauchEvent('Diagnosed - Send Symptoms');
                    document.getElementById('step1').scrollIntoView(true);
                    this.curatedLists.push({ id: this.infoOneDisease.id });
                    this.dontShowIntro = true;
                    let ngbModalOptions: NgbModalOptions = {
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'ModalClass-sm'// xl, lg, sm
                    };
                    if (this.modalReference3 != undefined) {
                        this.modalReference3.close();
                    }
                    this.modalReference3 = this.modalService.open(contentInfoSendSymptoms, ngbModalOptions);
                    // Swal.fire(this.translate.instant("land.diagnosed.symptoms.Nice"), this.translate.instant("land.diagnosed.symptoms.msgCheckedSymptoms"), "success"); 
                }));
        }
    }

    getClinicalTrials(name) {
        this.subscription.add(this.apiClinicalTrialsService.getClinicalTrials(name)
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
        var foundElement = this.searchService.search(this.curatedLists, 'id', this.infoOneDisease.id);
        if (foundElement) {
            this.showIntro = false;
            this.symtomsSent = true;
        }

        this.showAllDescrip = false;
    }

    closeSymptom() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
    }

    letsGo() {
        if (this.modalReference2 != undefined) {
            this.modalReference2.close();
        }
        this.showIntro = false;
    }

    closeInfoSendSymptoms() {
        if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            Swal.fire({
                icon: 'success',
                html: this.translate.instant("land.diagnosed.symptoms.msgCheckedSymptoms"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false
            })
            setTimeout(function () {
                Swal.close();
                //window.location.href = 'https://foundation29.org/';
            }, 2000);
            if (this.modalReference2 != undefined) {
                this.modalReference2.close();
            }
            this.symtomsSent = true;
        }
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
                this.symtomsSent = true;
                this.sendEmailvar = true;
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

                if (this.modalReference3 != undefined) {
                    this.modalReference3.close();
                }
                this.email = '';
                if (this.modalReference2 != undefined) {
                    this.modalReference2.close();
                }
            }, (err) => {
                console.log(err);
                this.sending = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));

    }

    closeDisease() {
        this.showIntro = true;
        this.symtomsSent = false;
        this.listOfFilteredDiseases = []
        this.showDisease = false;
        this.searchDiseaseField = '';
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

}
