import { Component, ViewChild, OnInit, OnDestroy, Input, ElementRef, ChangeDetectorRef, AfterViewInit, HostListener } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { PatientService } from 'app/shared/services/patient.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { NgForm, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';

import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { DateService } from 'app/shared/services/date.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { HighlightSearch} from 'app/shared/services/search-filter-highlight.service';
import { Subscription } from 'rxjs/Subscription';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgxHotjarService } from 'ngx-hotjar';
import * as d3 from 'd3';
import {symbol, symbolTriangle} from "d3-shape";
import * as venn from 'venn.js'

import * as faker from 'faker';
import { fromEvent } from 'rxjs';
import { brush } from 'd3';
import { style } from '@angular/animations';
import { FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
declare var JSZipUtils: any;
declare var Docxgen: any;
declare var pdfjsLib: any;

declare global {
  interface Window {
    opera: string;
  }
}

@Component({
    selector: 'app-withdiagnosis',
    templateUrl: './withdiagnosis.component.html',
    styleUrls: ['./withdiagnosis.component.scss'],
    providers: [PatientService,Apif29BioService, ApiDx29ServerService, Apif29NcrService]
})

export class WithdiagnosisComponent implements OnInit, OnDestroy, AfterViewInit{
  loadedListOfDiseases: boolean = false;
  loadedPatientId: boolean = false;
  loadedInfoPatient: boolean = false;
  loadedDiagnosisInfo: boolean = false;
  loadedSymptoms: boolean = false;
  loadedDataFromSharingAccounts: boolean = false;
  loadedGeno: boolean = false;

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  isEditable = true;

  showingWizard: boolean = true;
  savingNotes: boolean = false;
  tmpCondition: string = '';
  actualStep: string = "0";
  showPanelSymptomsPatient: boolean = false;
  showButtonWorkspace: boolean = false;
  roleShare: string = 'Clinical';
  patients: any;
  isMine: boolean = true;
  message: string = '';
  showPanelDiagnosisInfo: boolean = false;
  showPanelGeneticInfo: boolean = false;

  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  showPanelExtractor: boolean = false;
  userId: string = '';

  diagnosisInfo: any = {};

  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  listOfDiseases: any = [];
  listOfFilteredDiseases: any = [];
  selectedDiseaseIndex: number = -1;
  searchDiseaseField: string = '';
  tempDisease: any = {};
  actualCondition: string = '';
  actualConditionId: string = '';
  //geneticTests = new FormControl();


  phenotype: any = {};
  phenotypeCopy: any = {};
  symptomsPermissions:any = {shareWithCommunity:false};
  numberOfSymptoms: number = 0;
  checksChanged: boolean = false;

  medicalText: string = '';
  resultTextNcr: string = '';
  resultTextNcrCopy: string = '';
  copyResultTextNcr: string = '';
  loadingHpoExtractor: boolean = false;
  temporalSymptoms: any = [];

  modalReference: NgbModalRef;

  selectedItems:any = [];
  symptomsOfDisease:any = [];
  symptomsOfDiseaseForGraph:any =[];

  @ViewChild('input') inputEl;

  modelTemp: any;
  sending: boolean = false;
  expanded: boolean = true;
  actualSymptom: any = {};
  complete: any = 0;
  searchTerm: string = '';
  hposMedicalText: any = {};
  selectedPatient: any = {};
  decimalCurrentRate: number = 1.00;
  listOfSharingAccounts: any = [];
  shareWithObject: any = {};

  symptoms :any = [];
  revonking: boolean = false;
  @ViewChild('f') shareForm: NgForm;
  email: string = '';
  role: string = 'User';
  permissions: any = {};
  infoNcrToSave: any = {};
  accessToken: IBlobAccessToken = {
     // tslint:disable-next-line:max-line-length
     sasToken: environment.blobAccessToken.sasToken,
     blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
     containerName: '',
     patientId: ''
  };

  fileUploadInfo: any;
  indexPermissions: number = -1;
  parserObject: any = {parserStrategy:'Auto', callingParser: false, file: undefined}
  langToExtract: string = '';
  resultSegmentation: any = {};

  uploadingGenotype: boolean = false;
  preparingFile: boolean = false;
  filesVcf: any = [];
  otherGeneFiles: any = [];
  filename: string = '';

  hasVcf: boolean = false;
  uploadProgress: Observable<number>;
  basicInfoPatient: any;
  basicInfoPatientCopy: any;
  loadingSuggestions: boolean = false;
  relatedConditions: any = [];
  posactual: number = 0;
  steps: number = 0;
  numberOfSymptomsPerPage: number = 18;
  listOfSymptomsTemp: any = [];
  listOfSymptoms: any = [];
  hasChangesSuggestion: boolean = false;
  viewSuggestion: number = 0;
  modelRadio: number = 0;
  loadingSymptomsOfDisease: boolean = false;
  posicionTrozo: number = 0;
  cantidadTrozos: number = 0;
  selectedHpoIndex: number = -1;
  selectedSymptomIndex: number = -1;
  selectedInfoSymptomIndex: number = -1;
  ncrResultView: boolean = false;

  scaledScore: number = -1;
  normalizedScore: number = -1;
  isMobileOrTablet: boolean = false;

  fullListSymptoms: any = [];
  exampleParent:String=this.translate.instant("patdiagdashboard.ExampleParent");
  exampleSuccesorOfParent:String=this.translate.instant("patdiagdashboard.ExampleSuccesorOfParent");
  omimSymptoms: any = [];
  orphaSymptoms: any = [];
  listGenericSymptoms: any=[];
  loadingSymptomsDataForGraph: boolean = false;
  @ViewChild('chartVenn') private chartContainerVenn: ElementRef;
  @ViewChild('chartBars') private chartContainerBars: ElementRef;
  @ViewChild('chartSymptomsFreq',{ read: ElementRef, static:false }) private chartContainerSymptomsFreq: ElementRef;
  @ViewChild('chartVennReal') private chartContainerVennReal: ElementRef;
  @ViewChild('chartBarsReal') private chartContainerBarsReal: ElementRef;


  @Input() private chartDataVenn: Array<any>=[];
  @Input() private chartDataVennReal: Array<any>=[];

  @Input() private chartDataBars: Array<any>=[];
  @Input() private chartDataBarsReal: Array<any>=[];


  @Input() private chartDataSymptomsFreq: Array<any>=[];
  //chartSize_MeOmim: number = 0;
  //chartSize_MeOrpha: number = 0;
  //chartSize_OmimOrpha: number = 0;
  //chartSize_All: number = 0;
  chartSize_MeGeneric:number =0;
  listSymptomsMe:any=[];
  listSymptomsGeneric:any=[];
  listSymptomsMeGeneric:any=[];
  listSymptomsMe_real:any=[];
  listSymptomsMeReal:any=[];
  listSymptomsReal:any=[];
  // Lista de paciente-sintomas
  listSymtomsFreqResponse:any=[]
  // Lista de paciente-sintomas SIN los padres (por cada paciente se "limpia" la lista de HP, eliminando los padres si los hay)
  listSymtomsFreqResponseWithoutPredecessorsByPatient:any=[]
  // lista de sintoma-pacientes
  listSymtomsFreq:any=[];

  // Lista de pacientes-sintomas de los casos simulados
  listSymtomsFreqResponseSim:any=[]
  // Lista de paciente Simulados-sintomas SIN los padres (por cada paciente se "limpia" la lista de HP, eliminando los padres si los hay)
  listSymtomsFreqResponseSimWithoutPredecessorsByPatient:any=[]

  // lista de sintoma-pacientes simulados
  listSymtomsFreqSim:any=[];


  // Lista que se usa en los graficos
  listSymtomsFreqForGraph:any=[];
  // Copia de la lista que se usa en los graficos con todos los datos de entrada (sin filtro ni query)
  listSymtomsFreqForGraphOriginalCopy:any=[];

  // Lista de sintomas filtrados (checked=true/false)
  listSymtomsFreqForGraphFiltered:any=[];
  // Lista de los sintomas filtrados NUEVOS antes de dar a guardar (por si se cancela resetear estos)
  listSymtomsFreqForGraphFilteredLastAdded:any=[];
  //booleano que indica si hay filtro o no
  filterApply:boolean=false;

  // Lista de sintomas queried (checked=true/false)
  listSymtomsFreqForGraphQuery:any=[];
  // Lista de los sintomas queried NUEVOS antes de dar a guardar (por si se cancela resetear estos)
  listSymtomsFreqForGraphQueryLastAdded:any=[];
  //booleano que indica si hay query o no
  queryApply:boolean=false;

  // booleano que indica cuando se puede mostrar el histograma(cuando los datos esten cargados)
  loadingGraphSymptomFreq:boolean=false;
  diagramSymptomsFreqMaxSize:number=0;
  maxSizeFreqSymptoms:number=100;
  mazSizeFreqSymtpomsReduceScreen:number=10;

  // Booleano para indicar que se han eliminado datos del histograma por pacientes=0
  patientDataNotShowHistogram:boolean=false;
  // Los nombres de los sintomas que no se estan mostrando que tenia el paciente
  listpatientDataNotShowHistogram:any=[];
  listpatientDataNotShowHistogramString:string="";
  // Un ejemplo de los sintomas que no salen porque son padres de otros
  exampleSymptomPredeccessor="";


  private margin: any = { top: 60, bottom: 0, left: 35, right: 20};
  private marginFreq: any = { top: 60, bottom: 10, left: 10, right: 40};
  private chartVenn: any;
  private chartBars: any;
  private chartVennReal: any;
  private chartBarsReal: any;
  private chartSymptomsFreq: any;
  private chartSymptomsFreq2: any;


  private widthVenn: number;
  private heightVenn: number;
  private widthBars: number;
  private heightBars: number;
  private xScaleBars: any;
  private yScaleBars: any;
  private xScaleBarsReal: any;
  private yScaleBarsReal: any;
  private colorsBars: any;
  private xAxisBars: any;
  private yAxisBars: any;
  private xAxisBarsReal: any;
  private yAxisBarsReal: any;
  private widthSymptomsFreq: number;
  private heightSymptomsFreq: number;
  private xScaleSymptomsFreq: any;
  private yScaleSymptomsFreq: any;
  private yZoom:any;
  private gBrush:any;
  private handle:any;
  private brush:any;
  private previousSelection:any;
  private xAxisSymptomsFreq: any;
  private yScaleSymptomsFreq_mini: any;
  private xScaleSymptomsFreq_mini: any;
  private yAxisSymptomsFreq: any;
  private maxWidth: any=0;
  private widthSymptomsFreq_saved:any;
  private windowSizeforWidthSymptomsFreq_size:any;
  private redrawNewSize:boolean=true;
  loadingquality: boolean = false;
  listOfphenotypesinfo: any = [];
  listOfphenotypesinfoOld: any = [];
  listOfFilteredSymptoms: any = [];
  numDeprecated: number = -1;
  private subscription: Subscription = new Subscription();
  private subscriptionLoadSymptoms: Subscription = new Subscription();

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private router: Router,  private patientService: PatientService, public searchFilterPipe: SearchFilterPipe, public toastr: ToastrService, private authGuard: AuthGuard, private sortService: SortService, private searchService: SearchService, private modalService: NgbModal,
    private highlightSearch: HighlightSearch, private blob: BlobStorageService, private dateService: DateService, private _formBuilder: FormBuilder, protected $hotjar: NgxHotjarService,private cdRef:ChangeDetectorRef, private apif29BioService:Apif29BioService, private apiDx29ServerService: ApiDx29ServerService, private apif29NcrService:Apif29NcrService){
      var lang = this.authService.getLang();
      this.subscription.add( this.http.get('assets/jsons/phenotypes_'+lang+'.json')
     .subscribe( (res : any) => {
       this.listOfphenotypesinfo = res;
      }, (err) => {
        console.log(err);
      }));

    this.subscription.add( this.http.get('assets/jsons/phenotypes_'+lang+'_old.json')
     .subscribe( (res : any) => {
       this.listOfphenotypesinfoOld = res;
      }, (err) => {
        console.log(err);
      }));

    //load files to upload docs
    $.getScript("./assets/js/docs/jszip-utils.js").done(function(script, textStatus) {
      //console.log("finished loading and running jszip-utils.js. with a status of" + textStatus);
    });

    $.getScript("./assets/js/docs/docxtemplater.v2.1.5.js").done(function(script, textStatus) {
      //console.log("finished loading and running docxtemplater.js. with a status of" + textStatus);
    });



    this.isMobileOrTablet = this.mobileAndTabletCheck();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.subscriptionLoadSymptoms) {
         this.subscriptionLoadSymptoms.unsubscribe();
     }
    //this.changeTriggerHotjar('generalincoming_');
  }

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required]
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required]
    });
    this.fullListSymptoms = [];
  }

  @HostListener('window:resize')
  onResize() {
      // call our matchHeight function here
      this.redrawNewSize=true;
      this.drawCharts();
  }

  getAzureBlobSasToken(){
    this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
    this.accessToken.patientId = this.authService.getCurrentPatient().sub;

    this.subscription.add( this.apiDx29ServerService.getAzureBlobSasToken(this.accessToken.containerName)
    .subscribe( (res : any) => {
      console.log(res);
      this.accessToken.sasToken = '?'+res;
      this.blob.init(this.accessToken);
      this.blob.createContainerIfNotExists(this.accessToken, 'patientGenoFiles');
    }, (err) => {
      console.log(err);
    }));
  }




  ngAfterViewInit(){
    this.loadTranslations();
    this.initVariables();
    this.loadListOfDiseases();
    this.cdRef.detectChanges();
  }

  loadTranslations(){
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk=res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail=res;
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

   this.permissions.shareEmr = true;
   this.permissions.askFirst = false;
   this.permissions.shareWithAll = false;
 }

  loadListOfDiseases(){
    this.loadedListOfDiseases = false;
    var lang = this.authService.getLang();
    this.subscription.add( this.http.get('assets/jsons/diseases_'+lang+'.json')
    //this.subscription.add( this.http.get('https://f29bio.northeurope.cloudapp.azure.com/api/BioEntity/diseases/'+lang+'/all')
     .subscribe( (res : any) => {
       this.listOfDiseases = res;
       this.loadedListOfDiseases = true;
       this.initEnvironment();
      }, (err) => {
        console.log(err);
        this.loadedListOfDiseases = true;
      }));
  }

  initEnvironment(){
    this.userId = this.authService.getIdUser();
    if(this.authService.getCurrentPatient()==null){
      this.loadPatientId();
    }else{
      this.$hotjar.tagRecording(['withdiagnosis', this.authService.getIdUser(), this.authService.getCurrentPatient().sub]);
      this.loadedPatientId = true;
      this.selectedPatient = this.authService.getCurrentPatient();
      this.getInfoPatient();
      this.getDiagnosisInfo();
      this.loadSymptoms(true);
      this.loadPatients();
    }
  }

  loadPatientId(){
    this.loadedPatientId = false;
    this.subscription.add( this.patientService.getPatientId()
    .subscribe( (res : any) => {
      console.log(res);
      if(res==null){
        this.authService.logout();
        this.router.navigate(['/login']);
      }else{
        this.loadedPatientId = true;
        this.authService.setCurrentPatient(res);
        this.$hotjar.tagRecording(['withdiagnosis', this.authService.getIdUser(), this.authService.getCurrentPatient().sub]);
        this.selectedPatient = res;
        this.getInfoPatient();
        this.getDiagnosisInfo();
        this.loadSymptoms(true);
        this.loadPatients();
      }
     }, (err) => {
       console.log(err);
     }));
  }

  getInfoPatient(){
    this.loadedInfoPatient = false;
    this.subscription.add( this.http.get(environment.api+'/api/patients/'+this.authService.getCurrentPatient().sub)
        .subscribe( (res : any) => {
          this.basicInfoPatient = res.patient;
          this.basicInfoPatient.birthDate=this.dateService.transformDate(res.patient.birthDate);
          this.basicInfoPatientCopy = JSON.parse(JSON.stringify(res.patient));
          this.loadedInfoPatient = true;
          if(this.basicInfoPatient.birthDate!=null && this.basicInfoPatient.birthDate!=''){
            this.actualStep = "2";
          }else if(this.basicInfoPatient.birthDate==null || this.basicInfoPatient.birthDate==''){
            this.actualStep = "1";
          }
         }, (err) => {
           console.log(err);
           this.loadedInfoPatient = true;
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));
  }

  getDiagnosisInfo(){
    this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
    this.accessToken.patientId = this.authService.getCurrentPatient().sub;
    this.getAzureBlobSasToken();
    this.loadedGeno = false;
    this.loadedDiagnosisInfo = false;
    //console.log(this.authService);
    var para = this.authService.getCurrentPatient();
    //cargar el fenotipo del usuario
    this.subscription.add( this.http.get(environment.api+'/api/diagnosis/'+para.sub)
    .subscribe( (res : any) => {
      //console.log(res);
      this.loadedDiagnosisInfo = true;
      if(res.message){
        this.diagnosisInfo = {
          hasDiagnosis: true,
          previousDiagnosis: '',
          geneticTests: [],
          geneticallyTested: '',
          haveGeneticData: '',
          identifiedGene: '',
          evaluation: '',
          selectedItemsFilter: [],
          notes: '',
          infoGenesAndConditionsExomizer: [],
          infoGenesAndConditionsPhen2Genes: [],
          relatedConditions: [],
          hasVcf: false,
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
            "genomeAssembly": 'hg19'
          },
          _id: null
        };

      }else{
        this.diagnosisInfo = res.diagnosis;
        this.diagnosisInfo.hasDiagnosis=true;
        if(this.diagnosisInfo.previousDiagnosis != ''){
          var actualConditionObject = this.searchFilterPipe.transform(this.listOfDiseases, 'id', this.diagnosisInfo.previousDiagnosis);
          this.actualCondition = actualConditionObject[0].name;
          this.actualConditionId = actualConditionObject[0].id;
          this.testQualitySymptoms();
          //this.showWizard(false);
          this.showPanelSymptomsPatient = true;
        }
        if(this.diagnosisInfo.hasDiagnosis==undefined){
          this.diagnosisInfo.hasDiagnosis=true;
          this.actualStep = "2";

        }else if(this.diagnosisInfo.hasDiagnosis == 'true' || this.diagnosisInfo.hasDiagnosis == 'false'){
          if(this.diagnosisInfo.previousDiagnosis!= '' || this.diagnosisInfo.hasDiagnosis == 'No'){
            this.showPanelSymptomsPatient = true;
            this.actualStep = "2";
          }
        }
        if(this.showingWizard==false){
          this.loadSymptomsOfDiseaseForGraph();
        }
      }

     }, (err) => {
       console.log(err);
     }));
  }

  loadSymptoms(bool){
    this.loadedSymptoms = false;
    this.numDeprecated = 0;
    var para= this.authService.getCurrentPatient();
    //cargar el fenotipo del usuario
    this.subscription.add( this.apiDx29ServerService.getSymptoms(para.sub)
    .subscribe( (res : any) => {
      if(res.message){
        //no tiene fenotipo
        this.symptomsPermissions = {shareWithCommunity:false};
        this.numberOfSymptoms = 0;
        if(this.diagnosisInfo.hasDiagnosis && this.diagnosisInfo.previousDiagnosis!= ''){
          this.expanded = false;
        }
        this.loadedSymptoms = true;
      }else{
        console.log(res.phenotype.permissions)
        var tempPermissions = res.phenotype.permissions;
        if(res.phenotype.permissions!=undefined){
          if(res.phenotype.permissions.length==0){
            this.symptomsPermissions = {shareWithCommunity:false};
          }else{
            this.symptomsPermissions = res.phenotype.permissions[0];
          }
        }else{
          this.symptomsPermissions = {shareWithCommunity:false};
        }

        console.log(this.symptomsPermissions);
        if(res.phenotype.data.length>0){
          this.actualStep = "3";
          if(bool){
            this.showWizard(false);
          }else{
            this.showWizard(true);
          }

          this.showPanelSymptomsPatient = true;
          res.phenotype.data.sort(this.sortService.GetSortOrder("name"));// los ordeno por nombre?
          this.phenotype = res.phenotype;
          this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
          //this.idPhenotype = res.phenotype._id;
          var hposStrins =[];
          this.phenotype.data.forEach(function(element) {
            hposStrins.push(element.id);
          });
            //get symtoms
            var lang = this.authService.getLang();
            if(this.listOfphenotypesinfo.length==0){
              this.testCallGetInfoSymptomsJSON(hposStrins);
            }else{
              this.callGetInfoSymptomsJSON(hposStrins);
            }

          for (var j = 0; j < this.phenotype.data.length; j++) {
            this.phenotype.data[j].checked = true;
          }
          this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
          this.numberOfSymptoms = this.phenotype.data.length;
          //this.getRelatedConditions();
          this.expanded = false;
          if(this.relatedConditions.length>0){
            this.loadDataPanelSuggestions();
          }

        }else{

          //no tiene fenotipo
          this.loadedSymptoms = true;
          this.phenotype = res.phenotype;
          this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
          this.numberOfSymptoms = 0;
          if(this.diagnosisInfo.hasDiagnosis && this.diagnosisInfo.previousDiagnosis!= ''){
            this.expanded = false;
            //this.showWizard(false);
          }else{
            //this.showWizard(true);
          }
        }
      }
      this.testQualitySymptoms();
      this.loadedSymptoms = true;
     }, (err) => {
       console.log(err);
       this.testQualitySymptoms();
       this.loadedSymptoms = true;
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
      var tamano= Object.keys(res2).length;
      if(tamano>0){
        var hposStrinsOld =[];
        for(var i in res2) {
          if(res2[i].length>0){
            for (var j = 0; j < this.phenotype.data.length; j++) {
              if(res2[i][0].id==this.phenotype.data[j].id){
                this.phenotype.data[j].name = res2[i][0].layperson;
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

  testQualitySymptoms(){
    this.loadingquality = true;
    this.scaledScore = 0;
    this.normalizedScore = 0;
    var lang = this.authService.getLang();
    var idcondition = this.actualConditionId;
    if(idcondition!=''){
      console.log(idcondition);
      this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang,[idcondition],0)
      .subscribe( (res2 : any) => {
        var info = res2[idcondition];
        if(info!=undefined){
          var listOfSymptoms = info.phenotypes
          if(Object.keys(listOfSymptoms).length>0){
            var hposStrins2 = "";
            for(var j in listOfSymptoms) {
                var nextSym = "ref_id=" + j;
                  if(hposStrins2!=undefined){
                    hposStrins2 = hposStrins2+ "&"
                  }
                  hposStrins2 = hposStrins2+ nextSym;
            }
            this.callSimScore(hposStrins2)
          }else{
            this.getAlternativeQualitySymptoms();
          }
        }else{
          this.getAlternativeQualitySymptoms();
        }
      }, (err) => {
       console.log(err);
       this.getAlternativeQualitySymptoms();
     }));
   }else{
     this.getAlternativeQualitySymptoms();
   }

    /*
    this.scaledScore = -1;
    this.normalizedScore = -1;
    var hposStrins2 = "";
    for(var j = 0; j < this.phenotype.data.length; j++) {
      var nextSym = "id=" + this.phenotype.data[j].id;
        if(hposStrins2!=undefined){
          hposStrins2 = hposStrins2+ "&"
        }
        hposStrins2 = hposStrins2+ nextSym;
    }
    //get symtoms
    var lang = this.authService.getLang();
    this.subscription.add( this.http.get('https://api.monarchinitiative.org/api/sim/score?'+hposStrins2)
    .subscribe( (res : any) => {
      //console.log(res);
      this.scaledScore = res.scaled_score;
      this.normalizedScore = this.scaledScore*5;

    }, (err) => {
     console.log(err);
   }));*/
  }

  getAlternativeQualitySymptoms(){
    this.scaledScore = 0;
    this.normalizedScore = 0;
    if(this.phenotype.data.length>0 && this.phenotype.data.length<3){
      this.scaledScore = 0.2;
    }else if(this.phenotype.data.length>=3 && this.phenotype.data.length<5){
      this.scaledScore = 0.4;
    }else if(this.phenotype.data.length>=5 && this.phenotype.data.length<7){
      this.scaledScore = 0.6;
    }else if(this.phenotype.data.length>=7 && this.phenotype.data.length<10){
      this.scaledScore = 0.8;
    }else if(this.phenotype.data.length>=10){
      this.scaledScore = 1;
    }
    this.normalizedScore = this.scaledScore*5;
    this.loadingquality = false;
  }

  callSimScore(hposStrins1){
    if(this.phenotype.data.length>0){
      var hposStrins2 = "";
      for(var j = 0; j < this.phenotype.data.length; j++) {
        var nextSym = "query_id=" + this.phenotype.data[j].id;
          if(hposStrins2!=undefined){
            hposStrins2 = hposStrins2+ "&"
          }
          hposStrins2 = hposStrins2+ nextSym;
      }
      //get symtoms
      var lang = this.authService.getLang();
      this.subscription.add( this.http.get('https://api.monarchinitiative.org/api/sim/compare?'+hposStrins1+'&'+hposStrins2)
      .subscribe( (res : any) => {
        if(res.matches[0]!=undefined){
          this.scaledScore = res.matches[0].score/100;
          this.normalizedScore = Math.round(this.scaledScore*5);
        }else{
          this.scaledScore = 0;
          this.normalizedScore = 0;
        }

        this.loadingquality = false;
      }, (err) => {
       console.log(err);
       this.getAlternativeQualitySymptoms();
     }));
    }else{
      this.getAlternativeQualitySymptoms();
    }

  }

  mobileAndTabletCheck(){
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

  loadPatients(){
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
    }, (err) => {
      console.log(err);
    }));
  }

  onKey(event){
    if( this.searchDiseaseField.trim().length > 3){
      var tempModelTimp = this.searchDiseaseField.trim();
      this.listOfFilteredDiseases = this.searchFilterPipe.transformDiseases(this.listOfDiseases, 'name', tempModelTimp);
    }else{
      this.listOfFilteredDiseases = [];
      this.tempDisease = {};
    }
  }

  onKeySymptoms(event){
    if( this.modelTemp.trim().length > 3){
      var tempModelTimp = this.modelTemp.trim();
      this.listOfFilteredSymptoms = this.searchFilterPipe.transformDiseases(this.listOfphenotypesinfo, 'name', tempModelTimp);
    }else{
      this.listOfFilteredSymptoms = [];
    }
  }

  hasGeneticallyTested(event){
    //console.log(event)
    this.diagnosisInfo.geneticallyTested = event;
    this.saveNotes();
  }

  hasGeneticData(event){
    //console.log(event)
    this.diagnosisInfo.haveGeneticData = event;
    this.saveNotes();
  }

  showMoreInfoDisease(diseaseIndex){
    if(this.selectedDiseaseIndex == diseaseIndex ){
      this.selectedDiseaseIndex = -1;
    }else{
      this.selectedDiseaseIndex = diseaseIndex;
    }
  }

  showMoreInfoSymptom(symptomIndex){
    if(this.selectedInfoSymptomIndex == symptomIndex ){
      this.selectedInfoSymptomIndex = -1;
    }else{
      this.selectedInfoSymptomIndex = symptomIndex;
    }
  }

  changePreviousDiagnosis(value, contentSeeSymptomsOfDisease){
    Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: '<p>'+this.translate.instant("patdiagdashboard.Do you want to select")+' <strong>'+value.name+'</strong> '+this.translate.instant("patdiagdashboard.as your diagnosis")+'</p>',
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
        this.confirmChangePreviousDiagnosis(value, contentSeeSymptomsOfDisease);
      }
    });
  }

  confirmChangePreviousDiagnosis(value, contentSeeSymptomsOfDisease){
    //console.log(value);
    this.diagnosisInfo.previousDiagnosis = value.id;
    this.actualCondition = value.name;
    this.actualConditionId = value.id;
    this.saveNotes();
    this.showPanelSymptomsPatient = true;
    //show symptoms of diseases
    this.getSymptomsOfDisease(value.id, contentSeeSymptomsOfDisease);
  }

  highlightRow(tmpCondition){
    this.tmpCondition = tmpCondition.name;
  }

  getSymptomsOfDisease(id, contentSeeSymptomsOfDisease){
    this.loadingSymptomsOfDisease = true;
    //get symtoms
    var lang = this.authService.getLang();
    this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang,[id],0)
    .subscribe( (res : any) => {
      console.log(res);
      var info = res[id];
      this.symptomsOfDisease = [];

      if(info!=undefined){
        var listOfSymptoms = info.phenotypes
        if(Object.keys(listOfSymptoms).length>0){
          for(var k in listOfSymptoms) {
             //console.log(k, listOfSymptoms[k]);
             var foundElement = this.searchService.search(this.phenotype.data,'id', k);
             var foundElement2 = this.searchService.search(this.symptomsOfDisease,'id', k);
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
                 this.symptomsOfDisease.push({id:k, name: listOfSymptoms[k].name, def: def, comment: comment, synonyms: listOfSymptoms[k].synonyms, checked: true});
               }else{
                 this.symptomsOfDisease.push({id:k, name: listOfSymptoms[k].name, def: def, comment: comment, synonyms: listOfSymptoms[k].synonyms, checked: false});
               }
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
                 var foundElement2 = this.searchService.search(this.symptomsOfDisease,'id', k);
                 if(!foundElement2){
                   var comment = "";
                   var def = "";
                   if(listOfOtherSymptoms[k].desc!="None"){
                     def = listOfOtherSymptoms[k].desc;
                   }
                   if(listOfOtherSymptoms[k].comment!=""){
                     comment = listOfOtherSymptoms[k].comment;
                   }else{
                     comment = "None"
                   }
                   if(foundElement){
                     this.symptomsOfDisease.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: true});
                   }else{
                     this.symptomsOfDisease.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: false});
                   }
                 }
              }
            }
          }
        }
      }

      if(this.symptomsOfDisease.length>0){

        this.symptomsOfDisease.sort(this.sortService.GetSortOrder("name"));

        let ngbModalOptions: NgbModalOptions = {
              backdrop : 'static',
              keyboard : false,
              windowClass: 'ModalClass-xl'
        };
        if(this.modalReference!=undefined){
          this.modalReference.close();

        }
        this.modalReference = this.modalService.open(contentSeeSymptomsOfDisease, ngbModalOptions);
        this.loadingSymptomsOfDisease = false;

      }else{
        this.toastr.warning('', this.translate.instant("dashboardpatient.Right now we can not show you symptoms associated with your condition"));
        this.loadingSymptomsOfDisease = false;
      }
      //console.log(this.symptomsOfDisease);

     }, (err) => {
       console.log(err);
       this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
       this.loadingSymptomsOfDisease = false;
     }));

  }

  reloadSymptomsOfDisease(contentSeeSymptomsOfDisease){
    this.getSymptomsOfDisease(this.actualConditionId, contentSeeSymptomsOfDisease);
  }

  changeStateDiseaseSymptom(index){
    this.symptomsOfDisease[index].checked = !(this.symptomsOfDisease[index].checked);
  }

  saveSymptomsOfDisease(){
    //console.log(this.symptomsOfDisease);
    for (var k = 0; k < this.symptomsOfDisease.length; k++) {
      if(this.symptomsOfDisease[k].checked){
        var foundElement = this.searchService.search(this.phenotype.data,'id', this.symptomsOfDisease[k].id);
        //console.log(foundElement);
        if(!foundElement){
          this.phenotype.data.push(
            {id: this.symptomsOfDisease[k].id,
              name: this.symptomsOfDisease[k].name,
              new: true,
              checked: true,
              percentile: this.symptomsOfDisease[k].percentile,
              def: this.symptomsOfDisease[k].def,
              synonyms: this.symptomsOfDisease[k].synonyms,
              comment: this.symptomsOfDisease[k].comment,
              inputType: 'proposedDiseases',
              importance: '1',
              polarity: '0',
              severity: '',
              onset: ''
            });
          this.checksChanged =true;
        }
      }else{
        var foundElement = this.searchService.search(this.phenotype.data,'id', this.symptomsOfDisease[k].id);
        if(foundElement){
          var finished = false;
          //console.log(this.phenotype.data);
          for (var i = 0; i < this.phenotype.data.length && !finished; i++) {
            if(this.phenotype.data[i]!=undefined){

              if(this.phenotype.data[i].id == this.symptomsOfDisease[k].id){
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

    if(this.modalReference!=undefined){
      this.modalReference.close();

    }
    this.expanded = false;
    this.saveSymptomsToDb();

  }

  changeDiagnosis(){
    //this.diagnosisInfo.previousDiagnosis = '';
    //this.searchDiseaseField = '';
    this.listOfFilteredDiseases = [];
  }


  saveNotes(){
    this.savingNotes = true;
    if(this.authGuard.testtoken()){
      if(this.diagnosisInfo._id==null){
        this.subscription.add( this.http.post(environment.api+'/api/diagnosis/'+this.authService.getCurrentPatient().sub, this.diagnosisInfo)
        .subscribe( (res : any) => {
          this.diagnosisInfo = res.diagnosis;
          this.savingNotes = false;
          //this.toastr.success('', this.translate.instant("generics.Data saved successfully"));

         }, (err) => {
           console.log(err);
           this.savingNotes = false;
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/diagnosis/'+this.diagnosisInfo._id, this.diagnosisInfo)
        .subscribe( (res : any) => {
          this.diagnosisInfo = res.diagnosis;
          this.savingNotes = false;
          //this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
         }, (err) => {
           console.log(err.error);
           this.savingNotes = false;
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));
      }
    }
  }

  onFileChangePDF(event)  {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]); // read file as data url
      reader.onload = (event2:any) => { // called once readAsDataURL is completed
        var the_url = event2.target.result

        var extension = (event.target.files[0]).name.substr((event.target.files[0]).name.lastIndexOf('.'));
        extension= extension.toLowerCase();
        console.log(extension);
        this.langToExtract = '';
        if(event.target.files[0].type=='application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension == '.docx'){
          this.loadFile(the_url,function(err,content){
              if (err) { console.log(err);};
              var doc = new Docxgen(content);
              var text = doc.getFullText();
              this.detectLanguage(text, 'otherdocs');
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

          this.callParser();

       }else{
         Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "error");
       }

      }

    }
  }

  callParser(){
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
            self.callParser();
          }else{
            console.log('seleciona no');
            var testLangText = self.medicalText.substr(0,4000)
            self.detectLanguage(testLangText, 'parser');
          }
        });

      }else{
        self.parserObject.parserStrategy = 'Auto'
        var testLangText = self.medicalText.substr(0,4000)
        self.detectLanguage(testLangText, 'parser');
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

  detectLanguage(testLangText, method){
    this.subscription.add( this.apiDx29ServerService.getDetectLanguage(testLangText)
    .subscribe( (res : any) => {
      console.log(res[0].language);
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
              this.callParser();
            }
          }else{
            this.langToExtract = res[0].language
          }
        });

      }else{
        if(res[0].language != this.authService.getLang()){
          this.langToExtract = res[0].language
        }else{
          this.langToExtract = this.authService.getLang()
        }

      }
    }, (err) => {
      console.log(err);
      this.loadingHpoExtractor = false;
      this.toastr.error('', this.translate.instant("generics.error try again"));
    }));
  }

  onSubmitToExtractor(){
    this.loadingHpoExtractor = true;
    Swal.fire({
        title: this.translate.instant("generics.Please wait"),
        html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i><p>'+this.translate.instant("patdiagdashboard.document down into sentences")+'</p>',
        showCancelButton: false,
        showConfirmButton: false,
        allowOutsideClick: false
    }).then((result) => {

    });
    var lang = this.authService.getLang();
    if(this.langToExtract!=''){
      lang = this.langToExtract;
    }
    var jsontestLangText = { "text": this.medicalText };
    this.subscription.add(this.apif29BioService.getSegmentation(lang,jsontestLangText)
    .subscribe( (res : any) => {
      console.log(res);
      this.resultSegmentation = res;
      this.prepareCallNCR();

   }, (err) => {
     console.log(err);
     //tratar el error
     Swal.close();
   }));
  }

  prepareCallNCR(){
    console.log(this.langToExtract);
    if(this.langToExtract!='en'){
      Swal.close();
      Swal.fire({
          title: this.translate.instant("generics.Please wait"),
          html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i><p>'+this.translate.instant("patdiagdashboard.translating the document")+'</p>',
          showCancelButton: false,
          showConfirmButton: false,
          allowOutsideClick: false
      }).then((result) => {

      });
      this.subscription.add(this.apif29BioService.getTranslationDictionary('en',this.resultSegmentation)
      .subscribe( (res : any) => {
        console.log(res);
        this.resultSegmentation = res;
        this.callNCR();
     }, (err) => {
       console.log(err);
       Swal.close();
     }));
    }else{
      this.callNCR();
    }
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
    Swal.close();
    Swal.fire({
        title: this.translate.instant("generics.Please wait"),
        html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i><p>'+this.translate.instant("patdiagdashboard.extracting the symptoms")+'</p>',
        showCancelButton: false,
        showConfirmButton: false,
        allowOutsideClick: false
    }).then((result) => {

    });
    this.subscription.add(this.apif29NcrService.getAnnotate_batch(temporal)
    .subscribe( (res : any) => {
      console.log(res);
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

          console.log(infoNcr);
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
          console.log(this.temporalSymptoms);
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
          this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(hposStrins,this.listOfphenotypesinfo)
          //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,hposStrins)
          .subscribe( (res2 : any) => {
            var tamano= Object.keys(res2).length;
            if(tamano>0){
              for(var i in res2) {
                if(res2[i][0]!=undefined){
                  for (var j = 0; j < this.temporalSymptoms.length; j++) {
                    if(res2[i][0].id==this.temporalSymptoms[j].id){
                      this.temporalSymptoms[j].name = res2[i][0].layperson;
                      this.temporalSymptoms[j].def = res2[i][0].desc;
                      this.temporalSymptoms[j].synonyms = res2[i][0].synonyms;
                      this.temporalSymptoms[j].comment = res2[i][0].comment;
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
         Swal.close();
          document.getElementById("openModalSymptomsNcrButton").click();
          this.changeTriggerHotjar('ncrresults_');
        }else{
          this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
        }
        this.loadingHpoExtractor = false;
      }

   }, (err) => {
     console.log(err);
     Swal.close();
   }));
  }

  addTemporalSymptom(symptom, inputType){
    var foundElement = this.searchService.search(this.temporalSymptoms,'id', symptom.id);
    if(!foundElement){
      this.temporalSymptoms.push({id: symptom.id,name: symptom.name, new: true, checked: true, percentile:-1, inputType: inputType, importance: '1', polarity: '0', similarity: symptom.similarity, positions: symptom.positions, severity: symptom.severity, onset: symptom.onset, text: symptom.text});
    }else{
      //buscar el sintoma, mirar si tiene mejor prababilidad, y meter la nueva aparicion en posiciones
      var enc = false;
      for(var z = 0; z < this.temporalSymptoms.length && !enc; z++) {
        if(this.temporalSymptoms[z].id==symptom.id){
          if(this.temporalSymptoms[z].similarity < symptom.similarity){
            this.temporalSymptoms[z].similarity = symptom.similarity;
          }
          this.temporalSymptoms[z].positions.push(symptom.positions[0]);

          //añadir la frase donde aparece
          console.log(symptom.text[0]);
          this.temporalSymptoms[z].text.push(symptom.text[0]);
          enc = true;
        }
      }
    }
  }

  changeStateSymptom(index){
    this.temporalSymptoms[index].checked = !(this.temporalSymptoms[index].checked);
  }

  showPanelSymptomsNcr(contentSymptomsNcr){
    this.ncrResultView = false;
    this.selectedHpoIndex = -1;
    this.selectedSymptomIndex = -1;
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
    this.ncrResultView = true;
    this.searchTerm = text.substring(pos1, pos2);
    this.resultTextNcrCopy = this.highlightSearch.transform(this.resultTextNcr, this.searchTerm);
    setTimeout(()=>{
      var el = document.getElementsByClassName("actualPosition")[0];
      el.scrollIntoView(true);
    }, 100);
    //document.getElementById('initpos').scrollIntoView(true);
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

    //document.getElementById('actualPosition').scrollIntoView(true);
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
    this.saveSymptomsToDb();
    this.saveResultsNcr();
    if(this.modalReference!=undefined){
      this.modalReference.close();
      this.showPanelExtractor = false;
    }
  }

  sortByName(){
    this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
  }

  sortBySimilarity(){
    this.temporalSymptoms.sort(this.sortService.GetSortOrderInverse("similarity"));
  }

   addSymptom(symptom, inputType){
     var foundElement = this.searchService.search(this.phenotype.data,'id', symptom.id);
     if(!foundElement){
       this.phenotype.data.push({id: symptom.id,name: symptom.name, new: true, checked: true, percentile:-1, inputType: inputType, importance: '1', polarity: '0', severity: '', onset: ''});
       this.numberOfSymptoms++;
     }
   }

   addSymptomsManual(contentAddSymptomsManual){
     let ngbModalOptions: NgbModalOptions = {
           backdrop : 'static',
           keyboard : false,
           windowClass: 'ModalClass-xl'
     };
     this.modalReference = this.modalService.open(contentAddSymptomsManual, ngbModalOptions);
   }

   selected2(index) {
     this.selectedItems.push(this.listOfFilteredSymptoms[index]);
     this.listOfFilteredSymptoms = [];
     this.modelTemp = '';
   }

   deleteItem(item) {
     this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
     //this.inputEl.nativeElement.focus();
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

   hasSymptomsToSave(){
     if(this.phenotype.data.length>0){
       this.saveSymptomsToDb();
     }else{
       this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
     }

   }

   saveSymptomsToDb() {
     if(this.authGuard.testtoken()){
       this.sending = true;
       var phenotoSave = JSON.parse(JSON.stringify(this.phenotype));
       phenotoSave.data = [];
       for (var i = 0; i <  this.phenotype.data.length; i++) {
         if(this.phenotype.data[i].checked){
           if(this.phenotype.data[i].inputType == undefined){
             phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name, inputType: 'unknown', importance: '1', polarity: '0', severity: '', onset: ''});
           }else{
             phenotoSave.data.push({id: this.phenotype.data[i].id,name: this.phenotype.data[i].name, inputType: this.phenotype.data[i].inputType, importance: '1', polarity: '0', severity: '', onset: ''});
           }
         }
       }
       this.phenotype = JSON.parse(JSON.stringify(phenotoSave));
       this.checksChanged = false;
       this.phenotype.date = Date.now();
       //console.log(this.phenotype);
       if(this.phenotype._id==null){
         this.subscription.add( this.http.post(environment.api+'/api/phenotypes/'+this.authService.getCurrentPatient().sub, this.phenotype)
         .subscribe( (res : any) => {
           this.sending = false;
           //this.toastr.success('', this.msgDataSavedOk);

           this.loadSymptoms(false);

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
           this.loadSymptoms(false);

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
         this.saveSymptomsToDb();
         //this.getRelatedConditions();
       }
     });
   }

   openLinkMonarch(url, e){
     window.open('https://monarchinitiative.org/phenotype/'+url, '_blank');
     e.stopPropagation();
   }

   checkChange(){
     this.checksChanged = true;
   }

   changeAttributesSymptom(index, contentSymptomAttributes){
     this.actualSymptom = this.phenotype.data[index];
     //console.log(this.phenotype.data[index]);
     let ngbModalOptions: NgbModalOptions = {
           backdrop : 'static',
           keyboard : false,
           windowClass: 'ModalClass-xl'
     };
     this.modalReference = this.modalService.open(contentSymptomAttributes, ngbModalOptions);
   }

   reportError(){
     //mostrar mensaje informando que el servicio monarch está caido y que se les informará de ello
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
           //console.log(res);
         }, (err) => {
           console.log(err);
         }));
       }
     });

   }

   setStateExpanded(value){
     this.expanded = value;
   }

   initVars(){
     this.shareForm.reset();
     this.roleShare = 'Clinical';
     this.email = '';
     this.role = 'User';
     this.permissions.shareEmr = true;
     this.permissions.askFirst = false;
     this.permissions.shareWithAll = false;
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
        //this.getSymptomsOfDisease(value.id, contentSeeSymptomsOfDisease);

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
            this.listOfSymptomsTemp.push({id:this.relatedConditions[i].symptoms[j].id, name: this.relatedConditions[i].symptoms[j].name, def: this.relatedConditions[i].symptoms[j].def, comment: this.relatedConditions[i].symptoms[j].comment, synonyms: this.relatedConditions[i].symptoms[j].synonyms, checked: false});
          }
        }
      }
    }

    //console.log(this.listOfSymptomsTemp);
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

  nextDisease(){
    this.posactual++;
    document.getElementById('initpos').scrollIntoView(true);
    this.getSymptomsStep();
  }

  previousDisease(){
    if(this.posactual>0){
      this.posactual--;
    }
    document.getElementById('initpos').scrollIntoView(true);
    this.getSymptomsStep();

  }

  changeStateTempSymptom(index){
    this.listOfSymptoms[index].checked = !(this.listOfSymptoms[index].checked);
    var enc = false;
    for (var i = 0; i <  this.listOfSymptomsTemp.length && !enc; i++) {
      if(this.listOfSymptomsTemp[i].checked){
        enc = true;
      }
    }
    if(enc){
      this.hasChangesSuggestion = true;
    }else{
      this.hasChangesSuggestion = false;
    }
  }

  recalculate(){
    this.saveSymptomsOfDiseaseSuggested();
  }

  changeSuggestedView(){
    if(this.viewSuggestion == 1){
      this.viewSuggestion = 0;
    }else{
      this.viewSuggestion = 1;
    }
    //console.log(this.viewSuggestion);
  }

  finishWizard(){
    this.showWizard(false);
    //this.loadSymptomsOfDiseaseForGraph();
  }

  goTo(index){
    this.showWizard(true);
  }


  showWizard(bool){
    this.showingWizard = bool;

    if(bool== false){
      this.showButtonWorkspace = true;
      if(this.diagnosisInfo.hasDiagnosis != undefined){
        this.showPanelDiagnosisInfo = false;
      }
      if(this.diagnosisInfo.previousDiagnosis!= ''){
        this.showPanelSymptomsPatient = true;
      }
      this.loadSymptomsOfDiseaseForGraph();
    }

  }
  goToWorkspace(){
    if(this.phenotype.data.length==0 || this.actualCondition ==''){
      if(this.actualCondition ==''){
        Swal.fire(this.translate.instant("patdiagdashboard.conditiontoWorkspace"), '', "error");
      }else if(this.phenotype.data.length==0){
        Swal.fire(this.translate.instant("patdiagdashboard.symptomstoWorkspace"), '', "error");
      }

    }else{
      this.redrawNewSize=false;
      // Elimino todo lo que hubiese (limpio la pantalla)
      d3.selectAll("svg").remove();
      d3.selectAll(".venntooltip").remove();
      d3.selectAll(".text").remove();

      this.chartDataSymptomsFreq=[];
      this.chartDataVennReal=[];
      this.chartDataBarsReal=[];
      this.chartDataVenn=[]
      this.chartDataBars=[];
      this.showWizard(false)
    }

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

  changeHasDiagnosis(){
    //this.diagnosisInfo.hasDiagnosis = undefined;
    this.showPanelDiagnosisInfo = true;
    this.showPanelSymptomsPatient = false;
  }

  changeGeneticallyTested(){
    this.showPanelGeneticInfo = true;
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

  loadSymptomsOfDiseaseForGraph(){
    this.loadingGraphSymptomFreq=true;
    this.fullListSymptoms = [];
    this.omimSymptoms = [];
    this.orphaSymptoms = [];
    this.listSymtomsFreqForGraphFiltered=[];
    this.listSymtomsFreqForGraphQuery=[];

    if(this.diagnosisInfo.previousDiagnosis != '' && this.diagnosisInfo.previousDiagnosis != undefined ){
      this.loadingSymptomsDataForGraph = true;
      var actualConditionObject = this.searchFilterPipe.transformDiseases(this.listOfDiseases, 'id', this.diagnosisInfo.previousDiagnosis);
      var xrefs = actualConditionObject[0].id;
      var listXRefs = [actualConditionObject[0].id];
      //get symtoms
      var lang = this.authService.getLang();
      this.subscription.add(this.apif29BioService.getSymptomsOfDisease(lang,listXRefs,0)
      .subscribe( (res : any) => {
        //console.log(res);
          var idDesease = listXRefs[0];
          var info = res[idDesease];
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
                }
                for(var i = 0; i < listOfSymptoms[indexSymptom].source.length; i++) {
                  if(listOfSymptoms[indexSymptom].source[i].indexOf( 'OMIM' ) != -1){
                    this.omimSymptoms.push({id:indexSymptom, name: listOfSymptoms[indexSymptom].name, def: def, comment: comment, synonyms: listOfSymptoms[indexSymptom].synonyms});
                  }else if(listOfSymptoms[indexSymptom].source[i].indexOf( 'ORPHA' ) != -1){
                    this.orphaSymptoms.push({id:indexSymptom, name: listOfSymptoms[indexSymptom].name, def: def, comment: comment, synonyms: listOfSymptoms[indexSymptom].synonyms});
                  }
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
                       if(listOfOtherSymptoms[k].desc!="None"){
                         def = listOfOtherSymptoms[k].desc;
                       }
                       if(listOfOtherSymptoms[k].comment!=""){
                         comment = listOfOtherSymptoms[k].comment;
                       }else{
                         comment = "None"
                       }
                       if(!foundElement2){
                         if(foundElement){
                           this.omimSymptoms.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: true});
                         }else{
                           this.omimSymptoms.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: false});
                         }
                       }
                       if(!foundElement3){
                         if(foundElement){
                           this.orphaSymptoms.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: true});
                         }else{
                           this.orphaSymptoms.push({id:k, name: listOfOtherSymptoms[k].name, def: def, comment: comment, synonyms: listOfOtherSymptoms[k].synonyms, checked: false});
                         }
                       }

                     }
                  }
                }
              }
            }

            this.omimSymptoms.sort(this.sortService.GetSortOrder("name"));
            this.orphaSymptoms.sort(this.sortService.GetSortOrder("name"));
            //console.log(this.omimSymptoms);
            //console.log(this.orphaSymptoms);

            this.checkOPatientSymptoms();
            this.checkOrphaSymptoms();
            this.checkOmimSymptoms();

            // Llamada para coger los hijos de los sintomas
            // List IDs
            var symptomsOfDiseaseIds =[];
            this.fullListSymptoms.forEach(function(element) {
              symptomsOfDiseaseIds.push(element.id);
            });

            // Get predecessors
            this.subscription.add(this.apif29BioService.getSuccessorsOfSymptoms(symptomsOfDiseaseIds)
            .subscribe( (res1 : any) => {
              //console.log(res1)
              //console.log(this.phenotype.data)
              //console.log(this.fullListSymptoms)
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

              //console.log(this.listSymptomsMe)
              //console.log(this.listSymptomsGeneric)
              //console.log(this.listSymptomsMeGeneric)
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

              // Diagrama de bars

              // Lista de datos de entrada para la representacion del diagrama Bars
              this.chartDataBars = [];

              this.chartDataBars.push([
                this.translate.instant("patdiagdashboard.panel3ReferenceCase"),
                this.listSymptomsGeneric.length
              ]);
              this.chartDataBars.push([
                this.translate.instant("patdiagdashboard.panel3MyCase"),
                this.listSymptomsMe.length
              ]);

              // Diagrama de bars segun frequency de los sintomas

              // -------------- OBTENCION DE DATOS -> this.listSymtomsFreq -----------------------------
              // Partiendo de los genericos quitando los de phenotype
              //si tiene diagnóstico
              if(this.diagnosisInfo.previousDiagnosis != ''){
                //obtener la lista de síntomas, ids de pacientes, etc de esa enfermedad
                this.listSymtomsFreq=[];
                this.listSymtomsFreq=[{data:[],numberPoblation:0,numberSimPoblation:0}]
                this.subscription.add( this.http.get(environment.api+'/api/symptoms/'+this.diagnosisInfo.previousDiagnosis)
                .subscribe( (resSymptoms : any) => {
                  this.listSymtomsFreqResponse=resSymptoms;
                  var realSymtoms= Object.keys(this.listSymtomsFreqResponse).length;

                  // --------------------------------------------------------------------
                  // Aqui tendria que cargar la lista de paciente simulado-sintomas
                  this.listSymtomsFreqResponseSim=[] //(resSimSymptoms)

                  // Para casos simulados, no los vamos a sacar
                  /*var idLowCaseDisease = this.diagnosisInfo.previousDiagnosis.toLowerCase();
                  idLowCaseDisease = idLowCaseDisease.replace(":","-");
                  console.log(idLowCaseDisease);
                  this.subscription.add( this.http.get(environment.simulatedBlobAccessToken.blobAccountUrl+'/'+idLowCaseDisease+'.json'+environment.simulatedBlobAccessToken.sasToken)
                  .subscribe( (resSimSymptoms : any) => {*/
                      this.listSymtomsFreqResponseSim=Object.create(null);
                      /*for(var i=0;i<resSimSymptoms.patients.length;i++){
                        //console.log(resSimSymptoms.patients[i].id)
                        this.listSymtomsFreqResponseSim[resSimSymptoms.patients[i].id]=resSimSymptoms.patients[i].hpos
                      }*/
                      var simSymtoms= Object.keys(this.listSymtomsFreqResponseSim).length;
                      // ---------------------------------------------------------------------
                      //  A partir de aqui podria tener alguna de las dos listas vacias - que no hubiese datos, y esto no me puede afectar al resultado final
                      // Si a alvaro le paso una lista vacia - Falla por lo que antes de llamar a la de alvaro tengo que comprobar que la lista que me ha dado Javi no esta vacia(hay pacientes)

                      // en todos los casos el resultado se guardara en listSymptomsFreq (contendra la info real y la simulada para despues pasar al grafico)
                      // CASO 1. si que tengo pacientes realesç
                      if(realSymtoms>0){
                        // Caso 1.a. Ademas tengo pacientes simulados
                        if(simSymtoms>0){
                          console.log("case 1a")
                        // En este caso en la grafica podria pintar los simulados, los reales y los de mi caso
                          // Aqui lo primero sera limpiar las dos listas - quitar los padres en la lista de sintomas de cada paciente real o simulado
                          this.listSymtomsFreqResponseWithoutPredecessorsByPatient=[];
                          // Get succesors patient real-symtoms list
                          console.log(this.listSymtomsFreqResponse)
                          this.subscription.add(this.apif29BioService.getLeavesOfSymptoms(this.listSymtomsFreqResponse)
                          .subscribe( (resSymtomsFiltered : any) => {
                            console.log(resSymtomsFiltered)
                            this.listSymtomsFreqResponseWithoutPredecessorsByPatient=resSymtomsFiltered;
                            this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient=[];
                            // Get succesors patient sim-symtoms list
                            //console.log(this.listSymtomsFreqResponseSim)
                            this.subscription.add(this.apif29BioService.getLeavesOfSymptoms(this.listSymtomsFreqResponseSim)
                            .subscribe( (resSimSymtomsFiltered2 : any) => {
                              this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient=resSimSymtomsFiltered2
                              //console.log(resSimSymtomsFiltered)
                              // Con estas dos listas ya puedo generarme los datos que se van a mostrar, teniendo por tanto:
                              //  - numberPoblation: Un numero de pacientes reales total: sin contar los pacientes que no tengan sintomas
                              //  - numberSimPoblation: Un numero de pacientes simulados total: sin contar los pacientes que no tengan sintomas
                              //  - Una lista de sintomas -
                              //                          - listPatients total (todos los pacientes reales que tengan un sintoma)
                              //                          - listPatientsSim total (todos los pacientes sim que tengan un sintoma)
                              //                          - listPatientsWithoutPredecessors (todos los pacientes reales que tengan un sintoma que no sea PADRE)
                              //                          - listPatientsSimWithoutPredecessors (todos los pacientes simulados que tengan un sintoma que no sea PADRE)

                              // Calculo ahora el numero total de poblacion real considerando unicamente los pacientes reales que han metido sintomas
                              var tamanoSymptoms= Object.keys(this.listSymtomsFreqResponse).length;
                              if(tamanoSymptoms>0){
                                var numberPoblation=0;
                                for(var patient in this.listSymtomsFreqResponse){
                                  if(this.listSymtomsFreqResponse[patient].length>0){
                                    numberPoblation=numberPoblation+1;
                                  }
                                }
                                this.listSymtomsFreq[0].numberPoblation = numberPoblation;
                              }
                              var tamanoSimSymptoms= Object.keys(this.listSymtomsFreqResponseSim).length;
                              if(tamanoSimSymptoms>0){
                                var numberSimPoblation=0;
                                for(var patient2 in this.listSymtomsFreqResponseSim){
                                  if(this.listSymtomsFreqResponseSim[patient2].length>0){
                                    numberSimPoblation=numberSimPoblation+1;
                                  }
                                }
                                this.listSymtomsFreq[0].numberSimPoblation = numberSimPoblation;
                              }

                              // Ahora tengo que crear el data de listSymptomsFreq
                              //console.log(numberSimPoblation)
                              //console.log(numberPoblation)
                              // Para ello tengo que ir recorriendo las dos listas anteriores, y rellenando listSymptoms freq de acuerdo tambien con lo obtenido en las dos listas filtradas (sin padres)
                              var resultData=[];
                              // Recorro la primera respuesta de Javi
                              for(var ipatient in this.listSymtomsFreqResponse) {
                                //recorrer la lista de sintomas
                                var listOfSymptoms = this.listSymtomsFreqResponse[ipatient]
                                var symptomFoundForPatient=false;
                                for(var i=0;i<listOfSymptoms.length;i++){
                                  symptomFoundForPatient=false;
                                  for (var j=0;j<resultData.length;j++){
                                    // Si ya se habia añadido el sintoma a la lista
                                    if(resultData[j].symptom!=undefined){
                                      if(resultData[j].symptom.id==listOfSymptoms[i]){
                                        // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                        for(var ipatient2 in this.listSymtomsFreqResponseWithoutPredecessorsByPatient) {
                                          // Para el mismo paciente
                                          if(ipatient==ipatient2){
                                            // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                            if(this.listSymtomsFreqResponseWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                              resultData[j].listPatientsWithoutPredecessors.push({patientId:ipatient2,queried:false})
                                            }
                                          }
                                        }
                                        resultData[j].listPatients.push({patientId:ipatient,queried:false})
                                        symptomFoundForPatient=true;
                                      }
                                    }
                                  }
                                  // Si no se habia añadido el sintoma a la lista
                                  if(symptomFoundForPatient==false){
                                    // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                    for(var ipatient2 in this.listSymtomsFreqResponseWithoutPredecessorsByPatient) {
                                      // Para el mismo paciente
                                      if(ipatient==ipatient2){
                                        // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                        if(this.listSymtomsFreqResponseWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                          resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[{patientId:ipatient,queried:false}], listPatientsWithoutPredecessors:[{patientId:ipatient2,queried:false}],listPatientsSim:[],listPatientsSimWithoutPredecessors:[]})
                                        }
                                        else{
                                          resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[{patientId:ipatient,queried:false}], listPatientsWithoutPredecessors:[],listPatientsSim:[],listPatientsSimWithoutPredecessors:[]})
                                        }
                                      }
                                    }
                                  }
                                }
                              }

                              // Una vez que tengo todo analizado para la primera lista de Javi, ahora tengo que coger la segunda (sim)
                              // Recorriendo esta lista habria que buscar los sintomas que ya se han añadido sobre  resultData y añadir la info de sim
                              for(var ipatient in this.listSymtomsFreqResponseSim) {
                                //recorrer la lista de sintomas
                                var listOfSymptoms = this.listSymtomsFreqResponseSim[ipatient]
                                var symptomFoundForPatient=false;
                                for(var i=0;i<listOfSymptoms.length;i++){
                                  symptomFoundForPatient=false;
                                  // Ya tengo info en resultData
                                  for (var j=0;j<resultData.length;j++){
                                    // Hay que mirar si el sintoma del paciente simulado esta añadido o no
                                    // Si si lo esta, se añade solo la info adicional de los pacientes simulados
                                    if(resultData[j].symptom.id==listOfSymptoms[i]){
                                      // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                      for(var ipatient2 in this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient) {
                                        // Para el mismo paciente
                                        if(ipatient==ipatient2){
                                          // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                          if(this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                            resultData[j].listPatientsSimWithoutPredecessors.push({patientId:ipatient2,queried:false})
                                          }
                                        }
                                      }
                                      resultData[j].listPatientsSim.push({patientId:ipatient,queried:false})
                                      symptomFoundForPatient=true;
                                    }
                                  }
                                  // Si no lo esta, se añade el sintoma y los pacientes simulados
                                  if(symptomFoundForPatient==false){
                                    // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                    for(var ipatient2 in this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient) {
                                      // Para el mismo paciente
                                      if(ipatient==ipatient2){
                                        // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                        if(this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                          resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[], listPatientsWithoutPredecessors:[],listPatientsSim:[{patientId:ipatient,queried:false}],listPatientsSimWithoutPredecessors:[{patientId:ipatient2,queried:false}]})
                                        }
                                        else{
                                          resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[], listPatientsWithoutPredecessors:[],listPatientsSim:[{patientId:ipatient,queried:false}],listPatientsSimWithoutPredecessors:[]})
                                        }
                                      }
                                    }
                                  }
                                }
                              }

                              // Ahora ya tengo actualizado el resultData y puedo crear la lista para graph
                              this.listSymtomsFreq[0].data=resultData;

                              // Buscar los names
                              // Necesito la lista de hpo y se la paso al post, con el resultado actualizo el name de la lista de sintomas
                              var lang = this.authService.getLang();
                              var listSymptomsToTranslate=[];
                              for(var i=0;i<this.listSymtomsFreq[0].data.length;i++){
                                listSymptomsToTranslate.push(this.listSymtomsFreq[0].data[i].symptom.id)
                              }
                              this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(listSymptomsToTranslate,this.listOfphenotypesinfo)
                              //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,listSymptomsToTranslate)
                              .subscribe( (res2 : any) => {
                                var tamano= Object.keys(res2).length;
                                if(tamano>0){
                                  for(var i in res2) {
                                    if(res2[i][0]!=undefined){
                                      for (var j = 0; j < this.listSymtomsFreq[0].data.length; j++) {
                                        if(res2[i][0].id==this.listSymtomsFreq[0].data[j].symptom.id){
                                          console.log(res2[i][0].layperson)
                                          this.listSymtomsFreq[0].data[j].symptom.name = res2[i][0].layperson;
                                          if((res2[i][0].layperson).length>45){
                                            this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson).substr(0,45)+"...";
                                          }
                                          else{
                                            this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson)
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                // Lista de datos de entrada para la representacion del diagrama SymptomsFreq
                                // Me copio lo que había en listSymptomsFreq para actualizar la lista que voy a pintar:
                                this.listSymtomsFreqForGraph=[];
                                //this.listSymtomsFreqForGraph=this.listSymtomsFreq;
                                this.listSymtomsFreqForGraph=[];
                                this.listSymtomsFreqForGraph=this.listSymtomsFreq;

                                this.chartDataSymptomsFreq=[];

                                // Si la pantalla es muy pequeña hay que hacer este gráfico con el TOP10
                                this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
                                //console.log(this.chartDataSymptomsFreq)
                                this.listSymtomsFreqForGraphFiltered=this.listSymtomsFreqForGraph;
                                this.listSymtomsFreqForGraphOriginalCopy=this.listSymtomsFreqForGraphFiltered;

                                // Dibujo los gráficos
                                this.drawCharts();
                                this.loadingGraphSymptomFreq=false;
                              }, (err) => {
                                console.log(err);
                                this.toastr.error('', this.translate.instant("generics.error try again"));
                              }));
                            }, (err) => {
                              console.log(err);
                              this.toastr.error('', this.translate.instant("generics.error try again"));
                            }));
                          }, (err) => {
                            console.log(err);
                            this.toastr.error('', this.translate.instant("generics.error try again"));
                          }));
                        }
                        // Caso 1.b. No tengo pacientes simulados
                        else{
                          console.log("case 1b")
                          // En este caso en la grafica podria pintar los reales y los de mi caso
                          // Aqui lo primero sera limpiar las dos listas - quitar los padres en la lista de sintomas de cada paciente real
                          this.listSymtomsFreqResponseWithoutPredecessorsByPatient=[];
                          // Get succesors patient real-symtoms list
                          this.subscription.add(this.apif29BioService.getLeavesOfSymptoms(this.listSymtomsFreqResponse)
                          .subscribe( (resSymtomsFiltered : any) => {
                            console.log(resSymtomsFiltered)
                            this.listSymtomsFreqResponseWithoutPredecessorsByPatient=resSymtomsFiltered;
                            // En este caso los datos que se van a mostrar serian:
                            //  - numberPoblation: Un numero de pacientes reales total: sin contar los pacientes que no tengan sintomas
                            //  - numberSimPoblation: 0
                            //  - Una lista de sintomas -
                            //                          - listPatients total (todos los pacientes reales que tengan un sintoma)
                            //                          - listPatientsSim total []
                            //                          - listPatientsWithoutPredecessors (todos los pacientes reales que tengan un sintoma que no sea PADRE)
                            //                          - listPatientsSimWithoutPredecessors []

                            // Calculo ahora el numero total de poblacion real considerando unicamente los pacientes reales que han metido sintomas
                            var tamanoSymptoms= Object.keys(this.listSymtomsFreqResponse).length;
                            if(tamanoSymptoms>0){
                              var numberPoblation=0;
                              for(var patient in this.listSymtomsFreqResponse){
                                if(this.listSymtomsFreqResponse[patient].length>0){
                                  numberPoblation=numberPoblation+1;
                                }
                              }
                              this.listSymtomsFreq[0].numberPoblation = numberPoblation;
                            }

                            // Ahora tengo que crear el data de listSymptomsFreq

                            // Para ello tengo que ir recorriendo las lista anterior de datos reales, y rellenando listSymptoms freq de acuerdo con lo obtenido en la lista filtrada (sin padres)
                            var resultData=[];
                            // Recorro la primera respuesta de Javi
                            for(var ipatient in this.listSymtomsFreqResponse) {
                              //recorrer la lista de sintomas
                              var listOfSymptoms = this.listSymtomsFreqResponse[ipatient]
                              var symptomFoundForPatient=false;
                              for(var i=0;i<listOfSymptoms.length;i++){
                                symptomFoundForPatient=false;
                                for (var j=0;j<resultData.length;j++){
                                  // Si ya se habia añadido el sintoma a la lista
                                  if(resultData[j].symptom!=undefined){
                                    if(resultData[j].symptom.id==listOfSymptoms[i]){
                                      // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                      for(var ipatient2 in this.listSymtomsFreqResponseWithoutPredecessorsByPatient) {
                                        // Para el mismo paciente
                                        if(ipatient==ipatient2){
                                          // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                          if(this.listSymtomsFreqResponseWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                            resultData[j].listPatientsWithoutPredecessors.push({patientId:ipatient2,queried:false})
                                          }
                                        }
                                      }
                                      resultData[j].listPatients.push({patientId:ipatient,queried:false})
                                      symptomFoundForPatient=true;
                                    }
                                  }
                                }
                                // Si no se habia añadido el sintoma a la lista
                                if(symptomFoundForPatient==false){
                                  // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                  for(var ipatient2 in this.listSymtomsFreqResponseWithoutPredecessorsByPatient) {
                                    // Para el mismo paciente
                                    if(ipatient==ipatient2){
                                      // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                      if(this.listSymtomsFreqResponseWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                        resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[{patientId:ipatient,queried:false}], listPatientsWithoutPredecessors:[{patientId:ipatient2,queried:false}],listPatientsSim:[],listPatientsSimWithoutPredecessors:[]})
                                      }
                                      else{
                                        resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[{patientId:ipatient,queried:false}], listPatientsWithoutPredecessors:[],listPatientsSim:[],listPatientsSimWithoutPredecessors:[]})
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            // Ahora ya tengo actualizado el resultData y puedo crear la lista para graph
                            this.listSymtomsFreq[0].data=resultData;
                            // Buscar los names
                            // Necesito la lista de hpo y se la paso al post, con el resultado actualizo el name de la lista de sintomas
                            var lang = this.authService.getLang();
                            var listSymptomsToTranslate=[];
                            for(var i=0;i<this.listSymtomsFreq[0].data.length;i++){
                              listSymptomsToTranslate.push(this.listSymtomsFreq[0].data[i].symptom.id)
                            }
                            this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(listSymptomsToTranslate,this.listOfphenotypesinfo)
                            //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,listSymptomsToTranslate)
                            .subscribe( (res2 : any) => {
                              console.log(res2)
                              var tamano= Object.keys(res2).length;
                              if(tamano>0){
                                for(var i in res2) {
                                  if(res2[i][0]!=undefined){
                                    for (var j = 0; j < this.listSymtomsFreq[0].data.length; j++) {
                                      if(res2[i][0].id==this.listSymtomsFreq[0].data[j].symptom.id){
                                        this.listSymtomsFreq[0].data[j].symptom.name = res2[i][0].layperson;
                                        if((res2[i][0].layperson).length>45){
                                          this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson).substr(0,45)+"...";
                                        }
                                        else{
                                          this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson)
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              // Lista de datos de entrada para la representacion del diagrama SymptomsFreq
                              // Me copio lo que había en listSymptomsFreq para actualizar la lista que voy a pintar:
                              this.listSymtomsFreqForGraph=[];
                              //this.listSymtomsFreqForGraph=this.listSymtomsFreq;
                              this.listSymtomsFreqForGraph=[];
                              this.listSymtomsFreqForGraph=this.listSymtomsFreq;

                              console.log(this.listSymtomsFreqForGraph)
                              this.chartDataSymptomsFreq=[];

                              // Si la pantalla es muy pequeña hay que hacer este gráfico con el TOP10
                              this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
                              //console.log(this.chartDataSymptomsFreq)
                              this.listSymtomsFreqForGraphFiltered=this.listSymtomsFreqForGraph;
                              this.listSymtomsFreqForGraphOriginalCopy=this.listSymtomsFreqForGraphFiltered;

                              this.drawCharts();

                              this.loadingGraphSymptomFreq=false;
                            }, (err) => {
                              console.log(err);
                              this.toastr.error('', this.translate.instant("generics.error try again"));
                            }));

                          }, (err) => {
                            console.log(err);
                            this.toastr.error('', this.translate.instant("generics.error try again"));
                          }));
                        }
                      }
                      // CASO 2: no tengo pacientes reales
                      else{
                        // Caso 2.a. Pero tengo pacientes simulados
                        if(simSymtoms>0){
                          // En este caso en la grafica podria pintar los simulados y los de mi caso
                          console.log("case 2a")
                        // En este caso en la grafica podria pintar los simulados, los reales y los de mi caso
                          // Aqui lo primero sera limpiar las dos listas - quitar los padres en la lista de sintomas de cada paciente real o simulado
                          this.listSymtomsFreqResponseWithoutPredecessorsByPatient=[];
                          this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient=[];
                          // Get succesors patient sim-symtoms list
                          //console.log(this.listSymtomsFreqResponseSim)
                          this.subscription.add(this.apif29BioService.getLeavesOfSymptoms(this.listSymtomsFreqResponseSim)
                          .subscribe( (resSimSymtomsFiltered : any) => {
                            this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient=resSimSymtomsFiltered
                            //console.log(resSimSymtomsFiltered)
                            // Con estas dos listas ya puedo generarme los datos que se van a mostrar, teniendo por tanto:
                            //  - numberPoblation: 0
                            //  - numberSimPoblation: Un numero de pacientes simulados total: sin contar los pacientes que no tengan sintomas
                            //  - Una lista de sintomas -
                            //                          - listPatients total 0
                            //                          - listPatientsSim total (todos los pacientes sim que tengan un sintoma)
                            //                          - listPatientsWithoutPredecessors 0
                            //                          - listPatientsSimWithoutPredecessors (todos los pacientes simulados que tengan un sintoma que no sea PADRE)

                            var tamanoSimSymptoms= Object.keys(this.listSymtomsFreqResponseSim).length;
                            if(tamanoSimSymptoms>0){
                              var numberSimPoblation=0;
                              for(var patient2 in this.listSymtomsFreqResponseSim){
                                if(this.listSymtomsFreqResponseSim[patient2].length>0){
                                  numberSimPoblation=numberSimPoblation+1;
                                }
                              }
                              this.listSymtomsFreq[0].numberSimPoblation = numberSimPoblation;
                            }

                            // Ahora tengo que crear el data de listSymptomsFreq
                            //console.log(numberSimPoblation)
                            //console.log(numberPoblation)
                            // Para ello tengo que ir recorriendo la lista de sim, y rellenando listSymptoms freq de acuerdo con lo obtenido en la filtrada (sin padres)
                            var resultData=[];

                            for(var ipatient in this.listSymtomsFreqResponseSim) {
                              //recorrer la lista de sintomas
                              var listOfSymptoms = this.listSymtomsFreqResponseSim[ipatient]
                              var symptomFoundForPatient=false;
                              for(var i=0;i<listOfSymptoms.length;i++){
                                symptomFoundForPatient=false;
                                // Ya tengo info en resultData
                                for (var j=0;j<resultData.length;j++){
                                  // Hay que mirar si el sintoma del paciente simulado esta añadido o no
                                  // Si si lo esta, se añade solo la info adicional de los pacientes simulados
                                  if(resultData[j].symptom.id!=undefined){
                                    if(resultData[j].symptom.id==listOfSymptoms[i]){
                                      // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                      for(var ipatient2 in this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient) {
                                        // Para el mismo paciente
                                        if(ipatient==ipatient2){
                                          // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                          if(this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                            resultData[j].listPatientsSimWithoutPredecessors.push({patientId:ipatient2,queried:false})
                                          }
                                        }
                                      }
                                      resultData[j].listPatientsSim.push({patientId:ipatient,queried:false})
                                      resultData[j].listPatientsWithoutPredecessors=[];
                                      resultData[j].listPatients=[];
                                      symptomFoundForPatient=true;
                                    }
                                  }
                                }
                                // Si no lo esta, se añade el sintoma y los pacientes simulados
                                if(symptomFoundForPatient==false){
                                  // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                  for(var ipatient2 in this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient) {
                                    // Para el mismo paciente
                                    if(ipatient==ipatient2){
                                      // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                      if(this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                        resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[], listPatientsWithoutPredecessors:[],listPatientsSim:[{patientId:ipatient,queried:false}],listPatientsSimWithoutPredecessors:[{patientId:ipatient2,queried:false}]})
                                      }
                                      else{
                                        resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[], listPatientsWithoutPredecessors:[],listPatientsSim:[{patientId:ipatient,queried:false}],listPatientsSimWithoutPredecessors:[]})
                                      }
                                    }
                                  }
                                }
                              }
                            }

                            // Ahora ya tengo actualizado el resultData y puedo crear la lista para graph
                            this.listSymtomsFreq[0].data=resultData;

                            // Buscar los names
                            // Necesito la lista de hpo y se la paso al post, con el resultado actualizo el name de la lista de sintomas
                            var lang = this.authService.getLang();
                            var listSymptomsToTranslate=[];
                            for(var i=0;i<this.listSymtomsFreq[0].data.length;i++){
                              listSymptomsToTranslate.push(this.listSymtomsFreq[0].data[i].symptom.id)
                            }
                            this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(listSymptomsToTranslate,this.listOfphenotypesinfo)
                            //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,listSymptomsToTranslate)
                            .subscribe( (res2 : any) => {
                              var tamano= Object.keys(res2).length;
                              if(tamano>0){
                                for(var i in res2) {
                                  if(res2[i][0]!=undefined){
                                    for (var j = 0; j < this.listSymtomsFreq[0].data.length; j++) {
                                      if(res2[i][0].id==this.listSymtomsFreq[0].data[j].symptom.id){
                                        if(res2[0][i].layperson!=undefined){
                                          this.listSymtomsFreq[0].data[j].symptom.name = res2[i][0].layperson;
                                          if((res2[i][0].layperson).length>45){
                                            this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson).substr(0,45)+"...";
                                          }
                                          else{
                                            this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson)
                                          }
                                        }
                                      }
                                    }
                                  }

                                }
                              }
                              // Lista de datos de entrada para la representacion del diagrama SymptomsFreq
                              // Me copio lo que había en listSymptomsFreq para actualizar la lista que voy a pintar:
                              this.listSymtomsFreqForGraph=[];
                              //this.listSymtomsFreqForGraph=this.listSymtomsFreq;
                              this.listSymtomsFreqForGraph=[];
                              this.listSymtomsFreqForGraph=this.listSymtomsFreq;
                              console.log(this.listSymtomsFreqForGraph)
                              this.chartDataSymptomsFreq=[];

                              // Si la pantalla es muy pequeña hay que hacer este gráfico con el TOP10
                              this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
                              //console.log(this.chartDataSymptomsFreq)
                              this.listSymtomsFreqForGraphFiltered=this.listSymtomsFreqForGraph;
                              this.listSymtomsFreqForGraphOriginalCopy=this.listSymtomsFreqForGraphFiltered;

                              this.drawCharts();
                              this.loadingGraphSymptomFreq=false;
                            }, (err) => {
                              console.log(err);
                              this.toastr.error('', this.translate.instant("generics.error try again"));
                            }));
                          }, (err) => {
                            console.log(err);
                            this.toastr.error('', this.translate.instant("generics.error try again"));
                          }));

                        }
                        // Caso 2.b. No tengo pacientes simulados
                        else{
                          // En este caso en la grafica solo podria pintar los sintomas de mi caso
                          this.drawCharts();
                          this.loadingGraphSymptomFreq=false;

                        }
                      }
                  /*}, (err) => {
                    this.loadingGraphSymptomFreq=false;
                    console.log(err);
                  }));*/
                }, (err) => {
                  console.log(err);
                  this.loadingGraphSymptomFreq=false;
                  this.toastr.error('', this.translate.instant("generics.error try again"));
                }));
              }
            }, (err) => {
              console.log(err);
              this.loadingGraphSymptomFreq=false;
              this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
            }));
          }
          else{
              if(this.diagnosisInfo.previousDiagnosis != ''){
                //obtener la lista de síntomas, ids de pacientes, etc de esa enfermedad
                this.listSymtomsFreq=[];
                this.listSymtomsFreq=[{data:[],numberPoblation:0,numberSimPoblation:0}]
                console.log(this.diagnosisInfo.previousDiagnosis)
                this.subscription.add( this.http.get(environment.api+'/api/symptoms/'+this.diagnosisInfo.previousDiagnosis)
                .subscribe( (resSymptoms : any) => {
                  this.listSymtomsFreqResponse=resSymptoms;
                  var realSymtoms= Object.keys(this.listSymtomsFreqResponse).length;
                  this.listSymtomsFreqResponseSim=[]
                  this.listSymtomsFreqResponseSim=Object.create(null);
                  var simSymtoms= Object.keys(this.listSymtomsFreqResponseSim).length;
                  // CASO 1. si que tengo pacientes realesç
                  if(realSymtoms>0){
                    // Caso 1.a. Ademas tengo pacientes simulados
                    if(simSymtoms>0){
                    // En este caso en la grafica podria pintar los simulados, los reales y los de mi caso
                      // Aqui lo primero sera limpiar las dos listas - quitar los padres en la lista de sintomas de cada paciente real o simulado
                      this.listSymtomsFreqResponseWithoutPredecessorsByPatient=[];
                      // Get succesors patient real-symtoms list
                      console.log(this.listSymtomsFreqResponse)
                      this.subscription.add(this.apif29BioService.getLeavesOfSymptoms(this.listSymtomsFreqResponse)
                      .subscribe( (resSymtomsFiltered : any) => {
                        console.log(resSymtomsFiltered)
                        this.listSymtomsFreqResponseWithoutPredecessorsByPatient=resSymtomsFiltered;
                        this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient=[];
                        // Get succesors patient sim-symtoms list
                        //console.log(this.listSymtomsFreqResponseSim)
                        this.subscription.add(this.apif29BioService.getLeavesOfSymptoms(this.listSymtomsFreqResponseSim)
                        .subscribe( (resSimSymtomsFiltered2 : any) => {
                          this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient=resSimSymtomsFiltered2
                          //console.log(resSimSymtomsFiltered)
                          // Con estas dos listas ya puedo generarme los datos que se van a mostrar, teniendo por tanto:
                          //  - numberPoblation: Un numero de pacientes reales total: sin contar los pacientes que no tengan sintomas
                          //  - numberSimPoblation: Un numero de pacientes simulados total: sin contar los pacientes que no tengan sintomas
                          //  - Una lista de sintomas -
                          //                          - listPatients total (todos los pacientes reales que tengan un sintoma)
                          //                          - listPatientsSim total (todos los pacientes sim que tengan un sintoma)
                          //                          - listPatientsWithoutPredecessors (todos los pacientes reales que tengan un sintoma que no sea PADRE)
                          //                          - listPatientsSimWithoutPredecessors (todos los pacientes simulados que tengan un sintoma que no sea PADRE)

                          // Calculo ahora el numero total de poblacion real considerando unicamente los pacientes reales que han metido sintomas
                          var tamanoSymptoms= Object.keys(this.listSymtomsFreqResponse).length;
                          if(tamanoSymptoms>0){
                            var numberPoblation=0;
                            for(var patient in this.listSymtomsFreqResponse){
                              if(this.listSymtomsFreqResponse[patient].length>0){
                                numberPoblation=numberPoblation+1;
                              }
                            }
                            this.listSymtomsFreq[0].numberPoblation = numberPoblation;
                          }
                          var tamanoSimSymptoms= Object.keys(this.listSymtomsFreqResponseSim).length;
                          if(tamanoSimSymptoms>0){
                            var numberSimPoblation=0;
                            for(var patient2 in this.listSymtomsFreqResponseSim){
                              if(this.listSymtomsFreqResponseSim[patient2].length>0){
                                numberSimPoblation=numberSimPoblation+1;
                              }
                            }
                            this.listSymtomsFreq[0].numberSimPoblation = numberSimPoblation;
                          }

                          // Ahora tengo que crear el data de listSymptomsFreq
                          //console.log(numberSimPoblation)
                          //console.log(numberPoblation)
                          // Para ello tengo que ir recorriendo las dos listas anteriores, y rellenando listSymptoms freq de acuerdo tambien con lo obtenido en las dos listas filtradas (sin padres)
                          var resultData=[];
                          // Recorro la primera respuesta de Javi
                          for(var ipatient in this.listSymtomsFreqResponse) {
                            //recorrer la lista de sintomas
                            var listOfSymptoms = this.listSymtomsFreqResponse[ipatient]
                            var symptomFoundForPatient=false;
                            for(var i=0;i<listOfSymptoms.length;i++){
                              symptomFoundForPatient=false;
                              for (var j=0;j<resultData.length;j++){
                                // Si ya se habia añadido el sintoma a la lista
                                if(resultData[j].symptom!=undefined){
                                  if(resultData[j].symptom.id==listOfSymptoms[i]){
                                    // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                    for(var ipatient2 in this.listSymtomsFreqResponseWithoutPredecessorsByPatient) {
                                      // Para el mismo paciente
                                      if(ipatient==ipatient2){
                                        // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                        if(this.listSymtomsFreqResponseWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                          resultData[j].listPatientsWithoutPredecessors.push({patientId:ipatient2,queried:false})
                                        }
                                      }
                                    }
                                    resultData[j].listPatients.push({patientId:ipatient,queried:false})
                                    symptomFoundForPatient=true;
                                  }
                                }
                              }
                              // Si no se habia añadido el sintoma a la lista
                              if(symptomFoundForPatient==false){
                                // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                for(var ipatient2 in this.listSymtomsFreqResponseWithoutPredecessorsByPatient) {
                                  // Para el mismo paciente
                                  if(ipatient==ipatient2){
                                    // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                    if(this.listSymtomsFreqResponseWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                      resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[{patientId:ipatient,queried:false}], listPatientsWithoutPredecessors:[{patientId:ipatient2,queried:false}],listPatientsSim:[],listPatientsSimWithoutPredecessors:[]})
                                    }
                                    else{
                                      resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[{patientId:ipatient,queried:false}], listPatientsWithoutPredecessors:[],listPatientsSim:[],listPatientsSimWithoutPredecessors:[]})
                                    }
                                  }
                                }
                              }
                            }
                          }

                          // Una vez que tengo todo analizado para la primera lista de Javi, ahora tengo que coger la segunda (sim)
                          // Recorriendo esta lista habria que buscar los sintomas que ya se han añadido sobre  resultData y añadir la info de sim
                          for(var ipatient in this.listSymtomsFreqResponseSim) {
                            //recorrer la lista de sintomas
                            var listOfSymptoms = this.listSymtomsFreqResponseSim[ipatient]
                            var symptomFoundForPatient=false;
                            for(var i=0;i<listOfSymptoms.length;i++){
                              symptomFoundForPatient=false;
                              // Ya tengo info en resultData
                              for (var j=0;j<resultData.length;j++){
                                // Hay que mirar si el sintoma del paciente simulado esta añadido o no
                                // Si si lo esta, se añade solo la info adicional de los pacientes simulados
                                if(resultData[j].symptom.id==listOfSymptoms[i]){
                                  // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                  for(var ipatient2 in this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient) {
                                    // Para el mismo paciente
                                    if(ipatient==ipatient2){
                                      // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                      if(this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                        resultData[j].listPatientsSimWithoutPredecessors.push({patientId:ipatient2,queried:false})
                                      }
                                    }
                                  }
                                  resultData[j].listPatientsSim.push({patientId:ipatient,queried:false})
                                  symptomFoundForPatient=true;
                                }
                              }
                              // Si no lo esta, se añade el sintoma y los pacientes simulados
                              if(symptomFoundForPatient==false){
                                // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                for(var ipatient2 in this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient) {
                                  // Para el mismo paciente
                                  if(ipatient==ipatient2){
                                    // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                    if(this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                      resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[], listPatientsWithoutPredecessors:[],listPatientsSim:[{patientId:ipatient,queried:false}],listPatientsSimWithoutPredecessors:[{patientId:ipatient2,queried:false}]})
                                    }
                                    else{
                                      resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[], listPatientsWithoutPredecessors:[],listPatientsSim:[{patientId:ipatient,queried:false}],listPatientsSimWithoutPredecessors:[]})
                                    }
                                  }
                                }
                              }
                            }
                          }

                          // Ahora ya tengo actualizado el resultData y puedo crear la lista para graph
                          this.listSymtomsFreq[0].data=resultData;

                          // Buscar los names
                          // Necesito la lista de hpo y se la paso al post, con el resultado actualizo el name de la lista de sintomas
                          var lang = this.authService.getLang();
                          var listSymptomsToTranslate=[];
                          for(var i=0;i<this.listSymtomsFreq[0].data.length;i++){
                            listSymptomsToTranslate.push(this.listSymtomsFreq[0].data[i].symptom.id)
                          }
                          this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(listSymptomsToTranslate,this.listOfphenotypesinfo)
                          //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,listSymptomsToTranslate)
                          .subscribe( (res2 : any) => {
                            var tamano= Object.keys(res2).length;
                            if(tamano>0){
                              for(var i in res2) {
                                if(res2[i][0]!=undefined){
                                  for (var j = 0; j < this.listSymtomsFreq[0].data.length; j++) {
                                    if(res2[i][0].id==this.listSymtomsFreq[0].data[j].symptom.id){
                                      if(res2[i][0].layperson!=undefined){
                                        this.listSymtomsFreq[0].data[j].symptom.name = res2[i][0].layperson;
                                        if((res2[i][0].layperson).length>45){
                                          this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson).substr(0,45)+"...";
                                        }
                                        else{
                                          this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson)
                                        }
                                      }
                                    }
                                  }
                                }

                              }
                            }
                            // Lista de datos de entrada para la representacion del diagrama SymptomsFreq
                            // Me copio lo que había en listSymptomsFreq para actualizar la lista que voy a pintar:
                            this.listSymtomsFreqForGraph=[];
                            //this.listSymtomsFreqForGraph=this.listSymtomsFreq;
                            this.listSymtomsFreqForGraph=[];
                            this.listSymtomsFreqForGraph=this.listSymtomsFreq;

                            this.chartDataSymptomsFreq=[];

                            // Si la pantalla es muy pequeña hay que hacer este gráfico con el TOP10
                            this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
                            //console.log(this.chartDataSymptomsFreq)
                            this.listSymtomsFreqForGraphFiltered=this.listSymtomsFreqForGraph;
                            this.listSymtomsFreqForGraphOriginalCopy=this.listSymtomsFreqForGraphFiltered;

                            this.drawCharts();
                            this.loadingGraphSymptomFreq=false;
                          }, (err) => {
                            console.log(err);
                            this.toastr.error('', this.translate.instant("generics.error try again"));
                          }));
                        }, (err) => {
                          console.log(err);
                          this.toastr.error('', this.translate.instant("generics.error try again"));
                        }));
                      }, (err) => {
                        console.log(err);
                        this.toastr.error('', this.translate.instant("generics.error try again"));
                      }));
                    }
                    // Caso 1.b. No tengo pacientes simulados
                    else{
                      // En este caso en la grafica podria pintar los reales y los de mi caso
                      // Aqui lo primero sera limpiar las dos listas - quitar los padres en la lista de sintomas de cada paciente real
                      this.listSymtomsFreqResponseWithoutPredecessorsByPatient=[];
                      // Get succesors patient real-symtoms list
                      this.subscription.add(this.apif29BioService.getLeavesOfSymptoms(this.listSymtomsFreqResponse)
                      .subscribe( (resSymtomsFiltered : any) => {
                        console.log(resSymtomsFiltered)
                        this.listSymtomsFreqResponseWithoutPredecessorsByPatient=resSymtomsFiltered;
                        // En este caso los datos que se van a mostrar serian:
                        //  - numberPoblation: Un numero de pacientes reales total: sin contar los pacientes que no tengan sintomas
                        //  - numberSimPoblation: 0
                        //  - Una lista de sintomas -
                        //                          - listPatients total (todos los pacientes reales que tengan un sintoma)
                        //                          - listPatientsSim total []
                        //                          - listPatientsWithoutPredecessors (todos los pacientes reales que tengan un sintoma que no sea PADRE)
                        //                          - listPatientsSimWithoutPredecessors []

                        // Calculo ahora el numero total de poblacion real considerando unicamente los pacientes reales que han metido sintomas
                        var tamanoSymptoms= Object.keys(this.listSymtomsFreqResponse).length;
                        if(tamanoSymptoms>0){
                          var numberPoblation=0;
                          for(var patient in this.listSymtomsFreqResponse){
                            if(this.listSymtomsFreqResponse[patient].length>0){
                              numberPoblation=numberPoblation+1;
                            }
                          }
                          this.listSymtomsFreq[0].numberPoblation = numberPoblation;
                        }

                        // Ahora tengo que crear el data de listSymptomsFreq

                        // Para ello tengo que ir recorriendo las lista anterior de datos reales, y rellenando listSymptoms freq de acuerdo con lo obtenido en la lista filtrada (sin padres)
                        var resultData=[];
                        // Recorro la primera respuesta de Javi
                        for(var ipatient in this.listSymtomsFreqResponse) {
                          //recorrer la lista de sintomas
                          var listOfSymptoms = this.listSymtomsFreqResponse[ipatient]
                          var symptomFoundForPatient=false;
                          for(var i=0;i<listOfSymptoms.length;i++){
                            symptomFoundForPatient=false;
                            for (var j=0;j<resultData.length;j++){
                              // Si ya se habia añadido el sintoma a la lista
                              if(resultData[j].symptom!=undefined){
                                if(resultData[j].symptom.id==listOfSymptoms[i]){
                                  // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                  for(var ipatient2 in this.listSymtomsFreqResponseWithoutPredecessorsByPatient) {
                                    // Para el mismo paciente
                                    if(ipatient==ipatient2){
                                      // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                      if(this.listSymtomsFreqResponseWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                        resultData[j].listPatientsWithoutPredecessors.push({patientId:ipatient2,queried:false})
                                      }
                                    }
                                  }
                                  resultData[j].listPatients.push({patientId:ipatient,queried:false})
                                  symptomFoundForPatient=true;
                                }
                              }
                            }
                            // Si no se habia añadido el sintoma a la lista
                            if(symptomFoundForPatient==false){
                              // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                              for(var ipatient2 in this.listSymtomsFreqResponseWithoutPredecessorsByPatient) {
                                // Para el mismo paciente
                                if(ipatient==ipatient2){
                                  // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                  if(this.listSymtomsFreqResponseWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                    resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[{patientId:ipatient,queried:false}], listPatientsWithoutPredecessors:[{patientId:ipatient2,queried:false}],listPatientsSim:[],listPatientsSimWithoutPredecessors:[]})
                                  }
                                  else{
                                    resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[{patientId:ipatient,queried:false}], listPatientsWithoutPredecessors:[],listPatientsSim:[],listPatientsSimWithoutPredecessors:[]})
                                  }
                                }
                              }
                            }
                          }
                        }
                        // Ahora ya tengo actualizado el resultData y puedo crear la lista para graph
                        this.listSymtomsFreq[0].data=resultData;
                        // Buscar los names
                        // Necesito la lista de hpo y se la paso al post, con el resultado actualizo el name de la lista de sintomas
                        var lang = this.authService.getLang();
                        var listSymptomsToTranslate=[];
                        for(var i=0;i<this.listSymtomsFreq[0].data.length;i++){
                          listSymptomsToTranslate.push(this.listSymtomsFreq[0].data[i].symptom.id)
                        }
                        this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(listSymptomsToTranslate,this.listOfphenotypesinfo)
                        //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,listSymptomsToTranslate)
                        .subscribe( (res2 : any) => {
                          var tamano= Object.keys(res2).length;
                          if(tamano>0){
                            for(var i in res2) {
                              if(res2[i][0]!=undefined){
                                for (var j = 0; j < this.listSymtomsFreq[0].data.length; j++) {
                                  if(res2[i][0].id==this.listSymtomsFreq[0].data[j].symptom.id){
                                    if(res2[i][0].layperson!=undefined){
                                      this.listSymtomsFreq[0].data[j].symptom.name = res2[i][0].layperson;
                                      if((res2[i][0].layperson).length>45){
                                        this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson).substr(0,45)+"...";
                                      }
                                      else{
                                        this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson)
                                      }
                                    }
                                  }
                                }
                              }

                            }
                          }
                          // Lista de datos de entrada para la representacion del diagrama SymptomsFreq
                          // Me copio lo que había en listSymptomsFreq para actualizar la lista que voy a pintar:
                          this.listSymtomsFreqForGraph=[];
                          //this.listSymtomsFreqForGraph=this.listSymtomsFreq;
                          this.listSymtomsFreqForGraph=[];
                          this.listSymtomsFreqForGraph=this.listSymtomsFreq;

                          console.log(this.listSymtomsFreqForGraph)
                          this.chartDataSymptomsFreq=[];

                          // Si la pantalla es muy pequeña hay que hacer este gráfico con el TOP10
                          this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
                          //console.log(this.chartDataSymptomsFreq)
                          this.listSymtomsFreqForGraphFiltered=this.listSymtomsFreqForGraph;
                          this.listSymtomsFreqForGraphOriginalCopy=this.listSymtomsFreqForGraphFiltered;

                          this.drawCharts();
                          this.loadingGraphSymptomFreq=false;
                        }, (err) => {
                          console.log(err);
                          this.toastr.error('', this.translate.instant("generics.error try again"));
                        }));

                      }, (err) => {
                        console.log(err);
                        this.toastr.error('', this.translate.instant("generics.error try again"));
                      }));
                    }
                  }
                  // CASO 2: no tengo pacientes reales
                  else{
                    // Caso 2.a. Pero tengo pacientes simulados
                    if(simSymtoms>0){
                      // En este caso en la grafica podria pintar los simulados y los de mi caso
                    // En este caso en la grafica podria pintar los simulados, los reales y los de mi caso
                      // Aqui lo primero sera limpiar las dos listas - quitar los padres en la lista de sintomas de cada paciente real o simulado
                      this.listSymtomsFreqResponseWithoutPredecessorsByPatient=[];
                      this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient=[];
                      // Get succesors patient sim-symtoms list
                      //console.log(this.listSymtomsFreqResponseSim)
                      this.subscription.add(this.apif29BioService.getLeavesOfSymptoms(this.listSymtomsFreqResponseSim)
                      .subscribe( (resSimSymtomsFiltered : any) => {
                        this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient=resSimSymtomsFiltered
                        //console.log(resSimSymtomsFiltered)
                        // Con estas dos listas ya puedo generarme los datos que se van a mostrar, teniendo por tanto:
                        //  - numberPoblation: 0
                        //  - numberSimPoblation: Un numero de pacientes simulados total: sin contar los pacientes que no tengan sintomas
                        //  - Una lista de sintomas -
                        //                          - listPatients total 0
                        //                          - listPatientsSim total (todos los pacientes sim que tengan un sintoma)
                        //                          - listPatientsWithoutPredecessors 0
                        //                          - listPatientsSimWithoutPredecessors (todos los pacientes simulados que tengan un sintoma que no sea PADRE)

                        var tamanoSimSymptoms= Object.keys(this.listSymtomsFreqResponseSim).length;
                        if(tamanoSimSymptoms>0){
                          var numberSimPoblation=0;
                          for(var patient2 in this.listSymtomsFreqResponseSim){
                            if(this.listSymtomsFreqResponseSim[patient2].length>0){
                              numberSimPoblation=numberSimPoblation+1;
                            }
                          }
                          this.listSymtomsFreq[0].numberSimPoblation = numberSimPoblation;
                        }

                        // Ahora tengo que crear el data de listSymptomsFreq
                        //console.log(numberSimPoblation)
                        //console.log(numberPoblation)
                        // Para ello tengo que ir recorriendo la lista de sim, y rellenando listSymptoms freq de acuerdo con lo obtenido en la filtrada (sin padres)
                        var resultData=[];

                        for(var ipatient in this.listSymtomsFreqResponseSim) {
                          //recorrer la lista de sintomas
                          var listOfSymptoms = this.listSymtomsFreqResponseSim[ipatient]
                          var symptomFoundForPatient=false;
                          for(var i=0;i<listOfSymptoms.length;i++){
                            symptomFoundForPatient=false;
                            // Ya tengo info en resultData
                            for (var j=0;j<resultData.length;j++){
                              // Hay que mirar si el sintoma del paciente simulado esta añadido o no
                              // Si si lo esta, se añade solo la info adicional de los pacientes simulados
                              if(resultData[j].symptom.id!=undefined){
                                if(resultData[j].symptom.id==listOfSymptoms[i]){
                                  // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                                  for(var ipatient2 in this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient) {
                                    // Para el mismo paciente
                                    if(ipatient==ipatient2){
                                      // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                      if(this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                        resultData[j].listPatientsSimWithoutPredecessors.push({patientId:ipatient2,queried:false})
                                      }
                                    }
                                  }
                                  resultData[j].listPatientsSim.push({patientId:ipatient,queried:false})
                                  resultData[j].listPatientsWithoutPredecessors=[];
                                  resultData[j].listPatients=[];
                                  symptomFoundForPatient=true;
                                }
                              }
                            }
                            // Si no lo esta, se añade el sintoma y los pacientes simulados
                            if(symptomFoundForPatient==false){
                              // Buscar en la lista de pacientes sin sintomas padre si esta este sintoma para este paciente -  En caso de que si, lo añado
                              for(var ipatient2 in this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient) {
                                // Para el mismo paciente
                                if(ipatient==ipatient2){
                                  // Compruebo si el sintoma a añadir esta en la lista de pacientes sin sintomas padre
                                  if(this.listSymtomsFreqResponseSimWithoutPredecessorsByPatient[ipatient2].includes(listOfSymptoms[i])){
                                    resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[], listPatientsWithoutPredecessors:[],listPatientsSim:[{patientId:ipatient,queried:false}],listPatientsSimWithoutPredecessors:[{patientId:ipatient2,queried:false}]})
                                  }
                                  else{
                                    resultData.push({symptom:{name:listOfSymptoms[i],id:listOfSymptoms[i],checked:true,checkToQuery:false, nameForShow:listOfSymptoms[i]},belongstoCommunity:true,listPatients:[], listPatientsWithoutPredecessors:[],listPatientsSim:[{patientId:ipatient,queried:false}],listPatientsSimWithoutPredecessors:[]})
                                  }
                                }
                              }
                            }
                          }
                        }

                        // Ahora ya tengo actualizado el resultData y puedo crear la lista para graph
                        this.listSymtomsFreq[0].data=resultData;

                        // Buscar los names
                        // Necesito la lista de hpo y se la paso al post, con el resultado actualizo el name de la lista de sintomas
                        var lang = this.authService.getLang();
                        var listSymptomsToTranslate=[];
                        for(var i=0;i<this.listSymtomsFreq[0].data.length;i++){
                          listSymptomsToTranslate.push(this.listSymtomsFreq[0].data[i].symptom.id)
                        }
                        this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(listSymptomsToTranslate,this.listOfphenotypesinfo)
                        //this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang,listSymptomsToTranslate)
                        .subscribe( (res2 : any) => {
                          var tamano= Object.keys(res2).length;
                          if(tamano>0){
                            for(var i in res2) {
                              if(res2[i][0]!=undefined){
                                for (var j = 0; j < this.listSymtomsFreq[0].data.length; j++) {
                                  if(res2[i][0].id==this.listSymtomsFreq[0].data[j].symptom.id){
                                    if(res2[i][0].layperson!=undefined){
                                      this.listSymtomsFreq[0].data[j].symptom.name = res2[i][0].layperson;
                                      if((res2[i][0].layperson).length>45){
                                        this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson).substr(0,45)+"...";
                                      }
                                      else{
                                        this.listSymtomsFreq[0].data[j].symptom.nameForShow = (res2[i][0].layperson)
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                          // Lista de datos de entrada para la representacion del diagrama SymptomsFreq
                          // Me copio lo que había en listSymptomsFreq para actualizar la lista que voy a pintar:
                          this.listSymtomsFreqForGraph=[];
                          //this.listSymtomsFreqForGraph=this.listSymtomsFreq;
                          this.listSymtomsFreqForGraph=[];
                          this.listSymtomsFreqForGraph=this.listSymtomsFreq;
                          console.log(this.listSymtomsFreqForGraph)
                          this.chartDataSymptomsFreq=[];

                          // Si la pantalla es muy pequeña hay que hacer este gráfico con el TOP10
                          this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
                          //console.log(this.chartDataSymptomsFreq)
                          this.listSymtomsFreqForGraphFiltered=this.listSymtomsFreqForGraph;
                          this.listSymtomsFreqForGraphOriginalCopy=this.listSymtomsFreqForGraphFiltered;

                          // Crear gráficos
                          this.drawCharts();

                          this.loadingGraphSymptomFreq=false;
                        }, (err) => {
                          console.log(err);
                          this.toastr.error('', this.translate.instant("generics.error try again"));
                        }));
                      }, (err) => {
                        console.log(err);
                        this.toastr.error('', this.translate.instant("generics.error try again"));
                      }));

                    }
                    // Caso 2.b. No tengo pacientes simulados
                    else{
                      // En este caso en la grafica solo podria pintar los sintomas de mi caso
                      this.drawCharts();
                      this.loadingGraphSymptomFreq=false;
                    }
                  }
                }, (err) => {
                  console.log(err);
                  this.loadingGraphSymptomFreq=false;
                  this.toastr.error('', this.translate.instant("generics.error try again"));
                }));
              }
          }
      }, (err) => {
        console.log(err);
        this.toastr.error('', this.translate.instant("dashboardpatient.error try again"));
        this.loadingSymptomsOfDisease = false;
        this.loadingGraphSymptomFreq=false;
      }));
    }
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
        this.fullListSymptoms.push({id:this.omimSymptoms[i].id, name: this.omimSymptoms[i].name, def: this.omimSymptoms[i].def, comment: this.omimSymptoms[i].comment, synonyms: this.omimSymptoms[i].synonyms, group: 'none', omim: true, orphanet: false, patient: false});
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
        this.fullListSymptoms.push({id:this.orphaSymptoms[i].id, name: this.orphaSymptoms[i].name, def: this.orphaSymptoms[i].def, comment: this.orphaSymptoms[i].comment, synonyms: this.orphaSymptoms[i].synonyms, group: 'none', omim: false, orphanet: true, patient: false});
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
        this.fullListSymptoms.push({id:this.phenotype.data[i].id, name: this.phenotype.data[i].name, def: this.phenotype.data[i].def, comment: this.phenotype.data[i].comment, synonyms: this.phenotype.data[i].synonyms, group: 'none', omim: false, orphanet: false, patient: true});
      }
    }
  }

  ngOnChanges() {
    if (this.chartDataBars) {
      this.updateChartBars();
    }
    if(this.chartDataSymptomsFreq){
      this.updateChartFrequency();
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
        this.listSymptomsMe.push(resultListSuccesors[i].name)
      }
      if(resultListSuccesors[i].notpatientbutsuccessor==true){
        this.listSymptomsMeGeneric.push(resultListSuccesors[i].name)
      }
    }
    this.listSymptomsGeneric= this.listSymptomsGeneric.filter((valor, indiceActual, arreglo) => arreglo.indexOf(valor) === indiceActual);
    this.listSymptomsMeGeneric= this.listSymptomsMeGeneric.filter((valor, indiceActual, arreglo) => arreglo.indexOf(valor) === indiceActual);
    this.listSymptomsMe= this.listSymptomsMe.filter((valor, indiceActual, arreglo) => arreglo.indexOf(valor) === indiceActual);

  }

  calculeChartSymptomsInfoReal(listforGraph){
    // por un lado tengo Los sintomas que estan en MI caso: listSymptomsMe - son los de phenotype que ha metido el paciente
    // a estos tengo que quitarles los que no se muestran en el histograma porque son PADRES this.listpatientDataNotShowHistogram.
    this.listSymptomsMe_real=[];
    for(var i=0;i<this.phenotype.data.length;i++){
      if(this.listpatientDataNotShowHistogram.includes(this.phenotype.data[i].name)==false){
        this.listSymptomsMe_real.push(this.phenotype.data[i].name)
      }
    }
    this.listSymptomsReal=[];
    // Por otro lado tengo la lista de "genericos": la de chartDataFreq pero solo me quedo con d[0]
    for(var i=0;i<listforGraph.length;i++){
      this.listSymptomsReal.push(listforGraph[i][0])
    }

    // Y por ultimo la comun de estos dos: listSymptomsMeReal
    // Este caso es mas sencillo poque no tengo que mirar HIJOS ni PADRES (la lista de el histograma ya estaba limpia)
    this.listSymptomsMeReal=[];
    for(var i=0;i<listforGraph.length;i++){
      for(var j=0;j<this.phenotype.data.length;j++){
        if(listforGraph[i][0]==this.phenotype.data[j].name){
          this.listSymptomsMeReal.push(this.phenotype.data[j].name)
        }
      }
    }
  }

  drawCharts(){
    if(this.chartContainerSymptomsFreq!=undefined){
      let elementSymptomsFreq = this.chartContainerSymptomsFreq.nativeElement;
      this.widthSymptomsFreq_saved=elementSymptomsFreq.offsetWidth;
      this.windowSizeforWidthSymptomsFreq_size=window.innerWidth;
      //console.log(this.widthSymptomsFreq_saved)
      /*if(this.redrawNewSize==true){
        console.log("redraw true")
        let elementSymptomsFreq = this.chartContainerSymptomsFreq.nativeElement;
        this.widthSymptomsFreq_saved=elementSymptomsFreq.offsetWidth;
        this.windowSizeforWidthSymptomsFreq_size=window.innerWidth;
        console.log(this.widthSymptomsFreq_saved)
      }
      else{
        if(window.innerWidth!=this.windowSizeforWidthSymptomsFreq_size){
          // resize
          if(window.innerWidth>this.windowSizeforWidthSymptomsFreq_size){
            this.widthSymptomsFreq_saved=(window.innerWidth/2)-this.margin.left-this.margin.right-20;
          }
          else if(window.innerWidth<this.windowSizeforWidthSymptomsFreq_size/2){
            this.widthSymptomsFreq_saved=(window.innerWidth)-3*this.margin.left-2.5*this.margin.right-10;
          }
          this.windowSizeforWidthSymptomsFreq_size=window.innerWidth;


        }
      }*/
      // Dibujo los gráficos
      // Elimino todo lo que hubiese (limpio la pantalla)
      d3.selectAll("svg").remove();
      d3.selectAll(".venntooltip").remove();
      d3.selectAll(".text").remove();

      var venn=document.getElementById('chartVenn')
      venn.insertAdjacentHTML('beforeend', '<svg id ="venn" viewBox="0 0 580 340" [style.margin-left.px]= "-(((venn.offsetWidth)/2)+(margin.left/2))"></svg>');

      var graph=document.getElementById('chartBars')
      graph.insertAdjacentHTML('beforeend', '<svg id="graphBars"></svg>');

      var graphSymptomsFreq=document.getElementById('chartSymptomsFreq')
      graphSymptomsFreq.insertAdjacentHTML('beforeend', '<svg class="center-elements" id="graphSymptomsFreq"></svg>');

      var vennReal=document.getElementById('chartVennReal')
      vennReal.insertAdjacentHTML('beforeend', '<svg id ="vennReal" viewBox="0 0 580 340" [style.margin-left.px]= "-(((venn.offsetWidth)/2)+(margin.left/2))"></svg>');
      var graphReal=document.getElementById('chartBarsReal')
      graphReal.insertAdjacentHTML('beforeend', '<svg id="graphBarsReal"></svg>');


      this.createChartBars();
      if (this.chartDataBars) {
        this.updateChartBars();
      }
      this.createChartVenn();

      this.createChartFrequency();
      if (this.chartDataSymptomsFreq) {
        this.updateChartFrequency();
      }
      this.createChartBarsReal();
      if(this.createChartBarsReal){
        this.updateChartBarsReal();
      }
      this.createChartVennReal();
      //this.redrawNewSize=true

      // Check if the lists have info- if not svg size to 0
      // Real charts
      if(this.chartDataSymptomsFreq.length==0 && this.chartDataBarsReal.length==0 && this.chartDataVennReal.length==0){
        var graphFrequencySvg=document.getElementById('graphSymptomsFreq')
        graphFrequencySvg.style.height = "0px";
        graphFrequencySvg.style.width = "0px";
        var graphBarsRealSvg=document.getElementById('graphBarsReal')
        graphBarsRealSvg.style.height = "0px";
        graphBarsRealSvg.style.width = "0px";
        var graphVennRealSvg=document.getElementById('vennReal')
        graphVennRealSvg.style.height = "0px";
        graphVennRealSvg.style.width = "0px";
      }
      if(this.chartDataBars.length==0 && this.chartDataVenn.length==0){
        var graphBarsSvg=document.getElementById('graphBars')
        graphBarsSvg.style.height = "0px";
        graphBarsSvg.style.width = "0px";
        var graphVennSvg=document.getElementById('venn')
        graphVennSvg.style.height = "0px";
        graphVennSvg.style.width = "0px";
      }
    }


  }

  createChartBars() {
    // ----- Second graph ----------------------------------------------------------------
      let elementBars = this.chartContainerBars.nativeElement;
      this.widthBars = elementBars.offsetWidth - this.margin.left+20 - this.margin.right;
      this.heightBars = elementBars.offsetHeight - this.margin.top - this.margin.bottom;

      let svgBars = d3.select("#graphBars")
        .attr('width', elementBars.offsetWidth)
        .attr('height', 2*elementBars.offsetHeight)
        .classed("svg-content-responsive", true);
      // chart plot area
      this.chartDataBars.sort((a,b) =>{ return b[1] - a[1]; })
      this.chartBars = svgBars.append('g')
        .attr('class', 'bars')
        .attr('transform', `translate(${this.margin.left+20}, ${this.margin.top})`)
        .style("fill-opacity", .4);

      // define X & Y domains
      let xDomain = this.chartDataBars.map(d => d[0]);
      let yDomain = [0, d3.max(this.chartDataBars, d => d[1])];

      // create scales
      this.xScaleBars = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.widthBars]);
      this.yScaleBars = d3.scaleLinear().domain(yDomain).range([1.5*this.heightBars, 0]);

      // bar colors
      //this.colors = d3.scaleLinear().domain([0,this.chartDataBars.length]).range(<any[]>['blue', 'orange']);
      this.colorsBars=d3.scaleOrdinal(["#ff7f0e","#1f77b4"]);
      // x & y axis
      this.xAxisBars = svgBars.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(${this.margin.left+20}, ${this.margin.top + 1.5*this.heightBars})`)
        .call(d3.axisBottom(this.xScaleBars))
      this.xAxisBars.call(d3.axisBottom(this.xScaleBars)).selectAll("text")
        .style("font-size","14px")
        .style("fill","black")
        .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
      this.yAxisBars = svgBars.append('g')
        .attr('class', 'axis axis-y')
        .attr('transform', `translate(${this.margin.left+20}, ${this.margin.top})`)
        .call(d3.axisLeft(this.yScaleBars));

      this.yAxisBars.call(d3.axisLeft(this.yScaleBars)).selectAll("text")
        .style("font-size","10px")
        .style("fill","black")
        .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');

      //text label for y axis
      var yAxisText=this.translate.instant("patdiagdashboard.Number of symptoms")
      svgBars.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left+20)
      .attr("x", 0 - (1.5*this.heightBars/2)-(this.heightBars/2))
      .attr("dy", "1.8em")
      .style("text-anchor", "middle")
      .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif')
      .text(yAxisText);

  }

  updateChartBars() {

    // update scales & axis
    //console.log(this.xScale)
    this.xScaleBars.domain(this.chartDataBars.map(d => d[0]));
    this.yScaleBars.domain([0, d3.max(this.chartDataBars, d => d[1])]);
    //this.colors.domain([0, this.chartDataBars.length]);
    this.xAxisBars.transition().call(d3.axisBottom(this.xScaleBars));
    this.yAxisBars.transition().call(d3.axisLeft(this.yScaleBars));

    let updateBars = this.chartBars.selectAll('.bar')
      .data(this.chartDataBars);

    if(this.listSymptomsMe.length>this.listSymptomsGeneric.length){
      this.colorsBars=d3.scaleOrdinal(["#1f77b4","#ff7f0e"]);
    }
    else if(this.listSymptomsMe.length<this.listSymptomsGeneric.length){
      this.colorsBars=d3.scaleOrdinal(["#ff7f0e","#1f77b4"]);
    }

    // remove exiting bars
    updateBars.exit().remove();

    // update existing bars
    this.chartBars.selectAll('.bar').transition()
      .attr('x', d => this.xScaleBars(d[0]))
      .attr('y', d => this.yScaleBars(d[1]))
      .attr('width', d => this.xScaleBars.bandwidth())
      .attr('height', d => 1.5*this.heightBars - this.yScaleBars(d[1]))
      .style('fill', (d, i) => this.colorsBars(i))
      .style("fill-opacity", .4)
      .style("background-color", function(d, i) {
        return this.colorsBars(i);
      })
    // add new bars
    updateBars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScaleBars(d[0]))
      .attr('y', d => this.yScaleBars(0))
      .attr('width', this.xScaleBars.bandwidth())
      .attr('height', 0)
      .style('fill', (d, i) => this.colorsBars(i))
      .transition()
      .delay((d, i) => i * 10)
      .attr('y', d => this.yScaleBars(d[1]))
      .attr('height', d => 1.5*this.heightBars - this.yScaleBars(d[1]));
    updateBars.exit()
      .remove();

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
      vennSvg.insertAdjacentHTML('beforeend', '<svg id ="venn" viewBox="0 0 540 380" [style.margin-left.px]= "-(({{venn.offsetWidth}})/2)+({{margin.left}}/2))"></svg>');
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

  createChartBarsReal() {
    // ----- Second graph ----------------------------------------------------------------
      let elementBars = this.chartContainerBarsReal.nativeElement;
      this.widthBars = elementBars.offsetWidth - this.margin.left+20 - this.margin.right;
      this.heightBars = elementBars.offsetHeight - this.margin.top - this.margin.bottom;

      let svgBars = d3.select("#graphBarsReal")
        .attr('width', elementBars.offsetWidth)
        .attr('height', 2*elementBars.offsetHeight)
        .classed("svg-content-responsive", true);
      // chart plot area
      this.chartDataBarsReal.sort((a,b) =>{ return b[1] - a[1]; })
      this.chartBarsReal = svgBars.append('g')
        .attr('class', 'bars')
        .attr('transform', `translate(${this.margin.left+20}, ${this.margin.top})`)
        .style("fill-opacity", .4);

      // define X & Y domains
      let xDomain = this.chartDataBarsReal.map(d => d[0]);
      let yDomain = [0, d3.max(this.chartDataBarsReal, d => d[1])];

      // create scales
      this.xScaleBarsReal = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.widthBars]);
      this.yScaleBarsReal = d3.scaleLinear().domain(yDomain).range([1.5*this.heightBars, 0]);

      // bar colors
      //this.colors = d3.scaleLinear().domain([0,this.chartDataBars.length]).range(<any[]>['blue', 'orange']);
      this.colorsBars=d3.scaleOrdinal(["#ff7f0e","#1f77b4"]);
      // x & y axis
      this.xAxisBarsReal = svgBars.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(${this.margin.left+20}, ${this.margin.top + 1.5*this.heightBars})`)
        .call(d3.axisBottom(this.xScaleBarsReal))
      this.xAxisBarsReal.call(d3.axisBottom(this.xScaleBarsReal)).selectAll("text")
        .style("font-size","14px")
        .style("fill","black")
        .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
      this.yAxisBarsReal = svgBars.append('g')
        .attr('class', 'axis axis-y')
        .attr('transform', `translate(${this.margin.left+20}, ${this.margin.top})`)
        .call(d3.axisLeft(this.yScaleBarsReal));

      this.yAxisBarsReal.call(d3.axisLeft(this.yScaleBarsReal)).selectAll("text")
        .style("font-size","10px")
        .style("fill","black")
        .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');

      //text label for y axis
      var yAxisText=this.translate.instant("patdiagdashboard.Number of symptoms")
      svgBars.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left+20)
      .attr("x", 0 - (1.5*this.heightBars/2)-(this.heightBars/2))
      .attr("dy", "1.8em")
      .style("text-anchor", "middle")
      .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif')
      .text(yAxisText);

  }

  updateChartBarsReal() {

    // update scales & axis
    //console.log(this.xScale)
    this.xScaleBarsReal.domain(this.chartDataBarsReal.map(d => d[0]));
    this.yScaleBarsReal.domain([0, d3.max(this.chartDataBarsReal, d => d[1])]);
    //this.colors.domain([0, this.chartDataBars.length]);
    this.xAxisBarsReal.transition().call(d3.axisBottom(this.xScaleBarsReal));
    this.yAxisBarsReal.transition().call(d3.axisLeft(this.yScaleBarsReal));

    let updateBars = this.chartBarsReal.selectAll('.bar')
      .data(this.chartDataBarsReal);

    //this.colorsBars=d3.scaleOrdinal(["#eddc85","#1f77b4"]);

    if(this.listSymptomsMe_real.length>=this.listSymptomsReal.length){
      this.colorsBars=d3.scaleOrdinal(["#1f77b4","#ff0000"]);
    }
    else if(this.listSymptomsMe_real.length<this.listSymptomsReal.length){
      this.colorsBars=d3.scaleOrdinal(["#ff0000","#1f77b4"]);
    }

    // remove exiting bars
    updateBars.exit().remove();

    // update existing bars
    this.chartBarsReal.selectAll('.bar').transition()
      .attr('x', d => this.xScaleBarsReal(d[0]))
      .attr('y', d => this.yScaleBarsReal(d[1]))
      .attr('width', d => this.xScaleBarsReal.bandwidth())
      .attr('height', d => 1.5*this.heightBars - this.yScaleBarsReal(d[1]))
      .style('fill', (d, i) => this.colorsBars(i))
      .style("fill-opacity", .4)
      .style("background-color", function(d, i) {
        return this.colorsBars(i);
      })
    // add new bars
    updateBars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScaleBarsReal(d[0]))
      .attr('y', d => this.yScaleBarsReal(0))
      .attr('width', this.xScaleBarsReal.bandwidth())
      .attr('height', 0)
      .style('fill', (d, i) => this.colorsBars(i))
      .transition()
      .delay((d, i) => i * 10)
      .attr('y', d => this.yScaleBarsReal(d[1]))
      .attr('height', d => 1.5*this.heightBars - this.yScaleBarsReal(d[1]));
    updateBars.exit()
      .remove();

  }

  createChartVennReal(){
    // --- First graph --------------------------------------------------------------------------
    // 1. create Venn diagram

    let elementVenn = this.chartContainerVennReal.nativeElement;

    this.widthVenn = elementVenn.offsetWidth - this.margin.left - this.margin.right;
    this.heightVenn = elementVenn.offsetHeight - this.margin.top - this.margin.bottom;

    if(this.listSymptomsMeGeneric.length==0){
      //this.widthVenn = elementVenn.offsetWidth - 4*this.margin.left - 4*this.margin.right;
      //this.heightVenn = elementVenn.offsetHeight - 4*this.margin.top - 4*this.margin.bottom;
      document.getElementById('vennReal').remove()
      var vennSvg=document.getElementById('chartVennReal')
      vennSvg.insertAdjacentHTML('beforeend', '<svg id ="vennReal" viewBox="0 0 540 380" [style.margin-left.px]= "-(({{venn.offsetWidth}})/2)+({{margin.left}}/2))"></svg>');
    }

    //this.chartDataVenn.sort(function(a:any,b:any) { return b.size - a.size; })
    //console.log(this.chartDataVenn)
    this.chartVennReal = venn.VennDiagram()
    let svg1 = d3.select("#vennReal")
      .datum(this.chartDataVennReal)
      .call(this.chartVennReal)
      .attr('width', this.widthVenn)
      .attr('height', this.heightVenn);


    svg1.selectAll("g").sort(function(a:any,b:any) { return b.size - a.size; })
    svg1.selectAll("svg").attr("class","venn2Real");

    // 2. Add style to venn diagram
    //var colors2 = d3.scaleLinear().domain([0, this.chartDataVenn.length]).range(<any[]>['red', 'blue']);
    /*svg1.selectAll('.venn-circle path').transition()
      .style('fill', (d, i) => colors2(i));*/
    var colorsVenn;
    //colorsVenn=d3.scaleOrdinal(["#eddc85","#1f77b4"]);
    if(this.listSymptomsMe_real.length>=this.listSymptomsReal.length){
      colorsVenn=d3.scaleOrdinal(["#1f77b4","#ff0000"]);
    }
    else if(this.listSymptomsMe_real.length<this.listSymptomsReal.length){
      colorsVenn=d3.scaleOrdinal(["#ff0000","#1f77b4"]);
    }

    if(this.phenotype.data.length>0){
      if(this.listSymptomsReal.length>0){
        svg1.selectAll(".venn-circle path")
        .style("fill-opacity", .4)
        .style("stroke-width", 1)
        .style("stroke-opacity", 1)
        .style("stroke", "fff")
        .style('fill', (d, i) => colorsVenn(i));
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
        .style("fill","#ff0000")
    }
    svg1.selectAll(".venn-circle text")
      .style("font-size","14px")
      .style("fill","black")
      .style("font-family",'"Rubik", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');

    // 3. Add a tooltip
    var tooltip = d3.select("#chartVennReal").append("div")
      .attr("class", "venntooltipReal")
      .attr("data-html", "true");


    var graphOnClickReal=[];
    for(var i=0;i<this.chartDataVennReal.length;i++){
      graphOnClickReal.push(false)
    }
    var chartDataReal=this.chartDataVennReal;
    var lastDReal=undefined;
    var listVennSelectedReal=[];
    var lang=this.authService.getLang();
    // 4. add listeners to all the groups to display tooltip on mouseover
    svg1.selectAll("g").on("click", function(d:any, i) {
      for(var i=0;i<chartDataReal.length;i++){
        if(d==chartDataReal[i]){
          lastDReal=d;
          graphOnClickReal[i]=!graphOnClickReal[i]
          //console.log(graphOnClick[i])
          if(graphOnClickReal[i]==true){
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
            .style("z-index","9999");

            // tooltim html content
            var symptomsAreaListReal="";
            for(var j=0;j<d.data.length;j++){
              symptomsAreaListReal=symptomsAreaListReal+'<li style="float: left;width: 40%; margin-left:3%">'+d.data[j]+'</li>';
            }
            var nameAreaReal="";
            if(d.label!=undefined){
              nameAreaReal=d.label
            }
            else{
              nameAreaReal="common symptoms"
            }

            if(lang=='es'){
              if(d.data.length==1){
                tooltip.html('<div><button type="button" class="close" aria-label="Close" style="padding-right:3%"> <span aria-hidden="true">&times;</span></button></div><div> En el área <b>'+ nameAreaReal +"</b> hay "+d.data.length + " síntoma: <br> <ul>"+symptomsAreaListReal+"</ul></div>");
              }
              else{
                tooltip.html('<div><button type="button" class="close" aria-label="Close" style="padding-right:3%"> <span aria-hidden="true">&times;</span></button></div><div> En el área <b>'+ nameAreaReal +"</b> hay "+d.data.length + " síntomas: <br> <ul>"+symptomsAreaListReal+"</ul></div>");
              }
            }
            else{
              if(d.data.length==1){
                tooltip.html('<div><button type="button" class="close" aria-label="Close" style="padding-right:3%"> <span aria-hidden="true">&times;</span></button></div><div>In <b>'+ nameAreaReal +" area</b> there is "+d.data.length + " symptom: <br> <ul>"+symptomsAreaListReal+"</ul></div>");
              }
              else{
                tooltip.html('<div><button type="button" class="close" aria-label="Close" style="padding-right:3%"> <span aria-hidden="true">&times;</span></button></div><div>In <b>'+ nameAreaReal +" area</b> there are "+d.data.length + " symptoms: <br> <ul>"+symptomsAreaListReal+"</ul></div>");
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
            listVennSelectedReal.push({d:d,element:this,label:d.label})
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
              for(var i=0;i<chartDataReal.length;i++){
                if(lastDReal==chartDataReal[i]){
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
                  graphOnClickReal[i]=false;
                  listVennSelectedReal=[];
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
            listVennSelectedReal=[];
          }
        }
        else{
          //console.log(listVennSelected)
          graphOnClickReal[i]=false;

          if(listVennSelectedReal.length>0){
            //console.log(listVennSelected.length)
            for(var j=0;j<listVennSelectedReal.length;j++){
              if(listVennSelectedReal[j].d==chartDataReal[i]){
                //console.log(j)
                var selection2 = d3.select(listVennSelectedReal[j].element).transition("tooltip").duration(400);
                //console.log(selection2)
                if(listVennSelectedReal[j].label!=undefined){
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
      for(var i=0;i<graphOnClickReal.length;i++){
        if(graphOnClickReal[i]==false){
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
      for(var i=0;i<chartDataReal.length;i++){
        if(d==chartDataReal[i]){
          if(graphOnClickReal[i]==false){
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
      for(var i=0;i<graphOnClickReal.length;i++){
        if(graphOnClickReal[i]==true){
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

  createChartFrequency(){
    // Chart-bars with frequency of the symptoms
    //Added only for the mouse wheel
    var zoomer = d3.zoom()
        .on("zoom", null);

    var main_margin = {top:this.marginFreq.top, right: this.marginFreq.right, bottom: this.marginFreq.bottom, left: this.marginFreq.left};
    var main_width = (3/4)*this.widthSymptomsFreq_saved-main_margin.left-main_margin.right;
    var main_height = 500 - main_margin.top - main_margin.bottom;
    if(this.chartDataSymptomsFreq.length==1){
      main_height = this.chartDataSymptomsFreq.length*200 - main_margin.top - main_margin.bottom;
    }
    var mini_margin;
    if(this.widthSymptomsFreq_saved<600){
      mini_margin={top:this.marginFreq.top, right: 0, bottom: this.marginFreq.bottom, left: 2*this.marginFreq.left};
    }
    else{
      mini_margin={top:this.marginFreq.top, right: 0, bottom: this.marginFreq.bottom, left: 12*this.marginFreq.left};
    }
    var mini_width = (1/4)*this.widthSymptomsFreq_saved - mini_margin.left - mini_margin.right;
    var mini_height = 500 - mini_margin.top - mini_margin.bottom;
    if(this.chartDataSymptomsFreq.length==1){
      mini_height = this.chartDataSymptomsFreq.length*200 - mini_margin.top - mini_margin.bottom;
    }

    // Find the maxLabel width, adjust the width accordingly and transform the x axis.
    this.maxWidth = 0;
    var maxWidthCalcule=0;
    for(var i=0;i<this.chartDataSymptomsFreq.length;i++){
      if(this.chartDataSymptomsFreq[i][0].length>maxWidthCalcule){
        maxWidthCalcule=this.chartDataSymptomsFreq[i][0].length;
      }
    }
    //if(maxWidthCalcule<100) maxWidthCalcule=maxWidthCalcule+50;
    /*maxWidthCalcule=maxWidthCalcule+this.margin.left+5;
    if(this.chartDataSymptomsFreq.length==1){
      maxWidthCalcule=maxWidthCalcule-5-3*this.margin.left;
    }*/
    //this.maxWidth=(maxWidthCalcule*10)/2-main_margin.left;
    this.maxWidth=150;
    console.log(this.maxWidth)

    // All SVG: main+mini
    let svgSymptomsFreq = d3.select("#graphSymptomsFreq")
      .attr("width", main_margin.left+main_width+main_margin.right+mini_margin.left+mini_width+mini_margin.right)
      .attr("height", main_height + main_margin.top + main_margin.bottom)
      .classed("svg-content-responsive", true);

      // Main SVG
      var mainGroup = svgSymptomsFreq.append("g")
        .attr("class","mainGroupWrapper")
        .attr("transform","translate(" + main_margin.left + "," + main_margin.top + ")")
        .append("g") //another one for the clip path - due to not wanting to clip the labels
        .attr("class","mainGroup");

      // Mini SVG
      var miniGroup = svgSymptomsFreq.append("g")
        .attr("class","miniGroup")
        .attr("transform","translate(" + (main_margin.left+main_width+main_margin.right+mini_margin.left) + "," + mini_margin.top + ")");

      // BrushGroup
      var brushGroup = svgSymptomsFreq.append("g")
        .attr("class","brushGroup")
        .attr("transform","translate(" + (main_margin.left+main_width+main_margin.right+mini_margin.left) + "," + mini_margin.top + ")")

    // define X & Y domains
    let yDomain = this.chartDataSymptomsFreq.map(d =>  d[0]);
    let xDomain = this.chartDataSymptomsFreq.map(d => d[1]);

    // create scales
    var main_xScale = d3.scaleLinear().range([0,main_width-this.maxWidth]);
    var mini_xScale = d3.scaleLinear().range([0, mini_width]);
    var main_yScale = d3.scaleBand().padding(0.4).domain(yDomain).range([0,main_height]);
    var mini_yScale = d3.scaleBand().padding(0.4).domain(yDomain).range([0,mini_height]);


    var main_yZoom = d3.scaleLinear()
        .range([0, main_height])
        .domain([0, main_height]);

    // Scales in global variables
    this.yScaleSymptomsFreq=main_yScale;
    this.xScaleSymptomsFreq=main_xScale;
    this.yScaleSymptomsFreq_mini=mini_yScale;
    this.xScaleSymptomsFreq_mini=mini_xScale;
    this.yZoom=main_yZoom;



    // x & y axis for MAIN
    console.log(this.yScaleSymptomsFreq.bandwidth())
    this.yAxisSymptomsFreq = d3.select(".mainGroupWrapper").append("g")
    .attr('class', 'axis axis-y')
    .attr('transform', `translate(${this.maxWidth}, ${0})`)
    .call(d3.axisLeft(this.yScaleSymptomsFreq))
    .selectAll("text")
      .style("fill", "black")
      .style("font-size","10px")
      //.style("text-anchor", "end")
      .call(this.wrap,this.yScaleSymptomsFreq.bandwidth());

    this.xAxisSymptomsFreq = d3.select(".mainGroupWrapper").append("g")
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(${this.maxWidth}, ${main_height})`)
      .style("display","none")
      .call(d3.axisBottom(this.xScaleSymptomsFreq));

    //Update the scales
    this.xScaleSymptomsFreq.domain([0, d3.max(this.chartDataSymptomsFreq, function(d) {return d[1]})]);
    this.xScaleSymptomsFreq_mini.domain([0, d3.max(this.chartDataSymptomsFreq, function(d) {return d[1]})]);
    this.yScaleSymptomsFreq.domain(this.chartDataSymptomsFreq.map(function(d) { return d[0];}));
    this.yScaleSymptomsFreq_mini.domain(this.chartDataSymptomsFreq.map(function(d) { return d[0];}));

    if(this.chartDataSymptomsFreq.length>1){
      this.brush=d3.brushY()
        .extent( [[0,0], [mini_width,mini_height] ])
        .on("brush", this.brushmove.bind(this));

      //Set up the visual part of the brush
      this.gBrush = d3.select(".brushGroup").append("g")
        .attr("class", "brush")
        .call(this.brush)

      this.gBrush.selectAll(".resize")
        .append("line")
        .attr("x2", mini_width);

      this.handle= this.gBrush.selectAll(".handle--custom")
        .data([{type: "n"},{type:"s"}])
        .enter().append("path")
        .attr("class", "handle--custom")
        .attr("fill", "#666")
          .attr("fill-opacity", 0.8)
          .attr("stroke", "#000")
          .attr("stroke-width", 1.5)
          .attr("cursor", "ns-resize")
        .attr("d", symbol().type(symbolTriangle).size(20))
        .attr("transform", function(d,i) {
          var maxheightSelected=0;
          if(this.chartDataSymptomsFreq.length>10){
            maxheightSelected=this.yScaleSymptomsFreq_mini(this.chartDataSymptomsFreq[10][0])
          }
          else if(this.chartDataSymptomsFreq.length>0){
            maxheightSelected=this.yScaleSymptomsFreq_mini(this.chartDataSymptomsFreq[this.chartDataSymptomsFreq.length-1][0])
          }

          console.log(maxheightSelected)
          return i ? "translate(" +  mini_width/2 + "," + maxheightSelected+4 + ") rotate(180)" : "translate(" +  mini_width/2 + "," + -4 + ") rotate(0)";
        }.bind(this));

      this.gBrush.selectAll("rect")
        .attr("width", mini_width);

      //On a click recenter the brush window
      this.gBrush.selectAll(".overlay").remove();

      //The mini brushable bar
      //DATA JOIN
      var mini_bar = d3.select(".miniGroup").selectAll(".bar")
      .data(this.chartDataSymptomsFreq, function(d) { return d[0]; });

      var changeMycolors=this.symptomsPermissions.shareWithCommunity;

      //UDPATE
      mini_bar
        .attr("width", function(d) { return mini_xScale(d[1]); })
        .attr("y", function(d,i) { return mini_yScale(d[0]); })
        .attr("height", this.yScaleSymptomsFreq_mini.bandwidth());

      //ENTER
      mini_bar.enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("width", (d) => { return this.xScaleSymptomsFreq_mini(d[1]); })
        .attr("y", function(d,i) { return mini_yScale(d[0]); })
        .attr("height", this.yScaleSymptomsFreq_mini.bandwidth())
        .style("fill-opacity", .2)
        .attr("fill", (d) => {
          // Si el length es 0 no habría que pintarlo sino indicar que no hay datos para el
          if(d[1]==0){
            return "none"
          }
          else{
            if(changeMycolors==true){
              // Busco el name recortado entre la lista de los sintomas de referencia
              for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
                if(d[0]==this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow){
                  var foundElement=false;
                  // busco en los sintomas del paciente
                  for(var j=0;j<this.phenotype.data.length;j++){
                    if(this.listSymtomsFreqForGraph[0].data[i].symptom.id==this.phenotype.data[j].id){
                      foundElement=true;
                      return "#1f77b4";
                    }
                  }
                  // Si no lo encuentro en los del paciente
                  if(foundElement==false){
                    return "#ff0000";
                  }
                }
              }
            }
            else{
              return "#ff0000";
            }
          }
        })

      //EXIT
      mini_bar.exit()
        .remove();
    }

    //Start the brush
    if(this.chartDataSymptomsFreq.length>1){
      var defaultSection=[];
      if(this.chartDataSymptomsFreq.length>10){
        defaultSection=[0,this.yScaleSymptomsFreq_mini(this.chartDataSymptomsFreq[10][0])]
      }
      else if(this.chartDataSymptomsFreq.length>0){
        defaultSection=[0,this.yScaleSymptomsFreq_mini(this.chartDataSymptomsFreq[this.chartDataSymptomsFreq.length-1][0])]
      }
      this.previousSelection=defaultSection;
      this.gBrush.call(this.brush.move,defaultSection);
    }

    var COLORS = [];
    var LABELS = [];
    var color;
    if(changeMycolors==true){
      LABELS = [[this.translate.instant("patdiagdashboard.panel3MyCase"),this.translate.instant("patdiagdashboard.Enlarge")+"/"],[this.translate.instant("patdiagdashboard.panel3RealCases"),this.translate.instant("patdiagdashboard.Shift")]];
      color=["#1f77b4", "#ff0000"];
    }
    else{
      LABELS = [[this.translate.instant("patdiagdashboard.panel3RealCases"),this.translate.instant("patdiagdashboard.Enlarge")+"/"],["",this.translate.instant("patdiagdashboard.Shift")]];
      color=["#ff0000"]
    }
    //console.log(LABELS)
    // Legend
    var legend = svgSymptomsFreq.selectAll(".legend")
      .data(LABELS)
      .enter()
      .append("g")
      .attr("class","legend")

    legend.append("rect")
        .attr("fill", function (d, i){
          if(LABELS[i][0]!=""){
            return color[i]
          }
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("fill-opacity", .4)
        .attr("y", 5)
        .attr("x", function (d, i) {
          if(LABELS[i][0]!=""){
            return main_margin.left+i*100;
          }
        })
        .style("display",function(d,i){
          if(LABELS[i][0]!=""){
            return "flex";
          }
          else{
            return "none";
          }
        });

    legend.append("text")
      .attr("class", "label")
      .attr("y", 15)
      .attr("x", function (d, i) {
        return main_margin.left+20+i*100;
      })
      .attr("text-anchor", "start")
      .text(function (d, i) {
        //console.log(LABELS[i][0])
        if(LABELS[i][0]!=""){
          return LABELS[i][0];
        }
      })
      .attr("fill","black")
      .style("font-size", "13px");

    // Minibar help
    if(this.chartDataSymptomsFreq.length>1){
      legend.append("text")
        .attr("class", "label")
        .attr("y", function (d, i) {
          return mini_margin.top-(1-i)*12-5;
        })
        .attr("x", main_width+main_margin.left+main_margin.right+mini_margin.left)
        .attr("text-anchor", "end")
        .text(function (d, i) {
          return LABELS[i][1];
        })
        .attr("fill","black")
        .style("font-size", "13px")
        .style("text-anchor","start");
    }


  }
  updateChartFrequency(){
    var changeMycolors=this.symptomsPermissions.shareWithCommunity;
    /*d3.select(".mainGroupWrapper").select(".axis.axis-y").selectAll(".tick").selectAll("text")
      .style("fill", "black")
      .style("font-size","10px")
      .style("text-anchor", "end")
      .call(this.wrap,this.yScaleSymptomsFreq.bandwidth());*/

    //this.chartDataSymptomsFreq.reverse();
    //DATA JOIN
    var bar = d3.select(".mainGroup").selectAll(".bar")
        .remove()
        .exit()
        .data(this.chartDataSymptomsFreq);
    var titles=[]
    bar.each((d)=>{
      for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
        if(d[0]==this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow){
          titles.push(this.listSymtomsFreqForGraph[0].data[i].symptom.name)
        }
      }
    })
    //UPDATE
    bar
      .attr("y", (d,i) => { return this.yScaleSymptomsFreq(d[0]); })
      .attr("height", this.yScaleSymptomsFreq.bandwidth())
      .attr("x", this.maxWidth)
      .transition().duration(50)
      .attr("width", (d)=> {
        return this.xScaleSymptomsFreq(d[1])});
    //ENTER
    bar.enter().append("rect")
      .attr("class", "bar")
      .style("fill-opacity", .4)
      .attr("fill", (d) => {
        // Si el length es 0 no habría que pintarlo sino indicar que no hay datos para el
        if(d[1]==0||(this.yScaleSymptomsFreq.domain().includes(d[0])==false)){
          return "none"
        }
        else{
          if(changeMycolors==true){
            // Busco el name recortado entre la lista de los sintomas de referencia
            for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
              if(d[0]==this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow){
                var foundElement=false;
                // busco en los sintomas del paciente
                for(var j=0;j<this.phenotype.data.length;j++){
                  if(this.listSymtomsFreqForGraph[0].data[i].symptom.id==this.phenotype.data[j].id){
                    foundElement=true;
                    return "#1f77b4";
                  }
                }
                // Si no lo encuentro en los del paciente
                if(foundElement==false){
                  return "#ff0000";
                }
              }
            }
          }
          else{
            return "#ff0000";
          }
        }
      })
      .attr("y", (d,i) =>{ return this.yScaleSymptomsFreq(d[0]); })
      .attr("height", this.yScaleSymptomsFreq.bandwidth())
      .attr("x", this.maxWidth)
      .transition().duration(50)
      .attr("width", (d)=> {
        return this.xScaleSymptomsFreq(d[1])});
    // Title bars
    d3.select(".mainGroup").selectAll("rect").append("svg:title")
    .text((d, i) => {
      for(var j=0;j<this.listSymtomsFreqForGraph[0].data.length;j++){
        if(this.listSymtomsFreqForGraph[0].data[j].symptom!=undefined){
          if(d[0]==this.listSymtomsFreqForGraph[0].data[j].symptom.nameForShow){
            //return ("There are "+this.listSymtomsFreqForGraph[0].data[j].listPatients.length+" patients of "+this.listSymtomsFreqForGraph[0].numberPoblation+ " with symptom: \n"+this.listSymtomsFreqForGraph[0].data[j].symptom.name)
            return (this.listSymtomsFreqForGraph[0].data[j].symptom.name)
          }
        }
      }
    });

    d3.select(".mainGroup").selectAll(".bartext")
      .remove()
      .exit()
      .data(this.chartDataSymptomsFreq)
      .enter()
      .append("text")
      .attr("class","bartext")
      .attr("x", ((d)=> { return this.xScaleSymptomsFreq(d[1])+this.maxWidth}))
      .attr("y", (d)=>{ return this.yScaleSymptomsFreq(d[0])+this.yScaleSymptomsFreq.bandwidth()})
      .attr("dx", ".35em")
      .text((d, i) =>{
        if(d[1]>0 && this.yScaleSymptomsFreq.domain().includes(d[0])){return Math.round(d[1]);}
        else return "";
      })
      .style("fill","black")
      .style("text-anchor","start")
      .style("font-size", () =>{
        if(this.yScaleSymptomsFreq.bandwidth()<13) return this.yScaleSymptomsFreq.bandwidth();
        else return "13px";
      });
     //EXIT
    bar.exit()
     .remove();
  }
  //First function that runs on a brush move
  brushmove() {
      var main_margin = {top:this.marginFreq.top, right: this.marginFreq.right, bottom: this.marginFreq.bottom, left: this.marginFreq.left};
      var main_width = (3/4)*this.widthSymptomsFreq_saved-main_margin.left-main_margin.right;
      var main_height = 500 - main_margin.top - main_margin.bottom;
      if(this.chartDataSymptomsFreq.length==1){
        main_height = this.chartDataSymptomsFreq.length*200 - main_margin.top - main_margin.bottom;
      }
      var mini_margin;
      if(this.widthSymptomsFreq_saved<600){
        mini_margin={top:this.marginFreq.top, right: 0, bottom: this.marginFreq.bottom, left: 2*this.marginFreq.left};
      }
      else{
        mini_margin={top:this.marginFreq.top, right: 0, bottom: this.marginFreq.bottom, left: 12*this.marginFreq.left};
      }
      var mini_width = (1/4)*this.widthSymptomsFreq_saved - mini_margin.left - mini_margin.right;
      var mini_height = 500 - mini_margin.top - mini_margin.bottom;
      if(this.chartDataSymptomsFreq.length==1){
        mini_height = this.chartDataSymptomsFreq.length*200 - mini_margin.top - mini_margin.bottom;
      }
      var selection =d3.event.selection;
      if(selection!=undefined){
        let newData=[];
        newData=this.chartDataSymptomsFreq;
        newData=newData.filter((d,i) =>{
          // check if the start of the brush is before the band
          // and if the end of the brush is after the end of the band
          if(selection[0] <= this.yScaleSymptomsFreq_mini(d[0]) && selection[1] >= this.yScaleSymptomsFreq_mini(d[0])){
            return d;
          }
        });
        let newDataResize=false;
        let newDataResizeMinimum=false;
        if(newData.length>15){
          // Me muevo hacia abajo
          if((d3.event.type=="brush")&&(d3.event.sourceEvent.movementY>0)){
            // Tengo que mantener el valor del primero que estaba mostrándose y sumarle 14 para el ultimo
            var newEnd=14;
            selection[1]=this.yScaleSymptomsFreq_mini(newData[newEnd][0])+this.yScaleSymptomsFreq_mini.bandwidth();
            newData=newData.slice(newData[0][0],newData[newEnd][0])
          }
          // Me muevo hacia arriba
          else if((d3.event.type=="brush")&&(d3.event.sourceEvent.movementY<0)){
            // Tengo que mantener el valor del ultimo que estaba mostrándose y restarle 14 para el primero
            var newStart=(newData.length-1)-14;
            selection[0]=this.yScaleSymptomsFreq_mini(newData[newStart][0])-this.yScaleSymptomsFreq_mini.bandwidth();;
            newData=newData.slice([newStart][0],newData[newData.length-1][0])
          }
          newDataResize=true;
        }
        else if(newData.length==0){
          // Me muevo hacia arriba
          if((d3.event.type=="brush")&&(d3.event.sourceEvent.movementY<0)){
            // Tengo que mantener el valor del primero que estaba mostrándose y sumarle 14 para el ultimo
            var newEnd=1;
            console.log("me muevo hacia arriba")
            selection[1]=selection[1]+this.yScaleSymptomsFreq_mini.bandwidth();
          }
          // Me muevo hacia abajo
          else if((d3.event.type=="brush")&&(d3.event.sourceEvent.movementY>0)){
            console.log("me muevo hacia abajo")
            // Tengo que mantener el valor del ultimo que estaba mostrándose y restarle 14 para el primero
            selection[0]=selection[0]-this.yScaleSymptomsFreq_mini.bandwidth();
          }
          newDataResizeMinimum=true;
        }
        //console.log(newData)
        let yDomain = newData.map(d => d[0]);
        this.yScaleSymptomsFreq = d3.scaleBand().padding(0.4).domain(yDomain).range([0,mini_height]);
        d3.select(".mainGroupWrapper")
          .select(".axis.axis-y")
          .call(d3.axisLeft(this.yScaleSymptomsFreq))

        d3.select(".mainGroupWrapper").select(".axis.axis-y").selectAll(".tick").selectAll("text")
          .style("fill", "black")
          .style("font-size","10px")
          .call(this.wrap,this.yScaleSymptomsFreq.bandwidth());

        this.handle.attr("display", null).attr("transform", function(d, i) {
          var maxHeight=selection[1]+4;
          var minHeight=selection[0]-4
          return i ? "translate(" + mini_width/2 + "," + maxHeight + ") rotate(180)" : "translate(" +  mini_width/2 + "," + minHeight + ") rotate(0)";
        });
        if(newDataResize==true){
          let section=[selection[0],selection[1]]
          this.gBrush.call(this.brush.move,section);
          newDataResize=false;
        }
        if(newDataResizeMinimum==true){
          let section=[selection[0],selection[1]]
          this.gBrush.call(this.brush.move,section);
          newDataResizeMinimum=false;
        }
        this.updateChartFrequency();

      }

    }//brushmove

  wrap(text, height) {
    text.each(function() {
      var text = d3.select(this);
      var words = text.text().split(/\s+/).reverse();
      var word;
      var line = [];
      var lineNumber = 0;
      var lineHeight = height; // ems
      var y = text.attr("y");
      var dy = parseFloat(text.attr("dy"));
      var totalLength=0;
      // Numero de caracteres
      for(var i=0;i<words.length;i++){
        totalLength=totalLength+words[i].length;
      }
      //incluyendo los espacios
      totalLength=totalLength+(words.length-1)

      if(totalLength>30){
        dy=0.0;
      }
      var tspan = text.text(null).append("tspan").attr("x", "-1em").attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > 150) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          lineNumber = lineNumber+1;
          var dyShow =  lineNumber+dy
          tspan = text.append("tspan").attr("y", y).attr("x", "-1em").attr("dy", dyShow + "em").text(word+" ");
        }
      }
    });
  }

  showSharePanel(){
    //console.log('launch');
    document.getElementById("buttonShareTo").click();
  }

  calculeCharSymptomsFreqListForWindowSize(elementId){
    this.patientDataNotShowHistogram=false;
    this.listpatientDataNotShowHistogram=[];
    var listForGraphInVennAndBarDiagramsReal=[];
    var graphSymptomsFreq=document.getElementById(elementId)
    //console.log(this.listSymtomsFreqForGraph[0].data)
    var notShowButInList=[];
    var notShowButFiltered=[];
    // ORDENAR LOS DATOS DE ENTRADA
    var realSymtoms= Object.keys(this.listSymtomsFreqResponse).length;
    var simSymtoms= Object.keys(this.listSymtomsFreqResponseSim).length;
    this.listSymtomsFreqForGraph[0].data=this.orderFrequencybefore(this.listSymtomsFreqForGraph[0].data)
    //console.log(this.listSymtomsFreqForGraph[0])
    this.chartDataSymptomsFreq=[];
    // Como estan ordenados
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      //if((this.chartDataSymptomsFreq.length<60)){
      if(this.listSymtomsFreqForGraph[0].data[i].symptom.checked==true){
        //console.log(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length)
        if(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length>0){
          if(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length>0){
            var percReal=(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100;
            var perSim=(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100;
            //if((percReal>5)||(perSim>5)){
              /*if(graphSymptomsFreq.offsetWidth<this.diagramSymptomsFreqMaxSize){
                if(this.chartDataSymptomsFreq.length<this.mazSizeFreqSymtpomsReduceScreen){
                  this.chartDataSymptomsFreq.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
                  listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
                }
                else{
                  notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
                }
              }
              else{*/
                if(this.chartDataSymptomsFreq.length<this.maxSizeFreqSymptoms){
                  this.chartDataSymptomsFreq.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
                  listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
                }
                else{
                  notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
                }
              //}
            //}

          }
          else{
            var percReal=(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100;
            //if(percReal>5){
              /*if(graphSymptomsFreq.offsetWidth<this.diagramSymptomsFreqMaxSize){
                if(this.chartDataSymptomsFreq.length<this.mazSizeFreqSymtpomsReduceScreen){
                  this.chartDataSymptomsFreq.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,0])
                  listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,0])
                }
                else{
                  notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
                }
              }
              else{*/
                if(this.chartDataSymptomsFreq.length<this.maxSizeFreqSymptoms){
                  this.chartDataSymptomsFreq.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,0])
                  listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,0])
                }
                else{
                  notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
                }
              //}
            //}
          }
          //this.chartDataSymptomsFreq.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100])
        }
        else{
          // Si tiene datos de Sim
          if(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length>0){
            if(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length>0){
              var perSim=(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100;
              //if(perSim>5){
                /*if(graphSymptomsFreq.offsetWidth<this.diagramSymptomsFreqMaxSize){
                  if(this.chartDataSymptomsFreq.length<this.mazSizeFreqSymtpomsReduceScreen){
                    this.chartDataSymptomsFreq.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,0,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
                    listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,0,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
                  }
                  else{
                    notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
                  }
                }
                else{*/
                  if(this.chartDataSymptomsFreq.length<this.maxSizeFreqSymptoms){
                    this.chartDataSymptomsFreq.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,0,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
                    listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,0,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
                  }
                  else{
                    notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
                  }
                //}
              //}
            }
          }

        }
      }
      else{
        if(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length>0){
          if(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length>0){
            listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
          }
          else{
            listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100,0])
          }
        }
        else{
          // Si tiene datos de Sim
          if(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length>0){
            listForGraphInVennAndBarDiagramsReal.push([this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,0,(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100])
          }
        }
        notShowButFiltered.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
      }
      //}
    }

    // Buscar la lista de sintomas que NO aparecen en this.chartDataFreq pero si en los sintomas del paciente
    // Recorrer la lista completa de sintomas
    // Si un sintoma es de phenotype.data (patient) o Si un sintoma tiene patientbutsuccesor
    //-> Recorro la lista de chartDataSymptoms obteniendo su ID con graph -> Si no esta: lo añado a la lista
    if(this.fullListSymptoms.length==0){
      //console.log(this.phenotype.data)
      // Busco entre los del paciente
      for(var j=0;j<this.phenotype.data.length;j++){
        var symptomPatientFoundInChartData=false;
        // Si es un sintoma de paciente, busco si esta en chartData
        for(var k=0;k<this.chartDataSymptomsFreq.length;k++){
          for(var m=0;m<this.listSymtomsFreqForGraph[0].data.length;m++){
            if(this.chartDataSymptomsFreq[k][0]==this.listSymtomsFreqForGraph[0].data[m].symptom.nameForShow){
              var symptomShowId=this.listSymtomsFreqForGraph[0].data[m].symptom.id;
              if(symptomShowId==this.phenotype.data[j].id){
                // esta en chartData
                symptomPatientFoundInChartData=true;
              }
            }
          }
        }
        // Si era un sintoma de paciente, y no lo he encontrado en chartdata. push
        if(symptomPatientFoundInChartData==false){
          // Tengo que mirar que no estuviera en notShowButInList
          if(notShowButInList.includes(this.phenotype.data[j].id)==false){
            if(notShowButFiltered.includes(this.phenotype.data[j].id)==false){
              this.listpatientDataNotShowHistogram.push(this.phenotype.data[j].name)
            }
          }
        }

      }
    }
    for(var i=0;i<this.fullListSymptoms.length;i++){
      var symptomPatientFoundInChartData=false;
      // Busco entre los del paciente
      for(var j=0;j<this.phenotype.data.length;j++){
        // Si es un sintoma de paciente, busco si esta en chartData
        if(this.fullListSymptoms[i].id==this.phenotype.data[j].id){
          for(var k=0;k<this.chartDataSymptomsFreq.length;k++){
            for(var m=0;m<this.listSymtomsFreqForGraph[0].data.length;m++){
              if(this.chartDataSymptomsFreq[k][0]==this.listSymtomsFreqForGraph[0].data[m].symptom.nameForShow){
                var symptomShowId=this.listSymtomsFreqForGraph[0].data[m].symptom.id;
                if(symptomShowId==this.phenotype.data[j].id){
                  // esta en chartData
                  symptomPatientFoundInChartData=true;
                }
              }
            }
          }
          // Si era un sintoma de paciente, y no lo he encontrado en chartdata. push
          if(symptomPatientFoundInChartData==false){
            // Tengo que mirar que no estuviera en notShowButInList
            if(notShowButInList.includes(this.phenotype.data[j].id)==false){
              if(notShowButFiltered.includes(this.phenotype.data[j].id)==false){
                this.listpatientDataNotShowHistogram.push(this.phenotype.data[j].name)
              }
            }
          }
        }
      }
    }
    // Se pasa a String y se prepara para mostrarlo bien
    this.listpatientDataNotShowHistogramString="";
    for(var i=0;i<this.listpatientDataNotShowHistogram.length;i++){
      if(this.listpatientDataNotShowHistogram[i]!=undefined){
        if(i==this.listpatientDataNotShowHistogram.length-1){
          this.listpatientDataNotShowHistogramString=this.listpatientDataNotShowHistogramString+this.listpatientDataNotShowHistogram[i].toLowerCase();
        }
        else{
          this.listpatientDataNotShowHistogramString=this.listpatientDataNotShowHistogramString+this.listpatientDataNotShowHistogram[i].toLowerCase()+", ";
        }
      }

    }

    // Aqui hay que ordenar la lista de datos chartDataSymptomsFreq - si varios tienen la misma freq, poner primero los del paciente
    this.orderChartFreqData();

    // Los que esten filtrados SI se representan en los diagramas de venn y barras del histograma

    // Recalculate venn and bars diagrams for real cases
    this.calculeChartSymptomsInfoReal(listForGraphInVennAndBarDiagramsReal); //(listas de cada caso)


    //console.log(this.listSymptomsMe)
    //console.log(this.listSymptomsGeneric)
    //console.log(this.listSymptomsMeGeneric)
    var listSymptomsMeWithoutSuccessorsReal=[]
    // Diagrama de Venn

    // Lista de datos de entrada para la representacion del diagrama de Venn
    this.chartDataVennReal = [];
    if(this.symptomsPermissions.shareWithCommunity==true){
      this.chartDataVennReal = [
        {sets: ['My case'], size: this.listSymptomsMe_real.length,label: this.translate.instant("patdiagdashboard.panel3MyCase"),data:this.listSymptomsMe_real},
        {sets: ['Real case'], size: this.listSymptomsReal.length, label:this.translate.instant("patdiagdashboard.panel3RealCases"),data:this.listSymptomsReal},
        {sets: ['My case','Real case'], size: this.listSymptomsMeReal.length,data:this.listSymptomsMeReal}
      ];
    }
    else{
      this.chartDataVennReal = [
        {sets: ['My case'], size: 0,label: this.translate.instant("patdiagdashboard.panel3MyCase"),data:""},
        {sets: ['Real case'], size: this.listSymptomsReal.length, label:this.translate.instant("patdiagdashboard.panel3RealCases"),data:this.listSymptomsReal},
        {sets: ['My case','Real case'], size: 0,data:""}
      ];
    }

    // Diagrama de bars

    // Lista de datos de entrada para la representacion del diagrama Bars
    this.chartDataBarsReal = [];

    if(this.symptomsPermissions.shareWithCommunity==true){
      this.chartDataBarsReal.push([
        this.translate.instant("patdiagdashboard.panel3RealCases"),
        this.listSymptomsReal.length
      ]);
      this.chartDataBarsReal.push([
        this.translate.instant("patdiagdashboard.panel3MyCase"),
        this.listSymptomsMe_real.length
      ]);
    }
    else{
      this.chartDataBarsReal.push([
        this.translate.instant("patdiagdashboard.panel3RealCases"),
        this.listSymptomsReal.length
      ]);
      this.chartDataBarsReal.push([
        this.translate.instant("patdiagdashboard.panel3MyCase"),
        0
      ]);
    }
  }
  calculeCharSymptomsFreqListForWindowSizeQueried(listSymptomsToGraph){
    this.queryApply=true;
    var notShowButInList=[];
    var notShowButFiltered=[];
    var listForGraphInVennAndBarDiagramsReal=[];

     // Impongo que ninguno pertenece a la comunidad belongstoCommunity=false
     for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      this.listSymtomsFreqForGraph[0].data[i].symptom.belongstoCommunity=false;
    }
    // Impongo los estados de queried: quitamos todos los que estuviesen a queried antes del calculo (para nuevos añadidos)
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      for(var j=0;j<this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length;j++){
        this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors[j].queried=false;
      }
    }
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      for(var j=0;j<this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length;j++){
        this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors[j].queried=false;
      }
    }

    // 1. Calculo los queried
    // CASO 1: REALES
    var tamanoSymptoms= Object.keys(this.listSymtomsFreqResponse).length;
    if(tamanoSymptoms>0){
      //console.log("Case real")
      this.listSymtomsFreq[0].numberPoblation = tamanoSymptoms;
      var includeAllSymptoms=true;
      //recorrer la lista de pacientes
      for(var ipatient in this.listSymtomsFreqResponse) {
        includeAllSymptoms=true;
        // Para ese paciente evaluar si en la lista de HPOs estan todos los sintomas elegidos en la query listSymtomsFreqForGraphQuery
        for(var i=0;i<this.listSymtomsFreqForGraphQuery.length;i++){
          if((this.listSymtomsFreqResponse[ipatient].includes(this.listSymtomsFreqForGraphQuery[i]))==false){
            includeAllSymptoms=false;
          }
        }
        if(includeAllSymptoms==true){
          //console.log("include real")
          // Para los que se cumpla esto: los marco en la lista de pintar como queried y continuo con el pintar
          //console.log("El paciente: "+ipatient+", incluye todos los sintomas de la lista queried: "+this.listSymtomsFreqForGraphQuery.toString())
          for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
            // Este paciente se marca a queried en todas las listas de pacientes que se encuentre
            for(var j=0;j<this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length;j++){
              //console.log("check patient"+ipatient)
              if(ipatient==this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors[j].patientId){
                //console.log("queried real")
                this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors[j].queried=true;
              }
            }
          }
        }
      }
    }
    // CASO 2: SIMULADOS
    var simSymtoms= Object.keys(this.listSymtomsFreqResponseSim).length;
    if(simSymtoms>0){
      //console.log("Case simulados")
      var includeAllSymptoms=true;
      //recorrer la lista de pacientes
      for(var ipatient in this.listSymtomsFreqResponseSim) {
        includeAllSymptoms=true;
        // Para ese paciente evaluar si en la lista de HPOs estan todos los sintomas elegidos en la query listSymtomsFreqForGraphQuery
        //console.log(this.listSymtomsFreqForGraphQuery)
        for(var i=0;i<this.listSymtomsFreqForGraphQuery.length;i++){
          if((this.listSymtomsFreqResponseSim[ipatient].includes(this.listSymtomsFreqForGraphQuery[i]))==false){
            includeAllSymptoms=false;
          }
        }
        if(includeAllSymptoms==true){
          // Para los que se cumpla esto: los marco en la lista de pintar como queried y continuo con el pintar
          //console.log("El paciente: "+ipatient+", incluye todos los sintomas de la lista queried: "+this.listSymtomsFreqForGraphQuery.toString())
          for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
            // Este paciente se marca a queried en todas las listas de pacientes que se encuentre
            for(var j=0;j<this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length;j++){
              if(ipatient==this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors[j].patientId){
                //console.log("queried sim")
                this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors[j].queried=true;
              }
            }
          }
        }
      }
    }
    console.log(this.listSymtomsFreqForGraph[0])
    var graphSymptomsFreq=document.getElementById('chartSymptomsFreq')

    // ORDENAR LOS DATOS DE ENTRADA
    var realSymtoms= Object.keys(this.listSymtomsFreqResponse).length;
    var simSymtoms= Object.keys(this.listSymtomsFreqResponseSim).length;
    this.listSymtomsFreqForGraph[0].data=this.orderFrequencybefore(this.listSymtomsFreqForGraph[0].data)

    this.chartDataSymptomsFreq=[];
    // tengo que pintar los que pertenezcan a la comunidad:
    // 1. Busco Los sintomas que tengan pacientes a queried y hago una lista de sintoma-patientQueried
    // A queried ya tendre todos OK en este punto (lo habre hecho antes de llamar a esta funcion)

    // Para aprovechar me quedo tambien con el estado checked
    // Lista resultado: {symptomId,nameForShow,listPatients,checked}
    var symptomsAndPatientsQueriedReal=[];
    var symptomsAndPatientsQueriedSim=[]
    console.log("Go to calcule new community")
    var  realAndSim=false;
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      realAndSim=false;
      // puedo tener patients queried en las listas real y simulada
      // Segun donde los encuentre me cambiara el dato de la grafica de barras o de la linea
      if(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length>0){
        for(var k=0;k<this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length;k++){
          if(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors[k].queried==true){
            var included=false;
            for(var j=0;j<symptomsAndPatientsQueriedReal.length;j++){
              if(symptomsAndPatientsQueriedReal[j].symptomId==this.listSymtomsFreqForGraph[0].data[i].symptom.id){
                symptomsAndPatientsQueriedReal[j].listPatients.push(this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors[k].patientId)
                included=true;
                realAndSim=true;
              }
            }
            if(included==false){
              symptomsAndPatientsQueriedReal.push({symptomId:this.listSymtomsFreqForGraph[0].data[i].symptom.id,nameForShow:this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,listPatients:[this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors[k].patientId],checked:this.listSymtomsFreqForGraph[0].data[i].symptom.checked})
            }
          }
        }
      }
      if((realAndSim==false) && (this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length>0)){
        for(var k=0;k<this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors.length;k++){
          if(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors[k].queried==true){
            //console.log("Sim queried found")

            var included=false;
            for(var j=0;j<symptomsAndPatientsQueriedSim.length;j++){
              if(symptomsAndPatientsQueriedSim[j].symptomId==this.listSymtomsFreqForGraph[0].data[i].symptom.id){
                if(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors[k]!=undefined){
                  symptomsAndPatientsQueriedSim[j].listPatients.push(this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors[k].patientId)
                  included=true;
                }
              }
            }
            if(included==false){
              symptomsAndPatientsQueriedSim.push({symptomId:this.listSymtomsFreqForGraph[0].data[i].symptom.id,nameForShow:this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow,listPatients:[this.listSymtomsFreqForGraph[0].data[i].listPatientsSimWithoutPredecessors[k].patientId],checked:this.listSymtomsFreqForGraph[0].data[i].symptom.checked})
            }
          }
        }
      }
    }
    console.log(symptomsAndPatientsQueriedSim)
    console.log(symptomsAndPatientsQueriedReal)
    // Si la pantalla se hace  muy pequeña: entonces se hace el TOP10 de los SymptomsFaq para mostrar

    // 2. Partiendo de la lista anterior ya puedo sacar la info que se va a mostrar
    // teniendo en cuenta que los que tengan checked a false no se muestran:
    // Aqui hay que juntar los reales y los simulados en chartDataFrequency
    // Caso 1: tengo reales y simulados
    if((symptomsAndPatientsQueriedReal.length>0)&&(symptomsAndPatientsQueriedSim.length>0)){
      // tengo que buscar los comunes en los dos, y luego para los que no sean comunes - añadirlos con % 0 en el caso contrario
      // Recorro los reales
      for(var i=0;i<symptomsAndPatientsQueriedReal.length;i++){
        // recorro los simulados
        var foundInBoth=false;
        var foundInBothButFiltered=false;
        for(var j=0;j<symptomsAndPatientsQueriedSim.length;j++){
          if(symptomsAndPatientsQueriedReal[i].symptomId==symptomsAndPatientsQueriedSim[j].symptomId){
            // Compruebo que el sintoma este a check en alguno de los dos (valdra lo mismo en ambos)
            if(symptomsAndPatientsQueriedReal[i].checked==true){
              // Si es del paciente se mete si o si
              var percReal=(symptomsAndPatientsQueriedReal[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100;
              var perSim=(symptomsAndPatientsQueriedSim[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100;
              //if((percReal>5)||(perSim>5)){
              /*if(graphSymptomsFreq.offsetWidth<this.diagramSymptomsFreqMaxSize){
                if(this.chartDataSymptomsFreq.length<this.mazSizeFreqSymtpomsReduceScreen){
                  console.log("top10")
                  this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,perSim])
                  listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,perSim])
                  foundInBoth=true;
                }
                else{
                  notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
                }
              }
              else{*/
                if(this.chartDataSymptomsFreq.length<this.maxSizeFreqSymptoms){
                  this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,perSim])
                  listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,perSim])
                  foundInBoth=true;
                }
                else{
                  notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
                }
              //}
              //}
            }
            // Aunque alguno este filtrado si se tiene que mostrar en los diagrams de venn y de barras del caso real
            else{
              var percReal=(symptomsAndPatientsQueriedReal[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100;
              var perSim=(symptomsAndPatientsQueriedSim[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100;
              //if((percReal>5)||(perSim>5)){
              listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,perSim])
              notShowButFiltered.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
              foundInBothButFiltered=true;
            }
          }
        }
        // el real no se ha encontrado entre los simulados
        if(foundInBoth==false){
          if(symptomsAndPatientsQueriedReal[i].checked==true){
            var percReal=(symptomsAndPatientsQueriedReal[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100;
            //if((percReal>5)){
            /*if(graphSymptomsFreq.offsetWidth<this.diagramSymptomsFreqMaxSize){
              if(this.chartDataSymptomsFreq.length<this.mazSizeFreqSymtpomsReduceScreen){
                console.log("top10")
                this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
                listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
              }
              else{
                notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
              }
            }
            else{*/
              if(this.chartDataSymptomsFreq.length<this.maxSizeFreqSymptoms){
                this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
                listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
              }
              else{
                notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
              }
            //}
            //}
          }
          else{
            if(foundInBothButFiltered==false){
              var percReal=(symptomsAndPatientsQueriedReal[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100;
              listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
              notShowButFiltered.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
            }
          }
        }
      }
      // Por ultimo, antes de cambiar de caso, hay que mirar si entre los simulados existen algunos que no estan en los reales y por tanto no se han añadido aun
      for(var i=0;i<symptomsAndPatientsQueriedSim.length;i++){
        var foundInReal=false;
        for(var j=0;j<symptomsAndPatientsQueriedReal.length;j++){
          if(symptomsAndPatientsQueriedReal[j].symptomId==symptomsAndPatientsQueriedSim[i].symptomId){
            foundInReal=true;
          }
        }
        if(foundInReal==false){
          // compruebo el check y lo añado o no
          if(symptomsAndPatientsQueriedSim[i].checked==true){
            // Si es del paciente se mete si o si
            var perSim=(symptomsAndPatientsQueriedSim[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100;
            //if((perSim>5)){
            /*if(graphSymptomsFreq.offsetWidth<this.diagramSymptomsFreqMaxSize){
              if(this.chartDataSymptomsFreq.length<this.mazSizeFreqSymtpomsReduceScreen){
                console.log("top10")
                this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
                listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
              }
              else{
                notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
              }
            }
            else{*/
              if(this.chartDataSymptomsFreq.length<this.maxSizeFreqSymptoms){
                this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
                listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
              }
              else{
                notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
              }
            //}
            //}
          }
          else{
            var perSim=(symptomsAndPatientsQueriedSim[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100;
            listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
            notShowButFiltered.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
          }
        }
      }
    }
    // Caso 2: solo reales
    else if((symptomsAndPatientsQueriedReal.length>0)&&(symptomsAndPatientsQueriedSim.length==0)){
      for(var i=0;i<symptomsAndPatientsQueriedReal.length;i++){
        if(symptomsAndPatientsQueriedReal[i].checked==true){
          var percReal=(symptomsAndPatientsQueriedReal[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100;
          //if((percReal>5)){
          /*if(graphSymptomsFreq.offsetWidth<this.diagramSymptomsFreqMaxSize){
            if(this.chartDataSymptomsFreq.length<this.mazSizeFreqSymtpomsReduceScreen){
              console.log("top10")
              this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
              listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
            }
            else{
              notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
            }
          }
          else{*/
            if(this.chartDataSymptomsFreq.length<this.maxSizeFreqSymptoms){
              this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
              listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
            }
            else{
              notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
            }
          //}
          //}
        }
        else{
          var percReal=(symptomsAndPatientsQueriedReal[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberPoblation)*100;
          listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedReal[i].nameForShow,percReal,0])
          notShowButFiltered.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
        }
      }
    }
    // Caso 3: solo simulados
    else if((symptomsAndPatientsQueriedReal.length==0)&&(symptomsAndPatientsQueriedSim.length>0)){
      for(var i=0;i<symptomsAndPatientsQueriedSim.length;i++){
        if(symptomsAndPatientsQueriedSim[i].checked==true){
          var perSim=(symptomsAndPatientsQueriedSim[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100;
          //if((perSim>5)){
            /*if(graphSymptomsFreq.offsetWidth<this.diagramSymptomsFreqMaxSize){
              if(this.chartDataSymptomsFreq.length<this.mazSizeFreqSymtpomsReduceScreen){
                console.log("top10")
                this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
                listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
              }
              else{
                notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
              }
            }
            else{*/
              if(this.chartDataSymptomsFreq.length<this.maxSizeFreqSymptoms){
                this.chartDataSymptomsFreq.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
                listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
              }
              else{
                notShowButInList.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
              }
            //}
          //}
        }
        else{
          var perSim=(symptomsAndPatientsQueriedSim[i].listPatients.length/this.listSymtomsFreqForGraph[0].numberSimPoblation)*100;
          listForGraphInVennAndBarDiagramsReal.push([symptomsAndPatientsQueriedSim[i].nameForShow,0,perSim])
          notShowButFiltered.push(this.listSymtomsFreqForGraph[0].data[i].symptom.id);
        }
      }
    }

    // Por ultimo busco todos los sintomas que estan en chartDataFreq -> comunidad
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      for(var j=0;j<this.chartDataSymptomsFreq.length;j++){
        if(this.chartDataSymptomsFreq[j][0]==this.listSymtomsFreqForGraph[0].data[i].symptom.nameForShow){
          // Indico que pertenece a la comunidad
          this.listSymtomsFreqForGraph[0].data[i].symptom.belongstoCommunity=true;
        }
      }
    }

    // Buscar la lista de sintomas que NO aparecen en this.chartDataFreq pero si en los sintomas del paciente
    // Recorrer la lista completa de sintomas
    // Si un sintoma es de phenotype.data (patient) o Si un sintoma tiene patientbutsuccesor
    //-> Recorro la lista de chartDataSymptoms obteniendo su ID con graph -> Si no esta: lo añado a la lista
    if(this.fullListSymptoms.length==0){
      //console.log(this.phenotype.data)
      // Busco entre los del paciente
      for(var j=0;j<this.phenotype.data.length;j++){
        var symptomPatientFoundInChartData=false;
        // Si es un sintoma de paciente, busco si esta en chartData
        for(var k=0;k<this.chartDataSymptomsFreq.length;k++){
          for(var m=0;m<this.listSymtomsFreqForGraph[0].data.length;m++){
            if(this.chartDataSymptomsFreq[k][0]==this.listSymtomsFreqForGraph[0].data[m].symptom.nameForShow){
              var symptomShowId=this.listSymtomsFreqForGraph[0].data[m].symptom.id;
              if(symptomShowId==this.phenotype.data[j].id){
                // esta en chartData
                symptomPatientFoundInChartData=true;
              }
            }
          }
        }
        // Si era un sintoma de paciente, y no lo he encontrado en chartdata. push
        if(symptomPatientFoundInChartData==false){
          // Tengo que mirar que no estuviera en notShowButInList
          if(!notShowButInList.includes(this.phenotype.data[j].id)){
            if(notShowButFiltered.includes(this.phenotype.data[j].id)==false){
              this.listpatientDataNotShowHistogram.push(this.phenotype.data[j].name);
            }
          }
        }

      }
    }
    for(var i=0;i<this.fullListSymptoms.length;i++){
      var symptomPatientFoundInChartData=false;
      var succesorSymptomPatientFoundInChartData=false;
      // Busco entre los del paciente
      for(var j=0;j<this.phenotype.data.length;j++){
        // Si es un sintoma de paciente, busco si esta en chartData
        if(this.fullListSymptoms[i].id==this.phenotype.data[j].id){
          for(var k=0;k<this.chartDataSymptomsFreq.length;k++){
            for(var m=0;m<this.listSymtomsFreqForGraph[0].data.length;m++){
              if(this.chartDataSymptomsFreq[k][0]==this.listSymtomsFreqForGraph[0].data[m].symptom.nameForShow){
                var symptomShowId=this.listSymtomsFreqForGraph[0].data[m].symptom.id;
                if(symptomShowId==this.phenotype.data[j].id){
                  // esta en chartData
                  symptomPatientFoundInChartData=true;
                }
              }
            }
          }
          // Si era un sintoma de paciente, y no lo he encontrado en chartdata. push
          if(symptomPatientFoundInChartData==false){
            // Tengo que mirar que no estuviera en notShowButInList
            if(!notShowButInList.includes(this.phenotype.data[j].id)){
              if(notShowButFiltered.includes(this.phenotype.data[j].id)==false){
                this.listpatientDataNotShowHistogram.push(this.phenotype.data[j].name)
              }
            }
          }
        }
      }
      // Busco entre los patientbutsuccesor
      /*if(this.fullListSymptoms[i].patientbutsuccesor==true){
        for(var k=0;k<this.chartDataSymptomsFreq.length;k++){
          for(var m=0;m<this.listSymtomsFreqForGraph[0].data.length;m++){
            if(this.chartDataSymptomsFreq[k][0]==this.listSymtomsFreqForGraph[0].data[m].symptom.nameForShow){
              var symptomShowId=this.listSymtomsFreqForGraph[0].data[m].symptom.id;
              if(symptomShowId==this.fullListSymptoms[i].id){
                // esta en chartData
                succesorSymptomPatientFoundInChartData=true;
              }
            }
          }
        }
        // Si era un sintoma "succesor" de paciente, y no lo he encontrado en chartdata. push
        if(succesorSymptomPatientFoundInChartData==false){
          this.listpatientDataNotShowHistogram.push(this.fullListSymptoms[i].name)
        }
      }*/
    }
    // Se pasa a String y se prepara para mostrarlo bien
    this.listpatientDataNotShowHistogramString="";
    for(var i=0;i<this.listpatientDataNotShowHistogram.length;i++){
      if(i==this.listpatientDataNotShowHistogram.length-1){
        this.listpatientDataNotShowHistogramString=this.listpatientDataNotShowHistogramString+this.listpatientDataNotShowHistogram[i].toLowerCase();
      }
      else{
        this.listpatientDataNotShowHistogramString=this.listpatientDataNotShowHistogramString+this.listpatientDataNotShowHistogram[i].toLowerCase()+", ";
      }
    }

    this.orderChartFreqData();

    // Los que esten filtrados SI se representan en los diagramas de venn y barras del histograma
    // Recalculate venn and bars diagrams for real cases
    this.calculeChartSymptomsInfoReal(listForGraphInVennAndBarDiagramsReal); //(listas de cada caso)
    //console.log(this.listSymptomsMe)
    //console.log(this.listSymptomsGeneric)
    //console.log(this.listSymptomsMeGeneric)
    var listSymptomsMeWithoutSuccessorsReal=[]
    // Diagrama de Venn
    // Lista de datos de entrada para la representacion del diagrama de Venn
    this.chartDataVennReal = [];
    if(this.symptomsPermissions.shareWithCommunity==true){
      this.chartDataVennReal = [
        {sets: ['My case'], size: this.listSymptomsMe_real.length,label: this.translate.instant("patdiagdashboard.panel3MyCase"),data:this.listSymptomsMe_real},
        {sets: ['Real case'], size: this.listSymptomsReal.length, label:this.translate.instant("patdiagdashboard.panel3RealCases"),data:this.listSymptomsReal},
        {sets: ['My case','Real case'], size: this.listSymptomsMeReal.length,data:this.listSymptomsMeReal}
      ];
    }
    else{
      this.chartDataVennReal = [
        {sets: ['My case'], size: 0,label: this.translate.instant("patdiagdashboard.panel3MyCase"),data:""},
        {sets: ['Real case'], size: this.listSymptomsReal.length, label:this.translate.instant("patdiagdashboard.panel3RealCases"),data:this.listSymptomsReal},
        {sets: ['My case','Real case'], size: 0,data:""}
      ];
    }


    // Diagrama de bars

    // Lista de datos de entrada para la representacion del diagrama Bars
    this.chartDataBarsReal = [];
    if(this.symptomsPermissions.shareWithCommunity==true){
      this.chartDataBarsReal.push([
        this.translate.instant("patdiagdashboard.panel3RealCases"),
        this.listSymptomsReal.length
      ]);
      this.chartDataBarsReal.push([
        this.translate.instant("patdiagdashboard.panel3MyCase"),
        this.listSymptomsMe_real.length
      ]);
    }
    else{
      this.chartDataBarsReal.push([
        this.translate.instant("patdiagdashboard.panel3RealCases"),
        this.listSymptomsReal.length
      ]);
      this.chartDataBarsReal.push([
        this.translate.instant("patdiagdashboard.panel3MyCase"),
        0
      ]);
    }
  }

  orderFrequencybefore(listSymtomsFreqForGraphData){
    var resultList=[];
    // Busco todos los del paciente y los coloco primero
    /*for(var i=0;i<listSymtomsFreqForGraphData.length;i++){
      var symptomId= listSymtomsFreqForGraphData[i].symptom.id;
      for(var j=0;j<this.phenotype.data.length;j++){
        if(this.phenotype.data[j].id==symptomId){
          resultList.push(listSymtomsFreqForGraphData[i])
        }
      }
    }
    // Despues busco todos los que esten en la lista de fullSymptoms como patientNotSuccesors y los pongo despues
    for(var i=0;i<listSymtomsFreqForGraphData.length;i++){
      var symptomId= listSymtomsFreqForGraphData[i].symptom.id;
      // Busco si esta en la lista de fullSymptoms como patientNotSuccesor
      for(var j=0;j<this.fullListSymptoms.length;j++){
        if(this.fullListSymptoms[j].patientbutsuccesor==true){
          if(this.fullListSymptoms[j].id==symptomId){
            resultList.push(listSymtomsFreqForGraphData[i])
          }
        }
      }
    }*/
    // Por ultimo
    var realSymtoms= Object.keys(this.listSymtomsFreqResponse).length;
    var simSymtoms= Object.keys(this.listSymtomsFreqResponseSim).length;
    // Distintos casos:
    var listSymtomsFreqForGraphDataCopy= listSymtomsFreqForGraphData;
    // Caso 1: reales y simulados: primero los reales, y luego los sim me hago una lista y la ordeno por freq
    if(realSymtoms>0 && simSymtoms>0){
      listSymtomsFreqForGraphDataCopy.sort(function(a, b) {
        if(((b.listPatientsWithoutPredecessors).length>0)&&((a.listPatientsWithoutPredecessors).length>0)){
          return ((b.listPatientsWithoutPredecessors).length - (a.listPatientsWithoutPredecessors).length);
        }
        else{
          if(((b.listPatientsSim).length>0)&&((a.listPatientsSim).length>0)){
            return ((b.listPatientsSimWithoutPredecessors).length - (a.listPatientsSimWithoutPredecessors).length);
          }
          // Si se compara entre real y simulado
          else{

          }
        }
      });
    }
    // Caso 2: solo reales: lista ordenada y lo añado en ese orden al resultado
    else if(realSymtoms>0 && simSymtoms==0){
      listSymtomsFreqForGraphDataCopy.sort(function(a, b) {
        return ((b.listPatientsWithoutPredecessors).length - (a.listPatientsWithoutPredecessors).length);
      });
    }
    // Caso 3: somo sim: lista ordenada y lo añado en ese orden al resultado
    else if(realSymtoms==0 && simSymtoms>0){
      listSymtomsFreqForGraphDataCopy.sort(function(a, b) {
        return ((b.listPatientsSimWithoutPredecessors).length - (a.listPatientsSimWithoutPredecessors).length);
      });
    }
    for(var i=0;i<listSymtomsFreqForGraphDataCopy.length;i++){
      resultList.push(listSymtomsFreqForGraphDataCopy[i]);
    }
    //resultList=resultList+listSymtomsFreqForGraphDataCopy
    return resultList;
  }
  orderChartFreqData(){
    // Para cada sintoma de la lista  cojo su frecuencia y busco si en el resto de sintomas de esa misma lista hay alguno con freq=a esa
    // y es del paciente lo coloco primero
    var chartDataReorder=[];
    for(var i=0;i<this.chartDataSymptomsFreq.length;i++){
      // Si todavia no se ha añadido a la lista reordenada
      if(chartDataReorder.includes(this.chartDataSymptomsFreq[i])==false){
        var freq=this.chartDataSymptomsFreq[i][1];
        // Si es del paciente incluyo este primero
        for(var j=0;j<this.chartDataSymptomsFreq.length;j++){
          if(i!=j){
            if(this.chartDataSymptomsFreq[j][1]==freq){
              for(var k=0;k<this.listSymtomsFreqForGraph[0].data.length;k++){
                if(this.chartDataSymptomsFreq[j][0]==this.listSymtomsFreqForGraph[0].data[k].symptom.nameForShow){
                  var symptomId= this.listSymtomsFreqForGraph[0].data[k].symptom.id;
                  for(var m=0;m<this.phenotype.data.length;m++){
                    if(this.phenotype.data[m].id==symptomId){
                      chartDataReorder.push(this.chartDataSymptomsFreq[j])
                    }
                  }
                }
              }
            }
          }
        }
        chartDataReorder.push(this.chartDataSymptomsFreq[i])
      }
    }
    this.chartDataSymptomsFreq=[];
    this.chartDataSymptomsFreq=chartDataReorder;
    this.chartDataSymptomsFreq= this.chartDataSymptomsFreq.filter((valor, indiceActual, arreglo) => arreglo.indexOf(valor) === indiceActual);
  }

  showFilterSymptomsToGraph(contentFilterSymptomsFreqGraph){
    let ngbModalOptions: NgbModalOptions = {
          windowClass: 'ModalClass-xl'
    };
    this.modalReference = this.modalService.open(contentFilterSymptomsFreqGraph, ngbModalOptions);
  }
  changeSelectedSymptomForGraph(index){
    //console.log(index)
    this.listSymtomsFreqForGraphFiltered[0].data[index].symptom.checked=!this.listSymtomsFreqForGraphFiltered[0].data[index].symptom.checked;
    console.log(this.listSymtomsFreqForGraph[0].data[index].symptom)
    this.listSymtomsFreqForGraphFilteredLastAdded.push(this.listSymtomsFreqForGraphFiltered[0].data[index].symptom.id)
  }
  recalculateSymptomsFreqToShow(){
    this.loadingGraphSymptomFreq=true;
    this.listSymtomsFreqForGraph=this.listSymtomsFreqForGraphFiltered;
    //console.log("recalculate")
    //this.loadSymptomsOfDiseaseForGraph();
    // Comprobar si hay filtrado o se estan teniendo en cuenta todos los sintomas
    this.filterApply=false;
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      if(this.listSymtomsFreqForGraph[0].data[i].symptom.checked==false){
        this.filterApply=true;
      }
    }
    if(this.queryApply==true){
      this.calculeCharSymptomsFreqListForWindowSizeQueried(this.listSymtomsFreqForGraphQuery);
    }
    else{
      this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
    }
    // Dibujo el gráfico
    this.drawCharts();

    this.listSymtomsFreqForGraphFilteredLastAdded=[];
    this.loadingGraphSymptomFreq=false;
    this.modalReference.close();
  }
  cancelSymptomsFreqToShow(){
    this.loadingGraphSymptomFreq=true;

    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      for(var j=0;j<this.listSymtomsFreqForGraphFilteredLastAdded.length;j++){
        if(this.listSymtomsFreqForGraph[0].data[i].symptom.id==this.listSymtomsFreqForGraphFilteredLastAdded[j]){
          this.listSymtomsFreqForGraph[0].data[i].symptom.checked=!this.listSymtomsFreqForGraphFiltered[0].data[i].symptom.checked;
        }
      }
    }
    this.listSymtomsFreqForGraphFilteredLastAdded=[];
    this.filterApply=false;
    this.loadingGraphSymptomFreq=false;
    this.modalReference.close();

  }
  deleteAllFilters(){
    this.loadingGraphSymptomFreq=true;
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      this.listSymtomsFreqForGraph[0].data[i].symptom.checked=true;
    }
    this.listSymtomsFreqForGraphFiltered=this.listSymtomsFreqForGraph
    if(this.queryApply==true){
      this.calculeCharSymptomsFreqListForWindowSizeQueried(this.listSymtomsFreqForGraphQuery);
    }
    else{
      this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
    }

    this.drawCharts();
    this.listSymtomsFreqForGraphFilteredLastAdded=[];
    this.filterApply=false;
    this.loadingGraphSymptomFreq=false;
  }

  showQuerySymptomsToGraph(contentQuerySymptomsFreqGraph){
    let ngbModalOptions: NgbModalOptions = {
          windowClass: 'ModalClass-xl'
    };
    this.modalReference = this.modalService.open(contentQuerySymptomsFreqGraph, ngbModalOptions);
  }
  changeSelectedSymptomForQueryGraph(symptomID){
    //this.listSymtomsFreqForGraphQuery.push(symptomID)
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      if(this.listSymtomsFreqForGraph[0].data[i].symptom.id==symptomID){
        this.listSymtomsFreqForGraph[0].data[i].symptom.checkToQuery=!this.listSymtomsFreqForGraph[0].data[i].symptom.checkToQuery
        if(this.listSymtomsFreqForGraph[0].data[i].symptom.checkToQuery==true){
          this.listSymtomsFreqForGraphQuery.push(symptomID)
          this.listSymtomsFreqForGraphQueryLastAdded.push({toAdd:true,symptomId:symptomID})
        }
        else{
          console.log(this.listSymtomsFreqForGraphQuery)
          console.log(this.listSymtomsFreqForGraphQuery.length)
          if(this.listSymtomsFreqForGraphQuery.length==1){
            this.listSymtomsFreqForGraphQuery=[];
            this.listSymtomsFreqForGraphQueryLastAdded.push({toAdd:false,symptomId:symptomID})
          }
          else{
            console.log("splice")
            for(var j=0;j<this.listSymtomsFreqForGraphQuery.length;j++){
              if(this.listSymtomsFreqForGraphQuery[j]==symptomID){
                this.listSymtomsFreqForGraphQuery.splice(j,1)
                this.listSymtomsFreqForGraphQueryLastAdded.push(symptomID)
                this.listSymtomsFreqForGraphQueryLastAdded.push({toAdd:false,symptomId:symptomID})
              }
            }
          }
        }
      }
    }
    console.log(this.listSymtomsFreqForGraphQuery)
  }
  recalculateSymptomsFreqQueriedToShow(){
    console.log(this.listSymtomsFreqForGraph[0])
    // quitamos todos los que estuviesen a queried antes del calculo (para nuevos añadidos)
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      for(var j=0;j<this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length;j++){
        this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors[j].queried=false;
      }
    }
    this.queryApply=false
    // Si se han seleccionado sintomas
    console.log(this.listSymtomsFreqForGraphQuery.length)
    if(this.listSymtomsFreqForGraphQuery.length>0){
      this.queryApply=true;
      this.calculeCharSymptomsFreqListForWindowSizeQueried(this.listSymtomsFreqForGraphQuery)

      this.drawCharts();
    }
    // Si no se selecciona ninguno se vuelve al estado anterior
    else{
      //this.loadSymptomsOfDiseaseForGraph();
      this.queryApply=false;
      this.listSymtomsFreqForGraph=this.listSymtomsFreqForGraphOriginalCopy
      this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq')
      // Se van a representar los sintomas elegidos en la lista anterior y el numero de pacientes sera para cada uno de esos sintomas el numero de pacientes con queried=true

      this.drawCharts();
    }
    this.listSymtomsFreqForGraphQueryLastAdded=[];
    this.modalReference.close();
  }
  cancelSymptomsFreqQueriedToShow(){
    // Cambio el checkToQuery (lo reseteo a como estaba)
    //{toAdd:false,symptomId:symptomID}
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      for(var j=0;j<this.listSymtomsFreqForGraphQueryLastAdded.length;j++){
        if(this.listSymtomsFreqForGraph[0].data[i].symptom.id==this.listSymtomsFreqForGraphQueryLastAdded[j].symptomId){
          console.log(this.listSymtomsFreqForGraph[0].data[i].symptom.checkToQuery)
          this.listSymtomsFreqForGraph[0].data[i].symptom.checkToQuery=!this.listSymtomsFreqForGraph[0].data[i].symptom.checkToQuery;
          // Si se iba a añadir: lo elimino de la lista listSymtomsFreqForGraphQuery
          if(this.listSymtomsFreqForGraphQueryLastAdded[j].toAdd==true){
            // lo localizo en la lista listSymtomsFreqForGraphQuery
            for(var k=0;k<this.listSymtomsFreqForGraphQuery.length;k++){
              // Y lo añado
              if(this.listSymtomsFreqForGraphQuery[k]==this.listSymtomsFreqForGraphQueryLastAdded[j].symptomId){
                this.listSymtomsFreqForGraphQuery.splice(k,1)
              }
            }
          }
          // Si se iba a borrar, lo añado a la lista de listSymtomsFreqForGraphQuery
          else{
            this.listSymtomsFreqForGraphQuery.push(this.listSymtomsFreqForGraphQueryLastAdded[j].symptomId)
          }
        }
      }
    }
    this.listSymtomsFreqForGraphQueryLastAdded=[];
    this.modalReference.close();
  }
  deleteAllQueries(){
    this.loadingGraphSymptomFreq=true;
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      this.listSymtomsFreqForGraph[0].data[i].symptom.checkToQuery=false;
      for(var j=0;j<this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors.length;j++){
        this.listSymtomsFreqForGraph[0].data[i].listPatientsWithoutPredecessors[j].queried=false;
      }
    }
    // Impongo que todo sintoma pertenece a la comunidad belongstoCommunity=true
    for(var i=0;i<this.listSymtomsFreqForGraph[0].data.length;i++){
      this.listSymtomsFreqForGraph[0].data[i].symptom.belongstoCommunity=true;
    }
    this.listSymtomsFreqForGraphQuery=[];
    this.listSymtomsFreqForGraphQueryLastAdded=[];
    this.calculeCharSymptomsFreqListForWindowSize('chartSymptomsFreq');
    this.drawCharts();

    this.listSymtomsFreqForGraphFilteredLastAdded=[];
    this.loadingGraphSymptomFreq=false;
    this.queryApply=false;
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

  showSampleHistogram(sampleHistogram){
    let ngbModalOptions: NgbModalOptions = {
          windowClass: 'ModalClass-xl'
    };
    this.modalReference = this.modalService.open(sampleHistogram, ngbModalOptions);
    /*var chartSymptomsFreqModal= document.createElement("div")
    chartSymptomsFreqModal.setAttribute("id", "chartSymptomsFreqModal");
    chartSymptomsFreqModal.setAttribute("class", "d3-chart");
    var graphSymptomsFreqModal=document.createElement("svg")
    graphSymptomsFreqModal.setAttribute("id","graphSymptomsFreqModal")
    //var chartSymptomsFreqModal=document.getElementById('chartSymptomsFreqModal')
    //chartSymptomsFreqModal.insertAdjacentHTML('beforeend', '<svg id="graphSymptomsFreqModal"></svg>');
    chartSymptomsFreqModal.appendChild(graphSymptomsFreqModal)
    $(".modal-body").append(chartSymptomsFreqModal)
      this.createChartFrequency(graphSymptomsFreqModal,chartSymptomsFreqModal);

      if (this.chartDataSymptomsFreq) {
        this.updateChartFrequency(this.chartSymptomsFreq2);
      }*/

  }

  setShareWithCommunity(state){
    if(this.numberOfSymptoms==0){
      Swal.fire({
        title: this.translate.instant("generics.Warning"),
        html: '<p>'+this.translate.instant("patdiagdashboard.swalMsgNoSymptoms")+'</p>',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#0CC27E',
        confirmButtonText: this.translate.instant("patdiagdashboard.swalbuttonNoSymptoms"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
        }
      });
    }
    else{
      this.symptomsPermissions.shareWithCommunity = state;
      this.subscription.add( this.http.put(environment.api+'/api/symptoms/changesharewithcommunity/'+this.phenotype._id, this.symptomsPermissions)
      .subscribe( (res : any) => {
        //console.log(res);
        //this.loadingGraphSymptomFreq=true;
        // Elimino todo lo que hubiese (limpio la pantalla)
        d3.selectAll("svg").remove();
        d3.selectAll(".venntooltip").remove();
        d3.selectAll(".text").remove();

        var venn=document.getElementById('chartVenn')
        venn.insertAdjacentHTML('beforeend', '<svg id ="venn" viewBox="0 0 580 340" [style.margin-left.px]= "-(((venn.offsetWidth)/2)+(margin.left/2))"></svg>');

        var graph=document.getElementById('chartBars')
        graph.insertAdjacentHTML('beforeend', '<svg id="graphBars"></svg>');

        var graphSymptomsFreq=document.getElementById('chartSymptomsFreq')
        graphSymptomsFreq.insertAdjacentHTML('beforeend', '<svg class="center-elements" id="graphSymptomsFreq"></svg>');

        var vennReal=document.getElementById('chartVennReal')
        vennReal.insertAdjacentHTML('beforeend', '<svg id ="vennReal" viewBox="0 0 580 340" [style.margin-left.px]= "-(((venn.offsetWidth)/2)+(margin.left/2))"></svg>');
        var graphReal=document.getElementById('chartBarsReal')
        graphReal.insertAdjacentHTML('beforeend', '<svg id="graphBarsReal"></svg>');

        this.loadSymptomsOfDiseaseForGraph();

      }, (err) => {
        console.log(err.error);
      }));
    }

  }
}
