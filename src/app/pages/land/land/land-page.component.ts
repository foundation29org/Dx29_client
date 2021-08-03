import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { SortService } from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { HighlightSearch } from 'app/shared/services/search-filter-highlight.service';
import { Clipboard } from "@angular/cdk/clipboard"

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

@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
    providers: [Apif29BioService, Apif29NcrService, ApiDx29ServerService],
})

export class LandPageComponent implements OnInit, OnDestroy, AfterViewInit {

    private subscription: Subscription = new Subscription();
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
    lineChartZoomIdealOptions: Partial<ChartOptions>;
    lineChartRuidoOptions: Partial<ChartOptions>;
    refLangs: string = "https://docs.microsoft.com/en-us/azure/cognitive-services/translator/language-support";
    lucky: boolean = false;
    showErrorMsg: boolean = false;
    modelTemp: any;
    @ViewChild("inputTextArea") inputTextAreaElement: ElementRef;
    @ViewChild("inputManualSymptoms") inputManualSymptomsElement: ElementRef;

    formatter1 = (x: { name: string }) => x.name;

    // Flag search
    searchSymptom = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            map(term => {
                if (term.length < 2) {
                    return [];
                  }
                const searchResults = ((phenotypesinfo.filter(v => v.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()) > -1).slice(0, 100))).concat((phenotypesinfo.filter(v => v.id.toLowerCase().indexOf(term.toLowerCase().trim()) > -1).slice(0, 100)))
                if(searchResults.length==0){
                    this.showErrorMsg = true;
                }else{
                    this.showErrorMsg = false;
                }
                return searchResults.length > 0 ? searchResults : [{name:this.translate.instant("land.We have not found anything"), desc: this.translate.instant("land.Please try a different search"), error: true}];
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

    constructor(private http: HttpClient, private apif29BioService: Apif29BioService, private apif29NcrService: Apif29NcrService, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private textTransform: TextTransform, private eventsService: EventsService, private highlightSearch: HighlightSearch) {

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

    }

    initGraphs() {
        var dataIdeal = [80.4, 85.6, 88, 89.2, 90.1, 90.6, 90.9, 91.3, 91.6, 91.9, 92.2, 92.3, 92.6, 92.7, 92.9, 93, 93.3, 93.4, 93.5, 93.6, 93.7, 93.8, 93.8, 93.8, 93.9, 93.9, 94, 94.1, 94.1, 94.1, 94.2, 94.2, 94.3, 94.3, 94.3, 94.3, 94.3, 94.4, 94.4, 94.4, 94.5, 94.5, 94.5, 94.5, 94.5, 94.5, 94.5, 94.6, 94.6, 94.6, 94.6, 94.6, 94.7, 94.7, 94.7, 94.7, 94.7, 94.7, 94.7, 94.8, 94.9, 94.8, 94.8, 94.8, 94.9, 94.9, 94.9, 94.9, 95, 95, 95, 95, 95, 95.1, 95.1, 95.1, 95.2, 95.2, 95.2, 95.3, 95.3, 95.3, 95.4, 95.4, 95.4, 95.4, 95.4, 95.4, 95.4, 95.4, 95.5];

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
            title: {
                text: this.translate.instant("land.InfoDx29.Ideal patients"),
                align: 'left'
            },
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

        var dataZoomIdeal = [80.4, 85.6, 88, 89.2, 90.1, 90.6, 90.9, 91.3, 91.6, 91.9];

        this.lineChartZoomIdealOptions = {
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
                data: dataZoomIdeal,
            }],
            title: {
                text: this.translate.instant("land.InfoDx29.Ideal patients") + ' (Top 10)',
                align: 'left'
            },
            grid: {
                row: {
                    colors: ['#F5F5F5', 'transparent'], // takes an array which will be repeated on columns
                    opacity: 0.5
                },
            },
            xaxis: {
                tickAmount: 1,
                title: {
                    text: this.translate.instant("land.InfoDx29.Position of the disease"),
                },
            },
            yaxis: {
                tickAmount: 5,
            }
        }


        var dataRuido = [19.9, 27.8, 34.3, 38.5, 41.4, 44, 46.1, 47.8, 49.5, 51.1, 52.7, 53.7, 54.9, 56, 56.9, 57.7, 58.4, 59, 59.9, 60.7, 61.4, 61.9, 62.5, 63.1, 63.6, 64.1, 64.6, 65, 65.5, 65.7, 66.1, 66.4, 66.9, 67.3, 67.6, 68.1, 68.5, 69, 69.4, 69.8, 70.2, 70.7, 71, 71.2, 71.6, 71.8, 72.2, 72.4, 72.8, 73, 73.2, 73.4, 73.7, 73.7, 74.1, 74.3, 74.5, 74.8, 75, 75.3, 75.5, 75.7, 75.8, 76, 76.1, 76.4, 76.6, 76.8, 77, 77.2, 77.3, 77.5, 77.6, 77.8, 78, 78.1, 78.2, 78.3, 78.4, 78.6, 78.7, 78.8, 79, 79.1, 79.2, 79.3, 79.5, 79.6, 79.7, 79.8, 79.9, 80.1, 80.2, 80.3, 80.4, 80.6, 80.7, 80.7, 80.9, 80.9];
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
            title: {
                text: this.translate.instant("land.InfoDx29.Inaccurate patients"),
                align: 'left'
            },
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

        this.subscription.add(this.http.get('assets/jsons/phenotypes_' + this.lang + '.json')
            .subscribe((res: any) => {
                phenotypesinfo = res;
            }, (err) => {
                console.log(err);
            }));
    }

    ngOnInit() {
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
        this.focusTextArea();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    selected($e) {
        $e.preventDefault();
        if(!$e.item.error){
            var symptom = $e.item;
            var foundElement = this.searchService.search(this.temporalSymptoms, 'id', symptom.id);
            if (!foundElement) {
                this.temporalSymptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: true, percentile: -1, inputType: 'manual', importance: '1', polarity: '0', synonyms: symptom.synonyms, def: symptom.desc });
                this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
                this.numberOfSymtomsChecked++;
            } else {
                //this.toastr.warning(this.translate.instant("generics.Name")+': '+symptom.name, this.translate.instant("phenotype.You already had the symptom"));
            }
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
        if(this.medicalText.length<5){
            Swal.fire('', this.translate.instant("land.placeholderError"), "error");
        }else{
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
        this.temporalSymptoms = [];
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
                                    this.focusManualSymptoms();
                                }else{
                                    this.focusTextArea();
                                }
                            });
                        } else {
                            this.callGetInfoTempSymptomsJSON(hposStrins);
                        }

                    } else {
                        this.substepExtract = '4';
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

    focusManualSymptoms(){
        setTimeout(function () {
            if(this.temporalSymptoms.length==0){
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

    focusTextArea(){
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
                        Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                        this.focusManualSymptoms();
                    }
                } else {
                    this.substepExtract = '4';
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
                if (this.temporalSymptoms[z].id == symptom.id) {
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
                if (this.lucky) {
                    this.checkSymptoms();
                } else {
                    this.showSwalSelectSymptoms();
                }
                this.focusManualSymptoms();


            }, (err) => {
                console.log(err);
                this.substepExtract = '4';
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
                if(this.temporalSymptoms.length==0){
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
        if (info.symptoms.length >= this.minSymptoms) {
            var lang = this.lang;
            this.subscription.add(this.apiDx29ServerService.calculate(info, lang)
                .subscribe((res: any) => {
                    if (res == null) {
                        this.calculate()
                    } else {
                        this.temporalDiseases = res;
                        var listOfDiseases = [];
                        res.forEach(function (element) {
                            listOfDiseases.push(element.id);
                        });
                        this.getInfoDiseases(listOfDiseases);
                    }
                }));
        } else {
            if(this.temporalSymptoms.length < this.minSymptoms){
                Swal.fire(this.translate.instant("land.addMoreSymp"), this.translate.instant("land.remember"), "error");
                this.loadingCalculate = false;
            }else{
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
        this.temporalSymptoms = [];
        this.numberOfSymtomsChecked = 0;
        this.topRelatedConditions = [];
        this.temporalDiseases = [];
    }

    restartInitVars() {
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
                    console.log(res);
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
}
