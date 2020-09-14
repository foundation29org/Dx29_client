import { Component, ViewChild, OnInit, ElementRef, OnDestroy, Input  } from '@angular/core';
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
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { ExomiserService } from 'app/shared/services/exomiser.service';
import {ExomiserHttpService} from 'app/shared/services/exomiserHttp.service';
import { Apif29SrvControlErrors } from 'app/shared/services/api-f29srv-errors';
import Swal from 'sweetalert2';
import { sha512 } from "js-sha512";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { HighlightSearch} from 'app/shared/services/search-filter-highlight.service';
import { TextTransform } from 'app/shared/services/transform-text.service';
//para la parte de genes
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgxHotjarService } from 'ngx-hotjar';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { BlobStoragePedService } from 'app/shared/services/blob-storage-ped.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';

import { Subscription } from 'rxjs/Subscription';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import { Subject } from 'rxjs/Rx';
import {animate, state, style, transition, trigger} from '@angular/animations';

declare var JSZipUtils: any;
declare var Docxgen: any;
declare var pdfjsLib: any;

// State Flags constant declaration
let phenotypesinfo = [];

@Component({
    selector: 'app-diagnosis',
    templateUrl: './diagnosis2.component.html',
    styleUrls: ['./diagnosis2.component.scss'],
    providers: [PatientService, ApiDx29ServerService,ExomiserService,ExomiserHttpService,Apif29SrvControlErrors,Apif29BioService, Apif29NcrService],
    animations: [
      trigger('detailExpand', [
        state('collapsed', style({height: '0px', minHeight: '0'})),
        state('expanded', style({height: '*'})),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      ]),
    ]
})

export class DiagnosisComponent2 implements OnInit, OnDestroy  {
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
    filename: string = '';
    filesVcf: any = [];
    infoGenesAndConditions: any = [];
    infoGenesAndConditionsExomizer: any = [];
    infoGenesAndConditionsPhenolyzer: any = [];
    checksChanged: boolean = false;
    lastInfoPetition: any = {};
    switchOrigin: string = 'BOTH';
    //BLOBS
    uploadingGenotype: boolean = false;
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

    launchingPhenolyzer: boolean = false;
    filePhenolyzerOnBlob: string = '';
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

    exploreSymptomsPhenolizer: boolean = false;
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
    contentDownloadFiles: any;
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
    listOfphenotypesinfo: any = [];
    listOfphenotypesinfoOld: any = [];
    listOfFilteredSymptoms: any = [];
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
    viewSymptoms: number = 0;
    selectedPatient: any = {};

    constructor(private http: HttpClient, private authService: AuthService, public toastr: ToastrService, public translate: TranslateService, private authGuard: AuthGuard, private elRef: ElementRef, private router: Router, private patientService: PatientService, private sortService: SortService,private searchService: SearchService,
    private modalService: NgbModal ,private blob: BlobStorageService, private blobped: BlobStoragePedService, public searchFilterPipe: SearchFilterPipe, private highlightSearch: HighlightSearch, private apiDx29ServerService: ApiDx29ServerService, public exomiserService:ExomiserService,public exomiserHttpService:ExomiserHttpService,private apif29SrvControlErrors:Apif29SrvControlErrors, private apif29BioService:Apif29BioService, private apif29NcrService:Apif29NcrService,
    protected $hotjar: NgxHotjarService, private textTransform: TextTransform) {
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
      this.launchingPhenolyzer=false;
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
        "VariantEffectFilters": {"remove": ["UPSTREAM_GENE_VARIANT", "INTERGENIC_VARIANT", "REGULATORY_REGION_VARIANT", "CODING_TRANSCRIPT_INTRON_VARIANT", "NON_CODING_TRANSCRIPT_INTRON_VARIANT", "SYNONYMOUS_VARIANT", "DOWNSTREAM_GENE_VARIANT", "SPLICE_REGION_VARIANT"]},
        "genomeAssembly": 'hg19'
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
    }

    initVarsPrograms(){
      var d = new Date();
      var year = d.getFullYear();
      var month = d.getMonth();
      var day = d.getDate();
      this.dateGeneticProgram1 = new Date(year -5, month, day);
    }

    ngOnInit() {
      console.log("ng on init")
      this.exomiserHttpService.cancelPendingRequests();
      this.lang = this.authService.getLang();
      if(this.authService.getCurrentPatient()==null){
        this.router.navigate(['clinical/dashboard/home']);
      }else{
        this.selectedPatient = this.authService.getCurrentPatient();
        this.getActualStep(this.authService.getCurrentPatient().sub);
        this.loadAllData();
      }
    }

    getActualStep(patientId:string){
      this.subscription.add( this.http.get(environment.api+'/api/case/stepclinic/'+patientId)
          .subscribe( (res : any) => {
            console.log(this.actualStep);
            this.actualStep = res;
            this.maxStep = res;
            this.loadedStep = true;
            //si ya había comenzado el wizard y no lo ha terminado, preguntar si quiere continuar donde lo dejó o empezar de nuevo
            if(this.actualStep>"0.0" && this.actualStep<"5.0"){
              Swal.fire({
                  title: this.translate.instant("patnodiagdashboard.swalContinue.msgtitle1"),
                  text:  this.translate.instant("patnodiagdashboard.swalContinue.msg1"),
                  showCancelButton: true,
                  confirmButtonColor: '#0CC27E',
                  cancelButtonColor: '#f9423a',
                  confirmButtonText: this.translate.instant("patnodiagdashboard.swalContinue.btn1"),
                  cancelButtonText: this.translate.instant("patnodiagdashboard.swalContinue.btn2"),
                  showLoaderOnConfirm: true,
                  allowOutsideClick: false
              }).then((result) => {
                if (result.value) {
                  this.goToStep(this.actualStep, true);
                }else{
                  this.goToStep('0.0', true);
                }
              });
            }else if(this.actualStep=="0.0"){
              this.goToStep('0.0', false);
            }else if(this.actualStep>="5.0"){
              this.goToStep(this.actualStep, false);
            }

            this.showingWizard = false;
           }, (err) => {
             console.log(err);
             this.loadedStep= true;
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));


    }

    setActualStep(actualStep:string){
      var object = {actualStep:actualStep}
      if(actualStep>=this.maxStep && this.maxStep<"5.0"){
        this.maxStep = actualStep;
        this.subscription.add( this.http.put(environment.api+'/api/case/stepclinic/'+this.authService.getCurrentPatient().sub, object)
            .subscribe( (res : any) => {
             }, (err) => {
               console.log(err);
               this.toastr.error('', this.translate.instant("generics.error try again"));
             }));
      }

    }

    goToStep(indexStep, save){
      this.actualStep = indexStep;
      if(this.actualStep == '3.2'){
        this.launchPhenolyzer();
      }else if(this.actualStep == '3.1'){
        this.callExomizerSameVcf();
      }
      /*this.selectedInfoSymptomIndex = -1;
      this.actualStep = indexStep;
      if(this.actualStep == '2.7'){
        this.stateOfSuggestions = {discarded: [], added: [], unmarkedSymptoms: []};
        this.loadDataPanelSuggestions();
      }else if(this.actualStep == '5.0'){
        this.checkPrograms();
      }*/
      window.scrollTo(0, 0)
      if(save){
        this.setActualStep(indexStep);
      }
      /*if(this.actualStep== '4.0'){
        this.setActualStep('5.0');
      }*/
    }

    loadAllData(){
      this.getAzureBlobSasToken();
      this.loadMyEmail();
      this.loadTranslations();
      this.initVariables();
      this.initVarsPrograms();
      this.loadSymptoms();
      this.getDiagnosisInfo();
      this.checkServices(); //esto habría que ponerlo en el topnavbar tb
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
        this.loadBlobFiles();
      }, (err) => {
        console.log(err);
      }));
    }

    loadBlobFiles(){
      this.subscription.add( this.blob.change.subscribe(uploaded => {
         this.uploaded = uploaded;
         console.log("subscription blob")
         this.uploadingGenotype = false;
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
           }
         }

         if(this.uploaded){
           if(document.getElementById("idShowPanelWorkbench")==null && document.getElementById("settingExomiser")==null){
             //this.callExomizerSameVcf();
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
            console.log('no tiene!');
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
           }else{
             console.log('no tiene!');
           }
         }));

        //SI TIENE JSON DE EXOMIZER
       this.subscription.add( this.blob.changeFilesExomizerBlob.subscribe(filesOnBlob => {
         console.log(filesOnBlob);
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
            console.log('change blob exomiser no tiene!');
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

        //SI TIENE JSON DE PHENOLIZER
       this.subscription.add( this.blob.changeFilesPhenolyzerBlob.subscribe(filesPhenolyzerOnBlob => {
         this.loadingGeno = false;
         //console.log(filesPhenolyzerOnBlob);
          if(filesPhenolyzerOnBlob.length>0){
            filesPhenolyzerOnBlob.sort(this.sortService.DateSort("lastModified"));
            this.filePhenolyzerOnBlob = filesPhenolyzerOnBlob[0].name;
            this.loadPhenolyzerFromBlob();
          }else{
           console.log('no tiene!');
           this.launchingPhenolyzer = false;
          }
          this.loading = false;
        }));

        this.subscription.add( this.blob.changeNcrFilesPatientBlob.subscribe(filesNcr => {
          //console.log(filesPhenolyzerOnBlob);
           if(filesNcr.length>0){
             this.checkPrograms();
           }else{
            console.log('no tiene ncr!');
           }
         }));


        this.subscription.add( this.blob.changeFilesPatientBlob.subscribe(filesPatientBlob => {
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
               listPatientFiles[i].origenFile.nameForShow=""
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
            // this.urlFileHtmlExomiserBlob = this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+filesPatientBlob[0].name+this.accessToken.sasToken;
           }else{
            console.log('no tiene!');
            this.listPatientFiles = [];
           }
           Swal.close();
           let ngbModalOptions: NgbModalOptions = {
                 windowClass: 'ModalClass-lg',
                 centered: true
           };
           this.modalReference = this.modalService.open(this.contentDownloadFiles, ngbModalOptions);
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
        this.blob.loadFilesOnBlobPhenolyzer(this.accessToken.containerName);



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
      this.renderMap(this.relatedConditions.slice(0, 10), this.paramgraph);
    }

    checkServices(){
      // Find if the patient has pending works
      var patientId = this.authService.getCurrentPatient().sub;
      this.$hotjar.tagRecording(['clinician', this.authService.getIdUser(), patientId]);
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
          }
        }
      }, (err) => {
        console.log(err);
      }));
      this.checkPhenolyzer();

    }

    checkPhenolyzer(){
      var patientId = this.authService.getCurrentPatient().sub;
        this.subscription.add( this.http.get(environment.api+'/api/phenolyzerservices/'+patientId)
        .subscribe( (res2 : any) => {
          if(res2.message){
            if(res2.message=='something pending'){
              this.launchingPhenolyzer = true;
              this.getPhenolyzer(patientId);
            }else{
              this.launchingPhenolyzer = false;
            }
          }
         }, (err) => {
           console.log(err);
         }));
    }

    checkExomiser(){
      var patientId = this.authService.getCurrentPatient().sub;
      // Llamar al servicio
      this.subscription.add( this.exomiserService.checkExomiserStatus(patientId)
        .subscribe( async (res2 : any) => {
          console.log(res2);
          if(res2.message){
            if(res2.message=="nothing pending"){
              this.getExomizer(patientId);
            }
            else if (res2.message=="Error"){
              console.log("MEssage == error")
              // /api/Exomiser/StatusDescription(res2)
              this.manageErrorsExomiser("type 2",res2.res);
            }
            else if(res2.message=="something pending"){
              this.uploadingGenotype = true;
              await this.delay(5000);
              this.checkExomiser();
            }
          }
         }, (err) => {
           console.log(err);
           this.manageErrorsExomiser("type1",err);
         }));
    }

    openLinkMonarch(url, e){
      window.open('https://monarchinitiative.org/phenotype/'+url, '_blank');
      e.stopPropagation();
    }

    selected($e) {
      $e.preventDefault();
      //this.selectedItems.push($e.item);
      this.addSymptom($e.item, 'manual');
      //this.phenotype.data.push($e.item);
      this.modelTemp = '';
      //this.inputEl.nativeElement.value = '';
    }

    selected2(i) {
      console.log(this.listOfFilteredSymptoms[i]);
      //$e.preventDefault();
      this.selectedItems.push(this.listOfFilteredSymptoms[i]);
      //this.addSymptom($e.item, 'manual');
      //this.phenotype.data.push($e.item);
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
      }else{
        this.listOfFilteredSymptoms = [];
      }
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
      console.log(this.selectedInfoSymptomIndex );
      console.log(this.phenotype.data[this.selectedInfoSymptomIndex]);
      let ngbModalOptions: NgbModalOptions = {
            keyboard : true,
            windowClass: 'ModalClass-lg'
      };
      this.modalReference = this.modalService.open(contentInfoSymptom, ngbModalOptions);
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
     this.filePhenolyzerOnBlob = '';
     this.urlFileHtmlExomiserBlob = '';
     this.loadingFileHtmlExomiserBlob = false;
     this.infoGenesAndConditions = [];
     this.infoGenesAndConditionsExomizer = [];
     this.infoGenesAndConditionsPhenolyzer = [];
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
       infoGenesAndConditionsPhenolyzer: [],
       relatedConditions: [],
       hasVcf: false,
       selectedItemsFilter: [],
       _id: null
     };

     this.exploreSymptomsPhenolizer = false;

    }

    loadSymptoms(){

      //cargar los datos del usuario
      console.log("load symptoms");
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
            console.log(hposStrins.length);
            //get symtoms
            var lang = this.authService.getLang();
            console.log(this.listOfphenotypesinfo.length);
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
            //this.getRelatedConditions();
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
      this.subscriptionLoadSymptoms = Observable.interval(1000 * 60 * 5 ).subscribe(() => {
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
        console.log(res2);

        var tamano= Object.keys(res2).length;
        console.log(tamano)
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

    showPanelDiagnosis(contentRelatedConditions){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl',
            centered: true
      };
      this.modalReference = this.modalService.open(contentRelatedConditions, ngbModalOptions);

    }

    changeView1(){
      $('#panelSelectFromList').hide();
      $('#panelPhenotypeList').show();
    }
    changeView2(){
      $('#panelSelectFromList').show();
      $('#panelPhenotypeList').hide();
    }

    getRelatedConditions(){
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
      // Cojo lo de phenolyzer
      }else if(this.infoGenesAndConditionsPhenolyzer.length>0){
        infoToExtractGenes = this.infoGenesAndConditionsPhenolyzer;
        priorizeGenes=false;
      }
      console.log(infoToExtractGenes)
      if((infoToExtractGenes!= [])&&(priorizeGenes==true)&&(this.infoGenesAndConditionsExomizer.length>0)){
        this.getRelatedConditionsExomiser(infoToExtractGenes);
      }
      else{
        this.getRelatedConditionsPhenolyzer(infoToExtractGenes);
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
        console.log(resDiseases);
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
          console.log(res);
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
            console.log(temp2);
          
            //quedarse con 100 this.listOfDiseases
            this.listOfDiseases = [];
            for(var in3 = 0; in3 < this.relatedConditions.length; in3++) {
              this.listOfDiseases.push(this.relatedConditions[in3].name.id);
            }

            //end Merge and keep unique diseases.
            //get genes
            this.subscription.add(this.apif29BioService.getGenesOfDiseases(this.listOfDiseases)
            .subscribe( (res1 : any) => {
              console.log(res1)
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
                              }else if(this.infoGenesAndConditionsPhenolyzer.length>0){
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
            Swal.fire('Error', 'No exomiser or phenolyzer results have been found.', "error");
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
    
    getRelatedConditionsPhenolyzer(infoToExtractGenes){
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
        console.log(res);
        this.relatedConditions = res;
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
            console.log(res1)
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
                            }else if(this.infoGenesAndConditionsPhenolyzer.length>0){
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
            var str = JSON.stringify({analyze:"phenolyzer",data:{hpos:jsonHpos}});
            var fileNameRelatedConditions = "relatedConditions"+"-"+'executionParams.json';
            var fileRelatedConditionsParams = new File([str],fileNameRelatedConditions,{type:'application/json'});
            this.uploadProgress = this.blob
            .uploadToBlobStorage(this.accessToken, fileRelatedConditionsParams, fileNameRelatedConditions, 'relatedConditions');

            var copyrelatedConditions2 = [];
            console.log(this.relatedConditions);
            for(var i = 0; i < this.relatedConditions.length; i++) {
              if(this.relatedConditions[i].iscondition){
                copyrelatedConditions2.push(this.relatedConditions[i]);
              }
            }
            this.relatedConditions = copyrelatedConditions2;
            console.log(this.relatedConditions);
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
          Swal.fire('Error', 'No exomiser or phenolyzer results have been found.', "error");
        }
        this.gettingRelatedConditions = false;
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
            if(Object.keys(listOfSymptoms).length>0){
              for(var indexSymptom in listOfSymptoms) {
                var comment = "";
                var def = "";
                if(listOfSymptoms[indexSymptom].desc!="None"){
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
                /*if(this.relatedConditions[i].matches!=0){
                  for(var k = 0; k < this.relatedConditions[i].matches.length; k++) {
                    var found= false;
                    for(var lo = 0; lo < this.relatedConditions[i].symptoms.length && !found; lo++) {
                      if(this.relatedConditions[i].symptoms[lo].id == this.relatedConditions[i].matches[k].id){
                        found = true;
                      }
                    }
                    if(!found){
                      //no meter matches
                      //this.relatedConditions[i].symptoms.push({id:this.relatedConditions[i].matches[k].reference.id, name: this.relatedConditions[i].matches[k].reference.label});
                    }
                  }
                }*/

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

          this.phenotype.data
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
              var hposStrins ='';
              	arraySymptomsIds.forEach(function(element) {
                  if(hposStrins==''){
                    hposStrins='?id='+element;
                  }else{
                    hposStrins+='&id='+element;
                  }

              		//hposStrins+= '&id=';
              	});
              var limit = diseaseWithoutScore.length
              this.subscription.add(this.apif29BioService.getOWLSim3Match(hposStrins, limit)
              .subscribe( (res : any) => {
                console.log(res);
                console.log(diseaseWithoutScore);
                for(var i = 0; i < diseaseWithoutScore.length; i++) {
                  console.log('i=: '+i);
                  if(diseaseWithoutScore[i].positionOnResults>=0){
                    diseaseWithoutScore[i].score = res.matches[diseaseWithoutScore[i].positionOnResults].percentageScore//.score
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
              }));
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
            if(Object.keys(listOfSymptoms).length>0){
              for(var indexSymptom in listOfSymptoms) {
                var comment = "";
                var def = "";
                if(listOfSymptoms[indexSymptom].desc!="None"){
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
          this.renderMap(this.relatedConditions.slice(0, 10), 'h29');
          if(this.selectedItemsFilter.length > 0){
            this.applyFilters();
          }
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

      //deleteDuplicatedConditions
      this.subscription.add(this.apif29BioService.getInfoOfDiseases(this.listOfDiseases)
      .subscribe( (res1 : any) => {
        var copyrelatedConditionsIni = [];
        for(var i = 0; i < this.relatedConditions.length; i++) {
          var valtemp = this.relatedConditions[i].name.id;
          this.relatedConditions[i].name.id = res1[valtemp].id;
          var foundElement = this.searchService.search2Levels(copyrelatedConditionsIni,'name','id', this.relatedConditions[i].name.id);
          if(!foundElement){
            copyrelatedConditionsIni.push(this.relatedConditions[i]);
          }else{
            //console.log('Found: '+ this.relatedConditions[i].name.id);
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

      this.renderMap(this.relatedConditions.slice(0, 10), 'h29');
      console.log(this.relatedConditions);
      this.saveNotes();
      this.applyFilters();
      this.onchangeparamgraph();
    }


    checkChange(){
      this.checksChanged = true;
      //this.getRelatedConditions();
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
            windowClass: 'ModalClass-xl'
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
            windowClass: 'ModalClass-xl'
      };
      this.modalReference = this.modalService.open(contentAddTextSymptoms, ngbModalOptions);
    }

    showPanelFeedback(contentFeedback){
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

    hasSymptomsToSave(){
      if(this.phenotype.data.length>0){
        this.saveSymptomsToDb();
      }else{
        this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
      }

    }

    saveSymptomsToDb() {
      console.log("save symptoms to Db");
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
      console.log("On submit")
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

    confirmDeletePhenotype(index){
      Swal.fire({
          title: this.translate.instant("generics.Are you sure?"),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("generics.Delete"),
          cancelButtonText: this.translate.instant("generics.No, cancel"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
          this.phenotype.data.splice(index, 1);
          console.log("phenotype delete OK");
          this.isDeletingPhenotype=true;
          this.saveSymptomsToDb();
        }
      });

    }

    deleteAllSymtoms(){
      Swal.fire({
          title: this.translate.instant("generics.Are you sure?"),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#0CC27E',
          cancelButtonColor: '#f9423a',
          confirmButtonText: this.translate.instant("phenotype.Delete all symptoms"),
          cancelButtonText: this.translate.instant("generics.No, cancel"),
          showLoaderOnConfirm: true,
          allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
          this.phenotype.data = [];
          this.onSubmit();
          //this.getRelatedConditions();
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

      this.loadHtmlExo();
      this.subscription.add( this.http.get(this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+this.filesOnBlob[0].name+this.accessToken.sasToken)
        .subscribe( (res : any) => {
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
                    scoreSummary=res[i].geneScores[j].combinedScore.toFixed(2);
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

          if(this.actualStep == '3.1'){
            this.getRelatedConditions();
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
            //this.startDiagnosis();
            this.newVcf = false;
          }else{
            if(this.diagnosisInfo.infoGenesAndConditionsExomizer.length == 0){
              //this.getRelatedConditions();
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
      // Check if there are any symptoms
      // If not: swal and not launch exomiser
      if(this.phenotype.data.length==0){
        Swal.fire({ title: this.translate.instant("diagnosis.titleNotCanLaunchExomiser"), html: this.translate.instant("diagnosis.msgNotCanLaunchExomiser"),icon:"info" })
      }
      // If yes: launch exomiser
      else{
        this.uploadingGenotype = true;
        this.getExomiserSettings();
        if(this.settingExomizer.VariantEffectFilters!=undefined){
          if(this.settingExomizer.VariantEffectFilters.remove!=undefined){
            if(this.settingExomizer.VariantEffectFilters.remove.length==0){
              delete this.settingExomizer.VariantEffectFilters;
            }
          }
        }
        this.subscription.add(this.exomiserService.analyzeExomiser(this.settingExomizer)
        .subscribe( (res : any) => {
          this.subscription.add( this.apiDx29ServerService.setPendingJobs(this.accessToken.patientId,this.exomiserService.getActualToken())
          .subscribe( (res : any) => {
            //this.getExomizer(this.accessToken.patientId);
            this.checkExomiser()
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
      console.log("getExomizer")
      this.subscription.add(this.exomiserService.getExomiserResults()
      .subscribe( (res2 : any) => {
        if(this.uploadingGenotype){
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
            this.subscription.add( this.apiDx29ServerService.deletePendingJob(this.accessToken.patientId,this.exomiserService.getActualToken(),"exomiser")
            .subscribe( (res : any) => {
              this.uploadingGenotype = false;
              //this.loadFromBlob();
            }, (err) => {
              this.toastr.error('', this.translate.instant("generics.error try again"));
              console.log(err);
            }));

          }
          else{
            this.filename = '';
            this.uploadingGenotype = false;
          }
        }

        this.loading = false;
      }, (err) => {
        console.log(err);
        this.manageErrorsExomiser("type1",err);
        this.loading = false;
      }));
    }

    /*retrygetExomizer(patientId){
      setTimeout(function () {
        this.getExomizer(patientId);
      }.bind(this), 30000);
    }*/

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
            Swal.fire('The VCF file must have .vcf extension or .vcf.gz', '', "error");
          }


        }
        reader.readAsArrayBuffer(event.target.files[0]);

      }
    }

    startDiagnosis(){
      //this.subscription.unsubscribe();
      this.actualPosDisease = 0;
      this.globalPosDisease = 1;
      this.actualDisease = {};
      this.unknownSymptoms = [];
      this.symptomsLoaded = [];
      this.numberOfSymptoms = this.phenotype.data.length;
      this.getSymptomsOfDisease();
      document.getElementById("openModalButton").click();
    }

    editDiagnosis(contentRelatedConditions){
      this.infoGenesAndConditions = this.relatedConditions;

      this.sizeOfDiseases = this.relatedConditions.length;
      this.actualPosDisease = 0;
      this.globalPosDisease = 1;
      this.actualDisease = {};
      this.unknownSymptoms = [];
      this.symptomsLoaded = [];
      this.getSymptomsOfDisease();
      document.getElementById("openModalButton").click();
    }

    selectOldVcf(contentSelectVcf){
      if(this.filesVcf){
        if(this.filesVcf.length>1){
          let ngbModalOptions: NgbModalOptions = {
            windowClass: 'ModalClass-lg'
          };
          this.modalReference = this.modalService.open(contentSelectVcf, ngbModalOptions);
        }else{
          this.launchExomizerOldVcf();
        }
      }else{
        this.launchExomizerOldVcf();
      }
    }

    launchExomizerOldVcf(){
      this.relatedConditions = [];
      this.infoGenesAndConditionsExomizer = [];
      this.saveNotes();
      this.callExomizerSameVcf();
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
          allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
          console.log("Cancel exomiser")
          this.uploadingGenotype = false;
          if(place=='wizard'){
            console.log(this.filename);
            this.filename = '';
          }
          this.cancelSubscription();

          //preguntar si quiere eliminar el file
          Swal.fire({
              title: 'Do you want to delete the VCF file?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#0CC27E',
              cancelButtonColor: '#f9423a',
              confirmButtonText: this.translate.instant("generics.Yes"),
              cancelButtonText: this.translate.instant("generics.No"),
              showLoaderOnConfirm: true,
              allowOutsideClick: false
          }).then((result) => {
            if (result.value) {
              if(place=='workbench'){
                console.log(this.filename);
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

    finishDiagnosis(){
      var haschanged = false;
        for (var j = 0; j < this.infoGenesAndConditions.length; j++) {
          if (typeof this.infoGenesAndConditions[j].symptoms != 'undefined') {
            for (var k = 0; k < this.infoGenesAndConditions[j].symptoms.length; k++) {
              if(this.infoGenesAndConditions[j].symptoms[k].checked == true){
                var foundElement = this.searchService.search(this.phenotype.data,'id', this.infoGenesAndConditions[j].symptoms[k].id);
                if(!foundElement){
                  this.phenotype.data.push(
                    {id: this.infoGenesAndConditions[j].symptoms[k].id,
                      name: this.infoGenesAndConditions[j].symptoms[k].name,
                      new: true,
                      checked: true,
                      percentile: this.infoGenesAndConditions[j].symptoms[k].percentile,
                      def: this.infoGenesAndConditions[j].symptoms[k].def,
                      comment: this.infoGenesAndConditions[j].symptoms[k].comment,
                      synonyms: this.infoGenesAndConditions[j].symptoms[k].synonyms,
                      inputType: 'proposed',
                      importance: '1',
                      polarity: '0'
                    });

                      haschanged =true;
                }
              }else if(this.infoGenesAndConditions[j].symptoms[k].checked == 'unknown'){
                this.unknownSymptoms.push(
                  {id: this.infoGenesAndConditions[j].symptoms[k].id,
                    name: this.infoGenesAndConditions[j].symptoms[k].name,
                    new: true,
                    checked: true,
                    percentile: this.infoGenesAndConditions[j].symptoms[k].percentile,
                    def: this.infoGenesAndConditions[j].symptoms[k].def,
                    comment: this.infoGenesAndConditions[j].symptoms[k].comment,
                    synonyms: this.infoGenesAndConditions[j].symptoms[k].synonyms,
                    inputType: 'proposed',
                    importance: '1',
                    polarity: '0'
                  });

                    haschanged =true;
              }else if(this.infoGenesAndConditions[j].symptoms[k].checked == false){
                var foundElement = this.searchService.search(this.phenotype.data,'id', this.infoGenesAndConditions[j].symptoms[k].id);
                if(foundElement){
                  for(var m = 0; m < this.phenotype.data.length; m++) {
                    if(this.phenotype.data[m].id==this.infoGenesAndConditions[j].symptoms[k].id){
                      this.phenotype.data[m].checked=false;
                      haschanged =true;
                    }
                  }

                }
              }
            }
          }
        }
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
       this.phenotype.data.sort(this.sortService.GetSortOrder("name"));
       if(haschanged){
         this.checksChanged = true;
       }
       if(haschanged || this.relatedConditions != []){
         this.getRelatedConditions();
       }

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
      //this.getRelatedConditions();
    }

    resetSavedSymptoms(){
      this.phenotype = JSON.parse(JSON.stringify(this.phenotypeCopy));
      this.geneName = '';
    //  this.getRelatedConditions();
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

    continueAndCallPhenolyzer(){

      console.log("continueAndCallPhenolyzer")

      this.gettingRelatedConditions=false;
      this.loadingDiagnosisInfo=false;
      this.launchingPhenolyzer=false;
      console.log("Continue and call phenolyzer")
      this.uploadingGenotype=false;
      this.selectedItemsFilter=[];
      this.relatedConditions=[];

      //Swal.fire('Done', '', "success");
      document.getElementById("idShowPanelWorkbench").click();
      this.checkPrograms();
      setTimeout(function () {
        document.getElementById("tabPhenolyzer").click();
        if(this.filePhenolyzerOnBlob!=''){
          this.loadPhenolyzerFromBlob();
        }else{
          this.launchPhenolyzer();
        }

      }.bind(this), 200);

    }

    launchPhenolyzer(){
      // Check if there are any symptoms
      // If not: swal and not launch phenolyzer
      if(this.phenotype.data.length==0 || (this.phenotype.data.length == this.numDeprecated && this.numDeprecated>0)){
        Swal.fire({ title: this.translate.instant("diagnosis.titleNotCanLaunchPhenolyzer"), html: this.translate.instant("diagnosis.msgNotCanLaunchPhenolyzer"),icon:"info" })
      }
      // If yes: launch phenolyzer
      else{
        if(this.infoGenesAndConditionsExomizer.length == 0){
          this.relatedConditions = [];
        }
        this.infoGenesAndConditionsPhenolyzer = [];
        this.saveNotes();

        this.infoGenesAndConditionsPhenolyzer=[];
        this.numberOfSymptoms = this.phenotype.data.length;
        this.launchingPhenolyzer = true;
        var listSymptoms = [];
        for(var i = 0; i < this.phenotype.data.length; i++) {
          listSymptoms.push(this.phenotype.data[i].id);
        }

        var jsonfile = {
          "CaseName": this.accessToken.containerName,
          "Phenotypes": listSymptoms,
        };
        /*
       var jsonfile = {"CaseName":"ebfe116608a8c470a5b8304ead87799098f86f9c3bc6b6cb98a06381ce8f506","Phenotypes":["HP:0001250","HP:0001252","HP:0000160","HP:0002069","HP:0002104","HP:0002133","HP:0000013","HP:0002373","HP:0000011","HP:0000114","HP:0000111"]};
       */
        this.subscription.add( this.http.post(environment.phenolyzerUrl,jsonfile)
        .subscribe( (res : any) => {
          this.getPhenolyzer(this.accessToken.patientId);

        }, (err) => {
          console.log(err);
          this.loading = false;
        }));
      }

    }

    getPhenolyzer(patientId){
      this.subscription.add( this.http.get(environment.api+'/api/phenolyzerservice/'+patientId)
      .subscribe( (res2 : any) => {
        if(this.launchingPhenolyzer){
          if(res2.message){
            if(res2.message=='timeout'){
              this.getPhenolyzer(patientId);
            }else if(res2.error!=undefined){
              if(res2.message.body!=undefined){

                var test = (res2.message.body).split("\n\n");
                if(test[1]!=undefined){
                  var result = test[0]+'<br><br>'+test[1]
                  Swal.fire(res2.message.title, result, "error");
                }else{
                  Swal.fire(res2.message.title, res2.message.body, "error");
                }
              }else{
                Swal.fire('Error when processing phenolyzer', (res2.message).toString(), "error");
              }
              this.launchingPhenolyzer = false;
            }else{
              this.exploreSymptomsPhenolizer = true;
              this.blob.loadFilesOnBlobPhenolyzer(this.accessToken.containerName);
              this.launchingPhenolyzer = false;
            }

          }else{
          }
        }
        this.loading = false;
       }, (err) => {
         if(this.launchingPhenolyzer){
           this.getPhenolyzer(patientId);
         }
         console.log(err);
         this.loading = false;
       }));
    }

    exploreMoreSymptomsPhenolyzer(){
      this.exploreSymptomsPhenolizer = false;
      this.infoGenesAndConditions = this.infoGenesAndConditionsPhenolyzer;
      this.startDiagnosis();
      this.numberOfSymptoms = this.phenotype.data.length;
      this.actualPosDisease = 0;
      this.globalPosDisease = 1;
      this.actualDisease = {};
      this.unknownSymptoms = [];
      this.symptomsLoaded = [];
    }

    loadPhenolyzerFromBlob(){
      if(this.infoGenesAndConditionsPhenolyzer.length != 0){
        this.infoGenesAndConditions = this.infoGenesAndConditionsPhenolyzer;
        if(this.exploreSymptomsPhenolizer){
          this.exploreMoreSymptomsPhenolyzer();
        }
        this.sizeOfDiseases = this.infoGenesAndConditions.length;

        if(!this.exploreSymptomsPhenolizer){
          if(document.getElementById("idShowPanelWorkbench")!=null){
            document.getElementById("idShowPanelWorkbench").click();
            this.checkPrograms();
          }else{
            if(document.getElementById("buttonChangeTab")!=null){
              document.getElementById("buttonChangeTab").click();
            }

          }
        }
        this.checkPhenolyzer();


      }else{
        this.subscription.add( this.http.get(this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+this.filePhenolyzerOnBlob+this.accessToken.sasToken)
          .subscribe( (res : any) => {
            this.infoGenesAndConditions = [];
            this.infoGenesAndConditionsPhenolyzer = [];
            this.sizeOfDiseases = 0;
            for (var i = 0; i < 100; i++) {
              var dataForGene = [];
              for (var j = 0; j < res[i].Diseases.length ; j++) {
                var codeomimorpha = null;
                var tempinfo = [];
                var isOmim = false;
                if(res[i].Diseases[j].ORPHANET){
                  codeomimorpha = res[i].Diseases[j].ORPHANET[0].Id;

                  codeomimorpha = codeomimorpha.replace("ORPHANET", "ORPHA");
                  tempinfo = this.searchFilterPipe.transform(this.orphaOmim, 'ORPHA', codeomimorpha);

                }else if(res[i].Diseases[j].OMIM){
                  codeomimorpha = res[i].Diseases[j].OMIM[0].Id;
                  isOmim = true;
                  tempinfo = this.searchFilterPipe.transform(this.orphaOmim, 'OMIM', codeomimorpha);
                  //codeomimorpha = codeomimorpha.replace("ORPHANET", "Orphanet");
                }
                 if(tempinfo.length == 0 ){
                   if(codeomimorpha!=null){
                     codeomimorpha = codeomimorpha.replace("ORPHA", "Orphanet");
                   }
                   if(isOmim){
                     dataForGene.push({"condition": res[i].Diseases[j].OMIM[0].Condition, "idOrphanet": null, "idOMIM": codeomimorpha, "value": false});
                   }else{
                     if(codeomimorpha!=null){
                       codeomimorpha = codeomimorpha.replace("ORPHANET", "Orphanet");
                     }

                     if(res[i].Diseases[j].ORPHANET){
                       dataForGene.push({"condition": res[i].Diseases[j].ORPHANET[0].Condition, "idOrphanet": codeomimorpha, "idOMIM": null, "value": false});
                     }

                   }
                 }else{
                   tempinfo[0].ORPHA = (tempinfo[0].ORPHA).replace("ORPHANET", "Orphanet");
                   tempinfo[0].ORPHA = (tempinfo[0].ORPHA).replace("ORPHA", "Orphanet");
                   if(res[i].Diseases[j].ORPHANET){
                     dataForGene.push({"condition": res[i].Diseases[j].ORPHANET[0].Condition, "idOrphanet": tempinfo[0].ORPHA, "idOMIM": tempinfo[0].OMIM, "value": false});
                   }else if(res[i].Diseases[j].OMIM){
                     dataForGene.push({"condition": res[i].Diseases[j].OMIM[0].Condition, "idOrphanet": tempinfo[0].ORPHA, "idOMIM": tempinfo[0].OMIM, "value": false});
                   }

                 }

                 this.sizeOfDiseases++;
              }
              this.infoGenesAndConditions.push({"name": res[i].Name, "data": dataForGene, "score": res[i].Score});
              this.infoGenesAndConditionsPhenolyzer.push({"name": res[i].Name, "data": dataForGene, "score": res[i].Score});
              /*this.infoGenesAndConditions.push({"name": res[i].Name, "data": dataForGene});
              this.infoGenesAndConditionsPhenolyzer.push({"name": res[i].Name, "data": dataForGene});*/
            }
            if(this.actualStep == '3.2'){
              this.getRelatedConditions();
            }
            //this.checkPrograms();
            this.checkPhenolyzer();
            //this.exploreMoreSymptomsPhenolyzer();

           }, (err) => {
             console.log(err);
             this.checkPhenolyzer();
           }));
      }

    }

    getDiagnosisInfo(){
      console.log("get diagnosis info")
      this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
      this.accessToken.patientId = this.authService.getCurrentPatient().sub;

      this.loadingDiagnosisInfo = true;
      var para= this.authService.getCurrentPatient();
      //cargar el fenotipo del usuario
      this.subscription.add( this.http.get(environment.api+'/api/diagnosis/'+para.sub)
      .subscribe( (res : any) => {
        this.loadingDiagnosisInfo = false;
        if(res.message){
          this.diagnosisInfo = {
            hasDiagnosis: undefined,
            previousDiagnosis: '',
            identifiedGene: '',
            evaluation: '',
            notes: '',
            infoGenesAndConditionsExomizer: [],
            infoGenesAndConditionsPhenolyzer: [],
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
              "VariantEffectFilters": {"remove": ["UPSTREAM_GENE_VARIANT", "INTERGENIC_VARIANT", "REGULATORY_REGION_VARIANT", "CODING_TRANSCRIPT_INTRON_VARIANT", "NON_CODING_TRANSCRIPT_INTRON_VARIANT", "SYNONYMOUS_VARIANT", "DOWNSTREAM_GENE_VARIANT", "SPLICE_REGION_VARIANT"]},
              "genomeAssembly": 'hg19'
            },
            _id: null
          };

        }else{
          this.diagnosisInfo = res.diagnosis
          this.infoGenesAndConditionsExomizer = this.diagnosisInfo.infoGenesAndConditionsExomizer;
          this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
          this.infoGenesAndConditionsPhenolyzer = this.diagnosisInfo.infoGenesAndConditionsPhenolyzer;
          this.relatedConditions = this.diagnosisInfo.relatedConditions;
          this.settingExomizer = this.diagnosisInfo.settingExomizer;
          this.selectedItemsFilter = this.diagnosisInfo.selectedItemsFilter;
          if(this.relatedConditions.length>0){
            this.getSymptomsApi2();
          }
        }

       }, (err) => {
         console.log(err);
       }));
    }

    saveNotes(){
      console.log("save Notes")
      if(this.authGuard.testtoken() && !this.savingDiagnosis){
        this.savingDiagnosis = true;
        for(var i = 0; i < this.relatedConditions.length; i++) {
          delete this.relatedConditions[i].symptoms;
          //delete this.relatedConditions[i].genes;
        }
        if(this.modalReference!=undefined){
          this.modalReference.close();
        }
        this.diagnosisInfo.infoGenesAndConditionsExomizer = this.infoGenesAndConditionsExomizer;
        this.diagnosisInfo.infoGenesAndConditionsPhenolyzer = this.infoGenesAndConditionsPhenolyzer;
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
            //this.toastr.success('', this.translate.instant("generics.Data saved successfully"));

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
            //this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
           }, (err) => {
             console.log(err.error);
             this.toastr.error('', this.translate.instant("generics.error try again"));
             this.savingDiagnosis = false;
           }));
        }
      }
    }

    saveNotes2(){
      console.log("save filters")
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
        this.temporalSymptoms.push({id: symptom.id,name: symptom.name, new: true, checked: undefined, percentile:-1, inputType: inputType, importance: '1', polarity: '0', similarity: symptom.similarity, positions: symptom.positions});
      }else{
        //buscar el sintoma, mirar si tiene mejor prababilidad, y meter la nueva aparicion en posiciones
        var enc = false;
        for(var z = 0; z < this.temporalSymptoms.length && !enc; z++) {
          if(this.temporalSymptoms[z].id==symptom.id){
            if(this.temporalSymptoms[z].similarity < symptom.similarity){
              this.temporalSymptoms[z].similarity = symptom.similarity;
            }
            this.temporalSymptoms[z].positions.push(symptom.positions[0]);
            enc = true;
          }
        }
      }
    }

    changeStateSymptom(index, state){
      this.temporalSymptoms[index].checked = state;
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
      console.log(temporal)
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
          }else{
            this.substepExtract = '4';
            this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
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
        console.log(res2);

        var tamano= Object.keys(res2).length;
        console.log(tamano)
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
              allowOutsideClick: false
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
              allowOutsideClick: false
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
                Swal.fire('No text has been detected in the file.', '', "error");
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
            Swal.fire('No text has been detected in the file.', '', "error");
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

    getExomiserSettings(){

      var listSymptoms = [];
      for(var i = 0; i < this.phenotype.data.length; i++) {
        listSymptoms.push(this.phenotype.data[i].id);
      }

      this.settingExomizer.VcfBlobName = this.filename;
      this.settingExomizer.CaseName = this.accessToken.containerName;
      this.settingExomizer.Hpos = listSymptoms;
      if(this.settingExomizer.HiPhivePrioritisers.length==0){
        this.settingExomizer.HiPhivePrioritisers = ["human", "mouse", "fish", "ppi"];
      }
    }

    changeSettingsExomiser(contentSettingsExomiser){
      this.getExomiserSettings();

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
          Swal.fire('The ped file must have .ped extension and the file is too big!', '', "error");
        }else{
          if(extension!='.ped'){
            Swal.fire('The ped file must have .ped extension.', '', "error");
          }
          else if(event.target.files[0].size > 12048){
            Swal.fire('The file is too big!', '', "error");
          }
        }
      }else{
        if(event.target.files[0].size > 12048){
          Swal.fire('The file is too big!', '', "error");
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
      this.saveNotes();
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
      this.blob.deleteBlob(this.accessToken.containerName , file);
      this.blob.loadFilesVCF(this.accessToken.containerName);
    }

    clearValuesFrequencySources(){
      this.settingExomizer.FrequencySources = [];
    }

    clearValuesVariantEffectFilters(){
      this.settingExomizer.VariantEffectFilters.remove = [];
    }

    isGenomeChangedEvent(state){
      if(state && !this.variantEffectFiltersState){
        this.settingExomizer.VariantEffectFilters={remove:[]}
        this.variantEffectsFilterRequired=false;
      }
      else if(!state && !this.variantEffectFiltersState){
        //this.settingExomizer.VariantEffectFilters={"remove": ["UPSTREAM_GENE_VARIANT", "INTERGENIC_VARIANT", "REGULATORY_REGION_VARIANT", "CODING_TRANSCRIPT_INTRON_VARIANT", "NON_CODING_TRANSCRIPT_INTRON_VARIANT", "SYNONYMOUS_VARIANT", "DOWNSTREAM_GENE_VARIANT", "SPLICE_REGION_VARIANT"]}
        this.variantEffectsFilterRequired=true;

      }
    }

    variantEffectFiltersChanged(){
      this.variantEffectFiltersState = true;
      this.variantEffectsFilterRequired=true;

    }
    showPanelSymptomsNcr(contentSymptomsNcr){
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-xl'
      };
      this.modalReference = this.modalService.open(contentSymptomsNcr, ngbModalOptions);
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

    saveSymptomsNcr(){
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
      if(this.isNewNcrFile){
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
            allowOutsideClick: false
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
            if(!enc && this.infoGenesAndConditionsPhenolyzer.length==0){
              this.listOfGenes.push({gen: row.genes[i].gen, checked: false, importance: '3'});
            }
          }
        }
        if(this.infoGenesAndConditionsPhenolyzer.length>0 && row.genes.length>0){
          for(var i = 0; i < row.genes.length; i++) {
            var enc= false;
            for(var j = 0; j < this.infoGenesAndConditionsPhenolyzer.length && !enc; j++) {
              if(this.infoGenesAndConditionsPhenolyzer[j].name == row.genes[i].gen){
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
      /*for(var i = 0; i < row.matches.length; i++) {
        var enc= false;
        for(var j = 0; j < this.phenotype.data.length && !enc; j++) {
          //if(this.phenotype.data[j].id == row.matches[i].a.id){
          if(this.phenotype.data[j].id == row.matches[i].reference.id){
            enc=true;
            this.listOfSymptoms.push({id: this.phenotype.data[j].id, name: this.phenotype.data[j].name, def: this.phenotype.data[j].desc, comment: this.phenotype.data[j].comment, checked: true});
          }
        }
      }*/

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
               if(listOfSymptoms[k].desc!="None"){
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
        this.modalReference = this.modalService.open(contentSeeSymptomsOfDisease, ngbModalOptions);
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
        this.toastr.error('', 'The symptom is already added');
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
      console.log(this.selectedItemsFilter)
      console.log(this.relatedConditionsCopy)
      console.log(this.relatedConditions)
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
        this.renderMap(this.relatedConditions.slice(0, 10), this.paramgraph);
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
      this.renderMap(this.relatedConditions.slice(0, 10), this.paramgraph);
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      //guardo por si ha habido cambios en los filtros
      this.saveNotes2();
    }

    renderMap(data, param){
      this.checkPrograms();

      var tempParam = 'Dx29';

    /*  if(param == 'matches'){
        tempParam = 'C1';
      }else */if(param == 'scoregenes'){
        tempParam = 'C2';
      }else if(param == 'score'){
        tempParam = 'C1';
      }

      var tempdata = [];
      for(var i = 0; i < data.length; i++) {
        var tempColor= this.getColor(data[i].h29);
        var tempValue= data[i].h29;
        /*if(param == 'matches'){
          tempValue= data[i].matches.length;
        }else */if(param == 'scoregenes'){
          tempValue= data[i].scoregenes;
        }else if(param == 'score'){
          tempValue= data[i].score;
        }
        tempdata.push({name: data[i].name.label, value: tempValue, color: tempColor});
      }

      for(var i = 0; i < this.relatedConditions.length; i++)
        {
          this.relatedConditions[i].name.label = this.textTransform.transform(this.relatedConditions[i].name.label);
        }

      this.topRelatedConditions = data;

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

     this.makeCopyForSupport(file, this.fileUploadInfo, fileNameNcr, random_name);
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

    loadFilesContainer(contentDownloadFiles){
      this.contentDownloadFiles = contentDownloadFiles;
      this.blob.loadFilesPatientBlob(this.accessToken.containerName);
      Swal.fire({
          title: this.translate.instant("generics.Please wait"),
          html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i>',
          showCancelButton: false,
          showConfirmButton: false,
          allowOutsideClick: false
      }).then((result) => {

      });
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
                     this.changeStateSymptom(j, false);
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

               this.medicalText ='';
               this.isNewNcrFile = false;
               document.getElementById("openModalSymptomsNcrButton2").click();
               this.changeTriggerHotjar('ncrresults_');
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
                this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
                //this.phenotype.data.sort(this.sortService.GetSortOrder("name"));
                //this.hasSymptomsToSave();
                this.resultTextNcr = this.medicalText;
                this.resultTextNcrCopy = this.medicalText;
                this.copyResultTextNcr = this.medicalText;
                this.sortBySimilarity();

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
                document.getElementById("openModalSymptomsNcrButton2").click();
                this.changeTriggerHotjar('ncrresults_');
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
      this.subscription.add( this.http.get(environment.api+'/api/programs/'+this.authService.getCurrentPatient().sub)
      .subscribe( (res : any) => {
        this.programs = res;
        }, (err) => {
          console.log(err);
        }));
    }

    createProgram(){
      this.subscription.add( this.http.get(environment.api+'/api/createprogram/Genetic Program 1')
      .subscribe( (res : any) => {
        }, (err) => {
          console.log(err);
        }));
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
          allowOutsideClick: false
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
      console.log("Discard settings exomiser")

      this.getDiagnosisInfo();
      this.getExomiserSettings();
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
        this.goToStep('2.1', true);
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
      this.$hotjar.trigger(trigger);
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
                    if(listOfSymptoms[indexSymptom].desc!="None"){
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
        console.log(res2);
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
        console.log(this.listOfSymptomGroups);
     }, (err) => {
       console.log(err);
     }));
    }

    changeSuggestedViewSymptoms(value){
      this.viewSymptoms = value;
      //console.log(this.viewSymptoms);
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

    showPanelGenes(contentPanelGenes){
      let ngbModalOptions: NgbModalOptions = {
            windowClass: 'ModalClass-lg'
      };
      this.modalReference = this.modalService.open(contentPanelGenes, ngbModalOptions);
    }

}
