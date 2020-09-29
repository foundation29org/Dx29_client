import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { PatientService } from 'app/shared/services/patient.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
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
import { Data} from 'app/shared/services/data.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { HighlightSearch} from 'app/shared/services/search-filter-highlight.service';
import { Subscription } from 'rxjs/Subscription';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgxHotjarService } from 'ngx-hotjar';
import * as faker from 'faker';
declare var JSZipUtils: any;
declare var Docxgen: any;
declare var pdfjsLib: any;

@Component({
    selector: 'app-nodiagnosis',
    templateUrl: './nodiagnosis.component.html',
    styleUrls: ['./nodiagnosis.component.scss'],
    providers: [PatientService,Apif29BioService, ApiDx29ServerService, Apif29NcrService]
})

export class NodiagnosisComponent implements OnInit, OnDestroy{
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
  actualStep: string = "0.0";
  maxStep: string = "0.0";
  loadedStep: boolean = false;
  showPanelSymptomsPatient: boolean = false;
  showButtonWorkspace: boolean = false;
  patients: any;
  listOfSharingAccounts: any = [];
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
  searchDiseaseField: string = '';
  actualCondition: string = '';
  actualConditionId: string = '';
  //geneticTests = new FormControl();


  phenotype: any = {};
  phenotypeCopy: any = {};
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

  symptoms :any = [];
  infoNcrToSave: any = {};
  accessToken: IBlobAccessToken = {
     // tslint:disable-next-line:max-line-length
     sasToken: environment.blobAccessToken.sasToken,
     blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
     containerName: '',
     patientId: ''
  };

  fileUploadInfo: any;
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
  loadingSymptomsOfDisease: boolean = false;
  posicionTrozo: number = 0;
  cantidadTrozos: number = 0;
  selectedHpoIndex: number = -1;
  selectedSymptomIndex: number = -1;
  ncrResultView: boolean = false;


  userName: string = '';
  selectedInfoSymptomIndex: number = -1;
  stateOfSuggestions:any = {discarded: [], added: [], unmarkedSymptoms: []};;
  geneticTests: any = [];
  age: number = null;
  substepExtract: string = "0";
  listOfphenotypesinfo: any = [];
  listOfphenotypesinfoOld: any = [];
  listOfFilteredSymptoms: any = [];

  programs: any= [];
  actualProgram: any= [];
  dateGeneticProgram1:Date;
  lang:string = '';
  numDeprecated: number = -1;
  private subscription: Subscription = new Subscription();
  private subscriptionLoadSymptoms: Subscription = new Subscription();

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private route: ActivatedRoute, private router: Router,  private patientService: PatientService, public searchFilterPipe: SearchFilterPipe, public toastr: ToastrService, private authGuard: AuthGuard, private sortService: SortService, private searchService: SearchService, private modalService: NgbModal,
    private highlightSearch: HighlightSearch, private blob: BlobStorageService, private dateService: DateService, private data: Data, private _formBuilder: FormBuilder, protected $hotjar: NgxHotjarService, private apif29BioService:Apif29BioService, private apiDx29ServerService: ApiDx29ServerService, private apif29NcrService:Apif29NcrService){
    this.lang = this.authService.getLang();
    this.subscription.add( this.http.get('assets/jsons/phenotypes_'+this.lang+'.json')
     .subscribe( (res : any) => {
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

    //load files to upload docs
    $.getScript("./assets/js/docs/jszip-utils.js").done(function(script, textStatus) {
      //console.log("finished loading and running jszip-utils.js. with a status of" + textStatus);
    });

    $.getScript("./assets/js/docs/docxtemplater.v2.1.5.js").done(function(script, textStatus) {
      //console.log("finished loading and running docxtemplater.js. with a status of" + textStatus);
    });

    this.loadTranslations();
    this.initVariables();
    this.loadListOfDiseases();
  }

  goBack(){
  }

  goForward(){
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
    this.initVarsPrograms();

    this.subscription.add(this.route
      .queryParams
      .subscribe(params => {
        // Defaults to 0 if no query param provided.
        if(params['actualStep']!=undefined){
          this.actualStep = params['actualStep'];
          //this.actualStep = +params['actualStep'] || this.getActualStep();
          console.log(this.actualStep);
        }

      }));
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required]
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required]
    });

    this.subscription.add( this.blob.change.subscribe(uploaded => {
       this.uploadingGenotype = false;
       if(this.modalReference!=undefined){
         this.modalReference.close();
       }
     }));

    //si tiene VCF
    this.subscription.add( this.blob.changeFilesExomizerBlobVcf.subscribe(vcfFilesOnBlob => {
       if(vcfFilesOnBlob.length>0){
         var mindate = 0;
         for (var i = 0; i < vcfFilesOnBlob.length; i++) {
           if((vcfFilesOnBlob[i].name).indexOf('.vcf')!=-1){
             var d = new Date(vcfFilesOnBlob[i].lastModified);
             if(mindate<d.getTime()){
               this.filename = vcfFilesOnBlob[i].name;
               mindate = d.getTime();
             }
           }
         }
         var filesVcf = [];
         var otherGeneFiles = [];
         for(var i = 0; i < vcfFilesOnBlob.length; i++) {
           if(vcfFilesOnBlob[i].name.indexOf('genofilepatient-')!=-1){
             var name = vcfFilesOnBlob[i].name.substr(vcfFilesOnBlob[i].name.indexOf('-')+1)
             vcfFilesOnBlob[i].simplename = name;
             otherGeneFiles.push(vcfFilesOnBlob[i])
           }else{
             filesVcf.push(vcfFilesOnBlob[i])
           }
         }
        for(var i=0;i<filesVcf.length;i++){
          filesVcf[i].nameForShow=""
        }
        for(var i=0;i<filesVcf.length;i++){
          if(filesVcf[i].name.indexOf('/')){
            var sectionsVcfBlob = filesVcf[i].name.split('/');
            filesVcf[i].nameForShow=sectionsVcfBlob[sectionsVcfBlob.length-1]
          }
          else{
            filesVcf[i].nameForShow=filesVcf[i].name;
          }
        }

         this.otherGeneFiles = otherGeneFiles;
         this.filesVcf = filesVcf;
         //this.filename = vcfFilesOnBlob[0].name;
         this.hasVcf = true;
         /*this.setActualStep("0.0");
         this.goToStep("0.0");
         this.actualStep = "0.0";
         this.maxStep = "0.0";*/
       }else{
         console.log('no tiene!');
       }
       this.loadedGeno = true;
     }));
  }

  getActualStep(patientId:string){
    this.subscription.add( this.http.get(environment.api+'/api/patients/actualstep/'+patientId)
        .subscribe( (res : any) => {
          this.actualStep = res;
          //this.maxStep = res;
          this.loadedStep = true;
          //si ya había comenzado el wizard y no lo ha terminado, preguntar si quiere continuar donde lo dejó o empezar de nuevo
          if(this.actualStep>"0.0" && this.actualStep<"5.0"){
            Swal.fire({
                title: this.translate.instant("patnodiagdashboard.swalContinue.msgtitle1")+' '+this.userName,
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
                this.goToStep(this.actualStep);
              }else{
                this.goToStep('0.0');
              }
            });
          }else if(this.actualStep=="0.0"){
            this.goToStep('0.0');
          }else if(this.actualStep>="5.0"){
            this.goToStep(this.actualStep);
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
      this.subscription.add( this.http.put(environment.api+'/api/patients/actualstep/'+this.selectedPatient.sub, object)
          .subscribe( (res : any) => {
           }, (err) => {
             console.log(err);
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));
    }

  }

  goToStep(indexStep){
    this.selectedInfoSymptomIndex = -1;
    this.actualStep = indexStep;
    if(this.actualStep == '2.7'){
      this.stateOfSuggestions = {discarded: [], added: [], unmarkedSymptoms: []};
      this.loadDataPanelSuggestions();
    }else if(this.actualStep == '5.0'){
      this.checkPrograms();
    }
    window.scrollTo(0, 0)
    this.setActualStep(indexStep);
  }

  loadEnvironment(){
    this.getInfoPatient();
    this.getDiagnosisInfo();
    this.loadSymptoms();
  }

  loadTranslations(){
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk=res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail=res;
    });

    this.geneticTests = [
      {name: 'Karyotypes', checked: false, translation: this.translate.instant("dashboardpatient.Karyotypes"), scope: this.translate.instant("geneticTests.KaryotypesScope"), applications: this.translate.instant("geneticTests.KaryotypesApplications"), limitations: this.translate.instant("geneticTests.KaryotypesLimitations")},
      {name: 'FISH', checked: false, translation: this.translate.instant("dashboardpatient.FISH"), scope: this.translate.instant("geneticTests.FISHScope"), applications: this.translate.instant("geneticTests.FISHApplications"), limitations: this.translate.instant("geneticTests.FISHLimitations")},
      {name: 'Chromosomal Microarray', checked: false, translation: this.translate.instant("dashboardpatient.Chromosomal Microarray"), scope: this.translate.instant("geneticTests.ChromosomalScope"), applications: this.translate.instant("geneticTests.ChromosomalApplications"), limitations: this.translate.instant("geneticTests.ChromosomalLimitations")},
      {name: 'Targeted Variant Analysis', checked: false, translation: this.translate.instant("dashboardpatient.Targeted Variant Analysis (also known as direct variant analysis)"), scope: this.translate.instant("geneticTests.TargetedScope"), applications: this.translate.instant("geneticTests.TargetedApplications"), limitations: this.translate.instant("geneticTests.TargetedLimitations")},
      {name: 'Single Gene Tests', translation: this.translate.instant("dashboardpatient.Single Gene Tests"), scope: this.translate.instant("geneticTests.SingleScope"), applications: this.translate.instant("geneticTests.SingleApplications"), limitations: this.translate.instant("geneticTests.SingleLimitations")},
      {name: 'Multiple Gene Sequencing Panels', checked: false, translation: this.translate.instant("dashboardpatient.Multiple Gene Sequencing Panels"), scope: this.translate.instant("geneticTests.MultipleScope"), applications: this.translate.instant("geneticTests.MultipleApplications"), limitations: this.translate.instant("geneticTests.MultipleLimitations")},
      {name: 'WES', checked: false, translation: this.translate.instant("dashboardpatient.Whole Exome Sequencing (WES)"), scope: this.translate.instant("geneticTests.WESScope"), applications: this.translate.instant("geneticTests.WESApplications"), limitations: this.translate.instant("geneticTests.WESLimitations")},
      {name: 'WGS', translation: this.translate.instant("dashboardpatient.Whole Genome Sequencing (WGS)"), scope: this.translate.instant("geneticTests.WGSScope"), applications: this.translate.instant("geneticTests.WGSApplications"), limitations: this.translate.instant("geneticTests.WGSLimitations")},
      {name: 'I do not know', checked: false, translation: this.translate.instant("dashboardpatient.I do not know"), scope: '', applications: '', limitations: ''}
    ]
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
    this.getUserName();
    if(this.authService.getCurrentPatient()==null){
      this.loadPatientId();
    }else{
      this.loadedPatientId = true;
      this.selectedPatient = this.authService.getCurrentPatient();
      this.$hotjar.tagRecording(['withdiagnosis', this.authService.getIdUser(), this.authService.getCurrentPatient().sub]);

      this.loadEnvironment();
    }
  }

  getUserName(){
    this.subscription.add( this.http.get(environment.api+'/api/users/name/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        this.userName = res.userName;
      }, (err) => {
        console.log(err);
      }));

  }

  loadPatientId(){
    this.loadedPatientId = false;
    this.subscription.add( this.patientService.getPatientId()
    .subscribe( (res : any) => {
      this.loadedPatientId = true;
      this.authService.setCurrentPatient(res);
      this.selectedPatient = res;
      this.$hotjar.tagRecording(['nodiagnosis', this.authService.getIdUser(), this.authService.getCurrentPatient().sub]);
      this.loadEnvironment();
     }, (err) => {
       console.log(err);
     }));
  }

  getInfoPatient(){
    this.loadedInfoPatient = false;
    this.subscription.add( this.http.get(environment.api+'/api/patients/'+this.authService.getCurrentPatient().sub)
        .subscribe( (res : any) => {
          this.getActualStep(this.selectedPatient.sub);
          this.basicInfoPatient = res.patient;
          this.basicInfoPatient.birthDate=this.dateService.transformDate(res.patient.birthDate);
          this.basicInfoPatientCopy = JSON.parse(JSON.stringify(res.patient));
          this.loadedInfoPatient = true;
          if(this.basicInfoPatient.birthDate!=null && this.basicInfoPatient.birthDate!=''){
            this.ageFromDateOfBirthday(res.patient.birthDate);
            //this.actualStep = "2.0";
          }else if(this.basicInfoPatient.birthDate==null || this.basicInfoPatient.birthDate==''){
            //this.actualStep = "1.0";
          }
         }, (err) => {
           console.log(err);
           this.loadedInfoPatient = true;
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));
  }

  ageFromDateOfBirthday(dateOfBirth: any){
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
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

  getDiagnosisInfo(){
    this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
    this.accessToken.patientId = this.authService.getCurrentPatient().sub;
    this.getAzureBlobSasToken();

    this.loadedGeno = false;

    this.loadedDiagnosisInfo = false;
    var para = this.authService.getCurrentPatient();
    //cargar el fenotipo del usuario
    this.subscription.add( this.http.get(environment.api+'/api/diagnosis/'+para.sub)
    .subscribe( (res : any) => {
      this.loadedDiagnosisInfo = true;
      if(res.message){
        this.diagnosisInfo = {
          hasDiagnosis: undefined,
          previousDiagnosis: '',
          geneticTests: [],
          geneticallyTested: '',
          haveGeneticData: '',
          identifiedGene: '',
          evaluation: '',
          selectedItemsFilter: [],
          notes: '',
          infoGenesAndConditionsExomizer: [],
          infoGenesAndConditionsPhenolyzer: [],
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
            "VariantEffectFilters": {"remove": ["UPSTREAM_GENE_VARIANT", "INTERGENIC_VARIANT", "REGULATORY_REGION_VARIANT", "CODING_TRANSCRIPT_INTRON_VARIANT", "NON_CODING_TRANSCRIPT_INTRON_VARIANT", "SYNONYMOUS_VARIANT", "DOWNSTREAM_GENE_VARIANT", "SPLICE_REGION_VARIANT"]},
            "genomeAssembly": 'hg19'
          },
          _id: null
        };

      }else{
        this.diagnosisInfo = res.diagnosis
        if(this.diagnosisInfo.previousDiagnosis != ''){
          var actualConditionObject = this.searchFilterPipe.transform(this.listOfDiseases, 'id', this.diagnosisInfo.previousDiagnosis);
          this.actualCondition = actualConditionObject[0].name;
          this.actualConditionId = actualConditionObject[0].id;
        }
        if(this.diagnosisInfo.hasDiagnosis==undefined){
          //this.actualStep = "2.0";
        }else if(this.diagnosisInfo.hasDiagnosis == 'Yes' || this.diagnosisInfo.hasDiagnosis == 'No'){
          if(this.diagnosisInfo.previousDiagnosis!= '' || this.diagnosisInfo.hasDiagnosis == 'No'){
            this.showPanelSymptomsPatient = true;
            //this.actualStep = "2.0";
          }

        }

        this.setvaluestToGeneticTestsCards(this.diagnosisInfo.geneticTests);

      }

     }, (err) => {
       console.log(err);
     }));
  }

  loadSymptoms(){
    this.loadedSymptoms = false;
    this.numDeprecated = 0;
    var para= this.authService.getCurrentPatient();
    //cargar el fenotipo del usuario
    this.subscription.add( this.apiDx29ServerService.getSymptoms(para.sub)
    .subscribe( (res : any) => {
      if(res.message){
        //no tiene fenotipo
        this.numberOfSymptoms = 0;
        if(this.diagnosisInfo.hasDiagnosis && this.diagnosisInfo.previousDiagnosis!= ''){
          this.expanded = false;
        }
        this.loadedSymptoms = true;
      }else{

        if(res.phenotype.data.length>0){
          //this.actualStep = "3.0";
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
        }else{
          //no tiene fenotipo
          this.loadedSymptoms = true;
          this.phenotype = res.phenotype;
          this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));
          this.numberOfSymptoms = 0;

          if(this.diagnosisInfo.hasDiagnosis && this.diagnosisInfo.previousDiagnosis!= ''){
            this.expanded = false;
          }
        }
      }
      this.loadedSymptoms = true;
     }, (err) => {
       console.log(err);
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
      console.log(res2);

      var tamano= Object.keys(res2).length;
      console.log(tamano)
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

  onKey(event){
    if( this.modelTemp.trim().length > 3){
      var tempModelTimp = this.modelTemp.trim();
      this.listOfFilteredSymptoms = this.searchFilterPipe.transformDiseases(this.listOfphenotypesinfo, 'name', tempModelTimp);
    }else{
      this.listOfFilteredSymptoms = [];
    }
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
     this.goToStep('2.0');
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
       this.goToStep('2.0');
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
                this.temporalSymptoms[j].name = res2[i][0].layperson;
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

   selected2(index) {
     this.selectedItems.push(this.listOfFilteredSymptoms[index]);
     console.log(this.selectedItems)
     this.listOfFilteredSymptoms = [];
     this.modelTemp = '';
   }

   deleteItem(item) {
     this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
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
       if(this.stateOfSuggestions.added.length>0){
         var enc= false;
         for (var i = 0; i <  this.stateOfSuggestions.added.length; i++) {
           for (var j = 0; j <  this.phenotype.data.length && !enc; j++) {
             if(this.stateOfSuggestions.added[i].id == this.phenotype.data[j].id){
               enc = true;
             }
           }
           if(!enc){
             this.phenotype.data.push({id:this.stateOfSuggestions.added[i].id, name: this.stateOfSuggestions.added[i].name, inputType: 'suggestions', importance: '1', polarity: '0', severity: '', onset: ''});
           }
         }
       }

       if(this.stateOfSuggestions.discarded.length>0){
         for (var i = 0; i <  this.stateOfSuggestions.discarded.length; i++) {
           var enc= false;
           for (var j = 0; j <  this.phenotype.data.length && !enc; j++) {
             if(this.stateOfSuggestions.discarded[i].id == this.phenotype.data[j].id){
               enc = true;
             }
           }
           if(!enc){
             var foundElement = this.searchService.search(this.phenotype.discarded,'id', this.stateOfSuggestions.discarded[i].id);
             if(!foundElement){
               this.phenotype.discarded.push({id:this.stateOfSuggestions.discarded[i].id});
             }

           }

         }
       }
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
         }, (err) => {
           console.log(err);
         }));
       }
     });

   }

   showContentUnmarkedSymptoms(contentUnmarkedSymptoms){
     let ngbModalOptions: NgbModalOptions = {
           windowClass: 'ModalClass-xl'
     };
     this.modalReference = this.modalService.open(contentUnmarkedSymptoms, ngbModalOptions);
   }

   setStateExpanded(value){
     this.expanded = value;
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

  onFileChangeVCF(event, contentPreparingFile)  {
    let ngbModalOptions: NgbModalOptions = {
          backdrop : 'static',
          keyboard : false,
          windowClass: 'ModalClass-xl'
    };
    this.modalReference = this.modalService.open(contentPreparingFile, ngbModalOptions);
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
        if(extension =='.vcf' || extension =='.vcf.gz'){
          //Swal.fire('The VCF file must have .vcf extension.', '', "error");
          filename = filename + extension;
        }else{
          filename = 'genofilepatient-'+filename + extension;
        }
        this.filename = '';
        this.diagnosisInfo.hasVcf = this.hasVcf;
        this.saveNotes();
        //this.filename = event.target.files[0].name;
        this.uploadingGenotype = true;
        this.uploadProgress = this.blob
          .uploadToBlobStorage(this.accessToken, event.target.files[0], filename, 'patientGenoFiles');


      }
      reader.readAsArrayBuffer(event.target.files[0]);

    }
  }

  deleteVcfFile(file,i){

    if(file==this.filename){
      if(this.filesVcf.length>1){
        var enc =false;
        for(var j = 0; j < this.filesVcf.length && !enc; j++) {
          if(this.filesVcf[j].name!=this.filename){
            this.filename = this.filesVcf[j].name;
            enc = true;
          }
        }
      }else{
        this.filename = '';
      }
    }
    this.filesVcf.splice(i, 1);
    this.blob.deleteBlob(this.accessToken.containerName , file);
  }

  deleteOtherFile(file,i){

    if(file==this.filename){
      if(this.otherGeneFiles.length>1){
        var enc =false;
        for(var j = 0; j < this.otherGeneFiles.length && !enc; j++) {
          if(this.otherGeneFiles[j].name!=this.filename){
            this.filename = this.otherGeneFiles[j].name;
            enc = true;
          }
        }
      }else{
        this.filename = '';
      }
    }
    this.otherGeneFiles.splice(i, 1);
    this.blob.deleteBlob(this.accessToken.containerName , file);
  }

  updatePatient(){
    this.subscription.add( this.http.put(environment.api+'/api/patients/'+this.authService.getCurrentPatient().sub, this.basicInfoPatient)
        .subscribe( (res : any) => {
          this.checkPrograms();
         }, (err) => {
           console.log(err);
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail);
           }
         }));
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
      this.relatedConditions = res["diseases"];
      //load symptoms of all deseases
      if(this.relatedConditions.length==0){
        this.toastr.error('', this.translate.instant("patnodiagdashboard.step2-7.msg6"));
        this.goToStep('2.8')
      }else{
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
                  var isUnmarkedOrDiscardedSymptom = this.checkIsUnmarkedorDiscardedAddedSymptom(indexSymptom);
                  if(!isUnmarkedOrDiscardedSymptom){
                    this.relatedConditions[i].symptoms.push({id:indexSymptom, name: listOfSymptoms[indexSymptom].name, def: def, comment: comment, synonyms: listOfSymptoms[indexSymptom].synonyms});
                  }else{
                    console.log('discarted or unmarked');
                  }
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
                        var isUnmarkedOrDiscardedSymptom = this.checkIsUnmarkedorDiscardedAddedSymptom(this.relatedConditions[i].matches[k].reference.id);
                        if(!isUnmarkedOrDiscardedSymptom){
                          this.relatedConditions[i].symptoms.push({id:this.relatedConditions[i].matches[k].reference.id, name: this.relatedConditions[i].matches[k].reference.label});
                        }else{
                          console.log('discarted or unmarked');
                        }

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
      }
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
    for (var k = 0; k < this.listOfSymptomsTemp.length; k++) {
      if(this.listOfSymptomsTemp[k].checked){
        var foundElement = this.searchService.search(this.phenotype.data,'id', this.listOfSymptomsTemp[k].id);
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

  nextDisease(){
    this.checkUnmarkedAndDiscardedSymptoms();
    this.posactual++;
    document.getElementById('initpos').scrollIntoView(true);
    this.getSymptomsStep();
  }

  previousDisease(){
    //this.checkUnmarkedAndDiscardedSymptoms();
    if(this.posactual>0){
      this.posactual--;
    }
    document.getElementById('initpos').scrollIntoView(true);
    this.getSymptomsStep();

  }

  checkUnmarkedAndDiscardedSymptoms(){
    for (var i = 0; i <  this.listOfSymptoms.length; i++) {
      if(this.listOfSymptoms.checked==undefined){
        var enc = false;
        for (var j = 0; j <  this.stateOfSuggestions.unmarkedSymptoms.length && !enc; j++) {
          if(this.listOfSymptoms[i].id == this.stateOfSuggestions.unmarkedSymptoms[j].id){
            enc = true;
          }
        }
        if(!enc){
          this.stateOfSuggestions.unmarkedSymptoms.push(this.listOfSymptoms[i]);
        }
      }
    }
  }

  checkIsUnmarkedorDiscardedAddedSymptom(id): boolean {
    var result = false;
    var enc1 = false;
    var enc2 = false;
    for (var i = 0; i <  this.stateOfSuggestions.unmarkedSymptoms.length && !enc1; i++) {
      if(this.stateOfSuggestions.unmarkedSymptoms[i]!=undefined){
        if(id == this.stateOfSuggestions.unmarkedSymptoms[i].id){
          result = true;
        }
      }
    }
    for (var j = 0; j <  this.stateOfSuggestions.discarded.length && !enc2; j++) {
      if(this.stateOfSuggestions.discarded[i]!=undefined){
        if(id == this.stateOfSuggestions.discarded[j].id){
          result = true;
        }
      }
    }
    for (var j = 0; j <  this.stateOfSuggestions.added.length && !enc2; j++) {
      if(this.stateOfSuggestions.added[i]!=undefined){
        if(id == this.stateOfSuggestions.added[j].id){
          result = true;
        }
      }
    }
    return result;
  }

  changeStateSuggestionsSymptom(index, op){
    var idsymptom;
    if(op=="discard"){
      idsymptom = this.stateOfSuggestions.added[index].id;
      this.stateOfSuggestions.discarded.push(this.stateOfSuggestions.added[index])
      var copy = [];
      for (var i = 0; i <  this.stateOfSuggestions.added.length; i++) {
        if(i!=index){
          copy.push(this.stateOfSuggestions.added[i]);
        }
      }
      this.stateOfSuggestions.added = copy;
      //delete this.stateOfSuggestions.added[index];
    }else if(op=="add"){
      idsymptom = this.stateOfSuggestions.discarded[index].id;
      this.stateOfSuggestions.added.push(this.stateOfSuggestions.discarded[index])
      var copy = [];
      for (var i = 0; i <  this.stateOfSuggestions.discarded.length; i++) {
        if(i!=index){
          copy.push(this.stateOfSuggestions.discarded[i]);
        }
      }
      this.stateOfSuggestions.discarded = copy;
      //delete this.stateOfSuggestions.discarded[index];
    }
    //update list right and
    var enc = false;
    for (var j = 0; j <  this.listOfSymptomsTemp.length && !enc; j++) {
      if(idsymptom==this.listOfSymptomsTemp[j].id){
        if(op=="discard"){
          this.listOfSymptomsTemp[j].checked = false;

        }else if(op=="add"){
          this.listOfSymptomsTemp[j].checked = true;

          this.recalculate();
        }
        enc = true;
      }
    }
    if(!enc){
      if(op=="add"){
        this.listOfSymptomsTemp[j].checked = true;

        this.recalculate();
      }
    }


  }

  changeStateTempSymptom(index, state){
    var itsAChange = false;
    if(this.listOfSymptomsTemp[index].checked==undefined){
      itsAChange = true;
      this.listOfSymptomsTemp[index].checked = state;
    }else{
      if((!this.listOfSymptomsTemp[index].checked && state == false) || (this.listOfSymptomsTemp[index].checked && state == true)){
        itsAChange = false;
      }else{
        itsAChange = true;
        this.listOfSymptomsTemp[index].checked = !(this.listOfSymptomsTemp[index].checked);
      }

    }
    if(itsAChange){
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
      if(this.listOfSymptomsTemp[index].checked){
        this.stateOfSuggestions.added.push(this.listOfSymptomsTemp[index]);


        //buscar si está en discarted o o unmarkedSymptoms
        var enc3 =false;
        for (var ki = 0; ki <  this.stateOfSuggestions.discarded.length && !enc3; ki++) {
          if(this.listOfSymptomsTemp[index].id == this.stateOfSuggestions.discarded[ki].id){
            enc3 =true;
            var copy = [];
            for (var i = 0; i <  this.stateOfSuggestions.discarded.length; i++) {
              if(i!=index){
                copy.push(this.stateOfSuggestions.discarded[i]);
              }
            }
            this.stateOfSuggestions.discarded = copy;
            //delete this.stateOfSuggestions.discarded[ki];
          }
        }
        var enc3 =false;
        for (var ki = 0; ki <  this.stateOfSuggestions.unmarkedSymptoms.length && !enc3; ki++) {
          if(this.listOfSymptomsTemp[index].id == this.stateOfSuggestions.unmarkedSymptoms[ki].id){
            enc3 =true;
            var copy = [];
            for (var i = 0; i <  this.stateOfSuggestions.unmarkedSymptoms.length; i++) {
              if(i!=index){
                copy.push(this.stateOfSuggestions.unmarkedSymptoms[i]);
              }
            }
            this.stateOfSuggestions.unmarkedSymptoms = copy;
            //delete this.stateOfSuggestions.unmarkedSymptoms[ki];
          }
        }

        //recalculo de momento solo si marca chequed, porque no se le puede pasar los sintomas que no tiene
        this.recalculate();

      }else{
        this.stateOfSuggestions.discarded.push(this.listOfSymptomsTemp[index]);
        //buscar si está en added o o unmarkedSymptoms
        var enc3 =false;
        for (var ki = 0; ki <  this.stateOfSuggestions.added.length && !enc3; ki++) {
          if(this.listOfSymptomsTemp[index].id == this.stateOfSuggestions.added[ki].id){
            enc3 =true;
            var copy = [];
            for (var i = 0; i <  this.stateOfSuggestions.added.length; i++) {
              if(i!=index){
                copy.push(this.stateOfSuggestions.added[i]);
              }
            }
            this.stateOfSuggestions.added = copy;
            //delete this.stateOfSuggestions.added[ki];
          }
        }
        var enc3 =false;
        for (var ki = 0; ki <  this.stateOfSuggestions.unmarkedSymptoms.length && !enc3; ki++) {
          if(this.listOfSymptomsTemp[index].id == this.stateOfSuggestions.unmarkedSymptoms[ki].id){
            enc3 =true;
            var copy = [];
            for (var i = 0; i <  this.stateOfSuggestions.unmarkedSymptoms.length; i++) {
              if(i!=index){
                copy.push(this.stateOfSuggestions.unmarkedSymptoms[i]);
              }
            }
            this.stateOfSuggestions.unmarkedSymptoms = copy;
            //delete this.stateOfSuggestions.unmarkedSymptoms[ki];
          }
        }
      }
    }


  }

  recalculate(){
    //this.saveSymptomsOfDiseaseSuggested();
    /*if(this.relatedConditions.length>0){
      this.loadDataPanelSuggestions();
    }*/
    this.loadDataPanelSuggestions();
  }

  changeSuggestedView(){
    if(this.viewSuggestion == 1){
      this.viewSuggestion = 0;
    }else{
      this.viewSuggestion = 1;
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

  changeTriggerHotjar(trigger){
    var lang = this.authService.getLang();
    var addLangToTrigger = 'en';
    if(lang=='es'){
      addLangToTrigger = 'es';
    }
    trigger = trigger+addLangToTrigger;
    this.$hotjar.trigger(trigger);
  }

  showPanelAddTextSymptoms(contentAddTextSymptoms){
    let ngbModalOptions: NgbModalOptions = {
          backdrop : 'static',
          keyboard : false,
          windowClass: 'ModalClass-xl'
    };
    this.modalReference = this.modalService.open(contentAddTextSymptoms, ngbModalOptions);
  }

  showMoreInfoSymptom(symptomIndex){
    if(this.selectedInfoSymptomIndex == symptomIndex ){
      this.selectedInfoSymptomIndex = -1;
    }else{
      this.selectedInfoSymptomIndex = symptomIndex;
    }
  }

  changeStateSymptomFinal(index){
    this.phenotype.data[index].checked = !(this.phenotype.data[index].checked);
  }

  checkSymptomsToDb(){
    var temp = [];
    for(var index in this.phenotype.data){
      if(this.phenotype.data[index].checked){
        temp.push(this.phenotype.data[index]);
      }
    }
    this.phenotype.data = temp;
    this.saveSymptomsToDb();
  }

  changeStateTempGeneticTest(index, state){
    if(this.geneticTests[index].checked){
      this.geneticTests[index].checked = state;
    }else{
      this.geneticTests[index].checked = !(this.geneticTests[index].checked);
    }

    var enc = false;
    var copyDiagnosisInfoGeneticTests = [];
    for (var i = 0; i <  this.diagnosisInfo.geneticTests.length; i++) {
      if(this.diagnosisInfo.geneticTests[i] == this.geneticTests[index].name){
        enc = true;
      }else{
        copyDiagnosisInfoGeneticTests.push(this.diagnosisInfo.geneticTests[i]);
      }
    }
    if(!enc){
      if(this.geneticTests[index].checked){
        copyDiagnosisInfoGeneticTests.push(this.geneticTests[index].name);
      }
    }
    this.diagnosisInfo.geneticTests = copyDiagnosisInfoGeneticTests;
    this.saveNotes();

  }

  setvaluestToGeneticTestsCards(geneticTests){
    for (var j = 0; j <  this.geneticTests.length; j++) {
      for (var i = 0; i <  this.diagnosisInfo.geneticTests.length; i++) {
        if(this.geneticTests[j].name == this.diagnosisInfo.geneticTests[i]){
          this.geneticTests[j].checked = true;
        }
      }
    }
  }

  setGeneticTestsToNone(){
    this.diagnosisInfo.geneticTests = ['None'];
    this.saveNotes();
  }

  showSharePanel(roleShare){
    //console.log('launch');
    //this.data.storage = roleShare;
    this.data.storage = {roleShare:roleShare};
    document.getElementById("buttonShareTo").click();

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

  checkPrograms(){
    this.programs = [];
    /*this.subscription.add( this.http.get(environment.api+'/api/programs/'+this.authService.getCurrentPatient().sub)
    .subscribe( (res : any) => {
      console.log(res)
      this.programs = res;
     }, (err) => {
       console.log(err);
     }));*/
  }

  showProgramRequest(program, contentGeneticProgram){
    this.loadPatients();
    this.actualProgram = program
    this.modalReference = this.modalService.open(contentGeneticProgram, {size: 'lg', centered: true});
  }

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
      this.loadSharedPatients();
    }, (err) => {
      console.log(err);
    }));
  }

  loadSharedPatients(){
    //this.patients = [];
    this.subscription.add( this.http.get(environment.api+'/api/sharedcase/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      (res.listpatients).forEach(function(element) {
        element.ismine = false;
        this.patients.push(element);
      }.bind(this));
      this.patients.sort(this.sortService.GetSortOrderNames("patientName"));
      this.loadDataFromSharingAccounts();
    }, (err) => {
      console.log(err);
    }));
  }

  loadDataFromSharingAccounts(){
    this.listOfSharingAccounts = [];
    if(this.patients.length>0){
      this.subscription.add( this.http.post(environment.api+'/api/sharingaccountsclinical/'+this.authService.getIdUser(), this.patients)
      .subscribe( (res2 : any) => {
        res2.sort(this.sortService.DateSort("date"));
        this.listOfSharingAccounts = res2;
       }, (err) => {
         console.log(err);
         this.listOfSharingAccounts = [];
       }));
    }

  }


  inviteShare(form){
    Swal.fire({
        title: this.translate.instant("GeneticProgram.swalGeneticProgramPatient"),
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
        this.sending = true;
        var params:any = {};
        //params.userId = this.authService.getIdUser();
        params.lang = this.authService.getLang()
        params.email = form.value.email;
        params.role = 'Clinical';

        params.account = {};
        var patientparams = this.authService.getCurrentPatient();
        params.account.patientName = this.selectedPatient.patientName;
        params.account.sub = this.selectedPatient.sub;

        params.permissions = {shareEmr:true, askFirst:false, shareWithAll:false};

        params.message = ''
        params.internalmessage = 'Request genetic test'
        params.isMine = true;

        params.ownerID = this.authService.getIdUser()
        var alreadyShared = false;
        for (var i = 0; i < this.listOfSharingAccounts.length; i++) {
          if(this.listOfSharingAccounts[i].patientid==params.account.sub && this.listOfSharingAccounts[i].email==params.email){
            alreadyShared = true;
          }
        }
        if(!alreadyShared){
          this.subscription.add( this.http.post(environment.api+'/api/shareorinvite',params)
            .subscribe( (res : any) => {

                if(res.message == 'A request has been submitted for the creation of a new account at Dx29'){
                  Swal.fire(this.translate.instant("GeneticProgram.Done"), this.translate.instant("permissions.A request has been submitted"), "success");
                }else if(res.message == 'Patient sharing done and email sent'){
                  Swal.fire(this.translate.instant("GeneticProgram.Done"), this.translate.instant("permissions.Patient sharing done"), "success");
                }else if(res.message == 'There is already an account with that email'){
                  Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("dashboardpatient.There is already an account with that email"), "warning");
                }else{
                  Swal.fire(this.translate.instant("GeneticProgram.Done"), res.message, "success");
                }

                this.loadPatients();



              this.sending = false;
              if(this.modalReference!=undefined){
                this.modalReference.close();
              }
             }, (err) => {
               console.log(err);
               Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");

               this.sending = false;
             }));
        }else{
          this.sending = false;
          var msg= this.translate.instant("GeneticProgram.msgresult5.1")+ " "+params.account.patientName+ " "+ this.translate.instant("GeneticProgram.msgresult5.2")+ " "+params.email+ " "+ this.translate.instant("GeneticProgram.msgresult5.3");
          Swal.fire(this.translate.instant("generics.Warning"), msg, "error");
        }
      }
    });



  }

}
