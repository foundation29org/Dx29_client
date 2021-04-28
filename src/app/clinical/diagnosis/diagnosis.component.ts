import { Component, ViewChild, OnInit, ElementRef, OnDestroy, Input, HostListener  } from '@angular/core';
import { NgbTooltip, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { Router, NavigationStart, NavigationEnd, ActivationEnd } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { PatientService } from 'app/shared/services/patient.service';
import { DateService } from 'app/shared/services/date.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { ExomiserService } from 'app/shared/services/exomiser.service';
import {ExomiserHttpService} from 'app/shared/services/exomiserHttp.service';
import { Apif29SrvControlErrors } from 'app/shared/services/api-f29srv-errors';
import Swal from 'sweetalert2';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
import { sha512 } from "js-sha512";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { HighlightSearch} from 'app/shared/services/search-filter-highlight.service';
import { TextTransform } from 'app/shared/services/transform-text.service';
import { Data } from 'app/shared/services/data.service';
//para la parte de genes
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgxHotjarService } from 'ngx-hotjar';
import * as d3 from 'd3';
import {symbol, symbolTriangle} from "d3-shape";
import * as venn from 'venn.js'

import * as faker from 'faker';
import { fromEvent } from 'rxjs';
import { brush } from 'd3';
import { FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { BlobStoragePedService } from 'app/shared/services/blob-storage-ped.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';

import { Subscription } from 'rxjs/Subscription';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import{GoogleAnalyticsService} from 'app/shared/services/google-analytics.service';
import { Subject } from 'rxjs/Rx';
import {animate, state, style, transition, trigger} from '@angular/animations';

declare var JSZipUtils: any;
declare var Docxgen: any;
declare var pdfjsLib: any;

// State Flags constant declaration
let phenotypesinfo = [];

@Component({
    selector: 'app-diagnosis',
    templateUrl: './diagnosis.component.html',
    styleUrls: ['./diagnosis.component.scss'],
    providers: [PatientService, ApiDx29ServerService,ExomiserService,ExomiserHttpService,Apif29SrvControlErrors,Apif29BioService, Apif29NcrService],
    animations: [
      trigger('detailExpand', [
        state('collapsed', style({height: '0px', minHeight: '0'})),
        state('expanded', style({height: '*'})),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      ]),
    ]
})

@Injectable()
export class DiagnosisComponent implements OnInit, OnDestroy  {
    //Variable Declaration
    @Input() variantEffectsFilterRequired: boolean=true;

    private msgDataSavedOk: string;
    private msgDataSavedFail: string;
    loading: boolean = false;
    loadingSymptoms: boolean = false;
    loadingGeno: boolean = true;
    sending: boolean = false;
    activeTittleMenu: string = 'Symptoms';
    msgActiveTittleMenu: string = '';
    tittleSymptoms: string = '';
    tittleGenes: string = '';
    tittleWorkbench: string = '';
    tittleNotesAndConclusion: string = '';
    placeholderSearchForSymptoms: string = '';
    patients: any = [];

    phenotype: any = {};
    phenotypeCopy: any = {};
    temporalSymptoms: any = [];

    relatedConditions: any = [];
    relatedConditionsCopy: any = [];
    gettingRelatedConditions: boolean = false;
    topRelatedConditions: any = [];
    potentialDiagnostics: any = [];
    medicalText: string = '';
    resultTextNcr: string = '';
    resultTextNcrCopy: string = '';
    copyResultTextNcr: string = '';
    loadingHpoExtractor: boolean = false;

    hposMedicalText: any = {};

    selectedItems:any = [];
    selectedItemsFilter:any = [];
    selectedItemsFilterWithIndex:any = [{"id":"","index":""}];
    @ViewChild('input') inputEl;

    modelTemp: any;
    formatter1 = (x: { name: string }) => x.name;

    // Flag search
    searchSymptom = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      map(term => term === '' ? []
        : ((phenotypesinfo.filter(v => v.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()) > -1).slice(0, 100))).concat((phenotypesinfo.filter(v => v.id.toLowerCase().indexOf(term.toLowerCase().trim()) > -1).slice(0, 100)))
      )
    );

    //del gen
    orphaOmim: any = [];
    accessToken: IBlobAccessToken = {
       // tslint:disable-next-line:max-line-length
       sasToken: environment.blobAccessToken.sasToken,
       blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
       containerName: '',
       patientId: ''
    };

    modalReference: NgbModalRef;
    _openedModalRefs: any = [];
    filename: string = '';
    filesVcf: any = [];
    infoGenesAndConditions: any = [];
    infoGenesAndConditionsExomizer: any = [];
    infoGenesAndConditionsPhen2Genes: any = [];
    checksChanged: boolean = false;
    lastInfoPetition: any = {};
    switchOrigin: string = 'BOTH';
    //BLOBS
    uploadingGenotype: boolean = false;
    isSomethingPending: boolean = false;
    uploadingPed: boolean = false;
    uploadProgress: Observable<number>;
    uploadProgressPed: Observable<number>;
    uploaded: boolean = false;

    filesOnBlob: any = [];
    actualPosDisease: number = 0;

    nextPosDisease: number = 0;

    globalPosDisease: number = 1;
    actualDisease: any = {};
    nextDisease: any = {};
    previousDisease: any = {};
    sizeOfDiseases: number = 0;
    numberOfSymptoms: number = 0;
    unknownSymptoms: any = [];
    symptomsLoaded: any = [];
    newVcf: boolean = false;
    hasVcf: boolean = false;

    geneName: string = '';
    hasGen: boolean = false;
    t: any;

    launchingPhen2Genes: boolean = false;
    filePhen2GenesOnBlob: string = '';
    urlFileHtmlExomiserBlob: string = '';
    loadingFileHtmlExomiserBlob: boolean = false;
    respuestagenes : any;
    loadingInfoGenes: boolean = false;
    comtadorGenes: number = 0;
    comtadorSymptoms: number = 0;
    maxSymptoms: number = 0;
    calculatingH29Score: boolean = false;
    loadingSymptomsRelatedDiseases: boolean = false;
    diagnosisInfo: any = {};
    complete: any = 0;
    private subscription: Subscription = new Subscription();
    private subscriptionLoadSymptoms: Subscription = new Subscription();

    exploreSymptomsPhen2Genes: boolean = false;
    showErrorMsg: boolean = false;

    modelRadio = 1;
    modelRadio2 = 1;

    contTranslates: number = 0;
    numPieces: number = 0;
    actualPostition: number = 0;
    longitudtext: number = 0;
    data = [];
    settingExomizer: any = {};
    pedNameForShow:String = "";
    variantEffectFiltersState: boolean = false;
    searchTerm: string = '';
    paramgraph: string = 'h29';
    loadingPercentile: boolean = false;
    numToLoad:number = 4;
    listOfGenes: any = [];
    listOfSymptoms: any = [];
    actualProposedDisease: any = [];
    tempSymptom: any = {};
    loadingDiagnosisInfo: boolean = false;

    isDeletingPhenotype: boolean = false;
    preparingFile: boolean = false;
    infoNcrToSave: any = {};
    fileUploadInfo: any;
    listPatientFiles: any= [];
    isNewNcrFile: boolean = false;
    listOfDiseases: any= [];

    parserObject: any = {parserStrategy:'Auto', callingParser: false, file: undefined};
    langToExtract: string = '';
    resultSegmentation: any = {};
    substepExtract: string = "0";
    showPanelExtractor: boolean = false;
    expanded: boolean = true;

    savingDiagnosis: boolean = false;
    posicionTrozo: number = 0;
    cantidadTrozos: number = 0;
    selectedHpoIndex: number = -1;
    ncrResultView: boolean = false;

    programs: any= [];
    actualProgram: any= [];
    dateGeneticProgram1:Date;
    myEmail: string = '';
    selectedSymptomIndex: number = -1;
    selectedInfoSymptomIndex: number = -1;
    numDeprecated: number = -1;

    @ViewChild('programRequestform') programRequestForm: NgForm;
    lang:string = '';
    isSharedCase: boolean = false;
    columnsToDisplay=[]
    columns=[]
    variantTypes=[];
    clinVarTypes=[];
    frequencyTypes=[];
    inheritanceTypes=[];
    otherAnnotationsTypes=[];
    aminoAcid=[];
    moreInfoElement={};
    geneElementName="";
    loadingTable:boolean=false;
    actualStep: string = "0.0";
    maxStep: string = "0.0";
    loadedStep: boolean = false;
    showingWizard: boolean = true;

    posactual: number = 0;
    steps: number = 0;
    numberOfSymptomsPerPage: number = 18;
    listOfSymptomsTemp: any = [];
    hasChangesSuggestion: boolean = false;
    viewSuggestion: number = 0;
    loadingSymptomsOfDisease: boolean = false;
    loadingSuggestions: boolean = false;
    listOfSymptomGroups: any = [];
    loadingServices: boolean = false;
    uploadingVCF: boolean = false;
    viewSymptoms: number = 0;
    selectedPatient: any = {};
    age: any = {};
    symptomsExomiser: any = [];
    selectedDisease: number = -1;

    //graph
    fullListSymptoms: any = [];
    exampleParent:String=this.translate.instant("patdiagdashboard.ExampleParent");
    exampleSuccesorOfParent:String=this.translate.instant("patdiagdashboard.ExampleSuccesorOfParent");
    omimSymptoms: any = [];
    orphaSymptoms: any = [];
    listGenericSymptoms: any=[];
    loadingSymptomsDataForGraph: boolean = false;
    @ViewChild('chartVenn') private chartContainerVenn: ElementRef;


    @Input() private chartDataVenn: Array<any>=[];
    //chartSize_MeOmim: number = 0;
    //chartSize_MeOrpha: number = 0;
    //chartSize_OmimOrpha: number = 0;
    //chartSize_All: number = 0;
    chartSize_MeGeneric:number =0;
    listSymptomsMe:any=[];
    listSymptomsGeneric:any=[];
    listSymptomsMeGeneric:any=[];

    // booleano que indica cuando se puede mostrar el histograma(cuando los datos esten cargados)
    loadingGraphSymptomFreq:boolean=false;


    private margin: any = { top: 60, bottom: 0, left: 35, right: 20};
    private marginFreq: any = { top: 60, bottom: 10, left: 10, right: 40};
    private chartVenn: any;


    private widthVenn: number;
    private heightVenn: number;
    private yZoom:any;
    private gBrush:any;
    private handle:any;
    private brush:any;
    private previousSelection:any;
    private xAxisSymptomsFreq: any;
    private yAxisSymptomsFreq: any;
    private maxWidth: any=0;
    private redrawNewSize:boolean=true;
    loadingquality: boolean = false;
    listOfphenotypesinfo: any = [];
    listOfphenotypesinfoOld: any = [];
    listOfFilteredSymptoms: any = [];
    symptomsPermissions:any = {shareWithCommunity:false};
    actualDiseaseDesc: any = {};
    indexExpandedElementGenes: number = -1;
    expandedElement: any = null;
    actualRelatedDisease: any = {};
    isgen: boolean = true;
    treeOrphaPredecessors: any = {};
    eventsService: any = null;
    showIntroWizard: boolean = true;
    notAnalyzeGeneticInfo: boolean = false;
    loadingDocuments: boolean = false;
    otherDocs: any = [];
    docsNcr: any = [];
    selectedOrderFilesNcr: string = 'lastModified';
    selectedOrderFilesOther: string = 'lastModified';
    maps_to_orpha: any = {};
    orphanet_names: any = {};
    hp_frequencies:any = {};
    isLoadingStep: boolean = true;
    actualTemporalSymptomsIndex:number = 0;
    viewOptionNcr:number = 1;
    indexListRelatedConditions: number = 10;
    loadingPotentialDiagnostics: boolean = false;
    placement = "bottom-right";
    numberOfSymptomsExo:number =0;
    exostring: string = "3' UTR exon variant";
    tempVcfBlobName: string = '';
    nodescriptionSymptom:String=this.translate.instant("symptomssection.No description");
    launchedPhen2genes: boolean = false;
    viewSummarySymptoms: string = 'Simple';
    isNew: boolean = false;
    actualWidth: string = 'xs';
    resulExoEmpty: string = 'null';
    sendingToDev: boolean = false;

    constructor(private http: HttpClient, private authService: AuthService, public toastr: ToastrService, public translate: TranslateService, private authGuard: AuthGuard, private elRef: ElementRef, private router: Router, private patientService: PatientService, private sortService: SortService,private searchService: SearchService,
    private modalService: NgbModal ,private blob: BlobStorageService, private blobped: BlobStoragePedService, public searchFilterPipe: SearchFilterPipe, private highlightSearch: HighlightSearch, private apiDx29ServerService: ApiDx29ServerService, public exomiserService:ExomiserService,public exomiserHttpService:ExomiserHttpService,private apif29SrvControlErrors:Apif29SrvControlErrors, private apif29BioService:Apif29BioService, private apif29NcrService:Apif29NcrService,
    protected $hotjar: NgxHotjarService, private textTransform: TextTransform, private inj: Injector, private dataservice: Data, public googleAnalyticsService: GoogleAnalyticsService, private dateService: DateService) {
      this.eventsService = this.inj.get(EventsService);
      this.loadingTable=false;
      //this.columnsToDisplay=[this.translate.instant('diagnosis.Ranked genes'),this.translate.instant('phenotype.Related conditions')]
      //Columnas para el header
      this.columnsToDisplay=["Genes"]
      //Columnas para los datos
      this.columns=["name","info","score","icon"]

      this.router.events.subscribe( (event) =>{
        if (event instanceof NavigationStart ) {
            this.subscription.unsubscribe();
            this.exomiserHttpService.cancelPendingRequests();
        }
      })
      this.gettingRelatedConditions=false;
      this.loadingDiagnosisInfo=false;
      this.launchingPhen2Genes=false;
      this.settingExomizer = {
        "IsGenome": false,
        "VcfBlobName": '',
        "PedBlobName": null,
        "Proband": null,
        "CaseName": null,
        "NumGenes" : 0,
        "Hpos": [],
        "HiPhivePrioritisers": ["human", "mouse", "fish", "ppi"],
        "PathogenicitySources" : [ "POLYPHEN", "MUTATION_TASTER", "SIFT"] ,
        "AnalysisMode": "PASS_ONLY",
        "Frequency": 1.0,
        "KeepNonPathogenic":  true,
        "RegulatoryFeatureFilter": false,
        "MinQuality": 20.0,
        "OutputPassVariantsOnly": false,
        "OutputFormats": ["HTML", "JSON"],
        "InheritanceModes": {
           "AUTOSOMAL_DOMINANT": 0.1,
           "AUTOSOMAL_RECESSIVE_HOM_ALT": 0.1,
           "AUTOSOMAL_RECESSIVE_COMP_HET": 2.0,
           "X_DOMINANT": 0.1,
           "X_RECESSIVE_HOM_ALT": 0.1,
           "X_RECESSIVE_COMP_HET": 2.0,
           "MITOCHONDRIAL": 0.2
        },
        "FrequencySources": ["THOUSAND_GENOMES", "TOPMED", "UK10K", "ESP_AFRICAN_AMERICAN", "ESP_EUROPEAN_AMERICAN", "ESP_ALL", "EXAC_AFRICAN_INC_AFRICAN_AMERICAN", "EXAC_AMERICAN", "EXAC_SOUTH_ASIAN", "EXAC_EAST_ASIAN", "EXAC_FINNISH", "EXAC_NON_FINNISH_EUROPEAN", "EXAC_OTHER", "GNOMAD_E_AFR", "GNOMAD_E_AMR", "GNOMAD_E_EAS", "GNOMAD_E_FIN", "GNOMAD_E_NFE",
        "GNOMAD_E_OTH", "GNOMAD_E_SAS", "GNOMAD_G_AFR", "GNOMAD_G_AMR", "GNOMAD_G_EAS", "GNOMAD_G_FIN", "GNOMAD_G_NFE", "GNOMAD_G_OTH", "GNOMAD_G_SAS"],
        "VariantEffectFilters": {"remove": ["UPSTREAM_GENE_VARIANT", "INTERGENIC_VARIANT", "REGULATORY_REGION_VARIANT", "CODING_TRANSCRIPT_INTRON_VARIANT", "NON_CODING_TRANSCRIPT_INTRON_VARIANT", "SYNONYMOUS_VARIANT", "DOWNSTREAM_GENE_VARIANT"]},
        "genomeAssembly": 'hg38'
      };

      this.lang = this.authService.getLang();
      this.subscription.add( this.http.get('assets/jsons/phenotypes_'+this.lang+'.json')
       .subscribe( (res : any) => {
         phenotypesinfo = res;
         this.listOfphenotypesinfo = res;
        }, (err) => {
          console.log(err);
        }));

        this.subscription.add( this.http.get('assets/jsons/phenotypes_'+this.lang+'_old.json')
         .subscribe( (res : any) => {
           this.listOfphenotypesinfoOld = res;
          }, (err) => {
            console.log(err);
          }));

        this.subscription.add( this.http.get('assets/jsons/Exomiser_table/variantEffect.json')
       .subscribe( (res : any) => {
         this.variantTypes = res;
        }, (err) => {
          console.log(err);
        }));
        this.subscription.add( this.http.get('assets/jsons/Exomiser_table/clinVar.json')
       .subscribe( (res : any) => {
         this.clinVarTypes = res;
        }, (err) => {
          console.log(err);
        }));
        this.subscription.add( this.http.get('assets/jsons/Exomiser_table/frequency.json')
       .subscribe( (res : any) => {
         this.frequencyTypes = res;
        }, (err) => {
          console.log(err);
        }));
        this.subscription.add( this.http.get('assets/jsons/Exomiser_table/inheritance.json')
       .subscribe( (res : any) => {
         this.inheritanceTypes = res;
        }, (err) => {
          console.log(err);
        }));
        this.subscription.add( this.http.get('assets/jsons/Exomiser_table/otherAnnotations.json')
       .subscribe( (res : any) => {
         this.otherAnnotationsTypes = res;
        }, (err) => {
          console.log(err);
        }));

        this.subscription.add( this.http.get('assets/jsons/amino_acid.json')
        .subscribe( (res : any) => {
          this.aminoAcid = res;
         }, (err) => {
           console.log(err);
         }));


         this.subscription.add( this.http.get('assets/jsons/maps_to_orpha.json')
         .subscribe( (res : any) => {
           this.maps_to_orpha = res;
          }, (err) => {
            console.log(err);
          }));

          this.subscription.add( this.http.get('assets/jsons/orphanet_names_'+this.lang+'.json')
         .subscribe( (res : any) => {
           this.orphanet_names = res;
          }, (err) => {
            console.log(err);
          }));

          this.subscription.add( this.http.get('assets/jsons/hp_frequencies.json')
          .subscribe( (res : any) => {
            this.hp_frequencies = res;
          }, (err) => {
            console.log(err);
          }));


        $.getScript("./assets/js/docs/jszip-utils.js").done(function(script, textStatus) {
          //console.log("finished loading and running jszip-utils.js. with a status of" + textStatus);
        });

        $.getScript("./assets/js/docs/docxtemplater.v2.1.5.js").done(function(script, textStatus) {
          //console.log("finished loading and running docxtemplater.js. with a status of" + textStatus);
        });

        this.subscription.add( this.http.get('assets/jsons/orpha-omim-orpha.json')
          .subscribe( (res : any) => {
            this.orphaOmim = res;
          }, (err) => {
            console.log(err);
          }));

      /*$('#panelcillo a').click(function(e) {
          console.log(e);
            e.stopPropagation(); //stops default link action
            //do your stuff
            console.log('click!');
        });*/
    }

    ngOnDestroy() {
     this.subscription.unsubscribe();
     if (this.subscriptionLoadSymptoms) {
          this.subscriptionLoadSymptoms.unsubscribe();
      }
      this.eventsService.listeners.setStepWizard=[];
      this.eventsService.listeners.infoStep=[];
    }

    initVarsPrograms(){
      var d = new Date();
      var year = d.getFullYear();
      var month = d.getMonth();
      var day = d.getDate();
      this.dateGeneticProgram1 = new Date(year -5, month, day);
    }

    ngOnInit() {
      this.getWidth();
      $("#wizardpanel").scroll(function() {
         if($("#wizardpanel").scrollTop() > 80){
          $("#nav-buttons-wizard").css("box-shadow","0 0 6px -6px rgba(0, 0, 0, 0.01), 0 12px 15px 6px rgba(0, 0, 0, 0.06)");
        }else if($("#wizardpanel").scrollTop() <= 80){
          $("#nav-buttons-wizard").css("box-shadow","none");
         }
       });

      this.exomiserHttpService.cancelPendingRequests();
      this.lang = this.authService.getLang();
      if(this.authService.getCurrentPatient()==null){
        this.router.navigate(['clinical/dashboard/home']);
      }else{
        this.selectedPatient = this.authService.getCurrentPatient();
        this.eventsService.broadcast('selectedPatient', this.selectedPatient);
        var dateRequest2=new Date(this.selectedPatient.birthDate);
        if(this.selectedPatient.birthDate == null){
          this.age = null;
        }else{
          this.ageFromDateOfBirthday(dateRequest2);
        }
        this.loadAllData();

      }

    }

    @HostListener('window:resize')
    onResize() {
        this.getWidth()
        // call our matchHeight function here
        this.redrawNewSize=true;
        this.drawCharts();
    }

    getWidth(){
      var tempWidth= window.innerWidth;
      this.actualWidth = 'xs'
      if(tempWidth<768){
        this.actualWidth = 'xs'
      }else if(tempWidth>=768 && tempWidth<992){
        this.actualWidth = 'sm'
      }else if(tempWidth>=992 && tempWidth<1200){
        this.actualWidth = 'md'
      }else{
        this.actualWidth = 'lg'
      }
    }

    ageFromDateOfBirthday(dateOfBirth: any){
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      var months;
      months = (today.getFullYear() - birthDate.getFullYear()) * 12;
      months -= birthDate.getMonth();
      months += today.getMonth();
      var age =0;
      if(months>0){
        age = Math.floor(months/12)
      }
      var res = months <= 0 ? 0 : months;
      var m=res % 12;
      this.age = {years:age, months:m }
    }

    getActualStep(patientId:string){
      this.subscription.add( this.http.get(environment.api+'/api/case/stepclinic/'+patientId)
          .subscribe( (res : any) => {
            this.isLoadingStep = false;
            if(!this.showIntroWizard && res.stepClinic=='0.0'){
              this.setActualStep('1.0');
              this.setMaxStep('1.0');
            }else{
              if(res.stepClinic=='5.0'){
                this.setActualStepDB('6.0');
                this.setActualStep('6.0');
                this.setMaxStep('6.0');
              }else{
                this.setActualStep(res.stepClinic);
                this.setMaxStep(res.stepClinic);
              }

            }

            this.loadedStep = true;

            if(this.selectedPatient.showSwalIntro && this.selectedPatient.isShared){
              if(this.selectedPatient.showSwalIntro){
                document.getElementById("openModalIntro2").click();
              }
            }else{
              //si ya había comenzado el wizard y no lo ha terminado, preguntar si quiere continuar donde lo dejó o empezar de nuevo
              if((this.actualStep>"0.0" && this.actualStep<"5.0" && this.showIntroWizard) || (this.actualStep>"1.0" && this.actualStep<"5.0" && !this.showIntroWizard)){
                Swal.fire({
                    title: this.translate.instant("patnodiagdashboard.swalContinue.msgtitle1"),
                    text:  this.translate.instant("patnodiagdashboard.swalContinue.msg1"),
                    showCancelButton: true,
                    confirmButtonColor: '#009DA0',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: this.translate.instant("patnodiagdashboard.swalContinue.btn1"),
                    cancelButtonText: this.translate.instant("patnodiagdashboard.swalContinue.btn2"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons:true
                }).then((result) => {
                  if (result.value) {
                    this.goToStep(this.actualStep, false);
                  }else{
                    if(this.showIntroWizard){
                      this.goToStep('0.0', true);
                    }else{
                      this.goToStep('1.0', true);
                    }

                  }
                });
              }else if(this.actualStep=="0.0"){
                if(this.showIntroWizard){
                  this.goToStep('0.0', false);
                }else{
                  this.goToStep('1.0', false);
                }
              }else if(this.actualStep>="5.0"){
                this.goToStep(this.actualStep, false);
              }
            }


            this.showingWizard = false;
           }, (err) => {
             console.log(err);
             this.loadedStep= true;
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));


    }

    setActualStepDB(actualStep:string){
      console.log(actualStep)
      console.log(this.maxStep);
      var object = {actualStep:actualStep}
      if(actualStep>=this.maxStep && this.maxStep<"5.0"){
        if(actualStep=='5.0'){
          //actualStep = '6.0';
          object = {actualStep:actualStep}
        }
        if(actualStep=='6.0'){
          this.maxStep = '6.0';
          this.setMaxStep('6.0');
        }else{
          this.setMaxStep(actualStep);
        }

        this.subscription.add( this.http.put(environment.api+'/api/case/stepclinic/'+this.authService.getCurrentPatient().sub, object)
            .subscribe( (res : any) => {
             }, (err) => {
               console.log(err);
               this.toastr.error('', this.translate.instant("generics.error try again"));
             }));
      }

    }

    setActualStep(actualStep:string){
      this.actualStep = actualStep;
      this.dataservice.steps = {actualStep: this.actualStep, maxStep: this.maxStep};
      this.eventsService.broadcast('maxStep', this.maxStep);
      this.eventsService.broadcast('actualStep', this.actualStep);
    }

    setMaxStep(maxStep:string){
      this.maxStep = maxStep;
      this.dataservice.steps = {actualStep: this.actualStep, maxStep: this.maxStep};
      this.eventsService.broadcast('maxStep', this.maxStep);
      this.eventsService.broadcast('actualStep', this.actualStep);
    }

    goPrevStep(){
      if((this.actualStep == '1.0' || this.actualStep == '1') && this.showIntroWizard){
        this.setActualStep('0.0');
      }else if(this.actualStep > '5.0'){
        this.setActualStep('5.0');
      }else if(this.actualStep > '3.0'){
        this.symptomsExomiser = this.phenotype.data;
        this.getNumberOfSymptomsExo();
        if(this.loadingGeno || this.calculatingH29Score || this.gettingRelatedConditions || this.uploadingGenotype){
          Swal.fire(this.translate.instant("analysissection.stillanalyzing"), this.translate.instant("analysissection.may10minutesexov2"), "warning");

          /*Swal.fire({
              title: this.translate.instant("analysissection.analyzingdata"),
              text:  this.translate.instant("analysissection.stopanalysis?"),
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#0CC27E',
              cancelButtonColor: '#f9423a',
              confirmButtonText: this.translate.instant("generics.Accept"),
              cancelButtonText: this.translate.instant("generics.Cancel"),
              showLoaderOnConfirm: true,
              allowOutsideClick: false,
              reverseButtons:true
          }).then((result) => {
            if (result.value) {
              this.cancelSubscription();
              this.setActualStep('3.0');
              this.setActualStepDB('3.0');
              if(this.modalReference!=undefined){
                this.modalReference.close();
              }
            }
          });*/

        }else if(this.launchingPhen2Genes || this.calculatingH29Score || this.gettingRelatedConditions){
          Swal.fire(this.translate.instant("analysissection.stillanalyzing"), '', "warning");
        }else{
          if(!this.loadingGeno && !this.calculatingH29Score && !this.gettingRelatedConditions && !this.uploadingGenotype && !this.launchingPhen2Genes && !this.uploadingGenotype){
              //Swal.fire(this.translate.instant("analysissection.analysisover"), '', "warning");
              this.setActualStep('3.0');
          }else{
            this.setActualStep('3.0');
          }

        }
      }else if(this.actualStep == '3.0' || this.actualStep == '3'){
        this.setActualStep('2.0');
      }else if(this.actualStep > '1.0'){
        this.setActualStep('1.0');
      }
    }

    askAnalyze(){
      if(this.maxStep<'5.0'){
        this.goNextStep();
      }else{
        Swal.fire({
            title: this.translate.instant("analysissection.analyze the data"),
            icon: 'info',
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
            this.goNextStep();
          }else{
            this.goToStep('5.0', true)
          }
        });
      }

    }

    goNextStep(){
      if(this.actualStep >= '5.0'){
        this.goToStep('6.0', true)
      }else if(this.actualStep >= '3.3'){
        this.goToStep('5.0', true)
      }else if(this.actualStep == '3.2'){
        if(this.launchingPhen2Genes || this.calculatingH29Score || this.gettingRelatedConditions){
          Swal.fire(this.translate.instant("analysissection.stillanalyzing"), '', "warning");
        }else{
          this.goToStep('5.0', true)
        }
      }else if(this.actualStep == '3.1'){
        if(this.loadingGeno || this.calculatingH29Score || this.gettingRelatedConditions || this.uploadingGenotype){
          Swal.fire(this.translate.instant("analysissection.stillanalyzing"), '', "warning");
        }else{
          this.goToStep('5.0', true)
        }
      }else if(this.actualStep == '3.0' || this.actualStep == '3'){
        var haveSymptoms = false;
        for(var i=0;i<this.symptomsExomiser.length;i++){
          if(this.symptomsExomiser[i].checked){
            haveSymptoms = true;
            break;
          }
        }
        if(!haveSymptoms){
          Swal.fire({ title: this.translate.instant("analysissection.nosymptoms"), text:  this.translate.instant("analysissection.needsymtoms"), confirmButtonText: this.translate.instant("generics.Accept"),icon:"warning" })
        }else{
          if(this.filesVcf.length>0 && !this.notAnalyzeGeneticInfo){
            this.goToStep('3.1', true)
          }else{
            this.goToStep('3.2', true)
          }

        }
      }else if(this.actualStep == '2.0' || this.actualStep == '2'){
        if(this.filesVcf.length>0){
          this.goToStep('3.0', true);
        }else{
          Swal.fire({
              title: this.translate.instant("geneticsection.nogeneticinfo"),
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#0CC27E',
              cancelButtonColor: '#f9423a',
              confirmButtonText: this.translate.instant("generics.Yes"),
              cancelButtonText: this.translate.instant("generics.No, cancel"),
              showLoaderOnConfirm: true,
              allowOutsideClick: false,
              reverseButtons:true
          }).then((result) => {
            if (result.value) {
              this.goToStep('3.0', true);
            }
          });

        }
      }else if(this.actualStep == '1.0' || this.actualStep == '1'){
        if((this.phenotype.data.length == 0) || (this.numDeprecated==this.phenotype.data.length && this.numDeprecated>0)){
          Swal.fire({ title: this.translate.instant("symptomssection.needsymtoms"), confirmButtonText: this.translate.instant("generics.Accept"),icon:"warning" })
        }else{
          this.goToStep('2.0', true)
        }

      }else if(this.actualStep == '0.0'){
        this.goToStep('1.0', true)
      }
    }

    goToStepGenotics(){
      if((this.phenotype.data.length == 0) || (this.numDeprecated==this.phenotype.data.length && this.numDeprecated>0)){
        Swal.fire({ title: this.translate.instant("symptomssection.needsymtoms"), confirmButtonText: this.translate.instant("generics.Accept"),icon:"warning" })
      }else{
        this.goToStep('2.0', true);
      }

    }

    goToStepDiagnoses(){
      this.goToStep('3.0', false);
    }

    goToStep(indexStep, save){
      this.selectedDisease = -1;
      if(indexStep=='0.0'){
        document.getElementById("openModalIntro").click();
      }
      this.setActualStep(indexStep);
      if(this.actualStep == '3.2'){
        this.lauchPhen2Genes();
        document.getElementById("openModalPhen2genes").click();
      }else if(this.actualStep == '3.1'){
        if(save){
          this.callExomizerSameVcf();
        }
        document.getElementById("openModalExomiser").click();
      }else if(this.actualStep == '3.0'){
        this.notAnalyzeGeneticInfo=false;
        this.symptomsExomiser = this.phenotype.data;
        this.getNumberOfSymptomsExo();
        if(this.uploadingGenotype){
          this.goToStep('3.1', save);
        }
      }else if(this.actualStep == '5.0'){
        if(this.modalReference!=undefined){
          this.modalReference.close();
        }
      }else if(this.actualStep == '6.0'){
        //this.loadFilesContainer(false);
      }
      window.scrollTo(0, 0)
      if(save){
        this.setActualStepDB(indexStep);
      }
      /*if(this.actualStep== '4.0'){
        this.setActualStepDB('5.0');
      }*/
    }

    showPanelIntro(contentIntro){
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-sm'
      };
      this.modalReference = this.modalService.open(contentIntro, ngbModalOptions);
    }

    loadAllData(){

      this.loadShowIntroWizard();
      this.getAzureBlobSasToken();


      this.eventsService.on('infoStep', function(info) {
        if(info.maxStep!=null){
          this.setMaxStep('0.0');
        }
        this.goToStep(info.step, info.save);
      }.bind(this));

      this.eventsService.on('setStepWizard', function(info) {
        if(info=='next'){
          this.goNextStep();
        }else if(info=='prev'){
          this.goPrevStep();
        }else if(info=='reports'){
          this.setActualStep('4.0');
          //this.actualStep = '4.0';
          this.loadFilesContainer(true);
        }else if(info=='cancelAnalysis'){
          this.cancelAnalysis();
        }
      }.bind(this));
    }

    cancelAnalysis(){
      if(this.loadingGeno || this.calculatingH29Score || this.gettingRelatedConditions || this.uploadingGenotype){
        Swal.fire(this.translate.instant("analysissection.stillanalyzing"), this.translate.instant("analysissection.may10minutesexov2"), "warning");
      }else if(this.launchingPhen2Genes || this.calculatingH29Score || this.gettingRelatedConditions){
        Swal.fire(this.translate.instant("analysissection.stillanalyzing"), '', "warning");
      }else{
        this.setActualStep('5.0');
      }
    }

    getAzureBlobSasToken(){
      this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
      this.accessToken.patientId = this.authService.getCurrentPatient().sub;
      this.subscription.add( this.apiDx29ServerService.getAzureBlobSasToken(this.accessToken.containerName)
      .subscribe( (res : any) => {
        //console.log(res);
        this.accessToken.sasToken = '?'+res;
        this.blob.init(this.accessToken);
        this.blobped.init(this.accessToken);
        this.loadMyEmail();
        this.loadTranslations();
        this.initVariables();
        this.initVarsPrograms();
        this.loadSymptoms();
        this.getDiagnosisInfo();
      }, (err) => {
        console.log(err);
      }));
    }

    loadBlobFiles(){
      this.subscription.add( this.blob.change.subscribe(uploaded => {
         this.uploaded = uploaded;
         this.uploadingGenotype = false;
         this.uploadingVCF = false;
       }));

       this.subscription.add(this.blob.changeFilesBlob.subscribe(filesOnBlob => {
         if(filesOnBlob.length>0){
           filesOnBlob.sort(this.sortService.DateSort("lastModified"));
         }
         var mindate = 0;
         for (var i = 0; i < filesOnBlob.length; i++) {
           if(((filesOnBlob[i].name).indexOf('.vcf')!=-1)&&((filesOnBlob[i].name).indexOf('vcf/')!=-1)){
             var d = new Date(filesOnBlob[i].lastModified);
             //this.filename = filesOnBlob[i].name;
             if(mindate<d.getTime()){
               this.filename = filesOnBlob[i].name;
               mindate = d.getTime();
             }
             this.hasVcf = true;
             this.updateHasVcf();
           }
         }

         if(this.uploaded){
           if(document.getElementById("idShowPanelWorkbench")==null && document.getElementById("settingExomiser")==null){
           }else if(document.getElementById("settingExomiser")!=null){
             this.blob.loadFilesOnNewBlobExomizerSetting(this.accessToken.containerName);
           }
         }else{
           this.blob.loadFilesOnNewBlobExomizerSetting(this.accessToken.containerName);
         }

        }));

       //si tiene VCF
       this.subscription.add( this.blob.changeFilesExomizerBlobVcf.subscribe(vcfFilesOnBlob => {
         this.loadingGeno = false;
          if(vcfFilesOnBlob.length>0){
           vcfFilesOnBlob.sort(this.sortService.DateSort("lastModified"));
           for(var i=0;i<vcfFilesOnBlob.length;i++){
             vcfFilesOnBlob[i].nameForShow=""
           }
           for(var i=0;i<vcfFilesOnBlob.length;i++){
             if(vcfFilesOnBlob[i].name.indexOf('/')){
               var sectionsVcfBlob = vcfFilesOnBlob[i].name.split('/');
               vcfFilesOnBlob[i].nameForShow=sectionsVcfBlob[sectionsVcfBlob.length-1]
             }
             else{
               vcfFilesOnBlob[i].nameForShow=vcfFilesOnBlob[i].name;
             }
           }
           this.filesVcf = vcfFilesOnBlob;
           this.filename = vcfFilesOnBlob[0].name;
           this.hasVcf = true;
           if(document.getElementById("idShowPanelWorkbench")!=null && document.getElementById("settingExomiser")==null){
             //document.getElementById("idShowPanelWorkbench").click();
           }
          }else{
            //console.log('no tiene!');
          }
        }));

        this.subscription.add( this.blob.changeFilesOnlyVcf.subscribe(vcfFilesOnBlob => {
          this.loadingGeno = false;
           if(vcfFilesOnBlob.length>0){
             vcfFilesOnBlob.sort(this.sortService.DateSort("lastModified"));
             for(var i=0;i<vcfFilesOnBlob.length;i++){
               vcfFilesOnBlob[i].nameForShow=""
             }
             for(var i=0;i<vcfFilesOnBlob.length;i++){
               if(vcfFilesOnBlob[i].name.indexOf('/')){
                 var sectionsVcfBlob = vcfFilesOnBlob[i].name.split('/');
                 vcfFilesOnBlob[i].nameForShow=sectionsVcfBlob[sectionsVcfBlob.length-1]
               }
               else{
                 vcfFilesOnBlob[i].nameForShow=vcfFilesOnBlob[i].name;
               }
             }
             this.filesVcf = vcfFilesOnBlob;
             this.filename = vcfFilesOnBlob[0].name;
             this.hasVcf = true;
             this.updateHasVcf();
           }else{
             console.log('no tiene!');
           }
         }));

        //SI TIENE JSON DE EXOMIZER
       this.subscription.add( this.blob.changeFilesExomizerBlob.subscribe(filesOnBlob => {
         this.loadingGeno = false;
          this.filesOnBlob = filesOnBlob;
          //console.log(this.filesOnBlob);
          this.filesOnBlob.sort(this.sortService.DateSort("lastModified"));
          if(this.filesOnBlob.length>0){
            if(this.newVcf){
              this.loadFromBlob();
              //this.newVcf = false;
            }else{
              this.loadFromBlob();
              //document.getElementById("idShowPanelWorkbench").click();
            }
          }else{
            this.uploadingGenotype = false;
          }
          this.loading = false;
        }));

        //SI TIENE ped file
        this.subscription.add( this.blobped.change.subscribe(uploaded => {
           this.uploadingPed = !uploaded;
           this.blobped.loadFilesPedOnBlob(this.accessToken.containerName);
         }));

        this.subscription.add( this.blobped.changeFilesPedBlob.subscribe(filesPedOnBlob => {
           if(filesPedOnBlob.length>0){
             filesPedOnBlob.sort(this.sortService.DateSort("lastModified"));
             for(var i=0;i<filesPedOnBlob.length;i++){
               filesPedOnBlob[i].nameForShow=""
             }
             for(var i=0;i<filesPedOnBlob.length;i++){
               if(filesPedOnBlob[i].name.indexOf('/')){
                 var sectionsPedBlob = filesPedOnBlob[i].name.split('/');
                 filesPedOnBlob[i].nameForShow=sectionsPedBlob[sectionsPedBlob.length-1]
               }
               else{
                 filesPedOnBlob[i].nameForShow=filesPedOnBlob[i].name;
               }
             }
             this.pedNameForShow=filesPedOnBlob[0].nameForShow
             this.settingExomizer.PedBlobName = filesPedOnBlob[0].name;
           }else{
            console.log('no tiene!');
           }
         }));

        this.subscription.add( this.blob.changeNcrFilesPatientBlob.subscribe(filesNcr => {
           if(filesNcr.length>0){
             this.checkPrograms();
           }else{
            console.log('no tiene ncr!');
           }
         }));


        this.subscription.add( this.blob.changeFilesPatientBlob.subscribe(async filesPatientBlob => {
          this.docsNcr = [];
          this.otherDocs = [];
           if(filesPatientBlob.length>0){
             filesPatientBlob.sort(this.sortService.DateSort("lastModified"));
             var listPatientFiles = [];
             for(var i = 0; i < filesPatientBlob.length; i++) {
               var indexFileExecution1 = filesPatientBlob[i].name.split("-");
               var indexFileExecution2 =[];
               if((i+1)<filesPatientBlob.length){
                 indexFileExecution2 = filesPatientBlob[i+1].name.split("-");
               }
               var extension1 = filesPatientBlob[i].name.substr(filesPatientBlob[i].name.lastIndexOf('.'));
               var extension2 = null;
               var ncrresultfiles = false;
               if(filesPatientBlob[(i + 1)]==undefined){
                 if(indexFileExecution2[0]!=undefined) indexFileExecution2[0] = null;
                 else indexFileExecution2.push(null)
               }else{
                 extension2 = filesPatientBlob[i+1].name.substr(filesPatientBlob[i+1].name.lastIndexOf('.'));
                 if(filesPatientBlob[i].ncrresult || filesPatientBlob[i+1].ncrresult){
                   ncrresultfiles=true;
                 }
               }
               /*if((indexFileExecution1[0] == indexFileExecution2[0]) && ncrresultfiles){
                 if(extension1 == '.json'){
                   var name = filesPatientBlob[i+1].name.substr(filesPatientBlob[i+1].name.indexOf('-')+1)
                   filesPatientBlob[i+1].simplename = name;
                   listPatientFiles.push({origenFile:filesPatientBlob[i+1], ncrResults:filesPatientBlob[i]})
                 }else{
                   var name = filesPatientBlob[i].name.substr(filesPatientBlob[i].name.indexOf('-')+1)
                   filesPatientBlob[i].simplename = name;
                   listPatientFiles.push({origenFile:filesPatientBlob[i], ncrResults:filesPatientBlob[i+1]})
                 }
                 i=i+1;
               }else{
                 if(extension1 == '.json'){
                   var name = filesPatientBlob[i].name.substr(filesPatientBlob[i].name.indexOf('-')+1)
                   filesPatientBlob[i].simplename = name;
                   //listPatientFiles.push({origenFile:undefined, ncrResults:filesPatientBlob[i]})
                   listPatientFiles.push({origenFile:filesPatientBlob[i], ncrResults:filesPatientBlob[i]})
                 }else{
                   var name = filesPatientBlob[i+1].name.substr(filesPatientBlob[i+1].name.indexOf('-')+1)
                   filesPatientBlob[i+1].simplename = name;
                   //listPatientFiles.push({origenFile:undefined, ncrResults:filesPatientBlob[i]})
                   listPatientFiles.push({origenFile:filesPatientBlob[i], ncrResults:filesPatientBlob[i]})
                 }
                 //i=i+1;
               }*/

               if((indexFileExecution1[0] == indexFileExecution2[0]) && ncrresultfiles){
                 if(extension1 == '.json'){
                   var name = filesPatientBlob[i+1].name.substr(filesPatientBlob[i].name.indexOf('-')+1)
                   filesPatientBlob[i].simplename = name;
                   listPatientFiles.push({origenFile:filesPatientBlob[i+1], ncrResults:filesPatientBlob[i]})
                 }else{
                   var name = filesPatientBlob[i].name.substr(filesPatientBlob[i].name.indexOf('-')+1)
                   filesPatientBlob[i].simplename = name;
                   listPatientFiles.push({origenFile:filesPatientBlob[i], ncrResults:filesPatientBlob[i+1]})
                 }
                 i=i+1;
               }else{
                 if(extension1 == '.json'){
                   var name = filesPatientBlob[i].name.substr(filesPatientBlob[i].name.indexOf('-')+1)
                   filesPatientBlob[i].simplename = name;
                   //listPatientFiles.push({origenFile:undefined, ncrResults:filesPatientBlob[i]})
                   listPatientFiles.push({origenFile:filesPatientBlob[i], ncrResults:filesPatientBlob[i]})
                 }else{
                   var name = filesPatientBlob[i].name.substr(filesPatientBlob[i].name.indexOf('-')+1)
                   filesPatientBlob[i].simplename = name;
                   //listPatientFiles.push({origenFile:undefined, ncrResults:filesPatientBlob[i]})
                   listPatientFiles.push({origenFile:filesPatientBlob[i], ncrResults:filesPatientBlob[i]})
                 }
                 //i=i+1;
               }

             }
             for(var i=0;i<listPatientFiles.length;i++){
               listPatientFiles[i].origenFile.nameForShow="";
             }
             for(var i=0;i<listPatientFiles.length;i++){
               if(listPatientFiles[i].origenFile.simplename!=undefined){
                 if(listPatientFiles[i].origenFile.simplename.indexOf('/')!=-1){
                   var sectionslistPatientFiles = listPatientFiles[i].origenFile.simplename.split('/');
                   listPatientFiles[i].origenFile.nameForShow=sectionslistPatientFiles[sectionslistPatientFiles.length-1]
                 }
                 else{
                   listPatientFiles[i].origenFile.nameForShow=listPatientFiles[i].origenFile.simplename;
                 }
               }
             }
             this.listPatientFiles = listPatientFiles;
             for(var i=0;i<this.listPatientFiles.length;i++){
               this.listPatientFiles[i].origenFile.contentLength = this.formatBytes(this.listPatientFiles[i].origenFile.contentLength);
               if((this.listPatientFiles[i].ncrResults.name).indexOf('ncrresult.json')!=-1){
                 await this.getResumeNcr(this.listPatientFiles[i].ncrResults.name, i)

               }else{
                 var extension = this.listPatientFiles[i].origenFile.nameForShow.substr(this.listPatientFiles[i].origenFile.nameForShow.lastIndexOf('.'));
                 this.listPatientFiles[i].origenFile.extension=extension;
                 if(extension=='.vcf'|| extension=='.vcf.gz' || extension=='.pdf'|| extension=='.docx')
                 this.otherDocs.push(this.listPatientFiles[i]);
               }
             }
             this.docsNcr.sort(this.sortService.DateSortFiles("lastModified"));
             this.otherDocs.sort(this.sortService.DateSortFiles("lastModified"));

            // this.urlFileHtmlExomiserBlob = this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+filesPatientBlob[0].name+this.accessToken.sasToken;
           }else{
            console.log('no tiene!');
            this.listPatientFiles = [];
           }
           this.loadingDocuments = false;
           Swal.close();
         }));



       this.subscription.add( this.blob.changeFilesHtmlExomiserBlob.subscribe(filesHtmlExomiserBlob => {
          if(filesHtmlExomiserBlob.length>0){
            this.loadingFileHtmlExomiserBlob = false;
            filesHtmlExomiserBlob.sort(this.sortService.DateSort("lastModified"));
            this.urlFileHtmlExomiserBlob = this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+filesHtmlExomiserBlob[0].name+this.accessToken.sasToken;
          }else{
            this.loadingFileHtmlExomiserBlob = false;
           console.log('no tiene!');
          }
        }));

        //console.log(this.accessToken);
        this.blob.createContainerIfNotExists(this.accessToken, 'ncr');
        this.blob.createContainerIfNotExists(this.accessToken, '');
        this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
        this.getLastPhen2GenesResults();



    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async getResumeNcr(name, index){
      //this.listPatientFiles[i].origenFile.name
      this.subscription.add( this.http.get(this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+name+this.accessToken.sasToken)
       .subscribe( (res : any) => {
         var listSymptoms = [];
         var numSymptMatch = 0;
         var resumeText = '';
         if(res.originalText!=undefined){
           resumeText = res.originalText.slice(0, 200);
         }
          var infoNcr = res.result;
          if(infoNcr!=undefined){
            if(infoNcr.length>0){
             for(var i = 0; i < infoNcr.length; i++) {

               for(var j = 0; j < infoNcr[i].phens.length; j++) {
                 var foundkio =false;
                 for(var kio = 0; kio < listSymptoms.length && !foundkio; kio++) {
                   if(listSymptoms[kio]==infoNcr[i].phens[j].id){
                     foundkio=true;
                   }
                 }
                 if(!foundkio){
                   listSymptoms.push(infoNcr[i].phens[j].id);
                 }
               }
             }

             for(var i = 0; i < this.phenotype.data.length; i++) {
               var found = false;
               for(var j = 0; j < listSymptoms.length && !found; j++) {
                 if(this.phenotype.data[i].id==listSymptoms[j] && this.phenotype.data[i].checked){
                   numSymptMatch++;
                   found=true;
                 }
               }
             }
           }
          }
        var extension = this.listPatientFiles[index].origenFile.name.substr(this.listPatientFiles[index].origenFile.name.lastIndexOf('.'));
        this.listPatientFiles[index].ncrResults.extension = extension;
        this.listPatientFiles[index].ncrResults.numberSymptoms= listSymptoms.length;
        this.listPatientFiles[index].ncrResults.numSymptMatch= numSymptMatch;
        this.listPatientFiles[index].ncrResults.resumeText = resumeText;
        this.docsNcr.push(this.listPatientFiles[index]);
       }, (err) => {
         console.log(err);
       }));

    }

    onchangeparamgraph(){
      var namescore = "Dx29";
      /*if(this.paramgraph == 'matches'){
        namescore = "C1";
      }else */if(this.paramgraph == 'scoregenes'){
        namescore = "C2";
      }else if(this.paramgraph == 'score'){
        namescore = "C1";
      }
      const rows = [...this.relatedConditions];
      /*if(this.paramgraph == 'matches'){
        rows.sort(this.sortService.GetSortOrderNumberLength(this.paramgraph));
      }else{
        rows.sort(this.sortService.GetSortOrderNumber(this.paramgraph));
      }*/
      if(this.paramgraph == 'scoregenes'){
        rows.sort(this.sortService.GetSortOrderNumberPriority(this.paramgraph, 'h29', 'score'));
      }else{
        rows.sort(this.sortService.GetSortOrderNumberPriority(this.paramgraph, 'scoregenes', 'score'));
      }

      this.relatedConditions = rows;

      this.calculatingH29Score = false;
      this.renderMap();
    }

    checkServices(){
      // Find if the patient has pending works
      var patientId = this.authService.getCurrentPatient().sub;
      this.subscription.add( this.apiDx29ServerService.getPendingJobs(patientId)
      .subscribe( (res : any) => {
        if(res.exomiser!=undefined){
          if(res.exomiser.length>0){
            console.log("Check services... true")
            this.infoGenesAndConditionsExomizer=[];
            this.uploadingGenotype = true;
            this.filename = this.diagnosisInfo.settingExomizer.VcfBlobName;
            var actualToken=res.exomiser[res.exomiser.length-1]
            this.exomiserService.setActualToken(actualToken)
            this.checkExomiser();
          }else{
            if(this.actualStep=='3.1' || this.actualStep=='3.2'){
              this.goNextStep();
            }
            this.loadingServices = false;
          }
        }else{
          if(this.actualStep=='3.1' || this.actualStep=='3.2'){
            this.goNextStep();
          }
          this.loadingServices = false;
        }

      }, (err) => {
        console.log(err);
        this.loadingServices = false;
      }));
      this.launchingPhen2Genes = false;
    }

    checkExomiser(){
      var patientId = this.authService.getCurrentPatient().sub;
      // Llamar al servicio
      this.subscription.add( this.exomiserService.checkExomiserStatus(patientId)
        .subscribe( async (res2 : any) => {
          if(res2.message){
            if(res2.message=="nothing pending"){
              this.getExomizer(patientId);
              this.isSomethingPending = false;
            }
            else if (res2.message=="Error"){
              console.log("MEssage == error")
              // /api/Exomiser/StatusDescription(res2)
              this.isSomethingPending = false;
              this.manageErrorsExomiser("type 2",res2.res);
            }
            else if(res2.message=="something pending"){
              this.uploadingGenotype = true;
              this.isSomethingPending = true;
              if(this.actualStep=='3.0'){
                this.goToStep('3.1', false);
              }
              await this.delay(5000);
              this.checkExomiser();
            }
          }
          this.loadingServices = false;
         }, (err) => {
           console.log(err);
           this.manageErrorsExomiser("type1",err);
           this.loadingServices = false;
         }));
    }

    openLinkMonarch(url, e){
      window.open('https://monarchinitiative.org/phenotype/'+url, '_blank');
      e.stopPropagation();
    }

    selected($e) {
      $e.preventDefault();
      //this.selectedItems.push($e.item);

      var symptom = $e.item;
      var foundElement = this.searchService.search(this.phenotype.data,'id', symptom.id);
      if(!foundElement){
        this.phenotype.data.push({id: symptom.id,name: symptom.name, new: true, checked: true, percentile:-1, inputType: 'manual', importance: '1', polarity: '0', synonyms: symptom.synonyms});
        this.numberOfSymptoms++;
        this.saveSymptomsToDb();
        //this.toastr.success(this.translate.instant("generics.Name")+': '+symptom.name, this.translate.instant("phenotype.Symptom added"));
      }else{
        //this.toastr.warning(this.translate.instant("generics.Name")+': '+symptom.name, this.translate.instant("phenotype.You already had the symptom"));
      }
      this.modelTemp = '';
      //this.inputEl.nativeElement.value = '';
    }

    selected2(i) {
      this.addSymptom(this.listOfFilteredSymptoms[i], 'manual');
      this.hasSymptomsToSave();
      //this.addSymptom($e.item, 'manual');
      this.modelTemp = '';
      this.listOfFilteredSymptoms = [];
      //this.inputEl.nativeElement.value = '';
    }

    selected4(index) {
      this.selectedItems.push(this.listOfFilteredSymptoms[index]);
      this.listOfFilteredSymptoms = [];
      this.modelTemp = '';
    }

    onKeySymptoms(event){
      if( this.modelTemp.trim().length > 3){
        var tempModelTimp = this.modelTemp.trim();
        this.listOfFilteredSymptoms = this.searchFilterPipe.transformDiseases(this.listOfphenotypesinfo, 'name', tempModelTimp);
        this.listOfFilteredSymptoms = this.clearSavedSymptoms(this.listOfFilteredSymptoms);
      }else{
        this.listOfFilteredSymptoms = [];
      }
    }

    clearSavedSymptoms(filterSymptoms){
      var result = [];
      for(var i = 0; i < filterSymptoms.length; i++){
        var found = false;
        for(var j = 0; j < this.phenotype.data.length && !found ; j++){
          if(filterSymptoms[i].id==this.phenotype.data[j].id) {
            found = true;
          }
        }
        if(!found){
          result.push(filterSymptoms[i]);
        }
      }
      return result;
    }

    showMoreInfoSymptom(symptomIndex){
      if(this.selectedInfoSymptomIndex == symptomIndex ){
        this.selectedInfoSymptomIndex = -1;
      }else{
        this.selectedInfoSymptomIndex = symptomIndex;
      }
    }

    showMoreInfoSymptomPopup(symptomIndex, contentInfoSymptom){
      this.selectedInfoSymptomIndex = symptomIndex;
      let ngbModalOptions: NgbModalOptions = {
            keyboard : true,
            windowClass: 'ModalClass-sm'
      };
      this.modalReference = this.modalService.open(contentInfoSymptom, ngbModalOptions);
      this._openedModalRefs.push(this.modalReference);
    }

    showMoreInfoSymptomPopupGroup(index1, index2, contentInfoSymptom){
      var indexElement = this.searchService.searchIndex(this.phenotype.data,'id', this.listOfSymptomGroups[index1].symptoms[index2].id);
      this.showMoreInfoSymptomPopup(indexElement, contentInfoSymptom);
    }

    goPrevSymptom(){
      this.actualTemporalSymptomsIndex--;
    }

    deleteItem(item) {
      this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
      //this.inputEl.nativeElement.focus();
    }

    //traducir cosas
    loadTranslations(){
      this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
        this.msgDataSavedOk=res;
      });
      this.translate.get('generics.Data saved fail').subscribe((res: string) => {
        this.msgDataSavedFail=res;
      });
      this.translate.get('diagnosis.Symptoms').subscribe((res: string) => {
        this.tittleSymptoms=res;
        this.msgActiveTittleMenu = res;
      });
      this.translate.get('diagnosis.Genes').subscribe((res: string) => {
        this.tittleGenes=res;
      });
      this.translate.get('diagnosis.Workbench').subscribe((res: string) => {
        this.tittleWorkbench=res;
      });

      this.translate.get('diagnosis.Notes and Conclusion').subscribe((res: string) => {
        this.tittleNotesAndConclusion=res;
      });
      this.translate.get('phenotype.Search for symptoms').subscribe((res: string) => {
        this.placeholderSearchForSymptoms=res;
      });
    }

    initVariables(){
      this.phenotype = {
       validator_id: null,
       validated: false,
       inputType: 'manual',
       date: null,
       data: [],
       _id: null
     };

     this.phenotypeCopy = {
       validator_id: null,
       validated: false,
       inputType: 'manual',
       date: null,
       data: [],
       _id: null
     };
     this.selectedItems = [];

     this.filename = '';
     this.filesVcf = [];
     this.filesOnBlob = [];
     this.filePhen2GenesOnBlob = '';
     this.urlFileHtmlExomiserBlob = '';
     this.loadingFileHtmlExomiserBlob = false;
     this.loadingServices = true;
     this.infoGenesAndConditions = [];
     this.infoGenesAndConditionsExomizer = [];
     this.infoGenesAndConditionsPhen2Genes = [];
     this.activeTittleMenu = "Symptoms";

     this.lastInfoPetition = {
        date: null,
        data: []
     };
     this.loadingGeno = true;
     this.loading = false;
     this.loadingSymptoms = false;
     this.newVcf = false;
     this.relatedConditions = [];
     this.numberOfSymptoms = 0;
     this.loadingInfoGenes = false;

     this.diagnosisInfo = {
       hasDiagnosis: undefined,
       previousDiagnosis: '',
       identifiedGene: '',
       evaluation: '',
       notes: '',
       infoGenesAndConditionsExomizer: [],
       infoGenesAndConditionsPhen2Genes: [],
       relatedConditions: [],
       hasVcf: false,
       selectedItemsFilter: [],
       _id: null
     };

     this.exploreSymptomsPhen2Genes = false;

    }

    loadSymptoms(){

      //cargar los datos del usuario
      this.loadingSymptoms = true;
      this.numDeprecated = 0;
      var para= this.authService.getCurrentPatient();
      //cargar el fenotipo del usuario
      this.subscription.add( this.apiDx29ServerService.getSymptoms(para.sub)
      .subscribe( (res : any) => {
        this.checkPrograms();
        if(res.message){
          //no tiene fenotipo
        }else{

          if(res.phenotype.data.length>0){
            res.phenotype.data.sort(this.sortService.GetSortOrder("name"));// los ordeno por nombre?
            this.phenotype = res.phenotype;
            this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
            //this.idPhenotype = res.phenotype._id;
            var hposStrins =[];
            this.phenotype.data.forEach(function(element) {
              hposStrins.push(element.id);
            });

            //this.idPhenotype = res.phenotype._id;
            //get symtoms
            var lang = this.authService.getLang();
            if(this.listOfphenotypesinfo.length==0){
              this.testCallGetInfoSymptomsJSON(hposStrins);
            }else{
              this.callGetInfoSymptomsJSON(hposStrins);
            }

            this.callGetGroupsSymptoms(hposStrins);


            for (var j = 0; j < this.phenotype.data.length; j++) {
              this.phenotype.data[j].percentile = -1;
              this.phenotype.data[j].checked = true;
            }
            this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));

            if(this.isDeletingPhenotype){this.isDeletingPhenotype=false;}
            this.numberOfSymptoms = this.phenotype.data.length;
          }else{
            //no tiene fenotipo
            this.phenotype = res.phenotype;
            this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
          }
        }
        this.loadingSymptoms = false;
       }, (err) => {
         console.log(err);
         this.loadingSymptoms = false;
       }));
    }

    testCallGetInfoSymptomsJSON(hposStrins){
      this.subscriptionLoadSymptoms = Observable.interval(1000).subscribe(() => {
        this.numDeprecated = 0;
        if(this.listOfphenotypesinfo.length>0){
          this.subscriptionLoadSymptoms.unsubscribe();
          this.callGetInfoSymptomsJSON(hposStrins);
        }
      });
    }

    callGetInfoSymptomsJSON(hposStrins){
      this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(hposStrins,this.listOfphenotypesinfo)
      //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,hposStrins)
      .subscribe( (res2 : any) => {
        var tamano= Object.keys(res2).length;
        if(tamano>0){
          var hposStrinsOld =[];
          for(var i in res2) {
            if(res2[i].length>0){
              for (var j = 0; j < this.phenotype.data.length; j++) {
                if(res2[i][0].id==this.phenotype.data[j].id){
                  this.phenotype.data[j].name = res2[i][0].name;
                  this.phenotype.data[j].def = res2[i][0].desc;
                  this.phenotype.data[j].synonyms = res2[i][0].synonyms;
                  if(res2[i][0].comment==undefined){
                    this.phenotype.data[j].comment = '';
                  }else{
                    this.phenotype.data[j].comment = res2[i][0].comment;
                  }

                  if(this.phenotype.data[j].importance==undefined){
                    this.phenotype.data[j].importance = 1;
                  }
                }
              }
            }else{
              this.numDeprecated++;
            }
          }
          if(this.numDeprecated>0){
            for (var j = 0; j < this.phenotype.data.length; j++)
              {
                if(this.phenotype.data[j].synonyms==undefined){
                  hposStrinsOld.push(this.phenotype.data[j].id);
                }
              }
            this.callGetInfoOldSymptomsJSON(hposStrinsOld);
          }

        }

     }, (err) => {
       console.log(err);
     }));
    }

    callGetInfoOldSymptomsJSON(hposStrins){
      this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(hposStrins,this.listOfphenotypesinfoOld)
      //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,hposStrins)
      .subscribe( (res3 : any) => {
        var tamano= Object.keys(res3).length;
        if(tamano>0){
          for(var i in res3) {
            if(res3[i].length>0){

              for (var j = 0; j < this.phenotype.data.length; j++) {
                if(res3[i][0].id==this.phenotype.data[j].id){
                  this.phenotype.data[j].name = res3[i][0].name;
                  this.phenotype.data[j].def = res3[i][0].desc;
                  if(res3[i][0].comment==undefined){
                    this.phenotype.data[j].comment = '';
                  }else{
                    this.phenotype.data[j].comment = res3[i][0].comment;
                  }

                  if(this.phenotype.data[j].importance==undefined){
                    this.phenotype.data[j].importance = 1;
                  }
                }
              }
            }
          }
        }

     }, (err) => {
       console.log(err);
     }));
    }

    getRelatedConditionsview(isgen){
      this.isgen=isgen
      this.getRelatedConditions();
    }

    getRelatedConditions(){
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      this.gettingRelatedConditions = true;

      this.showErrorMsg = false;

      // Get list of diseases from Exomiser's genes
      var tempo = [];

      var infoToExtractGenes = [];
      var priorizeGenes=false;
      // Cojo lo de Exomiser
      if(this.infoGenesAndConditionsExomizer.length>0){
        infoToExtractGenes = this.infoGenesAndConditionsExomizer;
        priorizeGenes=true;
      // Cojo lo de phene2gene
      }else if(this.infoGenesAndConditionsPhen2Genes.length>0){
        infoToExtractGenes = this.infoGenesAndConditionsPhen2Genes;
        priorizeGenes=false;
      }
      if((infoToExtractGenes!= [])&&(priorizeGenes==true && this.isgen)&&(this.infoGenesAndConditionsExomizer.length>0)){
        this.getRelatedConditionsExomiser(infoToExtractGenes);
      }
      else{
        this.getRelatedConditionsPhen2Genes(infoToExtractGenes);
      }
    }

    getRelatedConditionsExomiser(infoToExtractGenes){
      var tempo = [];
      for(var k = 0; k < infoToExtractGenes.length; k++){
        for(var il = 0; il < infoToExtractGenes[k].data.length; il++){
          if(infoToExtractGenes[k].data[il].idOrphanet!=null){
            tempo.push({condition:infoToExtractGenes[k].data[il].condition, id: infoToExtractGenes[k].data[il].idOrphanet});
          }else{
            tempo.push({condition:infoToExtractGenes[k].data[il].condition, id: infoToExtractGenes[k].data[il].idOMIM});
          }
        }
      }
      // Leo los genes de exomiser y pregunto a la API de Alvaro por las relatedConditions
      // Comparo las relatedConditions que tenia en this.infoGenesAndConditionsExomizer y las de la respuesta de la API
      //    - Si ya estaba -> No hago nada
      //    - Si no estaba, la añado en la lista de condiciones para el gen
      var listGenes_names=[];
      for(var k = 0; k < infoToExtractGenes.length; k++){
        listGenes_names.push(infoToExtractGenes[k].name)
      }

      // Delete duplicates
      var mySet = new Set(listGenes_names);
      listGenes_names = [...mySet];

      // Llamar/bioentity/gene/diseases con infoToExtractGenes
      var infoDiseasesDiscard_null= new Object();
      infoDiseasesDiscard_null={};
      var infoDiseasesAdded= new Object();
      infoDiseasesAdded={};

      this.subscription.add( this.apif29BioService.getDiseaseOfGenes(listGenes_names)
      .subscribe( (resDiseases : any) => {
        for(var i=0;i<listGenes_names.length;i++){
          var idGen = listGenes_names[i];
          if((resDiseases[idGen] !=undefined)&&(resDiseases[idGen] !=null)){
            if(Object.keys((resDiseases[idGen]).diseases).length>0){
              var obttemp = (resDiseases[idGen]).diseases;
              for(var disease in obttemp) {
                var foundIntempo=false;
                for(var j=0;j<tempo.length;j++){
                  if(tempo[j].condition.toLowerCase()==obttemp[disease].label.toLowerCase()){
                    foundIntempo=true;
                  }
                }
                if(foundIntempo==false){
                  tempo.push({condition:obttemp[disease].label, id: obttemp[disease].id});
                  infoDiseasesAdded[resDiseases[idGen].id]={diseases:Object.keys(resDiseases[idGen].diseases)}
                }
              }
            }
          }
          else{
            infoDiseasesDiscard_null[listGenes_names[i]]={}
          }
        }

        if(Object.keys(infoDiseasesDiscard_null).length>0){
          var str = JSON.stringify(infoDiseasesDiscard_null);
          var fileNameRelatedConditionsDiscard = "genesToDisease/relatedConditions"+"-"+'discardDiseases_null.json';
          var file = new File([str],fileNameRelatedConditionsDiscard,{type:'application/json'});
          this.uploadProgress = this.blob
          .uploadToBlobStorage(this.accessToken, file, fileNameRelatedConditionsDiscard, 'relatedConditions');
        }

        if(Object.keys(infoDiseasesAdded).length>0){
          var str = JSON.stringify(infoDiseasesAdded);
          var fileNameRelatedConditionsDiscard = "genesToDisease/relatedConditions"+"-"+'addDiseases.json';
          var file = new File([str],fileNameRelatedConditionsDiscard,{type:'application/json'});
          this.uploadProgress = this.blob
          .uploadToBlobStorage(this.accessToken, file, fileNameRelatedConditionsDiscard, 'relatedConditions');
        }

        // end Get list of diseases from Exomiser's genes
        //Get list of diseases with Monarch (la de ahora).
        this.relatedConditions = [];
        var jsonPhenotype = { hpos: this.phenotype.data };
        var jsonHpos = [];
        for(var index in this.phenotype.data){
          if(this.phenotype.data[index].checked){
            jsonHpos.push(this.phenotype.data[index].id);
          }
        }
        this.subscription.add( this.apiDx29ServerService.getRelatedConditions(jsonHpos)
        .subscribe( (res : any) => {
          this.relatedConditions = res;
          if(infoToExtractGenes!= []){
            this.loadingInfoGenes = true;
            this.listOfDiseases = [];
            //Merge and keep unique diseases.
            for(var i = 0; i < this.relatedConditions.length; i++) {
              if(this.relatedConditions[i]!=undefined){
                if(this.relatedConditions[i].genes==undefined){
                  this.relatedConditions[i].genes = [];
                  this.relatedConditions[i].scoregenes = 0;
                }
                var foundElement = this.searchService.search(tempo,'condition', this.relatedConditions[i].name.label);
                if(!foundElement){
                  tempo.push({condition:this.relatedConditions[i].name.label, id: this.relatedConditions[i].name.id});
                }

              }
            }
            // Scores y priorizacion de todas las condiciones: exomiser+f29bio+monarch
            var temp2 = [];
            for(var in1 = 0; in1 < tempo.length; in1++) {
              var enc = false;
              var posi = -1;
              for(var in2 = 0; in2 < this.relatedConditions.length && !enc; in2++) {
                var para1 = (tempo[in1].condition).toLowerCase();
                var para2 = (this.relatedConditions[in2].name.label).toLowerCase();
                if(para1 == para2){
                  posi = in2;
                  enc = true;
                }
              }
              if(!enc){
                temp2.push({"name":{label: tempo[in1].condition, id: tempo[in1].id} , "score": 0, "matches": [], genes: [], scoregenes: 0});
              }else{
                var enctemp2 = false;
                for(var in3 = 0; in3 < temp2.length && !enctemp2; in3++) {
                  if(temp2[in3].name.label == this.relatedConditions[posi].name.label){
                    enctemp2 = true
                    temp2[in3].score = this.relatedConditions[posi].score
                  }
                }
                if(!enctemp2){
                  temp2.push({"name":{label: tempo[in1].condition, id: tempo[in1].id} , "score": this.relatedConditions[posi].score, "matches": [], genes: [], scoregenes: 0});
                }

              }
            }
            for(var in3 = 0; in3 < this.relatedConditions.length; in3++) {
              var enctemp2 = false;
              for(var in4 = 0; in4 < temp2.length && !enctemp2; in4++) {
                if(temp2[in4].name.label == this.relatedConditions[in3].name.label){
                  enctemp2 = true
                }
              }
              if(!enctemp2){
                temp2.push(this.relatedConditions[in3]);
              }
            }
            this.relatedConditions = temp2;

            //quedarse con 100 this.listOfDiseases
            this.listOfDiseases = [];
            for(var in3 = 0; in3 < this.relatedConditions.length; in3++) {
              this.listOfDiseases.push(this.relatedConditions[in3].name.id);
            }

            //end Merge and keep unique diseases.
            //get genes
            this.subscription.add(this.apif29BioService.getGenesOfDiseases(this.listOfDiseases)
            .subscribe( (res1 : any) => {
              var genRelationValuesListAccepted=["RO:0003303", "RO:0004012", "RO:0004013", "RO:0004014"]
              var infoGenesDiscard_null= new Object();
              infoGenesDiscard_null={};
              var infoGenesDiscard_filter= new Object();
              infoGenesDiscard_filter={};

              for(var i = 0; i < this.relatedConditions.length; i++) {
                var foundeleme = false;
                var idDesease = this.relatedConditions[i].name.id;
                if((res1[idDesease] !=undefined)&&(res1[idDesease] !=null)){
                  if(Object.keys((res1[idDesease]).genes).length>0){
                    for(var k = 0; k < infoToExtractGenes.length && !foundeleme; k++){
                      var obttemp = (res1[idDesease]).genes;
                      var genIncluded=false;
                        for(var gen in obttemp) {
                          foundeleme = false;
                          // Filter by "is_defined_by" (all that not have ONLY orphanet source)
                          var definedByOnlyOrphanet=false;
                          if(obttemp[gen].is_defined_by.indexOf('#orphanet')>-1){
                            if(obttemp[gen].is_defined_by.indexOf('|')==-1){
                              definedByOnlyOrphanet=true;
                            }
                          }
                          if(definedByOnlyOrphanet==false){
                            // Filter by relation
                            // (condition) if gen relation value in list of relationValues accepted
                            if(genRelationValuesListAccepted.includes(obttemp[gen].relation)==true){
                              this.relatedConditions[i].iscondition=true;
                              genIncluded=true;
                            }
                          }

                          var para3 = (infoToExtractGenes[k].name).toLowerCase();
                          var para4 = (obttemp[gen].label).toLowerCase();
                          if(para3==para4){
                            if(this.relatedConditions[i].scoregenes==0){
                              var scoregenes = 0;
                              if(this.infoGenesAndConditionsExomizer.length>0){
                                if(infoToExtractGenes[k].scoredx29 != undefined){
                                  scoregenes = parseInt(((infoToExtractGenes[k].score)*100).toFixed(0));
                                  this.relatedConditions[i].h29 = parseInt(((infoToExtractGenes[k].scoredx29)*100).toFixed(0));
                                }else{
                                  scoregenes = parseInt(((infoToExtractGenes[k].score)*100).toFixed(0));
                                }
                              }else if(this.infoGenesAndConditionsPhen2Genes.length>0){
                                scoregenes = parseInt(((infoToExtractGenes[k].score)*100).toFixed(0));

                              }else{
                                scoregenes = 100 - (k*5);
                              }
                              this.relatedConditions[i].scoregenes = scoregenes;
                            }
                            foundeleme = true;
                          }
                          var encposiel = false;
                          for(var posiel = 0; posiel < this.relatedConditions[i].genes.length && !encposiel; posiel++) {
                            if(this.relatedConditions[i].genes[posiel].gen == obttemp[gen].label){
                              encposiel = true;
                            }
                          }
                          if(!encposiel && foundeleme){
                            this.relatedConditions[i].genes.push({gen:obttemp[gen].label});
                          }
                        }
                        if(genIncluded==false){
                          this.relatedConditions[i].iscondition=false;
                          infoGenesDiscard_filter[res1[idDesease].id]=res1[idDesease].genes
                        }
                    }
                    if(this.relatedConditions[i].genes.length>0){
                      this.relatedConditions[i].genes.sort(this.sortService.GetSortOrder("gen"));
                    }
                  }else{
                    if(this.isUpperCase(this.relatedConditions[i].name.label)){
                      this.relatedConditions[i].name.infogene = 'https://www.genecards.org/cgi-bin/carddisp.pl?gene='+this.relatedConditions[i].name.label+'#diseases';
                    }else{
                      this.relatedConditions[i].name.infogene = 'https://www.genecards.org/Search/Keyword?queryString='+this.relatedConditions[i].name.label;
                    }
                  }
                }else{
                  this.relatedConditions[i].iscondition=false;
                  infoGenesDiscard_null[this.relatedConditions[i].name.id]={}
                  if(this.isUpperCase(this.relatedConditions[i].name.label)){
                    this.relatedConditions[i].name.infogene = 'https://www.genecards.org/cgi-bin/carddisp.pl?gene='+this.relatedConditions[i].name.label+'#diseases';
                  }else{
                    this.relatedConditions[i].name.infogene = 'https://www.genecards.org/Search/Keyword?queryString='+this.relatedConditions[i].name.label;
                  }
                }
              }

              if(Object.keys(infoGenesDiscard_filter).length>0){
                var str = JSON.stringify(infoGenesDiscard_filter);
                var fileNameRelatedConditionsDiscard = "diseasesToGenes/relatedConditions"+"-"+'discardDiseases_filter.json';
                var file = new File([str],fileNameRelatedConditionsDiscard,{type:'application/json'});
                this.uploadProgress = this.blob
                .uploadToBlobStorage(this.accessToken, file, fileNameRelatedConditionsDiscard, 'relatedConditions');
              }

              if(Object.keys(infoGenesDiscard_null).length>0){
                var str = JSON.stringify(infoGenesDiscard_null);
                var fileNameRelatedConditionsDiscard = "diseasesToGenes/relatedConditions"+"-"+'discardDiseases_null.json';
                var file = new File([str],fileNameRelatedConditionsDiscard,{type:'application/json'});
                this.uploadProgress = this.blob
                .uploadToBlobStorage(this.accessToken, file, fileNameRelatedConditionsDiscard, 'relatedConditions');
              }

              // Info of the execution
              var str = JSON.stringify({analyze:"exomiser",data:{hpos:jsonHpos}});
              var fileNameRelatedConditions = "relatedConditions"+"-"+'executionParams.json';
              var fileRelatedConditionsParams = new File([str],fileNameRelatedConditions,{type:'application/json'});
              this.uploadProgress = this.blob
              .uploadToBlobStorage(this.accessToken, fileRelatedConditionsParams, fileNameRelatedConditions, 'relatedConditions');

              var copyrelatedConditions2 = [];
              for(var i = 0; i < this.relatedConditions.length; i++) {
                if(this.relatedConditions[i].iscondition){
                  copyrelatedConditions2.push(this.relatedConditions[i]);
                }
              }
              this.relatedConditions = copyrelatedConditions2;
              this.loadingInfoGenes = false;
              //this.calcularScoreHealth29();
              this.getSymptomsApi();

            }, (err) => {
              console.log(err);
              //tratar el error
              this.reportError();
              this.closeAndShowMsg();
            }));


          }else{
            Swal.fire('Error', 'No exomiser or phene2gene results have been found.', "error");
          }
          this.gettingRelatedConditions = false;
        }, (err) => {
          console.log(err);
          //tratar el error
          this.reportError();
          this.toastr.error('', this.translate.instant("generics.error try again"));
          this.gettingRelatedConditions = false;
        }));
      }, (err) => {
        console.log(err);
        //tratar el error
        this.reportError();
        this.toastr.error('', this.translate.instant("generics.error try again"));
        this.gettingRelatedConditions = false;
      }));
    }

    getRelatedConditionsPhen2Genes(infoToExtractGenes){

      var tempo = [];
      for(var k = 0; k < infoToExtractGenes.length; k++){
        for(var il = 0; il < infoToExtractGenes[k].data.length; il++){
          if(infoToExtractGenes[k].data[il].idOrphanet!=null){
            tempo.push({condition:infoToExtractGenes[k].data[il].condition, id: infoToExtractGenes[k].data[il].idOrphanet});
          }else{
            tempo.push({condition:infoToExtractGenes[k].data[il].condition, id: infoToExtractGenes[k].data[il].idOMIM});
          }
        }
      }
      // Leo los genes de exomiser y pregunto a la API de Alvaro por las relatedConditions
      // Comparo las relatedConditions que tenia en this.infoGenesAndConditionsExomizer y las de la respuesta de la API
      //    - Si ya estaba -> No hago nada
      //    - Si no estaba, la añado en la lista de condiciones para el gen
      var listGenes_names=[];
      for(var k = 0; k < infoToExtractGenes.length; k++){
        listGenes_names.push(infoToExtractGenes[k].name)
      }

      // Delete duplicates
      var mySet = new Set(listGenes_names);
      listGenes_names = [...mySet];

      // Llamar/bioentity/gene/diseases con infoToExtractGenes
      var infoDiseasesDiscard_null= new Object();
      infoDiseasesDiscard_null={};
      var infoDiseasesAdded= new Object();
      infoDiseasesAdded={};

      this.subscription.add( this.apif29BioService.getDiseaseOfGenes(listGenes_names)
      .subscribe( (resDiseases : any) => {
        for(var i=0;i<listGenes_names.length;i++){
          var idGen = listGenes_names[i];
          if((resDiseases[idGen] !=undefined)&&(resDiseases[idGen] !=null)){
            if(Object.keys((resDiseases[idGen]).diseases).length>0){
              var obttemp = (resDiseases[idGen]).diseases;
              for(var disease in obttemp) {
                var foundIntempo=false;
                for(var j=0;j<tempo.length;j++){
                  if(tempo[j].condition.toLowerCase()==obttemp[disease].label.toLowerCase()){
                    foundIntempo=true;
                  }
                }
                if(foundIntempo==false){
                  tempo.push({condition:obttemp[disease].label, id: obttemp[disease].id});
                  infoDiseasesAdded[resDiseases[idGen].id]={diseases:Object.keys(resDiseases[idGen].diseases)}
                }
              }
            }
          }
          else{
            infoDiseasesDiscard_null[listGenes_names[i]]={}
          }
        }

        if(Object.keys(infoDiseasesDiscard_null).length>0){
          var str = JSON.stringify(infoDiseasesDiscard_null);
          var fileNameRelatedConditionsDiscard = "genesToDisease/relatedConditions"+"-"+'discardDiseases_null.json';
          var file = new File([str],fileNameRelatedConditionsDiscard,{type:'application/json'});
          this.uploadProgress = this.blob
          .uploadToBlobStorage(this.accessToken, file, fileNameRelatedConditionsDiscard, 'relatedConditions');
        }

        if(Object.keys(infoDiseasesAdded).length>0){
          var str = JSON.stringify(infoDiseasesAdded);
          var fileNameRelatedConditionsDiscard = "genesToDisease/relatedConditions"+"-"+'addDiseases.json';
          var file = new File([str],fileNameRelatedConditionsDiscard,{type:'application/json'});
          this.uploadProgress = this.blob
          .uploadToBlobStorage(this.accessToken, file, fileNameRelatedConditionsDiscard, 'relatedConditions');
        }
        //Get list of diseases with Monarch (la de ahora).
        this.relatedConditions = [];
        var jsonPhenotype = { hpos: this.phenotype.data };
        var jsonHpos = [];
        for(var index in this.phenotype.data){
          if(this.phenotype.data[index].checked){
            jsonHpos.push(this.phenotype.data[index].id);
          }
        }
        this.subscription.add( this.apiDx29ServerService.getRelatedConditions(jsonHpos)
        .subscribe( (res : any) => {
        this.relatedConditions = res;

        //Merge and keep unique diseases.
        for(var i = 0; i < this.relatedConditions.length; i++) {
          if(this.relatedConditions[i]!=undefined){
            if(this.relatedConditions[i].genes==undefined){
              this.relatedConditions[i].genes = [];
              this.relatedConditions[i].scoregenes = 0;
            }
            var foundElement = this.searchService.search(tempo,'condition', this.relatedConditions[i].name.label);
            if(!foundElement){
              tempo.push({condition:this.relatedConditions[i].name.label, id: this.relatedConditions[i].name.id});
            }

          }
        }
        var temp2=[];
        for(var in1=0;in1<tempo.length;in1++){
          temp2.push({name:{label: tempo[in1].condition, id: tempo[in1].id}});
        }

        this.relatedConditions.concat(temp2);
        if(infoToExtractGenes!= []){
          this.loadingInfoGenes = true;
          this.listOfDiseases = [];
          for(var i = 0; i < this.relatedConditions.length; i++) {
            if(this.relatedConditions[i]!=undefined){
              if(this.relatedConditions[i].genes==undefined){
                this.relatedConditions[i].genes = [];
                this.relatedConditions[i].scoregenes = 0;
              }
            }
          }
          //quedarse con 100 this.listOfDiseases
          this.listOfDiseases = [];
          for(var in3 = 0; in3 < this.relatedConditions.length; in3++) {
            this.listOfDiseases.push(this.relatedConditions[in3].name.id);
          }
          //end Merge and keep unique diseases.
          //get genes
          this.subscription.add(this.apif29BioService.getGenesOfDiseases(this.listOfDiseases)
          .subscribe( (res1 : any) => {
            var genRelationValuesListAccepted=["RO:0003303", "RO:0004012", "RO:0004013", "RO:0004014"]
            var infoGenesDiscard_null= new Object();
            infoGenesDiscard_null={};
            var infoGenesDiscard_filter= new Object();
            infoGenesDiscard_filter={};
            for(var i = 0; i < this.relatedConditions.length; i++) {
              var foundeleme = false;
              var idDesease = this.relatedConditions[i].name.id;
              if((res1[idDesease] !=undefined)&&(res1[idDesease] !=null)){
                if(Object.keys((res1[idDesease]).genes).length>0){
                  for(var k = 0; k < infoToExtractGenes.length && !foundeleme; k++){
                    var obttemp = (res1[idDesease]).genes;
                    var genIncluded=false;
                      for(var gen in obttemp) {
                        // Filter by "is_defined_by" (all that not have ONLY orphanet source)
                        var definedByOnlyOrphanet=false;
                        if(obttemp[gen].is_defined_by.indexOf('#orphanet')>-1){
                          if(obttemp[gen].is_defined_by.indexOf('|')==-1){
                            definedByOnlyOrphanet=true;
                          }
                        }
                        if(definedByOnlyOrphanet==false){
                          // Filter by relation
                          // (condition) if gen relation value in list of relationValues accepted
                          if(genRelationValuesListAccepted.includes(obttemp[gen].relation)==true){
                            this.relatedConditions[i].iscondition=true;
                            genIncluded=true;
                          }
                        }

                        var para3 = (infoToExtractGenes[k].name).toLowerCase();
                        var para4 = (obttemp[gen].label).toLowerCase();
                        if(para3==para4){
                          if(this.relatedConditions[i].scoregenes==0){
                            var scoregenes = 0;
                            if(this.infoGenesAndConditionsExomizer.length>0){
                              if(infoToExtractGenes[k].scoredx29 != undefined){
                                scoregenes = parseInt(((infoToExtractGenes[k].score)*100).toFixed(0));
                                this.relatedConditions[i].h29 = parseInt(((infoToExtractGenes[k].scoredx29)*100).toFixed(0));
                              }else{
                                scoregenes = parseInt(((infoToExtractGenes[k].score)*100).toFixed(0));
                              }
                            }else if(this.infoGenesAndConditionsPhen2Genes.length>0){
                              scoregenes = parseInt(((infoToExtractGenes[k].score)*100).toFixed(0));

                            }else{
                              scoregenes = 100 - (k*5);
                            }
                            this.relatedConditions[i].scoregenes = scoregenes;
                          }
                          foundeleme = true;
                        }
                        var encposiel = false;
                        for(var posiel = 0; posiel < this.relatedConditions[i].genes.length && !encposiel; posiel++) {
                          if(this.relatedConditions[i].genes[posiel].gen == obttemp[gen].label){
                            encposiel = true;
                          }
                        }
                        if(!encposiel){
                          this.relatedConditions[i].genes.push({gen:obttemp[gen].label});
                        }
                      }
                      if(genIncluded==false){
                        this.relatedConditions[i].iscondition=false;
                        infoGenesDiscard_filter[res1[idDesease].id]=res1[idDesease].genes
                      }
                  }
                  if(this.relatedConditions[i].genes.length>0){
                    this.relatedConditions[i].genes.sort(this.sortService.GetSortOrder("gen"));
                  }
                }else{
                  if(this.isUpperCase(this.relatedConditions[i].name.label)){
                    this.relatedConditions[i].name.infogene = 'https://www.genecards.org/cgi-bin/carddisp.pl?gene='+this.relatedConditions[i].name.label+'#diseases';
                  }else{
                    this.relatedConditions[i].name.infogene = 'https://www.genecards.org/Search/Keyword?queryString='+this.relatedConditions[i].name.label;
                  }
                }
              }else{
                this.relatedConditions[i].iscondition=false;
                infoGenesDiscard_null[this.relatedConditions[i].name.id]={};
                if(this.isUpperCase(this.relatedConditions[i].name.label)){
                  this.relatedConditions[i].name.infogene = 'https://www.genecards.org/cgi-bin/carddisp.pl?gene='+this.relatedConditions[i].name.label+'#diseases';
                }else{
                  this.relatedConditions[i].name.infogene = 'https://www.genecards.org/Search/Keyword?queryString='+this.relatedConditions[i].name.label;
                }
              }
            }

            if(Object.keys(infoGenesDiscard_filter).length>0){
              var str = JSON.stringify(infoGenesDiscard_filter);
              var fileNameRelatedConditionsDiscard = "diseasesToGenes/relatedConditions"+"-"+'discardByGenes_filter.json';
              var file = new File([str],fileNameRelatedConditionsDiscard,{type:'application/json'});
              this.uploadProgress = this.blob
              .uploadToBlobStorage(this.accessToken, file, fileNameRelatedConditionsDiscard, 'relatedConditions');

            }
            if(Object.keys(infoGenesDiscard_null).length>0){
              var str = JSON.stringify(infoGenesDiscard_null);
              var fileNameRelatedConditionsDiscard = "diseasesToGenes/relatedConditions"+"-"+'discardByGenes_null.json';
              var file = new File([str],fileNameRelatedConditionsDiscard,{type:'application/json'});
              this.uploadProgress = this.blob
              .uploadToBlobStorage(this.accessToken, file, fileNameRelatedConditionsDiscard, 'relatedConditions');

            }

            // Info of the execution
            var str = JSON.stringify({analyze:"Phen2Genes",data:{hpos:jsonHpos}});
            var fileNameRelatedConditions = "relatedConditions"+"-"+'executionParams.json';
            var fileRelatedConditionsParams = new File([str],fileNameRelatedConditions,{type:'application/json'});
            this.uploadProgress = this.blob
            .uploadToBlobStorage(this.accessToken, fileRelatedConditionsParams, fileNameRelatedConditions, 'relatedConditions');

            var copyrelatedConditions2 = [];
            if(this.infoGenesAndConditionsExomizer.length==0 && (this.infoGenesAndConditionsPhen2Genes.length==0 && this.launchedPhen2genes)){
              for(var i = 0; i < this.relatedConditions.length; i++) {
                copyrelatedConditions2.push(this.relatedConditions[i]);
              }
            }else{
              for(var i = 0; i < this.relatedConditions.length; i++) {
                if(this.relatedConditions[i].iscondition){
                  copyrelatedConditions2.push(this.relatedConditions[i]);
                }
              }
            }

            this.relatedConditions = copyrelatedConditions2;
            this.loadingInfoGenes = false;
            //this.calcularScoreHealth29();
            this.getSymptomsApi();

          }, (err) => {
              console.log(err);
              //tratar el error
              this.reportError();
              this.closeAndShowMsg();
          }));
        }else{
          Swal.fire('Error', 'No exomiser or Phen2Genes results have been found.', "error");
        }
        this.gettingRelatedConditions = false;
      }, (err) => {
        console.log(err);
        //tratar el error
        this.reportError();
        this.toastr.error('', this.translate.instant("generics.error try again"));
        this.gettingRelatedConditions = false;
      }));
    }, (err) => {
      console.log(err);
      //tratar el error
      this.reportError();
      this.toastr.error('', this.translate.instant("generics.error try again"));
      this.gettingRelatedConditions = false;
    }));

    }

    getSymptomsApi(){
      //get symtoms
      this.loadingSymptomsRelatedDiseases = true;
      var lang = this.authService.getLang();
      this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang,this.listOfDiseases,0)
      .subscribe( (res2 : any) => {
        var diseaseWithoutScore = [];
        for(var i = 0; i < this.relatedConditions.length; i++) {
          var idDesease = this.relatedConditions[i].name.id
          this.relatedConditions[i].symptoms = [];

          var info = res2[idDesease];
          //console.log(info);
          if(info!=undefined){
            var listOfSymptoms = info.phenotypes
            this.relatedConditions[i].xrefs = info.xrefs;
            if(Object.keys(listOfSymptoms).length>0){
              for(var indexSymptom in listOfSymptoms) {
                var comment = "";
                var def = "";
                if(listOfSymptoms[indexSymptom].desc!="None" && listOfSymptoms[indexSymptom].desc!=null){
                  def = listOfSymptoms[indexSymptom].desc;
                }
                if(listOfSymptoms[indexSymptom].comment!=""){
                  comment = listOfSymptoms[indexSymptom].comment;
                }/*else{
                  comment = "None"
                }*/
                this.relatedConditions[i].symptoms.push({id:indexSymptom, name: listOfSymptoms[indexSymptom].name, def: def, comment: comment, synonyms: listOfSymptoms[indexSymptom].synonyms});

               }
              if(this.relatedConditions[i].symptoms.length>0){
                this.relatedConditions[i].symptoms.sort(this.sortService.GetSortOrder("name"));
              }

            }
          }
          if(this.relatedConditions[i].score == 0){
            diseaseWithoutScore.push({id: idDesease, symptoms: this.relatedConditions[i].symptoms, positionOnResults: -1})
          }
        }
        this.loadingInfoGenes = false;
        if(diseaseWithoutScore.length>0){
          //calculateScore

          var arraySymptomsIds=[];

          for(var lo = 0; lo < this.phenotype.data.length; lo++) {
            arraySymptomsIds.push(this.phenotype.data[lo].id)
          }
          if(arraySymptomsIds.length>0){
            var query_ids = [];
            var positionOnResults = 0;
            for(var lo = 0; lo < diseaseWithoutScore.length; lo++) {
              var query_ids_disease = [];
              for(var lo2 = 0; lo2 < diseaseWithoutScore[lo].symptoms.length; lo2++) {
                if(query_ids_disease.length<99){
                  query_ids_disease.push(diseaseWithoutScore[lo].symptoms[lo2].id);
                }
              }
              if(query_ids_disease.length>0){
                diseaseWithoutScore[lo].positionOnResults = positionOnResults;
                positionOnResults++;
                query_ids.push(query_ids_disease);
              }else{
                console.log('no tengo sintomas!');
              }
            }
            var request = {
              "reference_ids": arraySymptomsIds,
              "query_ids": query_ids
            }

            this.subscription.add( this.http.post('https://api.monarchinitiative.org/api/sim/compare',request)
            .subscribe( (res : any) => {
              for(var i = 0; i < diseaseWithoutScore.length; i++) {
                if(diseaseWithoutScore[i].positionOnResults>=0){
                  diseaseWithoutScore[i].score = res.matches[diseaseWithoutScore[i].positionOnResults].score
                }
              }
              for(var i = 0; i < this.relatedConditions.length; i++) {
                var encdise = false;
                for(var j = 0; j < diseaseWithoutScore.length && !encdise; j++) {
                  if(diseaseWithoutScore[j].positionOnResults>=0){
                    if(diseaseWithoutScore[j].id== this.relatedConditions[i].name.id){
                      this.relatedConditions[i].score = diseaseWithoutScore[j].score;
                      encdise = true;
                    }
                  }

                }
              }
              this.calcularScoreHealth29();
            }, (err) => {
              console.log(err);
              this.calcularScoreHealth29();
            }));
          }else{
            this.calcularScoreHealth29();
          }

        }else{
          this.calcularScoreHealth29();
        }

      }, (err) => {
        this.loadingSymptomsRelatedDiseases = false;
        console.log(err);
        //tratar el error
        this.reportError();
        this.closeAndShowMsg();
      }));
    }

    getSymptomsApi2(){
      //get symtoms
      this.listOfDiseases = [];
      for(var in3 = 0; in3 < this.relatedConditions.length; in3++) {
        this.listOfDiseases.push(this.relatedConditions[in3].name.id);
      }
      var lang = this.authService.getLang();
      this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang,this.listOfDiseases,0)
      .subscribe( (res2 : any) => {
        for(var i = 0; i < this.relatedConditions.length; i++) {
          var idDesease = this.relatedConditions[i].name.id
          this.relatedConditions[i].symptoms = [];

          var info = res2[idDesease];
          //console.log(info);
          if(info!=undefined){
            var listOfSymptoms = info.phenotypes
            this.relatedConditions[i].xrefs = info.xrefs;
            if(Object.keys(listOfSymptoms).length>0){
              for(var indexSymptom in listOfSymptoms) {
                var comment = "";
                var def = "";
                if(listOfSymptoms[indexSymptom].desc!="None" && listOfSymptoms[indexSymptom].desc!=null){
                  def = listOfSymptoms[indexSymptom].desc;
                }
                if(listOfSymptoms[indexSymptom].comment!=""){
                  comment = listOfSymptoms[indexSymptom].comment;
                }/*else{
                  comment = "None"
                }*/
                this.relatedConditions[i].symptoms.push({id:indexSymptom, name: listOfSymptoms[indexSymptom].name, def: def, comment: comment, synonyms: listOfSymptoms[indexSymptom].synonyms});

               }
              if(this.relatedConditions[i].symptoms.length>0){

                this.relatedConditions[i].symptoms.sort(this.sortService.GetSortOrder("name"));
              }

            }
          }
        }
        if(this.relatedConditions.length>0){
          this.indexListRelatedConditions = 10;
          this.renderMap();
          if(this.selectedItemsFilter.length > 0){
            this.applyFilters();
          }
        }else{
          this.loadingPotentialDiagnostics = false;
        }
      }, (err) => {
        console.log(err);
      }));
    }

    isUpperCase(str) {
      return str === str.toUpperCase();
    }

    calcularScoreHealth29(){
      this.loadingSymptomsRelatedDiseases = false;
      this.calculatingH29Score = true;
      for(var i = 0; i < this.relatedConditions.length; i++) {
        var scoreHealth29 = 0;

        if(this.relatedConditions[i].scoregenes==undefined){
          this.relatedConditions[i].scoregenes = 0;
        }

        scoreHealth29 = (this.relatedConditions[i].score*(1/3))+(this.relatedConditions[i].scoregenes*(2/3));
        if(this.relatedConditions[i].h29 == undefined){
          this.relatedConditions[i].h29 = parseInt(scoreHealth29.toFixed(0));
        }
        this.relatedConditions[i].color = this.getColor(this.relatedConditions[i].h29);
      }


      /*const rows = [...this.relatedConditions];
      const sort = { dir: "desc", prop: "h29" };
      rows.sort((a, b) => {
        return a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1);
      });*/
      const rows = [...this.relatedConditions];
      rows.sort(this.sortService.GetSortOrderNumberPriority('h29', 'scoregenes', 'score'));

      this.relatedConditions = rows;

      var listOfDiseases = [];
      for(var i = 0; i < this.relatedConditions.length; i++) {
        if(this.relatedConditions[i]!=undefined){
          listOfDiseases.push(this.relatedConditions[i].name.id);
        }
      }
      //deleteDuplicatedConditions
      this.subscription.add(this.apif29BioService.getInfoOfDiseases(this.listOfDiseases)
      .subscribe( (res1 : any) => {
        var copyrelatedConditionsIni = [];
        for(var i = 0; i < this.relatedConditions.length; i++) {
          var valtemp = this.relatedConditions[i].name.id;
          if(res1[valtemp]!=undefined){
            this.relatedConditions[i].name.id = res1[valtemp].id;
            var foundElement = this.searchService.search2Levels(copyrelatedConditionsIni,'name','id', this.relatedConditions[i].name.id);
            if(!foundElement){
              copyrelatedConditionsIni.push(this.relatedConditions[i]);
            }else{
              //console.log('Found: '+ this.relatedConditions[i].name.id);
            }
          }
        }

        this.relatedConditions = copyrelatedConditionsIni;
        this.finishcalcularScoreHealth29();
      }, (err) => {
        console.log(err);
        this.finishcalcularScoreHealth29();
      }));


    }

    finishcalcularScoreHealth29(){
      var copyrelatedConditions = [];
      for(var i = 0; i < this.relatedConditions.length && i<100; i++) {
        copyrelatedConditions.push(this.relatedConditions[i]);
      }
      this.relatedConditions = copyrelatedConditions;
      this.calculatingH29Score = false;
      if(this.actualStep<'5.0'){
        if(this.maxStep<'5.0'){
          this.goToStep('5.0', true);
        }else{
          this.goToStep('5.0', false);
        }
      }
      this.indexListRelatedConditions = 10;
      this.renderMap();
      this.saveNotes(false);
      this.applyFilters();
      this.onchangeparamgraph();
    }


    checkChange(){
      this.checksChanged = true;
    }

    lastIndexOfRegex (info, regex){
      var match = info.match(regex);
      return match ? info.lastIndexOf(match[match.length-1]) : -1;
    }


    onSubmitToExtractor(contentExtractorSteps){
      this.loadingHpoExtractor = true;
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
      };
      this.modalReference = this.modalService.open(contentExtractorSteps, ngbModalOptions);
      /*this.documentIntoSentences = false;
      this.translatingDocument = false;
      this.extractingSymptoms =false;*/
      this.substepExtract = '1';
      var lang = this.authService.getLang();
      if(this.langToExtract!=''){
        lang = this.langToExtract;
      }
      var jsontestLangText = { "text": this.medicalText };
      this.subscription.add(this.apif29BioService.getSegmentation(lang,jsontestLangText)
      .subscribe( (res : any) => {
        this.resultSegmentation = res;
        this.prepareCallNCR();

     }, (err) => {
       console.log(err);
       //tratar el error
       this.goToStep('2.0', true);
     }));
    }

    prepareCallNCR(){
      if(this.langToExtract!='en'){
        this.substepExtract = '2';
        this.subscription.add(this.apif29BioService.getTranslationDictionary('en',this.resultSegmentation)
        .subscribe( (res : any) => {
          this.resultSegmentation = res;
          this.callNCR();
       }, (err) => {
         console.log(err);
         this.goToStep('2.0', true);
       }));
      }else{
        this.callNCR();
      }
    }

    continueToGenes(){
      this.hasSymptomsToSave();
    }

    backToSymtoms(){
      document.getElementById("idShowPanelSymptoms").click();
    }

    showPanelAddTextSymptoms(contentAddTextSymptoms){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-lg'// xl, lg, sm
      };
      this.modalReference = this.modalService.open(contentAddTextSymptoms, ngbModalOptions);
    }

    showPanelFeedback(contentFeedback){
      this.modalReference = this.modalService.open(contentFeedback);
    }

    showPanelCalculationsDetails(contentFeedback){
      this.tempVcfBlobName = this.settingExomizer.VcfBlobName.substr(this.settingExomizer.VcfBlobName.lastIndexOf('/'));
      this.tempVcfBlobName = this.tempVcfBlobName.split(("/"))[1];
      if(!this.isgen || this.tempVcfBlobName == undefined){
        this.tempVcfBlobName = ''
      }
      this.modalReference = this.modalService.open(contentFeedback);
    }

    addSymptomsOption1(){
      for(var hpo in this.selectedItems){
        this.addSymptom(this.selectedItems[hpo], 'manual');
      }
      this.selectedItems = [];
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      this.hasSymptomsToSave();

    }

    addSymptomsOption2(){
      for(var hpo in this.selectedItems){
        this.addSymptom(this.selectedItems[hpo], 'manual');
      }
      this.selectedItems = [];
      //this.hasSymptomsToSave();

    }

    addSymptom(symptom, inputType){
      var foundElement = this.searchService.search(this.phenotype.data,'id', symptom.id);
      if(!foundElement){
        this.phenotype.data.push({id: symptom.id,name: symptom.name, new: true, checked: true, percentile:-1, inputType: inputType, importance: '1', polarity: '0', synonyms: symptom.synonyms});
        this.numberOfSymptoms++;
        //this.toastr.success(this.translate.instant("generics.Name")+': '+symptom.name, this.translate.instant("phenotype.Symptom added"));
      }else{
        //this.toastr.warning(this.translate.instant("generics.Name")+': '+symptom.name, this.translate.instant("phenotype.You already had the symptom"));
      }
    }

    deleteSymptom(symptom, index2, disease){
      var index = -1;
      var found = false;
      for(var i=0;i<this.phenotype.data.length;i++)
        {
          if(symptom.id==this.phenotype.data[i].id){
            index= i;
            found = true;
            this.confirmDeletePhenotype2(index, index2, disease);
          }
        }
    }

    hasSymptomsToSave(){
      if(this.phenotype.data.length>0){
        this.saveSymptomsToDb();
      }else{
        this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
      }

    }

    saveSymptomsToDb() {
      this.loadingGeno = false;
      if(this.authGuard.testtoken()){
        this.sending = true;

        var phenotoSave = JSON.parse(JSON.stringify(this.phenotype));
        phenotoSave.data = [];
        for (var i = 0; i <  this.phenotype.data.length; i++) {
          if(this.phenotype.data[i].checked){
            if(this.phenotype.data[i].inputType == undefined){
              phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name, inputType: 'unknown', importance: '1', polarity: '0'});
            }else{
              phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name, inputType: this.phenotype.data[i].inputType, importance: '1', polarity: '0'});
            }
          }
        }
        this.phenotype = JSON.parse(JSON.stringify(phenotoSave));
        this.checksChanged = false;
        this.phenotype.date = Date.now();
        if(this.phenotype._id==null){
          this.subscription.add( this.http.post(environment.api+'/api/phenotypes/'+this.authService.getCurrentPatient().sub, this.phenotype)
          .subscribe( (res : any) => {
            this.sending = false;
            //this.toastr.success('', this.msgDataSavedOk);
            this.loadSymptoms();
            if(!this.isNew){
              this.loadFilesContainer(true);
            }

           }, (err) => {
             console.log(err);
             this.sending = false;
             if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
               this.authGuard.testtoken();
             }else{
               this.toastr.error('', this.msgDataSavedFail);
             }
           }));
        }else{
          this.subscription.add( this.http.put(environment.api+'/api/phenotypes/'+this.phenotype._id, this.phenotype)
          .subscribe( (res : any) => {
            //this.toastr.success('', this.msgDataSavedOk);
            this.sending = false;
            this.loadSymptoms();
            if(!this.isNew){
              this.loadFilesContainer(true);
            }

           }, (err) => {
             console.log(err.error);
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

    onSubmit() {
      if(this.authGuard.testtoken()){
        this.sending = true;
        //remove the new property
        var phenotoSave = JSON.parse(JSON.stringify(this.phenotype));
        phenotoSave.data = [];
        for (var i = 0; i <  this.phenotype.data.length; i++) {
          if(this.phenotype.data[i].checked){
            if(this.phenotype.data[i].inputType == undefined){
              phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name, inputType: 'unknown', importance: '1', polarity: '0'});
            }else{
              phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name, inputType: this.phenotype.data[i].inputType, importance: '1', polarity: '0'});
            }
          }
        }
        this.phenotype = JSON.parse(JSON.stringify(phenotoSave));
        this.checksChanged = false;
        this.phenotype.date = Date.now();
        if(this.phenotype._id==null){

          this.subscription.add( this.http.post(environment.api+'/api/phenotypes/'+this.authService.getCurrentPatient().sub, this.phenotype)
          .subscribe( (res : any) => {
            //this.idPhenotype = res.phenotype._id;
            this.phenotype = {};
            this.phenotype = res.phenotype;
            this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
            this.numberOfSymptoms = this.phenotype.data.length;
            //this.loadData();
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
        }else{
          this.subscription.add( this.http.put(environment.api+'/api/phenotypes/'+this.phenotype._id, this.phenotype)
          .subscribe( (res : any) => {
            //this.idPhenotype = res.phenotype._id;
            this.phenotype = res.phenotype;
            this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
            this.numberOfSymptoms = this.phenotype.data.length;
            //this.loadData();
            this.sending = false;
            this.toastr.success('', this.msgDataSavedOk);
           }, (err) => {
             console.log(err.error);
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

    confirmDeletePhenotypeGroup(index1, index2){
      var indexElement = this.searchService.searchIndex(this.phenotype.data,'id', this.listOfSymptomGroups[index1].symptoms[index2].id);
      this.confirmDeletePhenotype(indexElement);
    }

    confirmDeletePhenotype(index){
      Swal.fire({
          title: this.translate.instant("generics.Are you sure delete")+" "+this.phenotype.data[index].name+" ?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("generics.Accept"),
          cancelButtonText: this.translate.instant("generics.Cancel"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false,
          reverseButtons:true
      }).then((result) => {
        if (result.value) {
          this.phenotype.data.splice(index, 1);
          this.isDeletingPhenotype=true;
          this.saveSymptomsToDb();
        }
      });

    }

    confirmDeletePhenotype2(index, index2, disease){
      Swal.fire({
          title: this.translate.instant("generics.Are you sure delete")+" "+this.phenotype.data[index].name+" ?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("generics.Accept"),
          cancelButtonText: this.translate.instant("generics.Cancel"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false,
          reverseButtons:true
      }).then((result) => {
        if (result.value) {
          this.phenotype.data.splice(index, 1);
          this.isDeletingPhenotype=true;
          this.saveSymptomsToDb();
          this.selectedDisease = -1;
          this.showMoreInfoDisease(index2, disease);
        }
      });

    }

    deleteAllSymtoms(){
      Swal.fire({
          title: this.translate.instant("generics.Are you sure delete"),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("phenotype.Delete all symptoms"),
          cancelButtonText: this.translate.instant("generics.No"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false,
          reverseButtons:true
      }).then((result) => {
        if (result.value) {
          this.phenotype.data = [];
          this.onSubmit();
        }
      });
    }

    selectScoreColor(element){
      var backgroundColor=this.getColor(element*100)
      var fontColor="black"
      if(this.isTooDark(backgroundColor)){
        fontColor="white";
      }
      var color=[backgroundColor,fontColor];
      return color;
    }

    variantEffectInfo(element){
      var color=["white","black"];
      var colorSelected="white";
      var nameForShow=element;
      var priority="Moderate"
      Object.keys(this.variantTypes).forEach(key => {
        if(element==key){
          colorSelected=this.variantTypes[key].color;
          nameForShow=this.variantTypes[key].name;
          priority=this.variantTypes[key].impact

        }
      });
      var fontColor="black"
      switch(priority){
        case "High":
          fontColor="white";
          break;
        case "Moderate":
          fontColor="white";
          break;
        case "Low":
          fontColor="white";
          break;
        case "Modifier":
          fontColor="white";
          break;
      }
      color=[colorSelected,fontColor]
      return {name:nameForShow,color:color}
    }
    clinVarInfo(element){
      var color=["white","black"]
      var selectedColor="white"
      var nameForShow=element;
      var fontColor="black"
      Object.keys(this.clinVarTypes).forEach(key => {
        if(element.toLowerCase()==key){
          selectedColor=this.clinVarTypes[key].color;
          nameForShow=this.clinVarTypes[key].name;
          if(selectedColor!="#A8ACB1" && selectedColor!="white"){
            fontColor="white";
          }
        }
      });
      color=[selectedColor,fontColor]
      return {name:nameForShow,color:color}
    }

    inheritanceInfo(element){
      var nameForShow=element;
      Object.keys(this.inheritanceTypes).forEach(key => {
        if(element==key){
          nameForShow=this.inheritanceTypes[key].name;

        }
      });
      return {name:nameForShow}
    }

    frequencyInfo(element){
      var listFreqData=[];
      if(element.length>0){
        for(var i=0;i<element.length;i++){
          Object.keys(this.frequencyTypes).forEach(key => {
            if(element[i].source==key){
              if(element[i].frequency<0.01){
                element[i].frequency="< 0.01"
              }
              else{
                element[i].frequency=element[i].frequency.toFixed(2)
              }
              listFreqData.push({source:this.frequencyTypes[key].name,frequency:element[i].frequency})
            }
          });
        }
      }
      return listFreqData;
    }

    frequencyLinks(element){
      var listLinks=[];
      if(element.length>0){
        for(var i=0;i<element.length;i++){
          Object.keys(this.frequencyTypes).forEach(key => {
            if(element[i].source==key){
              if(this.frequencyTypes[key].category!=undefined){
                var yetAdded=false;
                for(var j=0;j<listLinks.length;j++){
                  if(this.frequencyTypes[key].category==listLinks[j].name){
                    yetAdded=true;
                  }
                }
                if(yetAdded==false){
                  listLinks.push({name:this.frequencyTypes[key].category,link:this.frequencyTypes[key].link})
                }
              }
              else{
                listLinks.push({name:this.frequencyTypes[key].name,link:this.frequencyTypes[key].link})
              }
            }
          });
        }
      }
      return listLinks;
    }

    otherInfoWhiteListed(element){
      var nameForShow=element;
      Object.keys(this.otherAnnotationsTypes).forEach(key => {
        if("whitelist_variant"==key){
          nameForShow=this.otherAnnotationsTypes[key].name;
        }
      });
      var result={value:element,name:nameForShow}
      return result;
    }

    completeInfoForGen(res){
      var infoForGen=[]
      for(var j=0;j<res.geneScores.length;j++){
        var contributingVariants=false;
        if(res.geneScores[j].contributingVariants.length>0){
          contributingVariants=true;
          var colorScoreCombinedScore=this.selectScoreColor(res.geneScores[j].combinedScore)
          var colorScorePriorityScore=this.selectScoreColor(res.geneScores[j].phenotypeScore)
          var colorScoreVariantScore=this.selectScoreColor(res.geneScores[j].variantScore)
          for(var w=0; w<res.geneScores[j].contributingVariants.length;w++){
            var variantEffectInfo = this.variantEffectInfo(res.geneScores[j].contributingVariants[w].variantEffect)
            var clinVarInfo= this.clinVarInfo(res.geneScores[j].contributingVariants[w].pathogenicityData.clinVarData.primaryInterpretation)
            var chromosomeInfo={chromosome:"chr"+res.geneScores[j].contributingVariants[w].chromosome,position:res.geneScores[j].contributingVariants[w].position,assembly:res.geneScores[j].contributingVariants[w].genomeAssembly}
            var transCriptAnnotationsLength=(res.geneScores[j].contributingVariants[w].transcriptAnnotations.length);
            var mutationInfomasterMind=[];
            if(transCriptAnnotationsLength>0){
              var transCriptAnnotationsProtein="";
              for(var k=0;k<res.geneScores[j].contributingVariants[w].transcriptAnnotations.length;k++){
                transCriptAnnotationsProtein="";
                if((res.geneScores[j].contributingVariants[w].transcriptAnnotations[k].hgvsProtein!=undefined)&&(res.geneScores[j].contributingVariants[w].transcriptAnnotations[k].hgvsProtein!="")){
                  if((res.geneScores[j].contributingVariants[w].transcriptAnnotations[k].hgvsProtein.indexOf("p.(=)")==-1)
                  &&(res.geneScores[j].contributingVariants[w].transcriptAnnotations[k].hgvsProtein.indexOf("p.?")==-1)){
                    transCriptAnnotationsProtein=(res.geneScores[j].contributingVariants[w].transcriptAnnotations[k].hgvsProtein);
                    var transCriptAnnotationsProteinmodified1=transCriptAnnotationsProtein.split("p.(")
                    if(transCriptAnnotationsProteinmodified1[1]!=undefined){
                      var transCriptAnnotationsProteinmodified2=transCriptAnnotationsProteinmodified1[1].split(")")
                      var transCriptAnnotationsProteinmodified3=transCriptAnnotationsProteinmodified2[0]
                      // traduzco los aminoacidos
                      for(var l=0;l<this.aminoAcid.length;l++){
                        if(transCriptAnnotationsProteinmodified3.indexOf(this.aminoAcid[l].code)>-1){
                          transCriptAnnotationsProteinmodified3=transCriptAnnotationsProteinmodified3.replace(this.aminoAcid[l].code,this.aminoAcid[l].term)
                        }
                      }
                      mutationInfomasterMind.push(transCriptAnnotationsProteinmodified3);
                    }
                  }
                }
              }
            }
            // Delete duplicates
            var mySet = new Set(mutationInfomasterMind);
            mutationInfomasterMind = [...mySet];
            // Order
            mutationInfomasterMind.sort((a, b) => a !== b ? a < b ? -1 : 1 : 0);
            var predictedPathogenicityScores=[];
            for(var k=0;k<res.geneScores[j].contributingVariants[w].pathogenicityData.predictedPathogenicityScores.length;k++){
              predictedPathogenicityScores.push({
                source:res.geneScores[j].contributingVariants[w].pathogenicityData.predictedPathogenicityScores[k].source,
                score:res.geneScores[j].contributingVariants[w].pathogenicityData.predictedPathogenicityScores[k].score,
              })
            }
            var variantEffect=({color:variantEffectInfo.color,value:variantEffectInfo.name})
            var mutation= ({ref:res.geneScores[j].contributingVariants[w].ref,alt:res.geneScores[j].contributingVariants[0].alt,position:res.geneScores[j].contributingVariants[0].chromosome+":"+res.geneScores[j].contributingVariants[0].position,url1:"rs"+res.geneScores[j].contributingVariants[0].frequencyData.rsId.id,mutationInfomasterMind:mutationInfomasterMind})
            var clinVarData=({data:res.geneScores[j].contributingVariants[w].pathogenicityData.clinVarData,name: clinVarInfo.name,colorPrimary:clinVarInfo.color})
            var predictedPathogenicityScoresList=(predictedPathogenicityScores)
            //var whiteListed=(res.geneScores[j].contributingVariants[w].whiteListed)
            var whiteListed=this.otherInfoWhiteListed(res.geneScores[j].contributingVariants[w].whiteListed)
            var modeOfInheritance=this.inheritanceInfo(res.geneScores[j].modeOfInheritance).name;
            var frequencyInfo = this.frequencyInfo(res.geneScores[j].contributingVariants[w].frequencyData.knownFrequencies)
            var frequencyLinks = this.frequencyLinks(res.geneScores[j].contributingVariants[w].frequencyData.knownFrequencies)
            infoForGen.push({
              modeOfInheritance:modeOfInheritance,
              synonyms:{hgncId:res.geneScores[j].geneIdentifier.hgncId,entrezId:res.geneScores[j].geneIdentifier.entrezId,ensemblId:res.geneScores[j].geneIdentifier.ensemblId,ucscId:res.geneScores[j].geneIdentifier.ucscId},
              variantEffect:variantEffect,// List
              whiteListed:whiteListed,// List
              mutation:mutation,// List
              frequencyData:frequencyInfo,
              clinVarData:clinVarData,// List
              scores:{combinedScore:{value:res.geneScores[j].combinedScore.toFixed(2),color:colorScoreCombinedScore},
                priorityScore:{value:res.geneScores[j].phenotypeScore.toFixed(2),color:colorScorePriorityScore},
                variantScore:{value:res.geneScores[j].variantScore.toFixed(2),color:colorScoreVariantScore}},
              contributingVariants:contributingVariants,
              predictedPathogenicityScores:predictedPathogenicityScoresList,// List
              moreInfoSelected:false,
              frequencyLinks:frequencyLinks,
              chromosomeInfo:chromosomeInfo
            })
          }
        }
      }
      return infoForGen;
    }

    showMoreInfo(element){
      element.moreInfoSelected=!element.moreInfoSelected;
    }

    loadFromBlob(){
      this.moreInfoElement={};
      this.geneElementName="";
      this.loadingTable=true
      this.resulExoEmpty = 'null'
      this.loadHtmlExo();
      this.subscription.add( this.http.get(this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+this.filesOnBlob[0].name+this.accessToken.sasToken)
        .subscribe( (res : any) => {
          if(res.length==0){
            this.resulExoEmpty = 'empty'
            var url = this.accessToken.containerName+'/'+this.filesOnBlob[0].name
            var patientInfo = this.authService.getCurrentPatient();
            var dateNow = new Date();
            var stringDateNow = this.dateService.transformDate(dateNow);
            var params = {subject:'Exomiser empty results', data:{date: stringDateNow, url:url, email: this.myEmail, patientInfo: {patientName:patientInfo.patientName}}}
            this.sendEmailToDev(params);
          }else{
            this.resulExoEmpty = 'hasinfo'
          }
          this.infoGenesAndConditions = [];
          this.infoGenesAndConditionsExomizer = [];
          this.sizeOfDiseases = 0;
          for (var i = 0; i < 100; i++) {
            var dataForGene = [];
            var info=[];
            if(res[i]!=undefined){
              // Coger la info de geneScores y rellenar una lista para cada gen con la info:
              var infoForGen=[];
              var infoForGen=this.completeInfoForGen(res[i])
              info.push(infoForGen)
              /**/
              // Summary info

              var clinVarDataTotal=null;
              var whiteListed={value:false,name:""};
              var scoreSummary=res[i].combinedScore.toFixed(2);
              for(var j=0;j<res[i].geneScores.length;j++){
                for(var w=0; w<res[i].geneScores[j].contributingVariants.length;w++){
                  if(res[i].geneScores[j].contributingVariants[w].whiteListed){
                    whiteListed = this.otherInfoWhiteListed(res[i].geneScores[j].contributingVariants[w].whiteListed)
                    if(res[i].geneScores[j].combinedScore.toFixed(2)>scoreSummary){
                      scoreSummary=res[i].geneScores[j].combinedScore.toFixed(2);
                    }
                    var clinVarInfoTotal= this.clinVarInfo(res[i].geneScores[j].contributingVariants[w].pathogenicityData.clinVarData.primaryInterpretation)
                    clinVarDataTotal=({data:res[i].geneScores[j].contributingVariants[w].pathogenicityData.clinVarData,name: clinVarInfoTotal.name,colorPrimary:clinVarInfoTotal.color})
                  }
                }
              }
              if(whiteListed.value==false){
                for(var j=0;j<res[i].geneScores.length;j++){
                  if(res[i].combinedScore==res[i].geneScores[j].combinedScore){
                    for(var w=0; w<res[i].geneScores[j].contributingVariants.length;w++){
                      if(res[i].geneScores[j].contributingVariants[w].pathogenicityData.clinVarData.alleleId!=""){
                        var clinVarInfoTotal= this.clinVarInfo(res[i].geneScores[j].contributingVariants[w].pathogenicityData.clinVarData.primaryInterpretation)
                        clinVarDataTotal=({data:res[i].geneScores[j].contributingVariants[w].pathogenicityData.clinVarData,name: clinVarInfoTotal.name,colorPrimary:clinVarInfoTotal.color})
                      }
                    }
                  }
                }
              }

              var colorScoredx29=this.selectScoreColor(scoreSummary)
              // data
              for (var j = 0; j < res[i].priorityResults.OMIM_PRIORITY.associatedDiseases.length ; j++) {
                var codeomimorpha = res[i].priorityResults.OMIM_PRIORITY.associatedDiseases[j].diseaseId;
                var isOmim = false;
                var tempinfo = [];
                 if(codeomimorpha.indexOf('OMIM')!=-1){
                   tempinfo = this.searchFilterPipe.transform(this.orphaOmim, 'OMIM', codeomimorpha);
                   isOmim = true;
                 }else{
                   tempinfo = this.searchFilterPipe.transform(this.orphaOmim, 'ORPHA', codeomimorpha);
                 }
                 codeomimorpha = codeomimorpha.replace("ORPHA", "Orphanet");
                 if(tempinfo.length == 0 ){
                   if(isOmim){
                     dataForGene.push({"condition": res[i].priorityResults.OMIM_PRIORITY.associatedDiseases[j].diseaseName, "idOrphanet": null, "idOMIM": codeomimorpha, "value": false});
                   }else{
                     dataForGene.push({"condition": res[i].priorityResults.OMIM_PRIORITY.associatedDiseases[j].diseaseName, "idOrphanet": codeomimorpha, "idOMIM": null, "value": false});
                   }
                 }else{
                   tempinfo[0].ORPHA = (tempinfo[0].ORPHA).replace("ORPHA", "Orphanet");
                   dataForGene.push({"condition": res[i].priorityResults.OMIM_PRIORITY.associatedDiseases[j].diseaseName, "idOrphanet": tempinfo[0].ORPHA, "idOMIM": tempinfo[0].OMIM, "value": false});
                 }

                 this.sizeOfDiseases++;
              }
              this.infoGenesAndConditions.push({"name": res[i].geneSymbol, "data": dataForGene, "score": res[i].variantScore, "scoredx29": res[i].combinedScore,summary:{colorScoredx29:colorScoredx29,scoreSummary:scoreSummary,whiteListed:whiteListed,clinVarDataTotal:clinVarDataTotal},info:info});
              this.infoGenesAndConditionsExomizer.push({"name": res[i].geneSymbol, "data": dataForGene, "score": res[i].variantScore, "scoredx29": res[i].combinedScore,summary:{colorScoredx29:colorScoredx29,scoreSummary:scoreSummary,whiteListed:whiteListed,clinVarDataTotal:clinVarDataTotal},info:info});
            }

          }
          this.loadingTable=false;

          if(this.actualStep == '3.1' || this.gettingRelatedConditions){
            this.getRelatedConditionsview(true);
            //this.getRelatedConditions();
          }
          if(document.getElementById("idShowPanelWorkbench")!=null){
            //document.getElementById("idShowPanelWorkbench").click();
            this.checkServices();
            this.checkPrograms();
          }else{
            //document.getElementById("buttonChangeTab").click();
          }
          this.uploadingGenotype = false;


          if(this.newVcf){
            this.newVcf = false;
          }else{
            if(this.diagnosisInfo.infoGenesAndConditionsExomizer.length == 0){
            }
            this.numberOfSymptoms = this.phenotype.data.length;
            this.actualPosDisease = 0;
            this.globalPosDisease = 1;
            this.actualDisease = {};
            this.unknownSymptoms = [];
            this.symptomsLoaded = [];
          }
          //this.checkExomiser();


         }, (err) => {
           console.log(err);
         }));
    }

    callExomizerSameVcf(){
      this.gettingRelatedConditions = true;
      // Check if there are any symptoms
      // If not: swal and not launch exomiser
      var tempSymptomsExo = [];
      for(var i=0;i<this.symptomsExomiser.length;i++){
        if(this.symptomsExomiser[i].checked){
          tempSymptomsExo.push(this.symptomsExomiser[i]);
        }
      }
      if(tempSymptomsExo.length==0){
        Swal.fire({ title: this.translate.instant("analysissection.nosymptoms"), text:  this.translate.instant("analysissection.needsymtoms"), confirmButtonText: this.translate.instant("generics.Accept"),icon:"warning" })
      }
      // If yes: launch exomiser
      else{
        this.uploadingGenotype = true;
        this.getExomiserSettings(tempSymptomsExo);
        if(this.settingExomizer.VariantEffectFilters!=undefined){
          if(this.settingExomizer.VariantEffectFilters.remove!=undefined){
            if(this.settingExomizer.VariantEffectFilters.remove.length==0){
              delete this.settingExomizer.VariantEffectFilters;
            }
          }
        }
        //this.settingExomizer.genomeAssembly='hg38';
        this.settingExomizer.IsGenome=false;
        var indexSearch = this.settingExomizer.VariantEffectFilters.remove.indexOf('SPLICE_REGION_VARIANT');
        if(indexSearch!=-1){
          this.settingExomizer.VariantEffectFilters.remove.splice(indexSearch, 1);
        }
        this.subscription.add(this.exomiserService.analyzeExomiser(this.settingExomizer)
        .subscribe( (res : any) => {
          this.subscription.add( this.apiDx29ServerService.setPendingJobs(this.accessToken.patientId,this.exomiserService.getActualToken())
          .subscribe( (res : any) => {
            //this.getExomizer(this.accessToken.patientId);
            this.checkExomiser()
            var exoservice = {patientId: this.accessToken.patientId, token: this.exomiserService.getActualToken(), patientName: this.selectedPatient.patientName}
            this.eventsService.broadcast('exoservice', exoservice);
            //alert("Create pending job with token:"+this.exomiserService.getActualToken)

          }, (err) => {
            console.log(err);
            this.uploadingGenotype = false;
            this.toastr.error('', this.translate.instant("generics.error try again"));
          }));

        }, (err) => {
          console.log(err);
          this.manageErrorsExomiser("type1",err);
        }));
      }
    }

    getExomizer(patientId){
      this.subscription.add(this.exomiserService.getExomiserResults()
      .subscribe( (res2 : any) => {

        this.subscription.add( this.apiDx29ServerService.deletePendingJob(this.accessToken.patientId,this.exomiserService.getActualToken(),"exomiser")
        .subscribe( (res : any) => {
          this.uploadingGenotype = false;
          //this.loadFromBlob();
        }, (err) => {
          this.toastr.error('', this.translate.instant("generics.error try again"));
          console.log(err);
        }));

        if(res2.files.length>0){
          if(this.activeTittleMenu == 'Genes'){
            this.filename = '';
          }
          this.newVcf = true;
          var files =res2.path.split("/")
          this.accessToken.containerName = files[0];
          var path=files[1]+"/"+files[2];
          this.accessToken.patientId = this.authService.getCurrentPatient().sub;
          this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,path);
          //alert("Go to delete Pending Job")
        }
        else{
          this.filename = '';
          this.uploadingGenotype = false;
        }

        this.loading = false;
      }, (err) => {
        console.log(err);
        this.manageErrorsExomiser("type1",err);
        this.loading = false;
      }));
    }

    onFileChangeVCF(event, step)  {
      this.preparingFile = true;
      if (event.target.files && event.target.files[0]) {

        var reader = new FileReader();
        //reader.readAsDataURL(event.target.files[0]); // read file as data url
        reader.onload = (event2:any) => { // called once readAsDataURL is completed
          this.preparingFile = false;
          //this.filename = event.target.files[0].name;
          var filename = event.target.files[0].name;
          var extension = filename.substr(filename.lastIndexOf('.'));
          var pos = (filename).lastIndexOf('.')
          pos=pos-4;
          if(pos>0 && extension == '.gz'){
            extension = (filename).substr(pos);
          }
          filename = filename.split(extension)[0];
          filename = filename + extension;
          if(extension=='.vcf' || extension=='.vcf.gz'){
            this.filename = '';
            this.uploadingGenotype = true;
            this.uploadingVCF = true;
            if(step = 'step1'){
              this.uploadProgress = this.blob
                .uploadToBlobStorage(this.accessToken, event.target.files[0], filename, 'vcfonly');
            }else{
              this.uploadProgress = this.blob
                .uploadToBlobStorage(this.accessToken, event.target.files[0], filename, 'vcf');
            }
            //this.filename=filename;
            this.blob.loadFilesVCF(this.accessToken.containerName);
          }else{
            Swal.fire(this.translate.instant("diagnosis.The VCF file must have"), '', "error");
          }


        }
        reader.readAsArrayBuffer(event.target.files[0]);

      }
    }

    cancelExomiser(place){
      Swal.fire({
          title: this.translate.instant("generics.Are you sure?"),
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
          this.uploadingGenotype = false;
          if(place=='wizard'){
            this.filename = '';
          }
          this.cancelSubscription();

          //preguntar si quiere eliminar el file
          Swal.fire({
              title: this.translate.instant("diagnosis.Do you want to delete the VCF file"),
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
              if(place=='workbench'){
                this.filename = '';
              }
              this.blob.deleteBlob(this.accessToken.containerName , this.filename);
              this.blob.loadFilesOnNewBlobExomizerSetting(this.accessToken.containerName);
            }
          });
          /*this.getDiagnosisInfo();
          this.loadFromBlob();*/
        }
      });

    }

    cancelSubscription(){
      var patientId = this.authService.getCurrentPatient().sub;
        this.subscription.add( this.http.get(environment.api+'/api/exomizerservices/cancel/'+patientId)
        .subscribe( (res2 : any) => {
          this.loadFromBlob();
         }, (err) => {
           console.log(err);
         }));
    }

    continueDiagnosis(){
      this.loadFromBlob();
    }

    closeAndShowMsg(){
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
       this.toastr.error('', this.translate.instant("generics.error try again"));
    }

    goTo(url){
      document.getElementById(url).scrollIntoView(true);
    }

    getSymptomsOfDisease(){
      for(var i = 0; i < this.infoGenesAndConditions.length; i++)
        {
          if(this.infoGenesAndConditions[i].symptoms.length>0)
            {
              for(var j = 0; j < this.infoGenesAndConditions[i].symptoms.length; j++)
                {
                  var enc = false;
                  for (var k = 0; k < this.phenotype.data.length; k++) {
                      if(this.phenotype.data[k].id == this.infoGenesAndConditions[i].symptoms[j].id){
                        this.infoGenesAndConditions[i].symptoms[j].checked = true;
                        enc = true;
                      }
                  }
                  if(!enc){
                    this.infoGenesAndConditions[i].symptoms[j].checked = false;
                  }

                }
                this.infoGenesAndConditions[i].symptoms.sort(this.sortService.GetSortOrderInverse("checked"));
            }
        }

      if(this.infoGenesAndConditions[this.actualPosDisease].symptoms==0) {
        this.getNextDisease();
      }else{
        this.actualDisease = this.infoGenesAndConditions[this.actualPosDisease];
      }

    }

    getNextDisease(){
      this.goTo('idHeader');
      if(this.actualPosDisease<(this.infoGenesAndConditions.length)-1){
        this.actualPosDisease++;
      }
      this.actualDisease = this.infoGenesAndConditions[this.actualPosDisease];
      if (this.actualDisease.symptoms>0){
        this.actualDisease.symptoms.sort(this.sortService.GetSortOrder("name"));
        this.actualDisease.symptoms.sort(this.sortService.GetSortOrderInverse("checked"));
      }

      if (this.actualDisease.symptoms==0 && this.actualPosDisease<(this.infoGenesAndConditions.length)-1) {
        this.getNextDisease();
      }
    }

    getPreviousDisease(){
      this.goTo('idHeader');
      if(this.actualPosDisease>0){
        this.actualPosDisease--;
      }
      this.actualDisease = this.infoGenesAndConditions[this.actualPosDisease];
      if (this.actualDisease.symptoms>0){
        this.actualDisease.symptoms.sort(this.sortService.GetSortOrder("name"));
        this.actualDisease.symptoms.sort(this.sortService.GetSortOrderInverse("checked"));
      }
      if (this.actualDisease.symptoms==0 && this.actualPosDisease>0) {
        this.getPreviousDisease();
      }
    }

    changeSymptomTrue(index){
      this.actualDisease.symptoms[index].checked = true;
      this.numberOfSymptoms++;
      this.actualDisease.symptoms.sort(this.sortService.GetSortOrder("name"));
      this.actualDisease.symptoms.sort(this.sortService.GetSortOrderInverse("checked"));
    }

    changeSymptomFalse(index){
      this.actualDisease.symptoms[index].checked = false;
      this.numberOfSymptoms--;
      this.actualDisease.symptoms.sort(this.sortService.GetSortOrder("name"));
      this.actualDisease.symptoms.sort(this.sortService.GetSortOrderInverse("checked"));
    }

    changeSymptomUnknownToFalse(index){
      this.actualDisease.symptoms[index].checked =false;

    }

    changeSymptomUnknown(index){
      if(this.actualDisease.symptoms[index].checked == true){
        this.numberOfSymptoms--;
      }
      this.actualDisease.symptoms[index].checked = 'unknown';
    }

    addSymptomToPhenotype(symptom, index){
      var foundElement = this.searchService.search(this.phenotype.data,'id', symptom.id);
      if(!foundElement){
        this.phenotype.data.push({id: symptom.id,name: symptom.name, new: true, checked: true, percentile:symptom.percentile, def: symptom.def, comment: symptom.comment, inputType: symptom.inputType, importance: symptom.importance, polarity: symptom.polarity, synonyms: symptom.synonyms});
        this.checksChanged = true;
      }

      var datadetcopy = [];
      delete this.unknownSymptoms[index];
      for (var i = 0; i < this.unknownSymptoms.length; i++) {
        if(this.unknownSymptoms[i]!=undefined){
          datadetcopy.push(this.unknownSymptoms[i]);
        }

      }
      this.unknownSymptoms = datadetcopy;
      this.phenotype.data.sort(this.sortService.GetSortOrder("name"));
    }

    resetSavedSymptoms(){
      this.phenotype = JSON.parse(JSON.stringify(this.phenotypeCopy));
      this.geneName = '';
    }

    addSymptomsManual(contentAddSymptomsManual){
      this.listOfFilteredSymptoms = [];
      this.modelTemp = '';
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl'
      };
      this.modalReference = this.modalService.open(contentAddSymptomsManual, ngbModalOptions);
    }

    getDiagnosisInfo(){
      this.loadingPotentialDiagnostics = true;
      this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
      this.accessToken.patientId = this.authService.getCurrentPatient().sub;

      this.loadingDiagnosisInfo = true;
      var para= this.authService.getCurrentPatient();
      //cargar el fenotipo del usuario
      this.subscription.add( this.http.get(environment.api+'/api/diagnosis/'+para.sub)
      .subscribe( (res : any) => {
        this.loadBlobFiles();
        this.loadingDiagnosisInfo = false;
        if(res.message){
          this.diagnosisInfo = {
            hasDiagnosis: undefined,
            previousDiagnosis: '',
            identifiedGene: '',
            evaluation: '',
            notes: '',
            infoGenesAndConditionsExomizer: [],
            infoGenesAndConditionsPhen2Genes: [],
            relatedConditions: [],
            hasVcf: false,
            selectedItemsFilter: [],
            settingExomizer: {
              "IsGenome": false,
              "VcfBlobName": '',
              "PedBlobName": null,
              "Proband": null,
              "CaseName": null,
              "NumGenes" : 0,
              "Hpos": [],
              "HiPhivePrioritisers": ["human", "mouse", "fish", "ppi"],
              "PathogenicitySources" : [ "POLYPHEN", "MUTATION_TASTER", "SIFT"] ,
              "AnalysisMode": "PASS_ONLY",
              "Frequency": 1.0,
              "KeepNonPathogenic":  true,
              "RegulatoryFeatureFilter": false,
              "MinQuality": 20.0,
              "OutputPassVariantsOnly": false,
              "OutputFormats": ["HTML", "JSON"],
              "InheritanceModes": {
                 "AUTOSOMAL_DOMINANT": 0.1,
                 "AUTOSOMAL_RECESSIVE_HOM_ALT": 0.1,
                 "AUTOSOMAL_RECESSIVE_COMP_HET": 2.0,
                 "X_DOMINANT": 0.1,
                 "X_RECESSIVE_HOM_ALT": 0.1,
                 "X_RECESSIVE_COMP_HET": 2.0,
                 "MITOCHONDRIAL": 0.2
              },
              "FrequencySources": ["THOUSAND_GENOMES", "TOPMED", "UK10K", "ESP_AFRICAN_AMERICAN", "ESP_EUROPEAN_AMERICAN", "ESP_ALL", "EXAC_AFRICAN_INC_AFRICAN_AMERICAN", "EXAC_AMERICAN", "EXAC_SOUTH_ASIAN", "EXAC_EAST_ASIAN", "EXAC_FINNISH", "EXAC_NON_FINNISH_EUROPEAN", "EXAC_OTHER", "GNOMAD_E_AFR", "GNOMAD_E_AMR", "GNOMAD_E_EAS", "GNOMAD_E_FIN", "GNOMAD_E_NFE",
              "GNOMAD_E_OTH", "GNOMAD_E_SAS", "GNOMAD_G_AFR", "GNOMAD_G_AMR", "GNOMAD_G_EAS", "GNOMAD_G_FIN", "GNOMAD_G_NFE", "GNOMAD_G_OTH", "GNOMAD_G_SAS"],
              "VariantEffectFilters": {"remove": ["UPSTREAM_GENE_VARIANT", "INTERGENIC_VARIANT", "REGULATORY_REGION_VARIANT", "CODING_TRANSCRIPT_INTRON_VARIANT", "NON_CODING_TRANSCRIPT_INTRON_VARIANT", "SYNONYMOUS_VARIANT", "DOWNSTREAM_GENE_VARIANT"]},
              "genomeAssembly": 'hg38'
            },
            _id: null
          };

          this.loadingPotentialDiagnostics = false;

        }else{
          this.diagnosisInfo = res.diagnosis
          this.infoGenesAndConditionsExomizer = this.diagnosisInfo.infoGenesAndConditionsExomizer;
          this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
          this.infoGenesAndConditionsPhen2Genes = this.diagnosisInfo.infoGenesAndConditionsPhen2Genes;
          this.relatedConditions = this.diagnosisInfo.relatedConditions;
          this.settingExomizer = this.diagnosisInfo.settingExomizer;
          this.selectedItemsFilter = this.diagnosisInfo.selectedItemsFilter;
          if(this.relatedConditions.length>0){
            this.getSymptomsApi2();
          }else{
            this.loadingPotentialDiagnostics = false;
          }
        }
        this.checkServices(); //esto habría que ponerlo en el topnavbar tb
       }, (err) => {
         console.log(err);
       }));
    }

    saveNotes(showMsg){
      if(this.authGuard.testtoken() && !this.savingDiagnosis){
        this.savingDiagnosis = true;
        for(var i = 0; i < this.relatedConditions.length; i++) {
          delete this.relatedConditions[i].symptoms;
          delete this.relatedConditions[i].xrefs;
          //delete this.relatedConditions[i].genes;
        }
        if(this.modalReference!=undefined){
          this.modalReference.close();
        }
        this.diagnosisInfo.infoGenesAndConditionsExomizer = this.infoGenesAndConditionsExomizer;
        this.diagnosisInfo.infoGenesAndConditionsPhen2Genes = this.infoGenesAndConditionsPhen2Genes;
        this.diagnosisInfo.settingExomizer = this.settingExomizer;
        this.diagnosisInfo.relatedConditions = this.relatedConditions;
        this.diagnosisInfo.hasVcf = this.hasVcf;
        this.diagnosisInfo.selectedItemsFilter = this.selectedItemsFilter;
        if(this.diagnosisInfo._id==null){
          this.subscription.add( this.http.post(environment.api+'/api/diagnosis/'+this.authService.getCurrentPatient().sub, this.diagnosisInfo)
          .subscribe( (res : any) => {
            this.diagnosisInfo = res.diagnosis;
            this.savingDiagnosis = false;
            this.getSymptomsApi2();
            if(showMsg){
              this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
            }

           }, (err) => {
             console.log(err);
             this.toastr.error('', this.translate.instant("generics.error try again"));
             this.savingDiagnosis = false;
           }));
        }else{
          this.subscription.add( this.http.put(environment.api+'/api/diagnosis/'+this.diagnosisInfo._id, this.diagnosisInfo)
          .subscribe( (res : any) => {
            this.diagnosisInfo = res.diagnosis;
            this.savingDiagnosis = false;
            this.getSymptomsApi2();
            if(showMsg){
              this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
            }
           }, (err) => {
             console.log(err.error);
             this.toastr.error('', this.translate.instant("generics.error try again"));
             this.savingDiagnosis = false;
           }));
        }
      }
    }

    updateHasVcf(){
      if(this.authGuard.testtoken() && !this.savingDiagnosis){
        this.savingDiagnosis = true;
        if(this.diagnosisInfo._id==null){
          for(var i = 0; i < this.relatedConditions.length; i++) {
            delete this.relatedConditions[i].symptoms;
            delete this.relatedConditions[i].xrefs;
          }
          this.diagnosisInfo.infoGenesAndConditionsExomizer = this.infoGenesAndConditionsExomizer;
          this.diagnosisInfo.infoGenesAndConditionsPhen2Genes = this.infoGenesAndConditionsPhen2Genes;
          this.diagnosisInfo.settingExomizer = this.settingExomizer;
          this.diagnosisInfo.relatedConditions = this.relatedConditions;
          this.diagnosisInfo.hasVcf = this.hasVcf;
          this.diagnosisInfo.selectedItemsFilter = this.selectedItemsFilter;
          this.subscription.add( this.http.post(environment.api+'/api/diagnosis/'+this.authService.getCurrentPatient().sub, this.diagnosisInfo)
          .subscribe( (res : any) => {
            this.diagnosisInfo = res.diagnosis;
            this.savingDiagnosis = false;
            this.getSymptomsApi2();
           }, (err) => {
             console.log(err);
             this.toastr.error('', this.translate.instant("generics.error try again"));
             this.savingDiagnosis = false;
           }));
        }else{
          this.subscription.add( this.http.put(environment.api+'/api/diagnosis/hasvcf/'+this.diagnosisInfo._id, this.hasVcf)
          .subscribe( (res : any) => {
            this.savingDiagnosis = false;
           }, (err) => {
             console.log(err.error);
             this.savingDiagnosis = false;
           }));
        }
      }
    }

    saveNotes2(){
      if(this.authGuard.testtoken() && !this.savingDiagnosis){
        this.savingDiagnosis = true;
        var obtToSave = [];
        for(var i = 0; i < this.selectedItemsFilter.length; i++) {
          obtToSave.push({checked: this.selectedItemsFilter[i].checked, id: this.selectedItemsFilter[i].id});
        }

        this.subscription.add( this.http.put(environment.api+'/api/diagnosis/filters/'+this.diagnosisInfo._id, obtToSave)
        .subscribe( (res : any) => {
          //this.diagnosisInfo = res.diagnosis;
          this.savingDiagnosis = false;
          //this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
         }, (err) => {
           console.log(err.error);
           this.toastr.error('', this.translate.instant("generics.error try again"));
           this.savingDiagnosis = false;
         }));
      }
    }

    addTemporalSymptom(symptom, inputType){
      var foundElement = this.searchService.search(this.temporalSymptoms,'id', symptom.id);
      if(!foundElement){
        this.temporalSymptoms.push({id: symptom.id,name: symptom.name, new: true, checked: undefined, percentile:-1, inputType: inputType, importance: '1', polarity: '0', similarity: symptom.similarity, positions: symptom.positions, text: symptom.text});
      }else{
        //buscar el sintoma, mirar si tiene mejor prababilidad, y meter la nueva aparicion en posiciones
        var enc = false;
        for(var z = 0; z < this.temporalSymptoms.length && !enc; z++) {
          if(this.temporalSymptoms[z].id==symptom.id){
            if(this.temporalSymptoms[z].similarity < symptom.similarity){
              this.temporalSymptoms[z].similarity = symptom.similarity;
            }
            this.temporalSymptoms[z].positions.push(symptom.positions[0]);
            //this.temporalSymptoms[z].text.push(symptom.text)
            enc = true;
          }
        }
      }
    }

    changeStateSymptom(index, state){
      this.temporalSymptoms[index].checked = !state;
    }

    callNCR(){
      this.temporalSymptoms = [];
      var temporal = [];
      if(this.resultSegmentation.segments){
        for(var i = 0; i < this.resultSegmentation.segments.length; i++) {
          if(this.langToExtract!='en'){
            temporal.push({text:this.resultSegmentation.segments[i].target, source:this.resultSegmentation.segments[i].source});
          }else{
            temporal.push({text:this.resultSegmentation.segments[i].source});
          }

        }
      }
      this.substepExtract = '3';
      this.subscription.add(this.apif29NcrService.getAnnotate_batch(temporal)
      .subscribe( (res : any) => {
        var docUrl= '';
        if(this.fileUploadInfo!=undefined){
          var extension = (this.fileUploadInfo).name.substr((this.fileUploadInfo).name.lastIndexOf('.'));
          var rightNow = new Date();
          var dateparse = rightNow.toISOString().slice(0,10).replace(/-/g,"");
          //docUrl = "uploadedFile-"+dateparse+extension;
          docUrl= (this.fileUploadInfo).name;
        }
        var actualDate = Date.now();
        this.infoNcrToSave = {ncrVersion:environment.ncrVersion, originalText: this.medicalText, result: res, rejectedSymptoms: [], date: actualDate, docUrl: docUrl};
        var infoNcr = res;
        if(res.message == 'Replica closed connection before replying' || res == null){
          Swal.close();
          Swal.fire(this.translate.instant("generics.Warning"), 'Replica closed connection before replying', "error");
        }else if(res.message == 'Too many requests for service ncr-gpu (overloaded)'){
          Swal.close();
          Swal.fire(this.translate.instant("generics.Warning"), 'Too many requests for service ncr-gpu (overloaded)', "error");
        }else{
          if(infoNcr.length>0){
            for(var i = 0; i < infoNcr.length; i++) {
              if(infoNcr[i].phens.length>0){
                infoNcr[i].phens.sort(this.sortService.GetSortOrderNumberInverse("characters"));
              }

              for(var j = 0; j < infoNcr[i].phens.length; j++) {
                var positions = [];
                infoNcr[i].phens[j].characters[0] = parseInt(infoNcr[i].phens[j].characters[0])
                infoNcr[i].phens[j].characters[1] = parseInt(infoNcr[i].phens[j].characters[1])
                positions.push(infoNcr[i].phens[j].characters);
                var text = [];
                if(infoNcr[i].source){
                  text = [{positions: positions[0], text: infoNcr[i].text, source: infoNcr[i].source}];
                }else{
                  text = [{positions: positions[0], text: infoNcr[i].text}];
                }

                var symptomExtractor = {id: infoNcr[i].phens[j].id,name: infoNcr[i].phens[j].concept, new: true, similarity: parseFloat(infoNcr[i].phens[j].probability), positions: positions, text: text};
                this.addTemporalSymptom(symptomExtractor, 'ncr');
              }

              //this.addSymptom(symptomExtractor, 'auto')
            }
            this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
            //this.phenotype.data.sort(this.sortService.GetSortOrder("name"));
            //this.hasSymptomsToSave();
            this.resultTextNcr = this.medicalText;
            this.resultTextNcrCopy = this.medicalText;
            this.copyResultTextNcr = this.medicalText;
            this.sortBySimilarity();

            this.medicalText ='';
            this.isNewNcrFile = true;
            //var actualDate = Date.now();
            //this.infoNcrToSave = {ncrVersion:environment.ncrVersion, originalText: '', result: {}, rejectedSymptoms: [], date: actualDate, docUrl: ''};

            //getInfo symptoms
            var hposStrins =[];
            this.temporalSymptoms.forEach(function(element) {
              hposStrins.push(element.id);
            });
            this.callGetInfoTempSymptomsJSON(hposStrins);
           Swal.close();
           this.substepExtract = '4';
            /*document.getElementById("openModalSymptomsNcrButton").click();
            this.changeTriggerHotjar('ncrresults_');*/
            if(this.temporalSymptoms.length==0){
              this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
              if(this.modalReference!=undefined){
                this.modalReference.close();
              }
            }else{
              document.getElementById("openModalSymptomsNcrButton2").click();
            }

          }else{
            this.substepExtract = '4';
            this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
            if(this.modalReference!=undefined){
              this.modalReference.close();
            }
          }

          this.loadingHpoExtractor = false;
        }

     }, (err) => {
       console.log(err);
       Swal.close();
     }));
    }

    callGetInfoTempSymptomsJSON(hposStrins){
      var depreca = 0;
      this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(hposStrins,this.listOfphenotypesinfo)
      //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,hposStrins)
      .subscribe( (res2 : any) => {

        var tamano= Object.keys(res2).length;
        if(tamano>0){
          var hposStrinsOld =[];
          for(var i in res2) {
            if(res2[i].length>0){
              for (var j = 0; j < this.temporalSymptoms.length; j++) {
                if(res2[i][0].id==this.temporalSymptoms[j].id){
                  this.temporalSymptoms[j].name = res2[i][0].name;
                  this.temporalSymptoms[j].def = res2[i][0].desc;
                  this.temporalSymptoms[j].synonyms = res2[i][0].synonyms;
                  if(res2[i][0].comment==undefined){
                    this.temporalSymptoms[j].comment = '';
                  }else{
                    this.temporalSymptoms[j].comment = res2[i][0].comment;
                  }

                  if(this.temporalSymptoms[j].importance==undefined){
                    this.temporalSymptoms[j].importance = 1;
                  }
                }
              }
            }else{
              depreca++;
            }
          }
          if(depreca>0){
            for (var j = 0; j < this.temporalSymptoms.length; j++)
              {
                if(this.temporalSymptoms[j].synonyms==undefined){
                  hposStrinsOld.push(this.temporalSymptoms[j].id);
                }
              }
            this.callGetInfoOldTempSymptomsJSON(hposStrinsOld);
          }
        }

     }, (err) => {
       console.log(err);
     }));
    }

    callGetInfoOldTempSymptomsJSON(hposStrins){
      this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(hposStrins,this.listOfphenotypesinfoOld)
      //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,hposStrins)
      .subscribe( (res3 : any) => {
        var tamano= Object.keys(res3).length;
        if(tamano>0){
          for(var i in res3) {
            if(res3[i].length>0){

              for (var j = 0; j < this.temporalSymptoms.length; j++) {
                if(res3[i][0].id==this.temporalSymptoms[j].id){
                  this.temporalSymptoms[j].name = res3[i][0].name;
                  this.temporalSymptoms[j].def = res3[i][0].desc;
                  if(res3[i][0].comment==undefined){
                    this.temporalSymptoms[j].comment = '';
                  }else{
                    this.temporalSymptoms[j].comment = res3[i][0].comment;
                  }

                  if(this.temporalSymptoms[j].importance==undefined){
                    this.temporalSymptoms[j].importance = 1;
                  }
                }
              }
            }
          }
        }

     }, (err) => {
       console.log(err);
     }));
    }

    onFileChangePDF(event, contentExtractorSteps)  {
      if (event.target.files && event.target.files[0]) {
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // read file as data url
        reader.onload = (event2:any) => { // called once readAsDataURL is completed
          var the_url = event2.target.result

          var extension = (event.target.files[0]).name.substr((event.target.files[0]).name.lastIndexOf('.'));
          extension= extension.toLowerCase();
          this.langToExtract = '';
          if(event.target.files[0].type=='application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension == '.docx'){
            this.loadFile(the_url,function(err,content){
                if (err) { console.log(err);};
                var doc = new Docxgen(content);
                var text = doc.getFullText();
                this.detectLanguage(text, 'otherdocs', contentExtractorSteps);
                this.medicalText = text;
                this.showPanelExtractor = true;
                this.expanded = true;
            }.bind(this))
            this.fileUploadInfo = event.target.files[0];
          }else if(event.target.files[0].type=='application/pdf' || extension == '.pdf' || extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif'){
            this.parserObject.file = event.target.files[0]
            if(extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif'){
              this.parserObject.parserStrategy = 'OcrOnly';
            }else{
              this.parserObject.parserStrategy = 'Auto';
            }

            this.callParser(contentExtractorSteps);

         }else{
           Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "error");
         }

        }

      }
    }

    callParser(contentExtractorSteps){
      Swal.fire({
          title: this.translate.instant("generics.Please wait"),
          html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i>',
          showCancelButton: false,
          showConfirmButton: false,
          allowOutsideClick: false
      }).then((result) => {

      });

      this.parserObject.callingParser = true;
      var full_text = '';
      var self = this;
      var oReq = new XMLHttpRequest();
      var lang = this.authService.getLang();
      if(this.langToExtract!=''){
        lang = this.langToExtract;
      }

      oReq.open("PUT", environment.f29api+'/api/Document/Parse?Timeout=5000&language='+lang+'&Strategy='+this.parserObject.parserStrategy, true);

      var self = this;
      oReq.onload = function (oEvent) {
        Swal.close();
        self.langToExtract = '';
        self.parserObject.callingParser = false;
        // Uploaded.
        let file = oEvent.target;
        var target:any = {};
        target = file;
        //target--> status, strategy, content
        if(target.response.content == undefined){
          self.medicalText = '';
        }else{
          self.medicalText = target.response.content
          self.medicalText = self.medicalText.split("\n").join(" ");
        }

        self.showPanelExtractor = true;
        self.expanded = true;

        if(target.response.status=='RequireOcr'){
          self.parserObject.parserStrategy = 'OcrOnly';
          Swal.fire({
              title: self.translate.instant("parser.OcrOnlyTitle"),
              text:  self.translate.instant("parser.OcrOnlyText"),
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#0CC27E',
              cancelButtonColor: '#f9423a',
              confirmButtonText: self.translate.instant("generics.Yes"),
              cancelButtonText: self.translate.instant("generics.No"),
              showLoaderOnConfirm: true,
              allowOutsideClick: false,
              reverseButtons:true
          }).then((result) => {
            if (result.value) {
              self.callParser(contentExtractorSteps);
            }else{
              var testLangText = self.medicalText.substr(0,4000)
              self.detectLanguage(testLangText, 'parser', contentExtractorSteps);
            }
          });

        }else{
          self.parserObject.parserStrategy = 'Auto'
          var testLangText = self.medicalText.substr(0,4000)
          self.detectLanguage(testLangText, 'parser', contentExtractorSteps);
        }
      };
      oReq.send(this.parserObject.file);
      const rt = "json";
      oReq.responseType = rt;
      this.fileUploadInfo = this.parserObject.file;
    }

    loadFile(url,callback){
        JSZipUtils.getBinaryContent(url,callback);
    }

    deleteText(){
      this.medicalText = '';
    }

    detectLanguage(testLangText, method, contentExtractorSteps){
      this.subscription.add( this.apiDx29ServerService.getDetectLanguage(testLangText)
      .subscribe( (res : any) => {
        if(res[0].language != this.authService.getLang() && this.parserObject.parserStrategy != 'Auto'){


          Swal.fire({
              title: this.translate.instant("patdiagdashboard.We have detected that the document is in another language"),
              text:  this.translate.instant("patdiagdashboard.Analyzed as")+'" "'+this.authService.getLang()+'", "'+this.translate.instant("patdiagdashboard.detected as")+'" "'+res[0].language+'". "'+this.translate.instant("patdiagdashboard.do you want us to do it"),
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
              this.langToExtract = res[0].language
              if(method == 'parser'){
                this.callParser(contentExtractorSteps);
              }
            }else{
              this.langToExtract = res[0].language
              if(this.medicalText!=''){
                this.onSubmitToExtractor(contentExtractorSteps);
              }else{
                Swal.fire(this.translate.instant("patdiagdashboard.No text has been detected in the file"), '', "error");
              }
            }
          });

        }else{
          if(res[0].language != this.authService.getLang()){
            this.langToExtract = res[0].language
          }else{
            this.langToExtract = this.authService.getLang()
          }
          if(this.medicalText!=''){
            this.onSubmitToExtractor(contentExtractorSteps);
          }else{
            Swal.fire(this.translate.instant("patdiagdashboard.No text has been detected in the file"), '', "error");
          }

        }
      }, (err) => {
        console.log(err);
        this.loadingHpoExtractor = false;
        this.toastr.error('', this.translate.instant("generics.error try again"));
      }));
    }

    cambiarOrdenSintomas(){
      if(this.modelRadio == 1){
        this.actualDisease.symptoms.sort(this.sortService.GetSortOrderInverse("percentile"));
      }else{
        this.actualDisease.symptoms.sort(this.sortService.GetSortOrder("name"));
      }

    }

    getExomiserSettings(tempSymptomsExo){

      var listSymptoms = [];
      for(var i = 0; i < tempSymptomsExo.length; i++) {
        listSymptoms.push(tempSymptomsExo[i].id);
      }

      this.settingExomizer.VcfBlobName = this.filename;
      this.settingExomizer.CaseName = this.accessToken.containerName;
      this.settingExomizer.Hpos = listSymptoms;
      if(this.settingExomizer.HiPhivePrioritisers.length==0){
        this.settingExomizer.HiPhivePrioritisers = ["human", "mouse", "fish", "ppi"];
      }
    }

    changeSettingsExomiser(contentSettingsExomiser){
      this.getExomiserSettings(this.phenotype.data);

      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl'
      };
      this.modalReference = this.modalService.open(contentSettingsExomiser, ngbModalOptions);
      this.goTo('settingExomiser');
      /*this.exomiserSettingsForm.valueChanges.subscribe((newForm) => {
        if(this.settingExomizer.PedBlobName){
           this.exomiserSettingsForm.controls.Proband.setValidators(null);
           //set the validations to null for the other input
        }else{
          //this.exomiserSettingsForm.controls.proband.setValidators(null);
          //set the validations to null for the other input
        }
        this.exomiserSettingsForm.controls.Proband.updateValueAndValidity();
      });*/
    }

    onFileChange(event: any): void {
      var filename = event.target.files[0].name;
      var extension = filename.substr(filename.lastIndexOf('.'));
      filename = filename.split(extension)[0];
      filename = filename + extension;
      if((extension!='.ped')||(event.target.files[0].size > 12048)){
        if(((extension!='.ped'))&&(event.target.files[0].size > 12048)){
          Swal.fire(this.translate.instant("diagnosis.The ped file must have and is big"), '', "error");
        }else{
          if(extension!='.ped'){
            Swal.fire(this.translate.instant("diagnosis.The ped file must"), '', "error");
          }
          else if(event.target.files[0].size > 12048){
            Swal.fire(this.translate.instant("diagnosis.The file is too big"), '', "error");
          }
        }
      }else{
        if(event.target.files[0].size > 12048){
          Swal.fire(this.translate.instant("diagnosis.The file is too big"), '', "error");
        }
        else{
          this.uploadingPed = true;
          this.uploadProgressPed = this.blobped
            .uploadToBlobStorage(this.accessToken, event.target.files[0], filename);
        }
      }
    }

    deleteDataAndFile(){
      //eliminar del blob
      this.blob.deleteBlob(this.accessToken.containerName , this.settingExomizer.PedBlobName);
      this.settingExomizer.PedBlobName = null;
      this.settingExomizer.Proband=null;
      this.pedNameForShow="";
    }

    saveSettingsExomiser(){
      if(!this.loadingSymptoms && !this.sending && (this.phenotypeCopy.data.length != this.phenotype.data.length || this.checksChanged)){
        this.saveSymptomsToDb();
      }

      this.variantEffectFiltersState = false;
      this.saveNotes(false);
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
    }

    /*cancelSettingsExomiser(){
      this.variantEffectFiltersState = false;
      this.settingExomizer = this.diagnosisInfo.settingExomizer;
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      this.goTo('idup');
    }*/

    selectVcfAsDefault(file){
      this.settingExomizer.VcfBlobName = file;
      this.filename = file;
    }

    deleteVcfFile(file,i){
      Swal.fire({
          title: this.translate.instant("generics.Are you sure delete it"),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("generics.Accept"),
          cancelButtonText: this.translate.instant("generics.Cancel"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false,
          reverseButtons:true
      }).then((result) => {
        if (result.value) {
          this.confirmDeleteVcfFile(file,i);
        }
      });
    }


    confirmDeleteVcfFile(file,i){

      if(file==this.filename){
        if(this.filesVcf.length>1){
          var enc =false;
          for(var j = 0; j < this.filesVcf.length && !enc; j++) {
            if(this.filesVcf[j].name!=this.filename){
              this.settingExomizer.VcfBlobName = this.filesVcf[j].name;
              this.filename = this.filesVcf[j].name;
              enc = true;
            }
          }
        }else{
          this.settingExomizer.VcfBlobName = '';
          this.filename = '';
        }
      }
      this.filesVcf.splice(i, 1);
      this.blob.deleteBlobAndLoadVCF(this.accessToken.containerName , file);
    }

    clearValuesFrequencySources(){
      this.settingExomizer.FrequencySources = [];
    }

    clearValuesVariantEffectFilters(){
      this.settingExomizer.VariantEffectFilters.remove = [];
    }

    variantEffectFiltersChanged(){
      this.variantEffectFiltersState = true;
      this.variantEffectsFilterRequired=true;

    }

    showPanelSymptomsNcr(contentSymptomsNcr, isNew){
      this.isNew = isNew;
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
      };
      this.actualTemporalSymptomsIndex = 0;
      this.modalReference = this.modalService.open(contentSymptomsNcr, ngbModalOptions);
      this._openedModalRefs.push(this.modalReference);
    }

    addSymptomTinder(index){
      this.temporalSymptoms[index].checked=true;
      this.actualTemporalSymptomsIndex++;
    }

    rejectSymptomTinder(index){
      this.temporalSymptoms[index].checked=false;
      this.actualTemporalSymptomsIndex++;
    }

    startAgainTinder(){
      this.actualTemporalSymptomsIndex = 0;
      this.selectedInfoSymptomIndex = -1;
    }


    markText(text, pos1, pos2){
      this.searchTerm = text.substring(pos1, pos2);
      this.resultTextNcrCopy = this.highlightSearch.transform(this.resultTextNcr, this.searchTerm);
      setTimeout(()=>{
        var el = document.getElementsByClassName("actualPosition")[0];
        el.scrollIntoView(true);
      }, 100);
    }

    markAllText(text, hpo){
      var words = [];
      for(var j = 0; j < hpo.positions.length; j++) {
        var value = text.substring(hpo.positions[j][0], hpo.positions[j][1]);
        words.push({args:value})
      }
      this.resultTextNcrCopy = this.highlightSearch.transformAll(this.resultTextNcr, words);
      setTimeout(()=>{
        var el = document.getElementsByClassName("actualPosition")[0];
        el.scrollIntoView(true);
      }, 100);
    }

    showPieceOfText(symptomIndex, hpoIndex){
      if(this.selectedSymptomIndex == symptomIndex && this.selectedHpoIndex == hpoIndex){
        this.selectedSymptomIndex = -1;
        this.selectedHpoIndex = -1;
      }else{
        this.selectedSymptomIndex = symptomIndex;
        this.selectedHpoIndex = hpoIndex;
      }

    }

    showCompleteNcrResultView(){
      this.ncrResultView = !this.ncrResultView ;
    }

    confirmCloseSymptomsNcr(){
      Swal.fire({
          title: this.translate.instant("symptomssection.want to close this window"),
          text:  this.translate.instant("symptomssection.You will miss the changes"),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("generics.Accept"),
          cancelButtonText: this.translate.instant("generics.Cancel"),
          showLoaderOnConfirm: false,
          allowOutsideClick: false,
          reverseButtons:true
      }).then((result) => {
        if (result.value) {
          this.closeAll()
        }
      });

    }

    closeAll(){

      for(var i = 0; i < this._openedModalRefs.length; i++) {
        if(this._openedModalRefs[i]!=undefined){
          this._openedModalRefs[i].close();
        }
      }
      this._openedModalRefs = [];
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
    }

    saveSymptomsNcr(){
      this.closeAll()
      for(var i = 0; i < this.temporalSymptoms.length; i++) {
        if(this.temporalSymptoms[i].checked){
          var symptomExtractor = {id: this.temporalSymptoms[i].id,name: this.temporalSymptoms[i].name, new: true};
          this.addSymptom(symptomExtractor, 'ncr');
        }else{
          var encOnphenotype = false;
          for (var j = 0; j <  this.phenotype.data.length && !encOnphenotype; j++) {
            if(this.temporalSymptoms[i].id == this.phenotype.data[j].id){
              encOnphenotype = true;
              this.phenotype.data[j].checked = false;
            }
          }
          var foundElement = this.searchService.search(this.infoNcrToSave.rejectedSymptoms,'id', this.temporalSymptoms[i].id);
          if(!foundElement){
            this.infoNcrToSave.rejectedSymptoms.push(this.temporalSymptoms[i]);
          }

        }

      }
      if(this.isNewNcrFile && this.isNew){
        this.saveResultsNcr();
      }
      this.saveSymptomsToDb();
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
    }

    sortByName(){
      this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
    }

    sortBySimilarity(){
      this.temporalSymptoms.sort(this.sortService.GetSortOrderInverse("similarity"));
    }

    loadHtmlExo(){
      this.blob.loadFilesHtmlExomiserOnBlob(this.accessToken.containerName);
      this.loadingFileHtmlExomiserBlob = true;
    }

    reportError(){
      //mostrar mensaje informando que el servicio monarch está caido y que se les informará de ello
      if(!Swal.isVisible()){
        Swal.fire({
            title: this.translate.instant("diagnosis.The monarch service is down"),
            text:  this.translate.instant("diagnosis.Do you want to receive an email"),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#f9423a',
            confirmButtonText: this.translate.instant("diagnosis.Notify me when active"),
            cancelButtonText: this.translate.instant("generics.No, cancel"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            reverseButtons:true
        }).then((result) => {
          if (result.value) {
            //enviar email a cada usuario cuando este disponible el servicio, para ello tenemos que guardar los ids...
            this.subscription.add( this.http.post(environment.api+'/api/testservicemonarch/'+this.authService.getIdUser(),'')
            .subscribe( (res : any) => {
            }, (err) => {
              console.log(err);
            }));
          }
        });
      }
    }

    changeSymptomsOfDisease(row, contentSeeSymptomsOfDisease){
      this.actualProposedDisease = row;
      //genes
      this.listOfGenes = [];

      if(row.genes!=undefined){
        if(this.infoGenesAndConditionsExomizer.length>0 && row.genes.length>0){
          for(var i = 0; i < row.genes.length; i++) {
            var enc= false;
            for(var j = 0; j < this.infoGenesAndConditionsExomizer.length && !enc; j++) {
              if(this.infoGenesAndConditionsExomizer[j].name == row.genes[i].gen){
                enc=true;
                this.listOfGenes.push({gen: row.genes[i].gen, checked: true, importance: '1'});
              }
            }
            if(!enc && this.infoGenesAndConditionsPhen2Genes.length==0){
              this.listOfGenes.push({gen: row.genes[i].gen, checked: false, importance: '3'});
            }
          }
        }
        if(this.infoGenesAndConditionsPhen2Genes.length>0 && row.genes.length>0){
          for(var i = 0; i < row.genes.length; i++) {
            var enc= false;
            for(var j = 0; j < this.infoGenesAndConditionsPhen2Genes.length && !enc; j++) {
              if(this.infoGenesAndConditionsPhen2Genes[j].name == row.genes[i].gen){
                enc=true;
                var foundElement = this.searchService.search(this.listOfGenes,'gen', row.genes[i].gen);
                if(!foundElement){
                  this.listOfGenes.push({gen: row.genes[i].gen, checked: true, importance: '2'});
                }

              }
            }
            if(!enc){
              var foundElement = this.searchService.search(this.listOfGenes,'gen', row.genes[i].gen);
              if(!foundElement){
                this.listOfGenes.push({gen: row.genes[i].gen, checked: false, importance: '3'});
              }

            }
          }
        }
        this.listOfGenes.sort(this.sortService.GetSortOrder("importance"));
      }

      //síntomas
      this.listOfSymptoms = [];

      this.getSymptomsOneDisease(row.name.id, contentSeeSymptomsOfDisease);
    }

    getSymptomsOneDisease(id, contentSeeSymptomsOfDisease){
      this.loadingSymptomsOfDisease = true;
      //get symtoms
      var lang = this.authService.getLang();
      this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang,[id],0)
      .subscribe( (res : any) => {
        var info = res[id];
        var listOfSymptoms = info.phenotypes
        this.listOfSymptoms = [];
        if(Object.keys(listOfSymptoms).length>0){
          for(var k in listOfSymptoms) {
             var foundElement = this.searchService.search(this.phenotype.data,'id', k);
             var foundElement2 = this.searchService.search(this.listOfSymptoms,'id', k);
             if(!foundElement2){
               var comment = "";
               var def = "";
               if(listOfSymptoms[k].desc!="None" && listOfSymptoms[k].desc!=null){
                 def = listOfSymptoms[k].desc;
               }
               if(listOfSymptoms[k].comment!=""){
                 comment = listOfSymptoms[k].comment;
               }else{
                 comment = "None"
               }
               if(foundElement){
                 this.listOfSymptoms.push({id:k, name: listOfSymptoms[k].name, def: def, comment: comment, synonyms: listOfSymptoms[k].synonyms, checked: true});
               }else{
                 this.listOfSymptoms.push({id:k, name: listOfSymptoms[k].name, def: def, comment: comment, synonyms: listOfSymptoms[k].synonyms, checked: false});
               }
             }else{
               var enc = false;
               for(var j = 0; j < this.phenotype.data.length && !enc; j++) {
                 if(this.phenotype.data[j].id == k){
                   enc=true;
                   this.listOfSymptoms.push({id: this.phenotype.data[j].id, name: this.phenotype.data[j].name, def: this.phenotype.data[j].desc, comment: this.phenotype.data[j].comment, checked: true, synonyms: this.phenotype.data[j].synonyms});
                 }
               }
             }
          }
          this.listOfSymptoms.sort(this.sortService.GetSortOrder("checked"));



        }
        Swal.close();
        let ngbModalOptions: NgbModalOptions = {
              windowClass: 'ModalClass-xl'
        };
        if(this.modalReference!=undefined){
          this.modalReference.close();

        }
        if(contentSeeSymptomsOfDisease!=null){
          this.modalReference = this.modalService.open(contentSeeSymptomsOfDisease, ngbModalOptions);
        }

        this.loadingSymptomsOfDisease = false;

       }, (err) => {
         console.log(err);
         this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
         this.loadingSymptomsOfDisease = false;
       }));

    }

    changeStateDiseaseSymptom(index){
      this.listOfSymptoms[index].checked = !(this.listOfSymptoms[index].checked);
    }


    saveSymptomsOfDisease(){
      for (var k = 0; k < this.listOfSymptoms.length; k++) {
        if(this.listOfSymptoms[k].checked){
          var foundElement = this.searchService.search(this.phenotype.data,'id', this.listOfSymptoms[k].id);
          if(!foundElement){
            this.phenotype.data.push(
              {id: this.listOfSymptoms[k].id,
                name: this.listOfSymptoms[k].name,
                new: true,
                checked: true,
                percentile: this.listOfSymptoms[k].percentile,
                def: this.listOfSymptoms[k].def,
                comment: this.listOfSymptoms[k].comment,
                inputType: 'proposedDiseases',
                importance: '1',
                polarity: '0'
              });
            this.checksChanged =true;
          }
        }else{
          var foundElement = this.searchService.search(this.phenotype.data,'id', this.listOfSymptoms[k].id);
          if(foundElement){
            var finished = false;
            for (var i = 0; i < this.phenotype.data.length && !finished; i++) {
              if(this.phenotype.data[i]!=undefined){

                if(this.phenotype.data[i].id == this.listOfSymptoms[k].id){
                  this.phenotype.data[i].checked = false;
                  finished = true;
                  this.checksChanged =true;
                }
              }
            }
          }
        }
      }

      if(this.modalReference!=undefined){
        this.modalReference.close();
      }

    }

    cambiarOrdenSintomasDisease(){
      if(this.modelRadio == 1){
        this.listOfSymptoms.sort(this.sortService.GetSortOrderInverse("checked"));
      }else{
        this.listOfSymptoms.sort(this.sortService.GetSortOrder("name"));
      }

    }

    onActivate(event, contentSeeSymptomsOfDisease) {
        if(event.type == 'click') {
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i>',
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false
            }).then((result) => {

            });
            this.changeSymptomsOfDisease(event.row, contentSeeSymptomsOfDisease);
        }
    }

    onActivate2(disease, contentSeeSymptomsOfDisease) {
        this.changeSymptomsOfDisease(disease, contentSeeSymptomsOfDisease);
    }

    setFitersDiseases(contentFilterDiseases){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl'
      };
      this.modalReference = this.modalService.open(contentFilterDiseases, ngbModalOptions);
    }

    selected3($e) {
      $e.preventDefault();
      this.tempSymptom = $e.item;
      this.modelTemp = '';
    }

    addSymptomToList(){

      var foundElement = this.searchService.search(this.selectedItemsFilter,'id', this.tempSymptom.id);
      if(!foundElement){
        if(this.modelRadio2 == 1){
          this.tempSymptom.checked = true;
        }else{
          this.tempSymptom.checked = false;
        }
        this.selectedItemsFilter.push(this.tempSymptom);
        this.selectedItemsFilterWithIndex = {"id":this.tempSymptom,"index":(this.selectedItemsFilter.length-1)};
        this.tempSymptom = {};
      }else{
        this.toastr.error('', this.translate.instant("phenotype.The symptom is already added"));
      }
    }

    deleteTempSymptom(){
      this.tempSymptom = {};
    }

    changeStateFilterSymptom(index){
      this.selectedItemsFilter[index].checked = !(this.selectedItemsFilter[index].checked);
    }

    addToo(index, checked){
      var foundElement = this.searchService.search(this.selectedItemsFilter,'id', this.phenotype.data[index].id);
      if(!foundElement){
        var oneSymptom = JSON.parse(JSON.stringify(this.phenotype.data[index]));
        this.selectedItemsFilter.push(oneSymptom);
        var lastindex = this.selectedItemsFilter.length;
        this.selectedItemsFilter[lastindex-1].checked = checked;
        this.selectedItemsFilterWithIndex.push({"id":oneSymptom,"index":(lastindex-1)});

      }
      else{
        var indexToChange="";
        for (var i=0; i<this.selectedItemsFilterWithIndex.length;i++){
          if (this.selectedItemsFilterWithIndex[i].id.id==this.phenotype.data[index].id){
            indexToChange=this.selectedItemsFilterWithIndex[i].index;
          }
        }
        this.selectedItemsFilter[indexToChange].checked = checked;

      }



    }

    deleteFilter(item) {
      this.selectedItemsFilter.splice(this.selectedItemsFilter.indexOf(item), 1);
      //this.inputEl.nativeElement.focus();
    }

    applyFilters(){
      if(this.selectedItemsFilter.length == 0){
        this.removeFilters();
      }else{
        /*if(this.relatedConditionsCopy.length == 0){
          this.relatedConditionsCopy = JSON.parse(JSON.stringify(this.relatedConditions));
        }*/
        if(this.relatedConditionsCopy.length == 0){
          this.relatedConditionsCopy= JSON.parse(JSON.stringify(this.relatedConditions));
        }else{
          this.relatedConditions = JSON.parse(JSON.stringify(this.relatedConditionsCopy));
        }
        var tempRelatedConditions = [];
        var counterFilters = 0;
        for(var i = 0; i < this.relatedConditions.length; i++) {
          var toAdd = false;
          var rejectDisease = false;
          var torejectDisease2 = false;
          var tosave = false;
          counterFilters = 0;
          for (var j = 0; j < this.selectedItemsFilter.length; j++) {
            if(!rejectDisease && !torejectDisease2){
              var foundElement = this.searchService.search(this.relatedConditions[i].symptoms,'id', this.selectedItemsFilter[j].id);
              if(foundElement){
                if(this.selectedItemsFilter[j].checked){
                  counterFilters = counterFilters+1;
                  toAdd = true;
                }
                if(!this.selectedItemsFilter[j].checked){
                  rejectDisease = true;
                }
              }else{
                if(!this.selectedItemsFilter[j].checked){
                  counterFilters = counterFilters+1;
                  tosave = true;
                }
                if(this.selectedItemsFilter[j].checked){
                  torejectDisease2 = true;
                }
              }
            }


          }
          if((toAdd && !rejectDisease) || (!torejectDisease2 && tosave)){
            if (counterFilters == this.selectedItemsFilter.length ){
              tempRelatedConditions.push(this.relatedConditions[i]);
            }
          }
          //else if(!toAdd && !rejectDisease && tosave && !torejectDisease2){
            //tempRelatedConditions.push(this.relatedConditions[i]);
          //}
        }
        if(tempRelatedConditions[0]==undefined){
          tempRelatedConditions = [];
        }
        this.relatedConditions = JSON.parse(JSON.stringify(tempRelatedConditions));
        this.renderMap();
        if(this.modalReference!=undefined){
          this.modalReference.close();
        }
      }
      //guardo por si ha habido cambios en los filtros
      this.saveNotes2();
    }

    removeFilters(){
      if(this.relatedConditionsCopy.length != 0){
        this.relatedConditions = JSON.parse(JSON.stringify(this.relatedConditionsCopy));
      }
      for(var index in this.phenotype.data){
        this.phenotype.data[index].checked=true;
      }
      this.relatedConditionsCopy = [];
      this.selectedItemsFilter = [];
      this.renderMap();
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      //guardo por si ha habido cambios en los filtros
      this.saveNotes2();
    }

    renderMap(){
      this.potentialDiagnostics = [];
      this.checkPrograms();
      this.loadingPotentialDiagnostics = true;
      this.getOrphaNamesAndCheckPotentialDiagnostics();
      //this.topRelatedConditions = data;
    }

    async getOrphaNamesAndCheckPotentialDiagnostics(){
      if(this.orphanet_names.disorders==undefined){
        await this.delay(1000);
        this.getOrphaNamesAndCheckPotentialDiagnostics();
      }else{
        for(var i = 0; i < this.relatedConditions.length; i++)
          {
            //get orpha name
            var found = false;
            var orphaId = this.maps_to_orpha.map[this.relatedConditions[i].name.id]
            if(orphaId!=undefined){
              var firstOrphaId = orphaId[0];
              this.relatedConditions[i].name.label = this.orphanet_names.disorders[firstOrphaId].name;
              found =true;
            }
            if(this.relatedConditions[i].xrefs!=undefined){
              for(var j = 0; j < this.relatedConditions[i].xrefs.length && !found; j++){
                var orphaId = this.maps_to_orpha.map[this.relatedConditions[i].xrefs[j]]
                if(orphaId!=undefined){
                  var firstOrphaId = orphaId[0];
                  this.relatedConditions[i].name.label = this.orphanet_names.disorders[firstOrphaId].name;
                  found =true;
                }
              }
            }
            this.relatedConditions[i].name.label = this.textTransform.transform(this.relatedConditions[i].name.label);

            //get potentialDiagnostics
            if(this.relatedConditions[i].checked){
              this.potentialDiagnostics.push(this.relatedConditions[i]);
            }
          }
          //delete repeated diseases by name
          var uniqueDiseases = this.deleteRepeatedDiseases(this.relatedConditions);

        this.topRelatedConditions = uniqueDiseases.slice(0, this.indexListRelatedConditions)
        this.loadingPotentialDiagnostics = false;
      }

    }


  arrayUnique(array) {
      var a = array.concat();
      for(var i=0; i<a.length; ++i) {
          for(var j=i+1; j<a.length; ++j) {
              if(a[i] === a[j])
                  a.splice(j--, 1);
          }
      }

      return a;
  }

  arrayUniqueGenes(array) {
      var a = array.concat();
      for(var i=0; i<a.length; ++i) {
          for(var j=i+1; j<a.length; ++j) {
            if(a[i].gen == a[j].gen){
              a.splice(j--, 1);
            }

          }
      }

      return a;
  }

    deleteRepeatedDiseases(listOfDiseases){
      var res = [];
      console.log(listOfDiseases);
      for(var i = 0; i < listOfDiseases.length; i++){
        var enc = false;
        for(var j = 0; j < res.length && !enc; j++){
          if(listOfDiseases[i].name.label==res[j].name.label){
            console.log('REPETIDO')
            console.log(i)
            var infoToExtractGenes = [];
            var priorizeGenes=false;
            // Cojo lo de Exomiser
            if(this.infoGenesAndConditionsExomizer.length>0){
              infoToExtractGenes = this.infoGenesAndConditionsExomizer;
              priorizeGenes=true;
            // Cojo lo de phene2gene
            }else if(this.infoGenesAndConditionsPhen2Genes.length>0){
              infoToExtractGenes = this.infoGenesAndConditionsPhen2Genes;
              priorizeGenes=false;
            }
            if((infoToExtractGenes!= [])&&(priorizeGenes==true && this.isgen)&&(this.infoGenesAndConditionsExomizer.length>0)){
              //nothing
              res[j].genes = this.arrayUniqueGenes(res[j].genes);
            }else{
              var array1 = res[j].genes;
              var array2 = listOfDiseases[i].genes;
              // Merges both arrays and gets unique items
              var array3 = array1.concat(array2)
              res[j].genes = this.arrayUnique(array3);
            }

            enc=true;
          }
        }
        if(!enc){
          res.push(listOfDiseases[i]);
        }
      }
      return res;
    }

    getColor(item){
      var color1= [121, 246, 89];//89
      var color2= [87, 96, 211];
      //var color2= [255, 255, 224];
      //var color1= [107, 142, 35];
      var w1 = (item/100);
      /*if(w1<0.8){
        w1=0;
      }*/
      var w2 = 1 - w1;
      var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
          Math.round(color1[1] * w1 + color2[1] * w2),
          Math.round(color1[2] * w1 + color2[2] * w2)];
          var c1 = (rgb[0]).toString(16);
          if(c1.length == 1){
            c1 = "0" + 0;
          }
          var c2 = (rgb[1]).toString(16);
          if(c2.length == 1){
            c2 = "0" + 0;
          }
          var c3 = (rgb[2]).toString(16);
          if(c3.length == 1){
            c3 = "0" + 0;
          }

          return "#" + c1 + c2 + c3;
    }

    isTooDark(hexcolor){
      var r = parseInt(hexcolor.substr(1,2),16);
      var g = parseInt(hexcolor.substr(3,2),16);
      var b = parseInt(hexcolor.substr(4,2),16);
      var yiq = ((r*299)+(g*587)+(b*114))/1000;
      return (yiq < 140);
    }

    delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    saveResultsNcr(){
      var random_name = Math.random().toString(36).substr(2, 9);
      this.infoNcrToSave.docUrl=random_name+'-'+this.infoNcrToSave.docUrl;
       var str = JSON.stringify(this.infoNcrToSave);
       var fileNameNcr = random_name+"-"+'ncrresult.json';
       var file = new File([str],fileNameNcr,{type:'application/json'});

      this.blob.uploadToBlobStorage(this.accessToken, file, fileNameNcr, 'ncrInfofile');

     if(this.fileUploadInfo!=undefined){
       this.uploadfile(random_name);
     }

     //this.makeCopyForSupport(file, this.fileUploadInfo, fileNameNcr, random_name);
     //var actualDate = Date.now();
     //this.infoNcrToSave = {ncrVersion:environment.ncrVersion, originalText: '', result: {}, rejectedSymptoms: [], date: actualDate, docUrl: ''};
     this.fileUploadInfo = undefined;

    }

    uploadfile(random_name){
      var filename = random_name+"-"+this.fileUploadInfo.name;
      this.blob.uploadToBlobStorage(this.accessToken, this.fileUploadInfo, filename, 'ncrOrigenfile');
    }

    makeCopyForSupport(file, fileUploadInfo, fileNameNcr, random_name){
      //SET accessToken TO THE BLOB
      this.accessToken.containerName = 'filesncr';
      var filename0= this.accessToken.patientId + "-" + fileNameNcr
      this.blob.uploadToBlobStorage(this.accessToken, file, filename0, 'ncrInfofile');

       if(this.fileUploadInfo!=undefined){
         var filename = this.accessToken.patientId + "-" + random_name+"-"+this.fileUploadInfo.name;
         this.blob.uploadToBlobStorage(this.accessToken, this.fileUploadInfo, filename, 'ncrOrigenfile');
       }


       //RESTORE
       this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
       this.accessToken.patientId = this.authService.getCurrentPatient().sub;


    }

    loadFilesContainer(showloading){
      this.loadingDocuments = true;
      this.blob.loadFilesPatientBlob(this.accessToken.containerName);
      if(showloading){
        Swal.fire({
            title: this.translate.instant("generics.Please wait"),
            html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i>',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then((result) => {

        });
      }
    }

    openNcrResult(name){
          this.temporalSymptoms = [];
          this.subscription.add( this.http.get(this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+name+this.accessToken.sasToken)
           .subscribe( (res : any) => {
             var isOldVersion = true;
             if(this.modalReference!=undefined){
               this.modalReference.close();
             }
             this.medicalText = res.originalText
             this.resultTextNcrCopy = res.result.result
             if(this.resultTextNcrCopy==undefined){
               this.resultTextNcrCopy = res.result;
               isOldVersion = false;
             }
             this.infoNcrToSave = res;
             var infoNcr = res.result.result
             if(infoNcr==undefined){
               infoNcr = res.result;
               isOldVersion = false;
             }
             if(isOldVersion){
               infoNcr.sort(this.sortService.GetSortOrderNumberInverse("characters"));
               for(var i = 0; i < infoNcr.length; i++) {
                 var positions = [];
                 infoNcr[i].characters[0] = parseInt(infoNcr[i].characters[0])
                 infoNcr[i].characters[1] = parseInt(infoNcr[i].characters[1])
                 positions.push(infoNcr[i].characters);
                 var symptomExtractor2 = {id: infoNcr[i].id,name: infoNcr[i].concept, new: true, similarity: parseFloat(infoNcr[i].probability), positions: positions};
                 this.addTemporalSymptom(symptomExtractor2, 'ncr');
                 //this.addSymptom(symptomExtractor2, 'auto')
               }
               this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
               for(var j = 0; j < this.temporalSymptoms.length; j++) {

                 for(var k = 0; k < res.rejectedSymptoms.length; k++) {
                   if(this.temporalSymptoms[j].id == res.rejectedSymptoms[k].id){
                     this.changeStateSymptom(j, true);
                   }
                  }
                  for(var jio = 0; jio < this.phenotype.data.length; jio++) {
                    if(this.temporalSymptoms[j].id == this.phenotype.data[jio].id){
                      this.temporalSymptoms[j].checked = true;
                    }
                   }
               }

               //this.phenotype.data.sort(this.sortService.GetSortOrder("name"));
               //this.hasSymptomsToSave();
               var resulttest = '';
               this.resultTextNcr = this.medicalText;
               this.resultTextNcrCopy = this.medicalText;
               this.copyResultTextNcr = this.medicalText;
               var nextposition = 0;
               //var tempores = infoNcr;

               for(var j = 0; j < infoNcr.length; j++) {
                 var newTrozo = '';
                 var pos1 = infoNcr[j].characters[0];
                 var pos2 = infoNcr[j].characters[1];
                 if(nextposition == 0 && pos1>0){
                   newTrozo = this.resultTextNcr.substring(nextposition, (pos1-1));
                   resulttest = resulttest.concat(newTrozo);
                   nextposition = parseInt(pos2)+1;
                 }else if(nextposition<pos1 && pos1>0){
                   newTrozo = this.resultTextNcr.substring(nextposition, (pos1-1));
                   resulttest = resulttest.concat(newTrozo);
                   nextposition = parseInt(pos2)+1;
                 }else if (infoNcr[j-1]!=undefined){
                   if(nextposition != 0 && j>0 && ((parseInt(infoNcr[j-1].characters[1])+1) == parseInt(infoNcr[j].characters[0]))){
                     nextposition = nextposition+ (pos2-pos1);
                     newTrozo = this.resultTextNcr.substring(pos1, pos2);
                   }
                 }

                 newTrozo = this.resultTextNcr.substring(pos1, pos2);
                 var info = (infoNcr[j].concept).toString()+' --> ' +(infoNcr[j].id).toString();
                 newTrozo = ' <a href="https://monarchinitiative.org/phenotype/'+infoNcr[j].id+'" target="_blank" title="'+info.toString()+'">'+newTrozo+'</a> '
                 resulttest = resulttest.concat(newTrozo);

                 if(j==(infoNcr.length-1) && nextposition < this.resultTextNcr.length){
                   newTrozo = this.resultTextNcr.substring(nextposition, (this.resultTextNcr.length));
                   resulttest = resulttest.concat(newTrozo);
                 }
               }

               this.resultTextNcr = resulttest;
               this.resultTextNcrCopy = resulttest;
               this.sortBySimilarity();
               var testLangText = this.medicalText.substr(0,4000)
               this.detectLanguage2(testLangText);
               this.medicalText ='';
               this.isNewNcrFile = false;

               document.getElementById("openModalShowPanelSymptomsNcr2").click();
               //this.changeTriggerHotjar('ncrresults_');
             }else{
               //is new versión
               if(infoNcr.length>0){
                for(var i = 0; i < infoNcr.length; i++) {
                  if(infoNcr[i].phens.length>0){
                    infoNcr[i].phens.sort(this.sortService.GetSortOrderNumberInverse("characters"));
                  }

                  for(var j = 0; j < infoNcr[i].phens.length; j++) {
                    var positions = [];
                    infoNcr[i].phens[j].characters[0] = parseInt(infoNcr[i].phens[j].characters[0])
                    infoNcr[i].phens[j].characters[1] = parseInt(infoNcr[i].phens[j].characters[1])
                    positions.push(infoNcr[i].phens[j].characters);
                    var text = [];
                    if(infoNcr[i].source){
                      text = [{positions: positions[0], text: infoNcr[i].text, source: infoNcr[i].source}];
                    }else{
                      text = [{positions: positions[0], text: infoNcr[i].text}];
                    }

                    var symptomExtractor = {id: infoNcr[i].phens[j].id,name: infoNcr[i].phens[j].concept, new: true, similarity: parseFloat(infoNcr[i].phens[j].probability), positions: positions, text: text};
                    this.addTemporalSymptom(symptomExtractor, 'ncr');
                  }

                  //this.addSymptom(symptomExtractor, 'auto')
                }
                for(var j = 0; j < this.temporalSymptoms.length; j++) {
                  for(var jio = 0; jio < this.phenotype.data.length; jio++) {
                    if(this.temporalSymptoms[j].id == this.phenotype.data[jio].id){
                      this.temporalSymptoms[j].checked = true;
                    }
                   }
                }

                this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
                //this.phenotype.data.sort(this.sortService.GetSortOrder("name"));
                //this.hasSymptomsToSave();
                this.resultTextNcr = this.medicalText;
                this.resultTextNcrCopy = this.medicalText;
                this.copyResultTextNcr = this.medicalText;
                this.sortBySimilarity();
                var testLangText = this.medicalText.substr(0,4000)
                this.detectLanguage2(testLangText);
                this.medicalText ='';
                //var actualDate = Date.now();
                //this.infoNcrToSave = {ncrVersion:environment.ncrVersion, originalText: '', result: {}, rejectedSymptoms: [], date: actualDate, docUrl: ''};

                //getInfo symptoms
                var hposStrins =[];
                this.temporalSymptoms.forEach(function(element) {
                  hposStrins.push(element.id);
                });
                var lang = this.authService.getLang();
                this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,hposStrins)
                .subscribe( (res : any) => {
                  var tamano= Object.keys(res).length;
                  if(tamano>0){
                    for(var i in res) {
                      for (var j = 0; j < this.temporalSymptoms.length; j++) {
                        if(res[i].id==this.temporalSymptoms[j].id){
                          this.temporalSymptoms[j].name = res[i].name;
                          this.temporalSymptoms[j].def = res[i].desc;
                          this.temporalSymptoms[j].synonyms = res[i].synonyms;
                          this.temporalSymptoms[j].comment = res[i].comment;
                          if(this.temporalSymptoms[j].importance==undefined){
                            this.temporalSymptoms[j].importance = 1;
                          }
                        }
                      }
                    }
                  }

               }, (err) => {
                 console.log(err);
               }));
               Swal.close();
                document.getElementById("openModalShowPanelSymptomsNcr2").click();
                //this.changeTriggerHotjar('ncrresults_');
              }else{
                this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
              }
             }

            }, (err) => {
              console.log(err);
            }));
    }

    checkPrograms(){
      this.programs = [];
      /*this.subscription.add( this.http.get(environment.api+'/api/programs/'+this.authService.getCurrentPatient().sub)
      .subscribe( (res : any) => {
        this.programs = res;
        }, (err) => {
          console.log(err);
        }));*/
    }

    showProgramRequest(program, contentGeneticProgram){
      this.actualProgram = program
      this.modalReference = this.modalService.open(contentGeneticProgram, {size: 'lg', centered: true});
    }

    submitInvalidForm() {
      if (!this.programRequestForm) { return; }
      const base = this.programRequestForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    programRequest(form){

      Swal.fire({
          title: this.translate.instant("GeneticProgram.swalGeneticProgramClinician"),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("generics.Yes"),
          cancelButtonText: this.translate.instant("generics.No, cancel"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false,
          reverseButtons:true
      }).then((result) => {
        if (result.value) {
          var para= this.authService.getCurrentPatient();
          var params = {};
          if(!this.actualProgram.data[2].result){
            params = {patientId:para.sub, birthDate: form.value.birthDate, gender: form.value.gender, email: form.value.email, idUser: this.authService.getIdUser(), updatePatient: true, clinicalEmail: this.myEmail, langClinician:this.authService.getLang()};
          }else{
            params = {patientId:para.sub, idUser: this.authService.getIdUser(), updatePatient: false, clinicalEmail: this.myEmail, langClinician:this.authService.getLang()};
          }

          //var isOwner =
          this.subscription.add( this.http.post(environment.api+'/api/programs/programrequest/'+this.actualProgram.id, params)
          .subscribe( (res : any) => {
            if(res.message=='Email sent'){
              var msg= this.translate.instant("GeneticProgram.msgresult1.1")+ " "+ form.value.email+ " "+ this.translate.instant("GeneticProgram.msgresult1.2")
              Swal.fire('Warning', msg, "success");
              if(this.modalReference!=undefined){
                this.modalReference.close();
              }
            }else if(res.message=='Fail sending email'){
              Swal.fire('Error', this.translate.instant("generics.error try again"), "error");
            }else if(res.message=='Added and email new user' || res.message=='Added'){
              this.checkPrograms();
              var msg= '';
              if(form.value.email!=undefined){
                msg=this.translate.instant("GeneticProgram.msgresult2.1")+ " "+ form.value.email+ " "+ this.translate.instant("GeneticProgram.msgresult2.2")
              }
              msg = msg+ this.translate.instant("GeneticProgram.msgresult3.1");

              Swal.fire(this.translate.instant("GeneticProgram.Done"), msg, "success");
              if(this.modalReference!=undefined){
                this.modalReference.close();
              }
            }else{
              if(this.modalReference!=undefined){
                this.modalReference.close();
              }
              this.checkPrograms();
              Swal.fire(this.translate.instant("GeneticProgram.Done"), this.translate.instant("GeneticProgram.msgresult3.1"), "success");
            }

          }, (err) => {
            console.log(err);
          }));

        }
      });

    }

    loadMyEmail(){
      this.subscription.add( this.http.get(environment.api+'/api/users/email/'+this.authService.getIdUser())
        .subscribe( (res : any) => {
          this.myEmail = res.email;
        }, (err) => {
          console.log(err);
        }));
    }

    discardSettingsExomiser(){

      this.getDiagnosisInfo();
      this.getExomiserSettings(this.phenotype.data);
      this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
      //this.settingExomizer=this.settingExomizerCopy;
      //this.settingExomizer = this.diagnosisInfo.settingExomizer;
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      this.goTo('idup');
    }

    manageErrorsExomiser(type,err){
      if(this.actualStep== '3.1'){
        this.goToStep('2.0', true);
      }
      this.subscription.add(this.apif29SrvControlErrors.getDescriptionErrorAndNotify(type,err,this.authService.getLang(),this.exomiserService.getActualToken())
      .subscribe( (res : any) => {
        if(this.exomiserService.getActualToken()!=undefined){
          // Delete pending jobs
          this.apiDx29ServerService.deletePendingJob(this.accessToken.patientId,this.exomiserService.getActualToken(),"exomiser")
          .subscribe( (resPendinJobs : any) => {
              // Specific control errors.
              // VCF corrupted
              if(res!=null){
                if(res.code!=undefined){
                  if(res.code=="ERR_EXOMISER_501"){
                    // Move VCF file to vcf_corrupted folder
                    this.subscription.add(this.apiDx29ServerService.moveCorruptedVCF(this.accessToken.patientId,this.settingExomizer.VcfBlobName)
                      .subscribe( (resMove : any) => {
                        this.filename=''
                        this.filesVcf=[];
                        this.blob.loadFilesVCF(this.accessToken.containerName)
                        this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
                        this.uploadingGenotype = false;
                      }, (errMove) => {
                          console.log(errMove);
                          this.uploadingGenotype = false;
                          this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
                          this.toastr.error('', this.translate.instant("generics.error try again"));
                      }));
                  }
                  else{
                    this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
                    this.uploadingGenotype = false;
                  }
                }
                else{
                  this.uploadingGenotype = false;
                  this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
                }
              }
              else{
                this.uploadingGenotype = false;
                this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
              }

          }, (errPendingJobs) => {
              console.log(errPendingJobs);
              this.uploadingGenotype = false;
              this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
              this.toastr.error('', this.translate.instant("generics.error try again"));
          });
        }
        else{
          // No pending jobs
          // Specific control errors.
          // VCF corrupted
          if(res!=null){
            if(res.code!=undefined){
              if(res.code=="ERR_EXOMISER_501"){
                // Move VCF file to vcf_corrupted folder
                this.subscription.add(this.apiDx29ServerService.moveCorruptedVCF(this.accessToken.patientId,this.settingExomizer.VcfBlobName)
                  .subscribe( (resMove : any) => {
                    this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
                    this.uploadingGenotype = false;
                  }, (errMove) => {
                      console.log(errMove);
                      this.uploadingGenotype = false;
                      this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
                      this.toastr.error('', this.translate.instant("generics.error try again"));
                  }));
              }
              else{
                this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
                this.uploadingGenotype = false;
              }
            }
            else{
              this.uploadingGenotype = false;
              this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
            }
          }
          else{
            this.uploadingGenotype = false;
            this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
          }
        }
      }, (err) => {
        console.log(err);
        this.uploadingGenotype = false;
        this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
        this.toastr.error('', this.translate.instant("generics.error try again"));
      }));

    }

    changeTriggerHotjar(trigger){
      var lang = this.authService.getLang();
      var addLangToTrigger = 'en';
      if(lang=='es'){
        addLangToTrigger = 'es';
      }
      trigger = trigger+addLangToTrigger;
      var elemento = document.getElementById('_hj_feedback_container');
      if(elemento){
        this.$hotjar.trigger(trigger);
      }

    }

    loadMoreInfoGenesPanel(contentMoreInfoGenes,element,geneName){
      let ngbModalOptions: NgbModalOptions = {
        backdrop : 'static',
        keyboard : false,
        windowClass: 'ModalClass-lg'
      };
      this.moreInfoElement=element;
      this.geneElementName=geneName;
      this.modalReference = this.modalService.open(contentMoreInfoGenes,ngbModalOptions);
    }

    showPanelSuggestions(contentSuggestions){
      let ngbModalOptions: NgbModalOptions = {
            windowClass: 'ModalClass-xl'
      };
      this.modalReference = this.modalService.open(contentSuggestions, ngbModalOptions);
      this.loadDataPanelSuggestions();
    }

    loadDataPanelSuggestions(){
      this.posactual = 0;
      this.loadingSuggestions = true;
      var jsonHpos = [];
      for(var index in this.phenotype.data){
        if(this.phenotype.data[index].checked){
          jsonHpos.push(this.phenotype.data[index].id);
        }
      }
        this.subscription.add( this.http.post(environment.api+'/api/phenotype/conditions/100', jsonHpos)
        .subscribe( (res : any) => {
          //console.log(res);
          this.relatedConditions = res["diseases"];
          //load symptoms of all deseases


          var listOfDiseases = [];
          for(var i = 0; i < this.relatedConditions.length; i++) {
            if(this.relatedConditions[i]!=undefined){
              listOfDiseases.push(this.relatedConditions[i].name.id);
            }
          }

          //get symtoms
          var lang = this.authService.getLang();
          this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang,listOfDiseases,0)
          .subscribe( (res2 : any) => {
            for(var i = 0; i < this.relatedConditions.length; i++) {
              var idDesease = this.relatedConditions[i].name.id
              this.relatedConditions[i].symptoms = [];

              var info = res2[idDesease];
              //console.log(info);
              if(info!=undefined){
                var listOfSymptoms = info.phenotypes
                if(Object.keys(listOfSymptoms).length>0){
                  for(var indexSymptom in listOfSymptoms) {
                    var comment = "";
                    var def = "";
                    if(listOfSymptoms[indexSymptom].desc!="None" && listOfSymptoms[indexSymptom].desc!=null){
                      def = listOfSymptoms[indexSymptom].desc;
                    }
                    if(listOfSymptoms[indexSymptom].comment!=""){
                      comment = listOfSymptoms[indexSymptom].comment;
                    }/*else{
                      comment = "None"
                    }*/
                    this.relatedConditions[i].symptoms.push({id:indexSymptom, name: listOfSymptoms[indexSymptom].name, def: def, comment: comment, synonyms: listOfSymptoms[indexSymptom].synonyms});
                   }
                  if(this.relatedConditions[i].symptoms.length>0){
                    //añadir los matches si no están el los sintomas de la condición
                    if(this.relatedConditions[i].matches!=0){
                      for(var k = 0; k < this.relatedConditions[i].matches.length; k++) {
                        var found= false;
                        for(var lo = 0; lo < this.relatedConditions[i].symptoms.length && !found; lo++) {
                          if(this.relatedConditions[i].symptoms[lo].id == this.relatedConditions[i].matches[k].id){
                            found = true;
                          }
                        }
                        if(!found){
                          this.relatedConditions[i].symptoms.push({id:this.relatedConditions[i].matches[k].reference.id, name: this.relatedConditions[i].matches[k].reference.label});
                        }
                      }
                    }

                    this.relatedConditions[i].symptoms.sort(this.sortService.GetSortOrder("name"));
                  }

                }
              }
            }
            this.getListAllSymptoms();
            this.loadingSuggestions = false;

          }, (err) => {
            console.log(err);
            //tratar el error
            this.reportError();
            this.loadingSuggestions = false;
          }));

        }, (err) => {
          console.log(err);
          //tratar el error
          this.reportError();
          this.toastr.error('', this.translate.instant("generics.error try again"));
          this.loadingSuggestions = false;
        }));
    }

    saveSymptomsOfDiseaseSuggested(){
      this.hasChangesSuggestion = false;
      //console.log(this.listOfSymptomsTemp);
      for (var k = 0; k < this.listOfSymptomsTemp.length; k++) {
        if(this.listOfSymptomsTemp[k].checked){
          var foundElement = this.searchService.search(this.phenotype.data,'id', this.listOfSymptomsTemp[k].id);
          //console.log(foundElement);
          if(!foundElement){
            this.phenotype.data.push(
              {id: this.listOfSymptomsTemp[k].id,
                name: this.listOfSymptomsTemp[k].name,
                new: true,
                checked: true,
                percentile: this.listOfSymptomsTemp[k].percentile,
                def: this.listOfSymptomsTemp[k].def,
                synonyms: this.listOfSymptomsTemp[k].synonyms,
                comment: this.listOfSymptomsTemp[k].comment,
                inputType: 'proposedDiseases',
                importance: '1',
                polarity: '0'
              });
            this.checksChanged =true;
          }
        }else{
          var foundElement = this.searchService.search(this.phenotype.data,'id', this.listOfSymptomsTemp[k].id);
          if(foundElement){
            var finished = false;
            //console.log(this.phenotype.data);
            for (var i = 0; i < this.phenotype.data.length && !finished; i++) {
              if(this.phenotype.data[i]!=undefined){

                if(this.phenotype.data[i].id == this.listOfSymptomsTemp[k].id){
                  this.phenotype.data[i].checked = false;
                  finished = true;
                  this.checksChanged =true;
                }
              }
            }
          }
        }
      }
      //console.log(this.phenotype.data);
      this.saveSymptomsToDb();
    }

    getListAllSymptoms(){
      this.listOfSymptomsTemp = [];
      for (var i = 0; i <  this.relatedConditions.length; i++) {
        for (var j = 0; j <  this.relatedConditions[i].symptoms.length; j++) {
          var enc = false;
          for (var k = 0; k <  this.phenotype.data.length && !enc; k++) {
            if(this.relatedConditions[i].symptoms[j].id == this.phenotype.data[k].id){
              enc = true
            }
          }
          if(!enc){
            var foundElement = this.searchService.search(this.listOfSymptomsTemp,'id', this.relatedConditions[i].symptoms[j].id);
            if(!foundElement){
              this.listOfSymptomsTemp.push({id:this.relatedConditions[i].symptoms[j].id, name: this.relatedConditions[i].symptoms[j].name, def: this.relatedConditions[i].symptoms[j].def, comment: this.relatedConditions[i].symptoms[j].comment, synonyms: this.relatedConditions[i].symptoms[j].synonyms, checked: undefined});
            }
          }
        }
      }
      this.steps = this.listOfSymptomsTemp.length/this.numberOfSymptomsPerPage;
      this.steps = Math.ceil(this.steps);

      if(document.getElementById('initpos')!=null){
        document.getElementById('initpos').scrollIntoView(true);
      }

      this.getSymptomsStep();
    }

    getSymptomsStep(){
      this.listOfSymptoms = [];
      for (var i = 0; i <  this.numberOfSymptomsPerPage; i++) {
        var index = i+(this.posactual*this.numberOfSymptomsPerPage)
        if(this.listOfSymptomsTemp[index]!=undefined){
          this.listOfSymptoms.push(this.listOfSymptomsTemp[index]);
        }
      }
    }

    callGetGroupsSymptoms(hposStrins){
      var lang = this.authService.getLang();
      this.listOfSymptomGroups = [];
      this.subscription.add(this.apif29BioService.getGroupsSymptoms(lang, hposStrins)
      //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,hposStrins)
      .subscribe( (res2 : any) => {
        for (var ini = 0; ini < this.phenotype.data.length; ini++) {
          this.phenotype.data[ini].groups = [];
        }
        var tamano= Object.keys(res2).length;
        if(tamano>0){
          for(var i in res2) {
                var items = res2[i].items;
                for (var ji = 0; ji < res2[i].items.length; ji++){
                  for(var k in res2[i].items[ji]) {
                    for (var j = 0; j < this.phenotype.data.length; j++) {
                      if(k==this.phenotype.data[j].id){
                        var foundElement0 = this.searchService.search(this.phenotype.data[j].groups,'idGroup', i);
                        if(!foundElement0){
                          this.phenotype.data[j].groups.push({idGroup: i, nameGroup: res2[i].name});
                        }
                        var foundElement = this.searchService.search(this.listOfSymptomGroups,'idGroup', i);
                        if(!foundElement){
                          this.listOfSymptomGroups.push({idGroup: i, nameGroup: res2[i].name, symptoms:[this.phenotype.data[j]]});
                        }else{
                          for (var ini3 = 0; ini3 < this.listOfSymptomGroups.length; ini3++) {
                            if(this.listOfSymptomGroups[ini3].idGroup==i){
                              this.listOfSymptomGroups[ini3].symptoms.push(this.phenotype.data[j]);
                            }

                          }
                        }
                      }

                    }
                  }
                }

              }

        }
        //mirar los que no tienen grupo
        for (var ini2 = 0; ini2 < this.phenotype.data.length; ini2++) {
          if(this.phenotype.data[ini2].groups.length==0){
            this.phenotype.data[ini2].groups.push({idGroup: 'Others', nameGroup: 'Others'});
            var foundElement = this.searchService.search(this.listOfSymptomGroups,'idGroup', 'Other');
            if(!foundElement){
              this.listOfSymptomGroups.push({idGroup: 'Others', nameGroup: 'Others', symptoms:[this.phenotype.data[ini2]]});
            }else{
              for (var ini3 = 0; ini3 < this.listOfSymptomGroups.length; ini3++) {
                if(this.listOfSymptomGroups[ini3].idGroup==i){
                  this.listOfSymptomGroups[ini3].symptoms.push(this.phenotype.data[ini2]);
                }

              }
            }
          }
        }
     }, (err) => {
       console.log(err);
     }));
    }

    changeSuggestedViewSymptoms(value){
      this.viewSymptoms = value;
      //console.log(this.viewSymptoms);
      var result = ''
      if(this.viewSymptoms==0){
        result= 'Simple';
      }else{
        result= 'Advanced';
      }
      this.googleAnalyticsService.eventEmitter("View symptoms - page symptoms: "+result, "general", "2");
    }

    changeViewSummarySymptoms(value){
      this.viewSummarySymptoms = value;
      this.googleAnalyticsService.eventEmitter("View symptoms - summary: "+value, "general", "1");
    }

    changeSuggestedViewSuggestions(){
      if(this.viewSuggestion == 1){
        this.viewSuggestion = 0;
      }else{
        this.viewSuggestion = 1;
      }
      //console.log(this.viewSuggestion);
    }

    sharePatient(){
      document.getElementById("buttonShareTo").click();
    }

    createNewPatient(){
      this.goToStep('5.0', true);
      this.router.navigate(['clinical/dashboard/home']);
    }

    logIndex(index){
      this.indexExpandedElementGenes = index;
      this.expandedElement = this.infoGenesAndConditionsExomizer[index];
    }

    setIndexAndshowPanelGenes(contentPanelGenes, gene){
      var index = -1;
      for(var i = 0; i < this.infoGenesAndConditionsExomizer.length; i++) {
        if(this.infoGenesAndConditionsExomizer[i].name==gene){
          index=i;
          break;
        }
      }
      this.expandedElement = this.infoGenesAndConditionsExomizer[index];
      this.showPanelGenes(contentPanelGenes);
    }

    setIndexAndshowPanelGenes2(contentPanelGenes, gene){
      var index = -1;
      for(var i = 0; i < this.infoGenesAndConditionsPhen2Genes.length; i++) {
        if(this.infoGenesAndConditionsPhen2Genes[i].name==gene){
          index=i;
          break;
        }
      }
      this.expandedElement = this.infoGenesAndConditionsPhen2Genes[index];
      this.showPanelGenes(contentPanelGenes);
    }

    showPanelGenes(contentPanelGenes){
      var size= 'ModalClass-lg';
      if(this.infoGenesAndConditionsExomizer.length==0 && this.infoGenesAndConditionsPhen2Genes.length>0){
        size = 'ModalClass-sm';
      }
      let ngbModalOptions: NgbModalOptions = {
            windowClass: size
      };
      this.modalReference = this.modalService.open(contentPanelGenes, ngbModalOptions);
    }

    lauchPhen2Genes(){
      this.launchingPhen2Genes = true;
      var patientId = this.authService.getCurrentPatient().sub;
      var hposStrings =[];
      this.phenotype.data.forEach(function(element) {
        hposStrings.push(element.id);
      });
      var jsonfile = {
        "Phenotypes": hposStrings,
      };

     this.subscription.add( this.apiDx29ServerService.lauchPhene2Gene(patientId, jsonfile)
     .subscribe( (res : any) => {
       this.processPhenToGenesInfo(res.fileName, res.data, res.message);
     }, (err) => {
       console.log(err);
     }));
    }

    getLastPhen2GenesResults(){
      var patientId = this.authService.getCurrentPatient().sub;
     this.subscription.add( this.apiDx29ServerService.getLastPhen2GenesResults(patientId)
     .subscribe( (res : any) => {
       if(res.data!=null){
         this.processPhenToGenesInfo(res.fileName, res.data, res.message);
       }else{
         this.filePhen2GenesOnBlob = '';
         this.launchingPhen2Genes = false;
       }
     }, (err) => {
       console.log(err);
     }));
    }

    processPhenToGenesInfo(fileName, data, message){
      if(message=='found'){
        this.launchedPhen2genes=true;
      }
      this.filePhen2GenesOnBlob = fileName;
      this.infoGenesAndConditions = [];
      this.infoGenesAndConditionsPhen2Genes = [];
      this.sizeOfDiseases = 0;
      var listGenes = [];
       Object.keys(data).forEach(keyGen => {
         var dataForGene = [];
         var actualGeneInfo = data[keyGen].diseases;
         if(actualGeneInfo!=undefined){
           Object.keys(actualGeneInfo).forEach(keyDisease => {
             if(data[keyGen].diseases[keyDisease].is_defined_by.indexOf('#orphanet')>-1){
               dataForGene.push({"condition": data[keyGen].diseases[keyDisease].label, "idOrphanet": data[keyGen].diseases[keyDisease].id, "idOMIM": null, "value": false});
             }else if(data[keyGen].diseases[keyDisease].is_defined_by.indexOf('#omim')>-1){
               dataForGene.push({"condition": data[keyGen].diseases[keyDisease].label, "idOrphanet": null, "idOMIM": data[keyGen].diseases[keyDisease].id, "value": false});
             }
             this.sizeOfDiseases++;
           });
         }

        var colorScoredx29=this.selectScoreColor(data[keyGen].score.toFixed(2));

         this.infoGenesAndConditions.push({"name": keyGen, "data": dataForGene, "score": data[keyGen].score.toFixed(2), colorScoredx29:colorScoredx29});
         this.infoGenesAndConditionsPhen2Genes.push({"name": keyGen, "data": dataForGene, "score": data[keyGen].score.toFixed(2), colorScoredx29:colorScoredx29});
       });


      if(document.getElementById("idShowPanelWorkbench")!=null){
        document.getElementById("idShowPanelWorkbench").click();
      }else{
        if(document.getElementById("buttonChangeTab")!=null){
          //document.getElementById("buttonChangeTab").click();
        }
      }
      this.launchingPhen2Genes = false;
      if(this.actualStep == '3.2'){
        this.getRelatedConditionsview(false);
        //this.getRelatedConditions();
      }
    }

    continueAndCallPhen2Genes(){

      this.gettingRelatedConditions=false;
      this.loadingDiagnosisInfo=false;
      this.launchingPhen2Genes=false;
      this.uploadingGenotype=false;
      this.selectedItemsFilter=[];
      this.relatedConditions=[];

      document.getElementById("idShowPanelWorkbench").click();
      setTimeout(function () {
        document.getElementById("tabPhen2Genes").click();
        this.lauchPhen2Genes();

      }.bind(this), 200);

    }

    goToVersion(page){
      var url = '/clinical/'+page;
      this.router.navigate([url]);
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

    funShowOptionsSymptoms(contentOptionsSymptoms){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-sm' // xl, lg, sm
      };
      this.modalReference = this.modalService.open(contentOptionsSymptoms, ngbModalOptions);
    }

    changeExomiserStateSymptom(index){
      this.symptomsExomiser[index].checked = !this.symptomsExomiser[index].checked;
    }

    showMoreInfoDisease(diseaseIndex, disease){
      if(this.selectedDisease == diseaseIndex ){
        this.selectedDisease = -1;
      }else{
        this.selectedDisease = diseaseIndex;
      }
      if(this.selectedDisease != -1){
        this.loadSymptomsOfDiseaseForGraph(disease);
      }

    }

    loadSymptomsOfDiseaseForGraph(disease){
      this.loadingGraphSymptomFreq=true;
      this.fullListSymptoms = [];
      this.omimSymptoms = [];
      this.orphaSymptoms = [];
      this.actualDiseaseDesc = {};

      this.loadingSymptomsDataForGraph = true;
      var xrefs = disease.name.id;
      var listXRefs = [disease.name.id];
      //get symtoms
      var lang = this.authService.getLang();
      this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang,listXRefs,0)
      .subscribe( (res : any) => {
          var idDesease = listXRefs[0];
          var info = res[idDesease];
          this.parseOtherInfoSymptomsOfDisease(info);
          //console.log(info);
          if(info!=undefined){
            this.actualDiseaseDesc = {desc: info.desc, comment: info.comment};
            var listOfSymptoms = info.phenotypes
            if(Object.keys(listOfSymptoms).length>0){
              for(var indexSymptom in listOfSymptoms) {
                var comment = "";
                var def = "";
                if(listOfSymptoms[indexSymptom].desc!="None" && listOfSymptoms[indexSymptom].desc!=null){
                  def = listOfSymptoms[indexSymptom].desc;
                }
                if(listOfSymptoms[indexSymptom].comment!=""){
                  comment = listOfSymptoms[indexSymptom].comment;
                }
                var onlyOrpha = false;
                var frec = null;
                for(var i = 0; i < listOfSymptoms[indexSymptom].source.length; i++) {
                  if(listOfSymptoms[indexSymptom].source[i].indexOf( 'ORPHA' ) != -1){
                    this.orphaSymptoms.push({id:indexSymptom, name: listOfSymptoms[indexSymptom].name, def: def, comment: comment, synonyms: listOfSymptoms[indexSymptom].synonyms, frequency: listOfSymptoms[indexSymptom].frequency});
                    if(listOfSymptoms[indexSymptom].source.length<=1){
                      onlyOrpha=true;
                    }else{
                      frec =  listOfSymptoms[indexSymptom].frequency;
                    }
                  }
                }
                if(!onlyOrpha && listOfSymptoms[indexSymptom].source.length>0){
                  this.omimSymptoms.push({id:indexSymptom, name: listOfSymptoms[indexSymptom].name, def: def, comment: comment, synonyms: listOfSymptoms[indexSymptom].synonyms, frequency: frec});
                }
               }

            }
            var listOfOtherDiseasesSymptoms = info.children
            if(Object.keys(listOfOtherDiseasesSymptoms).length>0){
              for(var diseasesSymptoms in listOfOtherDiseasesSymptoms) {
                if(listOfOtherDiseasesSymptoms[diseasesSymptoms].phenotypes!=undefined){
                  var listOfOtherSymptoms = listOfOtherDiseasesSymptoms[diseasesSymptoms].phenotypes
                  for(var k in listOfOtherSymptoms) {
                     //console.log(k, listOfOtherSymptoms[k]);
                     var foundElement = this.searchService.search(this.phenotype.data,'id', k);
                     var foundElement2 = this.searchService.search(this.omimSymptoms,'id', k);
                     var foundElement3 = this.searchService.search(this.orphaSymptoms,'id', k);
                     if(!foundElement2 || !foundElement3){
                       var comment = "";
                       var def = "";
                       var frequency = null;
                       if(listOfOtherSymptoms[k].desc!="None" && listOfOtherSymptoms[k].desc!=null){
                         def = listOfOtherSymptoms[k].desc;
                       }
                       if(listOfOtherSymptoms[k].comment!=""){
                         comment = listOfOtherSymptoms[k].comment;
                       }else{
                         comment = "None"
                       }
                       if(listOfOtherSymptoms[k].frequency!=undefined){
                         frequency = listOfOtherSymptoms[k].frequency;
                       }
                       if(!foundElement2){
                         if(foundElement){
                           this.omimSymptoms.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: true, frequency: frequency});
                         }else{
                           this.omimSymptoms.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: false, frequency: frequency});
                         }
                       }
                       if(!foundElement3){
                         if(foundElement){
                           this.orphaSymptoms.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: true, frequency: frequency});
                         }else{
                           this.orphaSymptoms.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: false, frequency: frequency});
                         }
                       }

                     }
                  }
                }
              }
            }

            this.omimSymptoms.sort(this.sortService.GetSortOrder("name"));
            this.orphaSymptoms.sort(this.sortService.GetSortOrder("name"));
            //asign frequency of orpha to omim symptoms
            for(var i=0;i<this.omimSymptoms.length;i++)
              {
                for(var j=0;j<this.orphaSymptoms.length;j++){
                  if(this.omimSymptoms[i].id==this.orphaSymptoms[j].id){
                    this.omimSymptoms[i].frequency = this.orphaSymptoms[j].frequency;
                  }
                }

              }
              /*for(var i=0;i<this.phenotype.data.length;i++)
              {
                for(var j=0;j<this.orphaSymptoms.length;j++){
                  if(this.phenotype.data[i].id==this.orphaSymptoms[j].id){
                    this.phenotype.data[i].frequency = this.orphaSymptoms[j].frequency;
                  }
                }

              }*/
            this.checkOPatientSymptoms();
            this.checkOmimSymptoms();
            this.checkOrphaSymptoms();
            console.log(this.orphaSymptoms)
            // Llamada para coger los hijos de los sintomas
            // List IDs
            var symptomsOfDiseaseIds =[];
            this.fullListSymptoms.forEach(function(element) {
              symptomsOfDiseaseIds.push(element.id);
            });
            this.getSuccessors(symptomsOfDiseaseIds);

            this.calculateAll(symptomsOfDiseaseIds);
          }
      }, (err) => {
        console.log(err);
        this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
        this.loadingSymptomsOfDisease = false;
        this.loadingGraphSymptomFreq=false;
      }));

    }
    async getSuccessors(symptomsOfDiseaseIds){
      return new Promise(async function (resolve, reject) {
        var result = { status: 200, data: [], message: "Calcule Conditions score OK" }
        //obtengo los hijos de la lista completa
        this.subscription.add(this.apif29BioService.getSuccessorsOfSymptomsDepth(symptomsOfDiseaseIds)
        .subscribe( async (res1 : any) => {
            await this.getPredecessorsOrpha(); //padres de orpha
            await this.setFrequencies(res1);//magia
            await this.getfrequencies()//pintar
        }, (err) => {
          console.log(err);
        }));
        return resolve(result);
      }.bind(this))
    }

    parseOtherInfoSymptomsOfDisease(info){
      var clinical_course = [];
      if(Object.keys(info.clinical_course).length>0){
        for(var hpo in info.clinical_course) {
          clinical_course.push({hpo:hpo, info: info.clinical_course[hpo]});
        }
      }
      var clinical_modifier = [];
      if(Object.keys(info.clinical_modifier).length>0){
        for(var hpo in info.clinical_modifier) {
          clinical_modifier.push({hpo:hpo, info: info.clinical_modifier[hpo]});
        }
      }
      var xrefs = this.cleanOrphas(info.xrefs)
      this.actualRelatedDisease = {clinical_course: clinical_course, clinical_modifier: clinical_modifier, xrefs: xrefs, name: info.name};
    }

    cleanOrphas(xrefs){
      var res = [];
      var count = 0;
      for (var i = 0; i < xrefs.length; i++){
        if(xrefs[i].indexOf('ORPHA')!=-1 || xrefs[i].indexOf('OMIM')!=-1){
          if(xrefs[i].indexOf('ORPHA')!=-1){
            count++;
          }
          if(count<2){
            var value = xrefs[i].split(':');
            if(xrefs[i].indexOf('ORPHA')!=-1){
              res.push({name: 'Orphanet', id: value[1]});
            }else if(xrefs[i].indexOf('OMIM')!=-1){
              res.push({name: 'OMIM', id: value[1]});
            }

          }
        }

      }
      return res;
    }

    async getPredecessorsOrpha(){
      return new Promise(async function (resolve, reject) {
        var result = { status: 200, data: [], message: "Calcule Conditions score OK" }
        var symptomsOfDiseaseIds =[];
        this.orphaSymptoms.forEach(function(element) {
          symptomsOfDiseaseIds.push(element.id);
        });

        this.subscription.add(this.apif29BioService.​getPredecessorsOfSymptomsDepth(symptomsOfDiseaseIds)
        .subscribe( async (res1 : any) => {
          // Para cada res tengo que pedir info de la frequencia y guardar
          this.treeOrphaPredecessors=res1;
          await this.setPredecessorsOrpha()
          return resolve(result);
        }, (err) => {
          console.log(err);
          return resolve(result);
        }));

      }.bind(this))
    }


    async setPredecessorsOrpha(){
      var tamanotreeOrpha= Object.keys(this.treeOrphaPredecessors).length;
      if(tamanotreeOrpha>0){
        for (var ipos = 0; ipos < this.orphaSymptoms.length; ipos++){
          var result = [];
          var ojjToSearch = this.treeOrphaPredecessors[this.orphaSymptoms[ipos].id];
          var tamano= Object.keys(ojjToSearch).length;
          if(tamano>0){
            this.orphaSymptoms[ipos].tree = [];
            this.getTree(ipos, ojjToSearch, this.orphaSymptoms[ipos].frequency)
          }
        }
      }
    }

    getTree(index, ojjToSearch, frequency){
      var tamano= Object.keys(ojjToSearch).length;
      if(tamano>0){
        for(var j in ojjToSearch){
          var foundElement = this.searchService.search(this.orphaSymptoms[index].tree,'id', j);
          if(!foundElement){
            this.orphaSymptoms[index].tree.push({id:j,frequency:frequency});
          }
          var tamano2= Object.keys(ojjToSearch[j]).length;
          if(tamano2>0){
            this.getTree(index, ojjToSearch[j],frequency);
          }
        }
      }

    }

    async setFrequencies(list){
      // Recorrer todos los trees, y los ids duplicados me quedo con la freq mayor = padres de orpha.
      var parents = [];
      for (var ipos = 0; ipos < this.orphaSymptoms.length; ipos++){
        for(var jpos = 0; jpos < this.orphaSymptoms[ipos].tree.length; jpos++){
          var foundInParents = false
          for (var kpos=0;kpos<parents.length;kpos++){
            if(parents[kpos].id == this.orphaSymptoms[ipos].tree[jpos].id){
              if(this.hp_frequencies[parents[kpos].frequency]!=undefined){
                var parentFrequency = this.hp_frequencies[parents[kpos].frequency].present;
                if(this.hp_frequencies[this.orphaSymptoms[ipos].tree[jpos].frequency]!=undefined){
                  var orphaFrequency = this.hp_frequencies[this.orphaSymptoms[ipos].tree[jpos].frequency].present;
                  if(orphaFrequency > parentFrequency){
                    parents[kpos].frequency = this.orphaSymptoms[ipos].tree[jpos].frequency;
                  }
                  foundInParents = true;
                }
              }


            }
          }
          if(foundInParents == false){
            parents.push(this.orphaSymptoms[ipos].tree[jpos])
          }
        }
      }

      for (var i = 0; i < this.fullListSymptoms.length; i++){
        if(this.fullListSymptoms[i].frequency==null){
          var actualList = list[this.fullListSymptoms[i].id];
          var actualList2 ={}
          actualList2[this.fullListSymptoms[i].id]=actualList

          var found_in_symptom = false;
          // Comparando cada sintoma con orpha y los padres
          found_in_symptom = await this.completeFrequencies(i, this.fullListSymptoms[i].id, parents);

          /*if ((found_in_symptom == false) && (this.fullListSymptoms[i].succesors != undefined)) {
            // Comparando los hijos del sintoma con orpha y los padres
            for (var j=0; j<this.fullListSymptoms[i].succesors.length; j++) {
              this.completeFrequencies(i, this.fullListSymptoms[i].succesors[j], parents);
            }
          }*/
        }
      }

    }

    async completeFrequencies(index, id, parents){
      var foundSymptom = false;
      // Si el id está en la lista de Orpha o en los padres de la lista de orpha
      for (var ipos = 0; ipos < this.orphaSymptoms.length && !foundSymptom; ipos++){

        // Si el id está en la lista de Orpha
        if(id==this.orphaSymptoms[ipos].id){
          this.setFrequencyToSymptom(index,ipos,null,parents)
          foundSymptom=true;
        }
        // Si no busco en los padres de orpha
        else {
          for (var jpos = 0; jpos < this.orphaSymptoms[ipos].tree.length && !foundSymptom; jpos++){
            // Si está en los padres de la lista de orpha
            if(id==this.orphaSymptoms[ipos].tree[jpos].id){
              this.setFrequencyToSymptom(index,ipos,jpos,parents)
              foundSymptom=true;
            }
          }
        }
      }

      return foundSymptom;
    }

    async setFrequencyToSymptom(index,ipos,jpos,parents){
      if(this.fullListSymptoms[index].frequency == null){
        if(jpos == null) {
          this.fullListSymptoms[index].frequency = this.orphaSymptoms[ipos].frequency;
          this.orphaSymptoms[ipos].frequency = null;
        }
        else {
          this.fullListSymptoms[index].frequency = this.orphaSymptoms[ipos].tree[jpos].frequency;
          this.orphaSymptoms[ipos].tree[jpos].frequency = null;
        }
      }else if(this.fullListSymptoms[index].frequency!=null){
        //REVISAR ESTO PORQUE ES PELIGROSO, SI CAMBIAN LOS HPOS DE PRIORIDAD PUEDE DEJAR DE FUNCIONAR
        if(jpos == null) {
          if(this.fullListSymptoms[index].frequency>this.orphaSymptoms[ipos].frequency){
            this.fullListSymptoms[index].frequency = this.orphaSymptoms[ipos].frequency;
            this.orphaSymptoms[ipos].frequency = null;
          }
        }
        else {
          if(this.fullListSymptoms[index].frequency>this.orphaSymptoms[ipos].tree[jpos].frequency){
            this.fullListSymptoms[index].frequency = this.orphaSymptoms[ipos].tree[jpos].frequency;
            this.orphaSymptoms[ipos].tree[jpos].frequency = null;
          }
        }
      }

    }

    async getfrequencies() {
      //getInfo symptoms
      var hposStrins =[];
      this.fullListSymptoms.forEach(function(element) {
        if(element.frequency!=null){
          hposStrins.push(element.frequency);
        }

      });
      var lang = this.authService.getLang();
      await this.apif29BioService.getInfoOfSymptoms(lang,hposStrins)
      .subscribe( (res : any) => {
        var tamano= Object.keys(res).length;
        if(tamano>0){
          for(var i in res) {
            for (var j = 0; j < this.fullListSymptoms.length; j++) {
              if(res[i].id==this.fullListSymptoms[j].frequency){
                if(this.fullListSymptoms[j].frequencyInfo==undefined){
                  this.fullListSymptoms[j].frequencyInfo = {name:res[i].name, desc:res[i].desc};
                  this.fullListSymptoms[j].frequencyId= res[i].id
                }
              }
              this.fullListSymptoms[j].myCase = false;
              if((this.fullListSymptoms[j].patient) || (!this.fullListSymptoms[j].patient && this.fullListSymptoms[j].patientbutsuccessor)){
                this.fullListSymptoms[j].myCase = true;
              }
              this.fullListSymptoms[j].referenceCase = false;
              if((!this.fullListSymptoms[j].patient) || (this.fullListSymptoms[j].patient && (this.fullListSymptoms[j].orphanet || this.fullListSymptoms[j].omim)) || (this.fullListSymptoms[j].patient && !this.fullListSymptoms[j].orphanet && !this.fullListSymptoms[j].omim && this.fullListSymptoms[j].notpatientbutsuccessor)){
                this.fullListSymptoms[j].referenceCase = true;
              }
            }
          }
          //this.fullListSymptoms.sort(this.sortService.GetSortOrder("frequencyId"));
          for (var ki = 0; ki < this.fullListSymptoms.length; ki++) {
            if(this.fullListSymptoms[ki].frequency==undefined){
              this.fullListSymptoms[ki].frequencyId= "HP:0040289";
            }
          }
          this.fullListSymptoms.sort(this.sortService.GetSortTwoElements("frequency", "name"));
          this.fullListSymptoms.sort(this.sortService.GetSortSymptoms());
          this.fullListSymptoms.sort(this.sortService.GetSortSymptoms2());
        }

     }, (err) => {
       console.log(err);
     });
    }

    calculateAll(symptomsOfDiseaseIds){
      this.listGenericSymptoms = [];
      // Get predecessors
      this.subscription.add(this.apif29BioService.getSuccessorsOfSymptoms(symptomsOfDiseaseIds)
      .subscribe( (res1 : any) => {
        var successorsAllSymptoms=res1;
        // Añadir los succesors a la lista de symptoms
        Object.keys(successorsAllSymptoms).forEach(key => {
          Object.keys(successorsAllSymptoms[key]).forEach(keyValue=>{
            for(var i=0;i<this.fullListSymptoms.length;i++){
              if(this.fullListSymptoms[i].id==key){
                if(this.fullListSymptoms[i].id==key){
                  if(this.fullListSymptoms[i].succesors==undefined){
                    this.fullListSymptoms[i].succesors = [keyValue]
                  }
                  else{
                    this.fullListSymptoms[i].succesors.push(keyValue)
                  }
                }
              }
            }
          });
        });

        //console.log(this.fullListSymptoms)
        // Separar los sintomas genericos a  this.listGenericSymptoms
        var symptonmPhen=false;
        for(var i=0;i<this.fullListSymptoms.length;i++){
          symptonmPhen=false;
          for (var j=0;j<this.phenotype.data.length;j++){
            if(this.phenotype.data[j].id==this.fullListSymptoms[i].id){
              symptonmPhen=true;
            }
          }
          if(symptonmPhen==false){
            this.listGenericSymptoms.push(this.fullListSymptoms[i])
          }
          else{
            for(var j=0;j<this.omimSymptoms.length;j++){
              if(this.fullListSymptoms[i].id==this.omimSymptoms[j].id){
                this.listGenericSymptoms.push(this.fullListSymptoms[i])
              }
            }
            for(var j=0;j<this.orphaSymptoms.length;j++){
              if(this.fullListSymptoms[i].id==this.orphaSymptoms[j].id){
                this.listGenericSymptoms.push(this.fullListSymptoms[i])
              }
            }
          }
        }
        // Eliminar los repetidos
        this.listGenericSymptoms= this.listGenericSymptoms.filter((valor, indiceActual, arreglo) => arreglo.indexOf(valor) === indiceActual);
        //this.fullListSymptoms=this.compareListAndUpdateChecksForPredecessors(this.fullListSymptoms,this.phenotype.data,this.listGenericSymptoms)

        //console.log(this.listGenericSymptoms)
        // Asi ya tenemos por un lado los genericos y por otro los de phenotype

        this.listSymptomsMe=[];
        this.listSymptomsGeneric=[];
        this.listSymptomsMeGeneric=[];

        // Calculo la información del los diagramas
        this.calculeChartSymptomsInfo(); //(listas de cada caso)
        var listSymptomsMeWithoutSuccessors=[]

        // Diagrama de Venn
        // De mis sintomas tengo que quitar los que son succesors para el data
        // Es decir, solo quedarme con los de phenotype.data
        for(var i=0;i<this.phenotype.data.length;i++){
          listSymptomsMeWithoutSuccessors.push(this.phenotype.data[i].name)
        }

        // Lista de datos de entrada para la representacion del diagrama de Venn
        this.chartDataVenn = [];
        this.chartDataVenn = [
          {sets: ['My case'], size: this.listSymptomsMe.length,label: this.translate.instant("patdiagdashboard.panel3MyCase"),data:listSymptomsMeWithoutSuccessors},
          {sets: ['Reference case'], size: this.listSymptomsGeneric.length, label:this.translate.instant("patdiagdashboard.panel3ReferenceCase"),data:this.listSymptomsGeneric},
          {sets: ['My case','Reference case'], size: this.listSymptomsMeGeneric.length,data:this.listSymptomsMeGeneric}
        ];

        this.drawCharts();
        this.loadingGraphSymptomFreq= false;

      }, (err) => {
        console.log(err);
        this.loadingGraphSymptomFreq=false;
        this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
      }));
    }

    checkOmimSymptoms(){
      for(var i = 0; i < this.omimSymptoms.length; i++) {
        var foundElement = this.searchService.search(this.fullListSymptoms,'id', this.omimSymptoms[i].id);
        if(foundElement){
          for(var j = 0; j < this.fullListSymptoms.length; j++) {
            if(this.fullListSymptoms[j].id==this.omimSymptoms[i].id){
              this.fullListSymptoms[j].omim= true;
            }
          }
        }else{
          this.fullListSymptoms.push({id:this.omimSymptoms[i].id, name: this.omimSymptoms[i].name, def: this.omimSymptoms[i].def, comment: this.omimSymptoms[i].comment, synonyms: this.omimSymptoms[i].synonyms, group: 'none', omim: true, orphanet: false, patient: false, frequency: this.omimSymptoms[i].frequency});
        }
      }
    }

    checkOrphaSymptoms(){
      for(var i = 0; i < this.orphaSymptoms.length; i++) {
        var foundElement = this.searchService.search(this.fullListSymptoms,'id', this.orphaSymptoms[i].id);
        if(foundElement){
          for(var j = 0; j < this.fullListSymptoms.length; j++) {
            if(this.fullListSymptoms[j].id==this.orphaSymptoms[i].id){
              this.fullListSymptoms[j].orphanet= true;
            }
          }
        }else{
          //this.fullListSymptoms.push({id:this.orphaSymptoms[i].id, name: this.orphaSymptoms[i].name, def: this.orphaSymptoms[i].def, comment: this.orphaSymptoms[i].comment, synonyms: this.orphaSymptoms[i].synonyms, group: 'none', omim: false, orphanet: true, patient: false});
        }
      }
    }

    checkOPatientSymptoms(){
      this.fullListSymptoms = [];
      for(var i = 0; i < this.phenotype.data.length; i++) {
        var foundElement = this.searchService.search(this.fullListSymptoms,'id', this.phenotype.data[i].id);
        if(foundElement){
          for(var j = 0; j < this.fullListSymptoms.length; j++) {
            if(this.fullListSymptoms[j].id==this.phenotype.data[i].id){
              this.fullListSymptoms[j].patient= true;
            }
          }
        }else{
          var frequency = null;
          if(this.phenotype.data[i].frequency!=undefined){
            if(this.phenotype.data[i].frequency!=null){
              //frequency = this.phenotype.data[i].frequency
            }
          }
          this.fullListSymptoms.push({id:this.phenotype.data[i].id, name: this.phenotype.data[i].name, def: this.phenotype.data[i].def, comment: this.phenotype.data[i].comment, synonyms: this.phenotype.data[i].synonyms, group: 'none', omim: false, orphanet: false, patient: true, frequency: frequency});
        }
      }
    }

    calculeChartSymptomsInfo(){
      this.chartSize_MeGeneric=0;
      this.listSymptomsMe=[];
      this.listSymptomsGeneric=[];
      this.listSymptomsMeGeneric=[];

      // Calcule Me
      for(var i=0;i<this.phenotype.data.length;i++){
        this.listSymptomsMe.push(this.phenotype.data[i].name)
      }
      // Calcule Generic
      for(var i=0;i<this.listGenericSymptoms.length;i++){
        this.listSymptomsGeneric.push(this.listGenericSymptoms[i].name)
      }
      // Calcule size Me-Generic
      for(var i=0;i<this.phenotype.data.length;i++){
        for(var j=0;j<this.listGenericSymptoms.length;j++){
          if(this.phenotype.data[i].id==this.listGenericSymptoms[j].id){
            this.listSymptomsMeGeneric.push(this.phenotype.data[i].name)
            this.chartSize_MeGeneric=this.chartSize_MeGeneric+1;
          }
        }
      }

      var resultListSuccesors=this.compareListAndUpdateChecksForPredecessors(this.fullListSymptoms,this.phenotype.data,this.listGenericSymptoms)
      for(var i=0;i<resultListSuccesors.length;i++){
        if(resultListSuccesors[i].patientbutsuccessor==true){
          this.listSymptomsMeGeneric.push(resultListSuccesors[i].name)
          this.listSymptomsGeneric.push(resultListSuccesors[i].name)
        }
        if(resultListSuccesors[i].notpatientbutsuccessor==true){
          this.listSymptomsMeGeneric.push(resultListSuccesors[i].name)
          this.listSymptomsMe.push(resultListSuccesors[i].name)
        }
      }
      this.listSymptomsGeneric= this.listSymptomsGeneric.filter((valor, indiceActual, arreglo) => arreglo.indexOf(valor) === indiceActual);
      this.listSymptomsMeGeneric= this.listSymptomsMeGeneric.filter((valor, indiceActual, arreglo) => arreglo.indexOf(valor) === indiceActual);
      this.listSymptomsMe= this.listSymptomsMe.filter((valor, indiceActual, arreglo) => arreglo.indexOf(valor) === indiceActual);

    }

    compareListAndUpdateChecksForPredecessors(totalList,p1,p2){
      // this.fullListSymptoms[j].notpatientbutsuccessor= true;
      // p1:pheno
      // p2:generic
      for(var i=0;i<totalList.length;i++){
        // Comparo los de la disease con p1 (patient)
        // tengo que separar los que son de la lista de p1, para comparar el resto con la lista de p1
        var foundInP1=false;
        for(var k= 0; k< p1.length;k++){
          if(p1[k].id==totalList[i].id){
            foundInP1 = true;
          }
        }
        if(foundInP1==false){
          for(var j=0;j<p1.length;j++){
            // miro si el de la total es padre de alguno de p1: si en la lista de sucesores del total esta incluido p1
            if(totalList[i].succesors!=undefined){
              if(totalList[i].succesors.includes(p1[j].id)){
                totalList[i].patientbutsuccessor= true;
              }
            }
          }
        }
      }
      for(var i=0;i<totalList.length;i++){
        // Comparo patient con p2(Disease):
        // tengo que separar los que son de la lista de p2, para comparar el resto con la lista de p2
        var foundInP2 = false;
        for(var k= 0; k< p2.length;k++){
          if(p2[k].id==totalList[i].id){
            foundInP2 = true;
          }
        }
        if(foundInP2==false){
          // Recorro entonces p2 y comparo los de la lista p2 con los que tengo
          for(var j=0;j<p2.length;j++){
            if(totalList[i].succesors!=undefined){
              // miro si el de la total es padre de alguno de p2: si en la lista de sucesores del total esta incluido p2
              if(totalList[i].succesors.includes(p2[j].id)){
                totalList[i].notpatientbutsuccessor= true;
              }
            }
          }
        }
      }
      return totalList;
    }


    drawCharts(){
      // Dibujo los gráficos
      // Elimino todo lo que hubiese (limpio la pantalla)
      d3.selectAll("svg").remove();
      d3.selectAll(".venntooltip").remove();
      d3.selectAll(".text").remove();

      var venn=document.getElementById('chartVenn')
      if(venn!=null){
        venn.insertAdjacentHTML('beforeend', '<svg id ="venn" viewBox="0 0 500 340" [style.margin-left.px]= "-(((venn.offsetWidth)/2)+(margin.left/2))"></svg>');

        this.createChartVenn();

        //this.redrawNewSize=true

        // Check if the lists have info- if not svg size to 0

        if(this.chartDataVenn.length==0){
          var graphVennSvg=document.getElementById('venn')
          graphVennSvg.style.height = "0px";
          graphVennSvg.style.width = "0px";
        }
      }


    }

    createChartVenn(){
      // --- First graph --------------------------------------------------------------------------
      // 1. create Venn diagram

      let elementVenn = this.chartContainerVenn.nativeElement;

      this.widthVenn = elementVenn.offsetWidth - this.margin.left - this.margin.right;
      this.heightVenn = elementVenn.offsetHeight - this.margin.top - this.margin.bottom;

      if(this.listSymptomsMeGeneric.length==0){
        //this.widthVenn = elementVenn.offsetWidth - 4*this.margin.left - 4*this.margin.right;
        //this.heightVenn = elementVenn.offsetHeight - 4*this.margin.top - 4*this.margin.bottom;
        document.getElementById('venn').remove()
        var vennSvg=document.getElementById('chartVenn')
        vennSvg.insertAdjacentHTML('beforeend', '<svg id ="venn" viewBox="0 0 500 380" [style.margin-left.px]= "-(({{venn.offsetWidth}})/2)+({{margin.left}}/2))"></svg>');
      }

      //this.chartDataVenn.sort(function(a:any,b:any) { return b.size - a.size; })
      //console.log(this.chartDataVenn)
      this.chartVenn = venn.VennDiagram()
      let svg1 = d3.select("#venn")
        .datum(this.chartDataVenn)
        .call(this.chartVenn)
        .attr('width', this.widthVenn)
        .attr('height', this.heightVenn);


      svg1.selectAll("g").sort(function(a:any,b:any) { return b.size - a.size; })
      svg1.selectAll("svg").attr("class","venn2");

      // 2. Add style to venn diagram
      //var colors2 = d3.scaleLinear().domain([0, this.chartDataVenn.length]).range(<any[]>['red', 'blue']);
      /*svg1.selectAll('.venn-circle path').transition()
        .style('fill', (d, i) => colors2(i));*/
      if(this.listSymptomsMe.length>0){
        if(this.listSymptomsGeneric.length>0){
          svg1.selectAll(".venn-circle path")
          .style("fill-opacity", .4)
          .style("stroke-width", 1)
          .style("stroke-opacity", 1)
          .style("stroke", "fff")
        }
        else{
          svg1.selectAll(".venn-circle path")
          .style("fill-opacity", .4)
          .style("stroke-width", 1)
          .style("stroke-opacity", 1)
          .style("stroke", "fff")
          .style("fill","#1f77b4")
        }
      }
      else{
        svg1.selectAll(".venn-circle path")
          .style("fill-opacity", .4)
          .style("stroke-width", 1)
          .style("stroke-opacity", 1)
          .style("stroke", "fff")
          .style("fill","#ff7f0e")
      }
      svg1.selectAll(".venn-circle text")
        .style("font-size","14px")
        .style("fill","black")
        .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');

      // 3. Add a tooltip
      var tooltip = d3.select("#chartVenn").append("div")
        .attr("class", "venntooltip")
        .attr("data-html", "true");


      var graphOnClick=[];
      for(var i=0;i<this.chartDataVenn.length;i++){
        graphOnClick.push(false)
      }
      var chartData=this.chartDataVenn;
      var lastD=undefined;
      var listVennSelected=[];
      var lang=this.authService.getLang();
      // 4. add listeners to all the groups to display tooltip on mouseover
      svg1.selectAll("g").on("click", function(d:any, i) {
        for(var i=0;i<chartData.length;i++){
          if(d==chartData[i]){
            lastD=d;
            graphOnClick[i]=!graphOnClick[i]
            //console.log(graphOnClick[i])
            if(graphOnClick[i]==true){
              // sort all the areas relative to the current item
              venn.sortAreas(svg1, d);
              tooltip.transition().duration(400)
              .style("fill-opacity", 0)
              .style("stroke-width", 1)
              .style("stroke-opacity", 1)
              .style("stroke", "fff")
              .style("border","none");
              tooltip.html("");

              // Display a tooltip
              tooltip.transition().duration(400)
              .style("fill-opacity", .8)
              .style("stroke-width", 2)
              .style("stroke-opacity", 1)
              .style("display", "block")
              .style("position", "absolute")
              .style("background-color","white")
              .style("color","black")
              .style("border","1px solid black")
              .style("z-index","9999");;

              // tooltim html content
              var symptomsAreaList="";
              for(var j=0;j<d.data.length;j++){
                symptomsAreaList=symptomsAreaList+'<li style="float: left;width: 40%; margin-left:3%">'+d.data[j]+'</li>';
              }
              var nameArea="";
              if(d.label!=undefined){
                nameArea=d.label
              }
              else{
                nameArea="common symptoms"
              }

              if(lang=='es'){
                if(d.data.length==1){
                  tooltip.html('<div><button type="button" class="close" aria-label="Close" style="padding-right:3%"> <span aria-hidden="true">&times;</span></button></div><div> En el área <b>'+ nameArea +"</b> hay "+d.data.length + " síntoma: <br> <ul>"+symptomsAreaList+"</ul></div>");
                }
                else{
                  tooltip.html('<div><button type="button" class="close" aria-label="Close" style="padding-right:3%"> <span aria-hidden="true">&times;</span></button></div><div> En el área <b>'+ nameArea +"</b> hay "+d.data.length + " síntomas: <br> <ul>"+symptomsAreaList+"</ul></div>");
                }
              }
              else{
                if(d.data.length==1){
                  tooltip.html('<div><button type="button" class="close" aria-label="Close" style="padding-right:3%"> <span aria-hidden="true">&times;</span></button></div><div>In <b>'+ nameArea +" area</b> there is "+d.data.length + " symptom: <br> <ul>"+symptomsAreaList+"</ul></div>");
                }
                else{
                  tooltip.html('<div><button type="button" class="close" aria-label="Close" style="padding-right:3%"> <span aria-hidden="true">&times;</span></button></div><div>In <b>'+ nameArea +" area</b> there are "+d.data.length + " symptoms: <br> <ul>"+symptomsAreaList+"</ul></div>");
                }
              }
              tooltip
              .style("padding-top","2%")
              .style("padding-left","3%")
              .style("padding-bottom","2%")
              // highlight the current path
              var selection = d3.select(this).transition("tooltip").duration(400);
              //console.log(selection)
              //console.log(this)
              listVennSelected.push({d:d,element:this,label:d.label})
              if(d.label!=undefined){
                selection.select("path")
                  .style("stroke-width", 3)
                  .style("fill-opacity", .7)
                  .style("stroke-opacity", 1)
                  .style("color","white");

                selection.select("text")
                  .style("fill","white");
                }
              else{
                selection.select("path")
                  .style("stroke-width", 3)
                  .style("fill-opacity", .5)
                  .style("stroke-opacity", 1)
                  .style("color","white");

                selection.select("text")
                  .style("font-size","14px")
                  .style("fill","white")
                  .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
              }
              tooltip.select("button").on("click",function(){
                //console.log(chartData)
                for(var i=0;i<chartData.length;i++){
                  if(lastD==chartData[i]){
                    //console.log(graphOnClick)
                    //console.log("click")
                    svg1.selectAll("g").sort(function(a:any,b:any) { return b.size - a.size; })
                    svg1.selectAll(".venn-intersection path")
                      .style("fill-opacity", 0)
                    svg1.selectAll(".venn-circle path")
                      .style("fill-opacity", .4)
                      .style("stroke-width", 1)
                      .style("stroke-opacity", 1)
                      .style("stroke", "fff");
                    svg1.selectAll(".venn-circle text")
                      .style("font-size","14px")
                      .style("fill","black")
                      .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
                    tooltip.transition().duration(400)
                      .style("background-color","transparent")
                      .style("fill-opacity", 0)
                      .style("stroke-width", 1)
                      .style("stroke-opacity", 1)
                      .style("stroke", "fff")
                      .style("border","none")

                    tooltip.html("");
                    graphOnClick[i]=false;
                    listVennSelected=[];
                    /*console.log(graphOnClick[i])
                    console.log(i)
                    console.log(graphOnClick)*/
                  }
                }
              })

            }
            else{
              svg1.selectAll(".venn-intersection path")
              .style("fill-opacity", 0)
              /*svg1.selectAll('.venn-circle path').transition()
              .style('fill', (d, i) => colors2(i));*/
              svg1.selectAll(".venn-circle path")
                .style("fill-opacity", .4)
                .style("stroke-width", 1)
                .style("stroke-opacity", 1)
                .style("stroke", "fff");
              svg1.selectAll(".venn-circle text")
                .style("font-size","14px")
                .style("fill","black")
                .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
              tooltip.transition().duration(400)
                .style("fill-opacity", 0)
                .style("stroke-width", 1)
                .style("stroke-opacity", 1)
                .style("stroke", "fff")
                .style("border","none")
                .style("background-color","transparent")
              tooltip.html("");
              listVennSelected=[];
            }
          }
          else{
            //console.log(listVennSelected)
            graphOnClick[i]=false;

            if(listVennSelected.length>0){
              //console.log(listVennSelected.length)
              for(var j=0;j<listVennSelected.length;j++){
                if(listVennSelected[j].d==chartData[i]){
                  //console.log(j)
                  var selection2 = d3.select(listVennSelected[j].element).transition("tooltip").duration(400);
                  //console.log(selection2)
                  if(listVennSelected[j].label!=undefined){
                    //console.log(selection)
                    selection2.select("path")
                      .style("fill-opacity", .4)
                      .style("stroke-width", 1)
                      .style("stroke-opacity", 1)
                      .style("stroke", "fff");

                    selection2.select("text")
                      .style("font-size","14px")
                      .style("fill","black")
                      .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
                  }
                  else{
                    selection2.select("path")
                      .style("fill-opacity", 0)

                    selection2.select("text")
                      .style("fill","black");
                  }
                }
              }
            }
          }
        }
      })
      svg1.selectAll("g").on("mouseover", function(d:any, i) {
        var selection = d3.select(this).transition("tooltip").duration(400);
        for(var i=0;i<graphOnClick.length;i++){
          if(graphOnClick[i]==false){
            if(d.label!=undefined){
              //console.log(selection)
              selection.select("path")
                  .style("stroke-width", 3)
                  .style("fill-opacity", .7)
                  .style("stroke-opacity", 1)
                  .style("color","white");

              selection.select("text")
                .style("font-size","14px")
                .style("fill","white")
                .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
            }
            else{
              selection.select("path")
              .style("stroke-width", 3)
              .style("fill-opacity", .5)
              .style("stroke-opacity", 1)
              .style("color","white");

              selection.select("text")
                .style("font-size","14px")
                .style("fill","white")
                .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
            }
          }
        }
      });
      svg1.selectAll("g").on("mouseout", function(d:any, i) {
        //console.log(graphOnClick)
        svg1.selectAll("g").sort(function(a:any,b:any) { return b.size - a.size; })
        var selection = d3.select(this).transition("tooltip").duration(400);
        for(var i=0;i<chartData.length;i++){
          if(d==chartData[i]){
            if(graphOnClick[i]==false){
              /*svg1.selectAll('.venn-circle path').transition()
              .style('fill', (d, i) => colors2(i));*/
              if(d.label!=undefined){
                selection.select("path")
                  .style("fill-opacity", .4)
                  .style("stroke-width", 1)
                  .style("stroke-opacity", 1)
                  .style("stroke", "fff")
                selection.select("text")
                  .style("font-size","14px")
                  .style("fill","black")
                  .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
              }
              else{
                selection.select("path")
                .style("fill-opacity", 0)
              }
            }
          }
        }
        var anySelected=false;
        for(var i=0;i<graphOnClick.length;i++){
          if(graphOnClick[i]==true){
            anySelected=true;
          }
        }
        if(anySelected==false){
          tooltip.transition().duration(400)
            .style("fill-opacity", 0)
            .style("stroke-width", 1)
            .style("stroke-opacity", 1)
            .style("stroke", "fff")
            .style("border","none");
          tooltip.html("");
        }
      });
    }

    loadShowIntroWizard(){
      this.subscription.add( this.http.get(environment.api+'/api/users/showintrowizard/'+this.authService.getIdUser())
        .subscribe( (res : any) => {
          this.showIntroWizard = res.showIntroWizard
          this.eventsService.broadcast('showIntroWizard', this.showIntroWizard);
          this.getActualStep(this.authService.getCurrentPatient().sub);

        }, (err) => {
          console.log(err);
        }));
    }

    setShowIntroWizard(showIntroWizard2:boolean){
      var object = {showIntroWizard:showIntroWizard2}
      this.subscription.add( this.http.put(environment.api+'/api/users/showintrowizard/'+this.authService.getIdUser(), object)
      .subscribe( (res : any) => {
        this.showIntroWizard = showIntroWizard2;
        this.eventsService.broadcast('showIntroWizard', this.showIntroWizard);
       }, (err) => {
         console.log(err);
       }));

    }

    showOptions($event){
      if($event.checked){
        this.setShowIntroWizard(false);
      }else{
        this.setShowIntroWizard(true);
      }
    }

    setNotAnalyzeGeneticInfo(){
      //this.notAnalyzeGeneticInfo = !this.notAnalyzeGeneticInfo;
      this.notAnalyzeGeneticInfo = true;
      if(this.notAnalyzeGeneticInfo){
        this.filename = '';
      }
    }

    setNotAnalyzeGeneticInfo2(){
      this.notAnalyzeGeneticInfo = false;
    }

    orderFilesNcr(field){
      this.selectedOrderFilesNcr = field;
      if(field=='lastModified'){
        this.docsNcr.sort(this.sortService.DateSortFiles("lastModified"));
      }else if(field=='extension'){
        this.docsNcr.sort(this.sortService.GetSortFilesNcrType("extension"));
      }else{
        this.docsNcr.sort(this.sortService.GetSortFilesNcrName(field, this.lang));
      }
    }

    orderFilesOthers(field){
      this.selectedOrderFilesOther = field;
      if(field=='lastModified'){
        this.otherDocs.sort(this.sortService.DateSortFiles("lastModified"));
      }else{
        this.otherDocs.sort(this.sortService.GetSortOtherFiles(field));
      }
    }

    setStateDisease(index,info, $event){
      this.topRelatedConditions[index].checked = $event.checked;
      var indexElement = this.searchService.searchIndexLevel2(this.relatedConditions,'name','id', this.topRelatedConditions[index].name.id);
      this.relatedConditions[indexElement].checked= this.topRelatedConditions[index].checked;
      this.saveRelatedConditions();
    }

    saveRelatedConditions(){
      if(this.authGuard.testtoken() && !this.savingDiagnosis){
        this.savingDiagnosis = true;
        var obtToSave = [];
        for(var i = 0; i < this.relatedConditions.length; i++) {
          delete this.relatedConditions[i].symptoms;
          delete this.relatedConditions[i].xrefs;
          //delete this.relatedConditions[i].genes;
        }

        this.subscription.add( this.http.put(environment.api+'/api/diagnosis/relatedconditions/'+this.diagnosisInfo._id, this.relatedConditions)
        .subscribe( (res : any) => {
          this.diagnosisInfo.relatedConditions = res.relatedConditions;//relatedConditions
          //this.diagnosisInfo = res.diagnosis;
          this.savingDiagnosis = false;
          this.getSymptomsApi2();

          //this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
         }, (err) => {
           console.log(err.error);
           this.toastr.error('', this.translate.instant("generics.error try again"));
           this.savingDiagnosis = false;
         }));
      }
    }

    changeViewOptionNcr(){
      var value = ''
      if(this.viewOptionNcr == 1){
        this.viewOptionNcr = 0;
        value = 'cards';
      }else{
        this.viewOptionNcr = 1;
        value = 'list';
      }
      this.googleAnalyticsService.eventEmitter("View ncr: "+value, "general", "1");
    }

    loat10More(){
      this.indexListRelatedConditions=this.indexListRelatedConditions+10;
      this.renderMap();
    }

    getNumberOfSymptomsExo(){
      this.numberOfSymptomsExo = 0;
      for(var i=0;i<this.symptomsExomiser.length;i++){
        if(this.symptomsExomiser[i].checked){
          this.numberOfSymptomsExo++;
        }
      }
    }

    getTotalReports(){
      var sum =  this.docsNcr.length+ this.otherDocs.length;
      return sum;
    }

    setShowSwal(showWizard){
      if(showWizard){
        this.showIntroWizard = true
        this.goToStep('1.0', false);
        this.setMaxStep('1.0');
      }
      this.setShowSwalIntro()

    }

    setShowSwalIntro(){
      var patientId = this.selectedPatient.sub;
      var objectData = { email: this.myEmail};
      this.subscription.add( this.http.post(environment.api+'/api/updateshowSwalIntro/'+patientId, objectData)
      .subscribe( (res : any) => {
        console.log(res);
       }, (err) => {
         console.log(err);
       }));
    }

    detectLanguage2(testLangText){
      this.subscription.add( this.apiDx29ServerService.getDetectLanguage(testLangText)
      .subscribe( (res : any) => {
        this.langToExtract=res[0].language;
      }, (err) => {
        console.log(err);
      }));
    }

    downloadToTxt(file){
      //{{accessToken.blobAccountUrl}}{{accessToken.containerName}}/{{onefile.origenFile.name}}{{accessToken.sasToken}}
      var url = this.accessToken.blobAccountUrl+ this.accessToken.containerName + '/' + file.origenFile.name + this.accessToken.sasToken;
      this.subscription.add( this.http.get(url)
       .subscribe( (res : any) => {
         var originalText = res.originalText;
         var dateNow = new Date();
         var stringDateNow = this.dateService.transformDate(dateNow);
         var nameFile   = "SymptomsExtracted_Dx29_"+stringDateNow+".txt";
         this.download(originalText, nameFile,'text/plain')
        }, (err) => {
          console.log(err);
        }));
    }

    download(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    sendEmailToDev(params){
      if(!this.sendingToDev){
        this.sendingToDev = true;
        this.subscription.add( this.http.post(environment.api+'/api/feedbackdev', params)
        .subscribe( (res : any) => {
          this.sendingToDev = false;
         }, (err) => {
           console.log(err);
           this.sendingToDev = false;
         }));
      }

    }

}
