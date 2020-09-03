import { Component, ViewChild, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { NgbTooltip, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient, HttpParams } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { DateService } from 'app/shared/services/date.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { PatientService } from 'app/shared/services/patient.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import * as d3 from 'd3';
import Swal from 'sweetalert2';
import { sha512 } from "js-sha512";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { HighlightSearch} from 'app/shared/services/search-filter-highlight.service';

//para la parte de genes
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { BlobStorageService, IBlobAccessToken } from 'app/shared/services/blob-storage.service';
import { BlobStoragePedService } from 'app/shared/services/blob-storage-ped.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import * as Highcharts from 'highcharts';
import Tree from 'highcharts/modules/treemap';
Tree(Highcharts);
import  Heatmap from 'highcharts/modules/heatmap';
Heatmap(Highcharts);
import  Exporting from 'highcharts/modules/exporting';
// Initialize exporting module.
Exporting(Highcharts);

import { Subscription } from 'rxjs/Subscription';

declare var JSZipUtils: any;
declare var Docxgen: any;
declare var pdfjsLib: any;

// State Flags constant declaration
let phenotypesinfo = [];

@Component({
    selector: 'app-diagnosis-super-admin',
    templateUrl: './diagnosis-super-admin.component.html',
    styleUrls: ['./diagnosis-super-admin.component.scss'],
    providers: [PatientService, ApiDx29ServerService]
})

export class DiagnosisSuperAdminComponent implements OnInit, OnDestroy {
    //Variable Declaration
    @ViewChild("containermap", { read: ElementRef }) container: ElementRef;
    @ViewChild('f') phenotypeExtractorForm: NgForm;
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
    patients: any;
    selectedPatient: any = {};

    phenotype: any = {};
    phenotypeCopy: any = {};
    temporalSymptoms: any = [];

    relatedConditions: any = [];
    relatedConditionsCopy: any = [];
    gettingRelatedConditions: boolean = false;
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
        : ((phenotypesinfo.filter(v => v.name.toLowerCase().indexOf(term.toLowerCase().trim()) > -1).slice(0, 100))).concat((phenotypesinfo.filter(v => v.id.toLowerCase().indexOf(term.toLowerCase().trim()) > -1).slice(0, 100)))
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
    actualPosGen: number = 0;
    actualPosDisease: number = 0;

    nextPosDisease: number = 0;
    nextPosGen: number = 0;

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
    loadingSymptomsOfDisease: boolean = false;
    respuestagenes : any;
    loadingInfoGenes: boolean = false;
    comtadorGenes: number = 0;
    maxSymptoms: number = 0;
    calculatingH29Score: boolean = false;
    diagnosisInfo: any = {};
    complete: any = 0;
    private subscription: Subscription = new Subscription();
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
    listOfDiseases:any = [];
    parserObject: any = {parserStrategy:'Auto', callingParser: false, file: undefined}
    posicionTrozo: number = 0;
    cantidadTrozos: number = 0;
    users: any = [];
    selectedUser: any = {};
    infoPatients: any = [];
    private msgDownload: string;

    constructor(private http: HttpClient, private authService: AuthService, public toastr: ToastrService, public translate: TranslateService, private authGuard: AuthGuard, private elRef: ElementRef, private router: Router, private patientService: PatientService, private sortService: SortService,private searchService: SearchService,
    private modalService: NgbModal ,private blob: BlobStorageService, private blobped: BlobStoragePedService, public searchFilterPipe: SearchFilterPipe, private highlightSearch: HighlightSearch, private dateService: DateService, private apiDx29ServerService: ApiDx29ServerService) {
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


      this.subscription.add( this.http.get('assets/jsons/phenotypes.json')
       .subscribe( (res : any) => {
         phenotypesinfo = res;
        }, (err) => {
          console.log(err);
        }));


        $.getScript("./assets/js/docs/jszip-utils.js").done(function(script, textStatus) {
          //console.log("finished loading and running jszip-utils.js. with a status of" + textStatus);
        });

        $.getScript("./assets/js/docs/docxtemplater.v2.1.5.js").done(function(script, textStatus) {
          //console.log("finished loading and running docxtemplater.js. with a status of" + textStatus);
        });

      /*$('#panelcillo a').click(function(e) {
          console.log(e);
            e.stopPropagation(); //stops default link action
            //do your stuff
            console.log('click!');
        });*/


    }

    ngOnDestroy() {
     this.subscription.unsubscribe();
    }

    ngOnInit() {
      this.getUsers();
      //this.loadPatients();
      this.loadTranslations();
      this.initVariables();

       this.subscription.add( this.blob.change.subscribe(uploaded => {
          this.uploaded = uploaded;
          this.uploadingGenotype = false;


        }));


        this.subscription.add(this.blob.changeFilesBlob.subscribe(filesOnBlob => {
          var mindate = 0;
          for (var i = 0; i < filesOnBlob.length; i++) {
            if((filesOnBlob[i].name).indexOf('.vcf')!=-1){
              var d = new Date(filesOnBlob[i].lastModified);
              //this.filename = filesOnBlob[i].name;
              if(mindate<d.getTime()){
                this.filename = filesOnBlob[i].name;
                mindate = d.getTime();
              }
            }
          }

          if(this.uploaded){
            console.log(document.getElementById("idShowPanelWorkbench"));
            console.log(document.getElementById("settingExomiser"));
            if(document.getElementById("idShowPanelWorkbench")==null && document.getElementById("settingExomiser")==null){
              this.callExomizerSameVcf();
            }else if(document.getElementById("settingExomiser")!=null){
              this.blob.loadFilesOnNewBlobExomizerSetting(this.accessToken.containerName);
            }
            console.log(this.filename);
          }

         }));

        //si tiene VCF
        this.subscription.add( this.blob.changeFilesExomizerBlobVcf.subscribe(vcfFilesOnBlob => {
          console.log(vcfFilesOnBlob);
          this.loadingGeno = false;
           if(vcfFilesOnBlob.length>0){
             this.filesVcf = vcfFilesOnBlob;
             this.filename = vcfFilesOnBlob[0].name;
             this.hasVcf = true;
             if(document.getElementById("idShowPanelWorkbench")!=null && document.getElementById("settingExomiser")==null){
               document.getElementById("idShowPanelWorkbench").click();
             }
           }else{
             console.log('no tiene!');
           }
         }));

         //SI TIENE JSON DE EXOMIZER
        this.subscription.add( this.blob.changeFilesExomizerBlob.subscribe(filesOnBlob => {
          this.loadingGeno = false;
           this.filesOnBlob = this.blob.filesOnBlob;
           //console.log(this.filesOnBlob);
           if(this.filesOnBlob.length>0){
             if(this.newVcf){
               this.loadFromBlob();
               //this.newVcf = false;
             }else{
               this.loadFromBlob();
               //document.getElementById("idShowPanelWorkbench").click();
             }
           }else{
             console.log('no tiene!');
             this.uploadingGenotype = false;
           }
           this.loading = false;
         }));

         //SI TIENE ped file
         this.subscription.add( this.blobped.change.subscribe(uploaded => {
            console.log(uploaded);
            this.uploadingPed = !uploaded;
            this.blobped.loadFilesPedOnBlob(this.accessToken.containerName);
          }));

         this.subscription.add( this.blobped.changeFilesPedBlob.subscribe(filesPedOnBlob => {
            if(filesPedOnBlob.length>0){
              console.log(filesPedOnBlob[0].name);
              this.settingExomizer.PedBlobName = filesPedOnBlob[0].name;
              console.log(this.settingExomizer);
            }else{
             console.log('no tiene!');
            }
          }));



         //SI TIENE JSON DE PHENOLIZER
        this.subscription.add( this.blob.changeFilesPhenolyzerBlob.subscribe(filesPhenolyzerOnBlob => {
          this.loadingGeno = false;
          //console.log(filesPhenolyzerOnBlob);
           if(filesPhenolyzerOnBlob.length>0){
             this.filePhenolyzerOnBlob = filesPhenolyzerOnBlob[0].name;
             this.loadPhenolyzerFromBlob();
           }else{
            console.log('no tiene!');
            this.launchingPhenolyzer = false;
           }
           this.loading = false;
         }));

         //SI TIENE JSON DE PHENOLIZER
        this.subscription.add( this.blob.changeFilesHtmlExomiserBlob.subscribe(filesHtmlExomiserBlob => {
           if(filesHtmlExomiserBlob.length>0){
             this.loadingFileHtmlExomiserBlob = false;
             this.urlFileHtmlExomiserBlob = this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+filesHtmlExomiserBlob[0].name+this.accessToken.sasToken;
           }else{
             this.loadingFileHtmlExomiserBlob = false;
            console.log('no tiene!');
           }
         }));

      this.subscription.add( this.http.get('assets/jsons/orpha-omim-orpha.json')
        .subscribe( (res : any) => {
          this.orphaOmim = res;
        }, (err) => {
          console.log(err);
        }));
    }

    onchangeparamgraph(){
      var namescore = "Dx29";
      if(this.paramgraph == 'matches'){
        namescore = "C1";
      }else if(this.paramgraph == 'scoregenes'){
        namescore = "C3";
      }else if(this.paramgraph == 'score'){
        namescore = "C2";
      }
      const rows = [...this.relatedConditions];
      if(this.paramgraph == 'matches'){
        rows.sort(this.sortService.GetSortOrderNumberLength(this.paramgraph));
      }else{
        rows.sort(this.sortService.GetSortOrderNumber(this.paramgraph));
      }
      this.relatedConditions = rows;

      this.calculatingH29Score = false;
      this.renderMap(this.relatedConditions.slice(0, 10), this.paramgraph);
    }

    checkServices(){
      this.checkPhenolyzer();
      this.checkExomiser();
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
        this.subscription.add( this.http.get(environment.api+'/api/exomizerservices/'+patientId)
        .subscribe( (res2 : any) => {
          console.log(res2);
          if(res2.message){
            if(res2.message=='something pending'){
              this.uploadingGenotype = true;
              this.getExomizer(patientId);
            }else{
              this.uploadingGenotype = false;
            }
          }
         }, (err) => {
           console.log(err);
         }));
    }

    openLinkMonarch(url, e){
      window.open('https://monarchinitiative.org/phenotype/'+url, '_blank');
      e.stopPropagation();
    }

    getUsers(){
      this.subscription.add( this.http.get(environment.api+'/api/superadmin/users/')
      .subscribe( (res : any) => {
        res.sort(this.sortService.GetSortOrder("email"));
        this.users = res;
        console.log(res);
      }, (err) => {
        console.log(err);
      }));
    }

    onChangeUser(value){
      console.log(value);
      this.loadPatients(value._id);
      this.getInfoPatients(value);
    }

    getInfoPatients(value){
      console.log(value);
      this.subscription.add( this.http.get(environment.api+'/api/superadmin/infopatients/'+value._id)
      .subscribe( (res : any) => {
        res.sort(this.sortService.GetSortOrder("case"));
        this.infoPatients = res;
        var json = JSON.stringify(res);
        var blob = new Blob([json], {type: "application/json"});
        var url  = URL.createObjectURL(blob);
        var p = document.createElement('p');
        var t = document.createTextNode(this.msgDownload+":");
        p.appendChild(t);
        document.getElementById('content').innerHTML="";
        document.getElementById('content').appendChild(p);

        var a = document.createElement('a');
        var dateNow = new Date();
        var stringDateNow = this.dateService.transformDate(dateNow);
        a.download    = value.userName+"_info_"+stringDateNow+".json";
        a.href        = url;
        a.textContent = value.userName+"_info_"+stringDateNow+".json";

        document.getElementById('content').appendChild(a);

        console.log(res);
      }, (err) => {
        console.log(err);
      }));
    }

    selected($e) {
      $e.preventDefault();
      //this.selectedItems.push($e.item);
      this.addSymptom($e.item, 'manual');
      //this.phenotype.data.push($e.item);
      this.modelTemp = '';
      //this.inputEl.nativeElement.value = '';
    }

    selected2($e) {
      $e.preventDefault();
      this.selectedItems.push($e.item);
      //this.addSymptom($e.item, 'manual');
      //this.phenotype.data.push($e.item);
      this.modelTemp = '';
      //this.inputEl.nativeElement.value = '';
    }

    deleteItem(item) {
      this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
      //this.inputEl.nativeElement.focus();
    }

    loadPatients(id){
      this.subscription.add( this.patientService.getPatientsClinicalSuperAdmin(id)
      .subscribe( (res : any) => {
        console.log(res);
        res.sort(this.sortService.GetSortOrder("patientName"));
        this.patients = JSON.parse(JSON.stringify(res));

        if(this.authService.getCurrentPatient()!=null){
          this.selectedPatient = this.authService.getCurrentPatient();
          this.getDiagnosisInfo();
          if(document.getElementById("idShowPanelSymptoms")!=null){
            document.getElementById("idShowPanelSymptoms").click();
          }
          this.initVariables();
          this.loadSymptoms();
        }
      }, (err) => {
        console.log(err);
      }));
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
       _id: null
     };

     this.exploreSymptomsPhenolizer = false;

    }

  SetActive(event, panelId: string) {
      var hElement: HTMLElement = this.elRef.nativeElement;
      //now you can simply get your elements with their class name
      var allAnchors = hElement.getElementsByClassName('list-group-item');
      //do something with selected elements
      [].forEach.call(allAnchors, function (item: HTMLElement) {
        item.setAttribute('class', 'list-group-item d-inline-block');
      });
      //set active class for selected item
      event.currentTarget.setAttribute('class', 'list-group-item bg-blue-grey bg-lighten-5 border-bottom-primary border-bottom-2 d-inline-block');

      if (panelId === 'panelSymptoms') {
        this.activeTittleMenu = "Symptoms";
        this.msgActiveTittleMenu = this.tittleSymptoms;
      }else if (panelId === 'panelGenes') {
        this.activeTittleMenu = "Genes";
        this.msgActiveTittleMenu = this.tittleGenes;
      }else if (panelId === 'PanelWorkbench') {
        this.activeTittleMenu = "Workbench";
        this.msgActiveTittleMenu = this.tittleWorkbench;
      }



      $('.content-overlay').removeClass('show');
      $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
      $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');

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

    onChangePatient(value){
      this.authService.setCurrentPatient(value);
      this.selectedPatient = this.authService.getCurrentPatient();
      if(document.getElementById("idShowPanelSymptoms")!=null){
        document.getElementById("idShowPanelSymptoms").click();
      }
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      this.initVariables();
      this.loadSymptoms();
      this.getDiagnosisInfo();

      /*this.settingExomizer = {
        "NumGenes" : 0,
        "HiPhivePrioritisers": ["human"],
        "PathogenicitySources" : [ "POLYPHEN", "MUTATION_TASTER", "SIFT"] ,
        "AnalysisMode": "PASS_ONLY",
        "Frequency": 1.0,
        "KeepNonPathogenic":  true,
        "MinQuality": 20.0,
        "OutputPassVariantsOnly": false,
        "genomeAssembly": 'hg19'
      };*/
    }

    changePatient(contentChangePatient){
      this.modalReference = this.modalService.open(contentChangePatient);
    }


    loadSymptoms(){
      //cargar los datos del usuario
      console.log("load symptoms");
      this.loadingSymptoms = true;
      var para= this.authService.getCurrentPatient();
      //cargar el fenotipo del usuario
      this.subscription.add( this.http.get(environment.api+'/api/phenotypes/'+para.sub)
      .subscribe( (res : any) => {
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
            if(hposStrins.length>50){
              //trocear, porque si no la url es muy larga y falla
              var contador = Math.ceil(hposStrins.length / 50);

              var posHposStrins = 0;
              for(var i = 0; i < contador; i++) {
                var hposStrins2 = "";
                for(var j = 0; i*contador < hposStrins.length && j<49 ; j++) {
                    if(hposStrins[posHposStrins]!=undefined){
                      if(hposStrins2 != ""){
                        hposStrins2 = hposStrins2+ ", ";
                      }
                      hposStrins2 = hposStrins2+ hposStrins[posHposStrins]
                    }
                    posHposStrins++;
                }
                //get symtoms
                var lang = this.authService.getLang();
                this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/phenotypes/'+lang+'/'+hposStrins2)
                .subscribe( (res : any) => {
                  for (var i = 0; i < res.length; i++) {
                    for (var j = 0; j < this.phenotype.data.length; j++) {
                      if(res[i].id==this.phenotype.data[j].id){
                        this.phenotype.data[j].name = res[i].name;
                        this.phenotype.data[j].def = res[i].desc;
                        this.phenotype.data[j].synonyms = res[i].synonyms;
                        this.phenotype.data[j].comment = res[i].comment;
                        if(this.phenotype.data[j].importance==undefined){
                          this.phenotype.data[j].importance = 1;
                        }
                      }
                    }
                  }

                }, (err) => {
                 console.log(err);
                 //tratar el error
                 this.reportError();
                }));
              }

            }else{
              var hposStrins3 = "";
              for(var i = 0; i < this.phenotype.data.length; i++) {
                  if(hposStrins3 != ""){
                    hposStrins3 = hposStrins3+ ", ";
                  }
                  hposStrins3 = hposStrins3+ this.phenotype.data[i].id
              }

              //get symtoms
              var lang = this.authService.getLang();
              this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/phenotypes/'+lang+'/'+hposStrins3)
              .subscribe( (res : any) => {
                for (var i = 0; i < res.length; i++) {
                  for (var j = 0; j < this.phenotype.data.length; j++) {
                    if(res[i].id==this.phenotype.data[j].id){
                      this.phenotype.data[j].name = res[i].name;
                      this.phenotype.data[j].def = res[i].desc;
                      this.phenotype.data[j].synonyms = res[i].synonyms;
                      this.phenotype.data[j].comment = res[i].comment;
                      if(this.phenotype.data[j].importance==undefined){
                        this.phenotype.data[j].importance = 1;
                      }
                    }
                  }
                }

             }, (err) => {
               console.log(err);
               //tratar el error
               this.reportError();
             }));
            }

            for (var j = 0; j < this.phenotype.data.length; j++) {
              this.phenotype.data[j].percentile = -1;
              this.phenotype.data[j].checked = true;
            }
            this.phenotypeCopy = JSON.parse(JSON.stringify(res.phenotype));


            if((this.activeTittleMenu == 'Symptoms') && !(this.isDeletingPhenotype)){
              this.goToGenesStep();
            }
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

    loadPercentilesInfoGenesAndConditions(httpParams, state, posGen, posDisease){
      if(state== 'next'){
        this.loadingPercentile = true;
      }

      if(this.infoGenesAndConditions[posGen].data[posDisease].symptoms!=undefined){
        this.infoGenesAndConditions[posGen].data[posDisease].symptoms.sort(this.sortService.GetSortOrder("name"));
      }
      console.log(state);
      if(state!= 'next'){
        this.actualDisease = this.infoGenesAndConditions[posGen].data[posDisease];
        this.cambiarOrdenSintomas();
        if(posGen==0 && posDisease==0){
          console.log('cargar primero next');
          this.loadNextDisease(posGen, posDisease);
        }else{
          console.log('cargar siguiente 0 ');
          this.loadNextDisease(posGen, posDisease);
        }

      }else{
        this.loadingPercentile = false;
        if(posGen==0 && posDisease==0){
          console.log('cargar primero next 1');
        }else{
          console.log('cargar siguiente 1');
          this.nextDisease = this.infoGenesAndConditions[posGen].data[posDisease];
          if(this.numToLoad>0){
            if(this.infoGenesAndConditions[posGen] != undefined){
              if(posDisease<(this.infoGenesAndConditions[posGen].data.length)-1){
                posDisease++;
              }else if(posDisease==(this.infoGenesAndConditions[posGen].data.length)-1){
                this.nextPosDisease = 0;
                posGen++;
              }
            }

            if(this.infoGenesAndConditions[posGen] != undefined){
              if(this.infoGenesAndConditions[posGen].data.length == 0){
                posDisease = 0;
                posGen++;
              }else{
                this.numToLoad--;
              }
            }
            this.loadNextDisease(posGen, posDisease);

          }
        }
      }
    }

    showPanelDiagnosis(contentRelatedConditions){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false
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
        var jsonPhenotype = { hpos: this.phenotype.data };
        var jsonHpos = [];
        for(var index in this.phenotype.data){
          if(this.phenotype.data[index].checked){
            jsonHpos.push(this.phenotype.data[index].id);
          }

        }
            var jsonPhenotype = { hpos: this.phenotype.data };
            var jsonHpos = [];
            for(var index in this.phenotype.data){
              if(this.phenotype.data[index].checked){
                jsonHpos.push(this.phenotype.data[index].id);
              }
            }
              this.subscription.add( this.http.post(environment.api+'/api/phenotype/conditions/100', jsonHpos)
              .subscribe( (res : any) => {
                this.relatedConditions = [];
                this.relatedConditions = res["diseases"];
                var infoToExtractGenes = [];
                if(this.infoGenesAndConditionsExomizer.length>0){
                  infoToExtractGenes = this.infoGenesAndConditionsExomizer;
                }else if(this.infoGenesAndConditionsPhenolyzer.length>0){
                  infoToExtractGenes = this.infoGenesAndConditionsPhenolyzer;
                }
                if(infoToExtractGenes!= []){
                  this.loadingInfoGenes = true;
                  this.comtadorGenes = 0;
                  this.maxSymptoms = 0;
                  console.log(this.relatedConditions);
                  console.log(this.infoGenesAndConditions);
                  this.listOfDiseases = "";
                  for(var i = 0; i < this.relatedConditions.length; i++) {
                    if(this.relatedConditions[i]!=undefined){
                      //this.relatedConditions[i].name.label = (this.relatedConditions[i].name.label).charAt(0).toUpperCase() + (this.relatedConditions[i].name.label).slice(1);
                      if(this.maxSymptoms<this.relatedConditions[i].matches.length){
                        this.maxSymptoms = this.relatedConditions[i].matches.length;
                      }
                      if(this.relatedConditions[i].genes==undefined){
                        this.relatedConditions[i].genes = [];
                        this.relatedConditions[i].scoregenes = 0;
                      }
                      if(this.listOfDiseases!=""){
                        this.listOfDiseases = this.listOfDiseases + ",";
                      }
                      this.listOfDiseases = this.listOfDiseases +this.relatedConditions[i].name.id;
                    }
                  }

                  //get genes
                  this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/disease/genes/tree/'+this.listOfDiseases)
                  .subscribe( (res1 : any) => {
                    console.log(res1);
                    for(var i = 0; i < this.relatedConditions.length; i++) {
                      var idDesease = this.relatedConditions[i].name.id;
                      if(res1[idDesease] !=undefined){
                        if(Object.keys((res1[idDesease]).genes).length>0){
                      //if(res1[idDesease].associations.length>0){
                        console.log(infoToExtractGenes);
                          for(var k = 0; k < infoToExtractGenes.length; k++){
                            var obttemp = (res1[idDesease]).genes;
                              for(var gen in obttemp) {
                                if(infoToExtractGenes[k].name==obttemp[gen].label){
                                  if(this.relatedConditions[i].scoregenes==0){
                                    var scoregenes = 0;
                                    if(this.infoGenesAndConditionsExomizer.length>0){
                                      scoregenes = parseInt(((infoToExtractGenes[k].score)*100).toFixed(0));

                                    }else if(this.infoGenesAndConditionsPhenolyzer.length>0){
                                      scoregenes = parseInt(((infoToExtractGenes[k].score)*100).toFixed(0));

                                    }else{
                                      scoregenes = 100 - (k*5);
                                    }
                                    this.relatedConditions[i].scoregenes = scoregenes;
                                  }
                                  break;
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
                          }
                          if(this.relatedConditions[i].genes.length>0){
                            this.relatedConditions[i].genes.sort(this.sortService.GetSortOrder("gen"));
                          }
                        }else{
                          console.log(this.relatedConditions[i].name.label);
                          if(this.isUpperCase(this.relatedConditions[i].name.label)){
                            this.relatedConditions[i].name.infogene = 'https://www.genecards.org/cgi-bin/carddisp.pl?gene='+this.relatedConditions[i].name.label+'#diseases';
                          }else{
                            this.relatedConditions[i].name.infogene = 'https://www.genecards.org/Search/Keyword?queryString='+this.relatedConditions[i].name.label;
                          }
                        }
                      }else{
                        console.log(this.relatedConditions[i].name.label);
                        if(this.isUpperCase(this.relatedConditions[i].name.label)){
                          this.relatedConditions[i].name.infogene = 'https://www.genecards.org/cgi-bin/carddisp.pl?gene='+this.relatedConditions[i].name.label+'#diseases';
                        }else{
                          this.relatedConditions[i].name.infogene = 'https://www.genecards.org/Search/Keyword?queryString='+this.relatedConditions[i].name.label;
                        }
                      }
                    }

                    this.loadingInfoGenes = false;
                    this.calcularScoreHealth29();
                    //this.getSymptomsApi();

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
      var lang = this.authService.getLang();
      this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/disease/phenotypes/'+lang+'/tree/'+this.listOfDiseases)
      .subscribe( (res2 : any) => {
        console.log(res2);
        for(var i = 0; i < this.relatedConditions.length; i++) {
          var idDesease = this.relatedConditions[i].name.id
          this.relatedConditions[i].symptoms = [];

          var info = res2[idDesease];
          console.log(info);
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
        this.loadingInfoGenes = false;
        this.calcularScoreHealth29();
      }, (err) => {
        console.log(err);
        //tratar el error
        this.reportError();
        this.closeAndShowMsg();
      }));
    }

    isUpperCase(str) {
      return str === str.toUpperCase();
    }

    calcularScoreHealth29(){
      for(var i = 0; i < this.relatedConditions.length; i++) {
        var scoreHelath29 = 0;

        if(this.relatedConditions[i].scoregenes==undefined){
          this.relatedConditions[i].scoregenes = 0;
        }
        /*if(this.relatedConditions[i].matches!=0){
          scoreHelath29 = this.relatedConditions[i].score+this.relatedConditions[i].scoregenes+((this.relatedConditions[i].matches.length/this.maxSymptoms)*100);
        }else{
          scoreHelath29 = this.relatedConditions[i].score+this.relatedConditions[i].scoregenes;
        }*/

        scoreHelath29 = (this.relatedConditions[i].score*(1/3))+(this.relatedConditions[i].scoregenes*(2/3));

        this.relatedConditions[i].h29 = parseInt(scoreHelath29.toFixed(0));
        this.relatedConditions[i].color = this.getColor(this.relatedConditions[i].h29);
      }


      /*const rows = [...this.relatedConditions];
      const sort = { dir: "desc", prop: "h29" };
      rows.sort((a, b) => {
        return a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1);
      });*/
      const rows = [...this.relatedConditions];
      rows.sort(this.sortService.GetSortOrderNumber("h29"));

      this.relatedConditions = rows;

      this.calculatingH29Score = false;

      this.renderMap(this.relatedConditions.slice(0, 10), 'h29');

      this.saveNotes();
      this.applyFilters();
    }

    checkChange(){
      this.checksChanged = true;
      //this.getRelatedConditions();
    }

    deleteText(){
      this.medicalText = '';
    }

    lastIndexOfRegex (info, regex){
      var match = info.match(regex);
      return match ? info.lastIndexOf(match[match.length-1]) : -1;
    }


    onSubmitToExtractor(){
      this.loadingHpoExtractor = true;
      //traducir a ingles
        //comprobar el idioma
        var testLangText = this.medicalText.substr(0,4000)
        this.subscription.add( this.apiDx29ServerService.getDetectLanguage(testLangText)
        .subscribe( (res : any) => {
          if(res[0].language == 'en'){
            this.callNCR();
          }else{
            if(this.medicalText.length>4999){
              var copyMedicalText = this.medicalText;
              this.medicalText = '';
              this.longitudtext = copyMedicalText.length;
              this.actualPostition = 0;
              var countDeleteCharacters = 0;
              var actualMedicalText = '';
              var trozos = [];
              while(this.actualPostition<this.longitudtext){
                actualMedicalText = copyMedicalText.substr(this.actualPostition,4999);
                //console.log(actualMedicalText);
                var lastCharacter = actualMedicalText.length;
                //var lastPoint= this.lastIndexOfRegex(actualMedicalText, /[a-zA-Z_\-. ]/);
                //var lastPoint2= this.lastIndexOfRegex(actualMedicalText, /[a-zA-Z_, ]/);
                var re = new RegExp("[.]"+" ",'g');
                var lastPoint = actualMedicalText.lastIndexOf(actualMedicalText.match(re).pop());
                var r2e = new RegExp("[,]"+" ",'g');
                var lastPoint2 = actualMedicalText.lastIndexOf(actualMedicalText.match(re).pop());
                //console.log(lastPoint);
                //console.log(lastPoint2);
                if( lastPoint > 0 || lastPoint2 >0){
                  lastPoint2++;
                  if(lastPoint >0){
                    lastPoint++;
                    lastCharacter = lastPoint;
                  }else{
                    lastCharacter = lastPoint2;
                  }
                }else{
                   lastCharacter = actualMedicalText.lastIndexOf(" ");
                }
                countDeleteCharacters = actualMedicalText.length-lastCharacter;
                //console.log(lastCharacter);

                actualMedicalText = actualMedicalText.substr(0, lastCharacter)
                trozos.push(actualMedicalText);
                this.actualPostition = (this.actualPostition+4999)-countDeleteCharacters;
                //console.log('eliminados: '+countDeleteCharacters);
                //console.log(actualMedicalText);
                //console.log(this.actualPostition);
              }

              //console.log(trozos);
              this.cantidadTrozos = trozos.length;
              this.posicionTrozo = 0;
              this.test(trozos, 0);

              /*this.getSomethingFromAnAPI(trozos).subscribe(response => {

                console.log(response);
                console.log(posicionTrozo);
                posicionTrozo++;
                this.medicalText = this.medicalText.concat(" ");
                var outString = (response[0].translations[0].text).replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
                this.medicalText = this.medicalText.concat(outString);
                if(posicionTrozo==cantidadTrozos){
                  //console.log('ha terminado');
                  //console.log(this.medicalText);
                  setTimeout(function () {
                      this.callNCR();
                  }.bind(this), 1000);

                }
              }, error => {
                this.loadingHpoExtractor = false;
                Swal.fire('', this.translate.instant("generics.error try again"), "error");
                console.error(error);
              });*/
            }else{
              this.subscription.add( this.apiDx29ServerService.getTranslationDictionary(this.medicalText)
              .subscribe( (res : any) => {
                Swal.close();
                //console.log(res);
                this.medicalText = res[0].translations[0].text;
                this.callNCR();

               }, (err) => {
                 console.log(err);
                 Swal.close();
                 if(err.status==429){
                   Swal.fire({
                       title: this.translate.instant("generics.Please wait"),
                       html: "<p>"+this.translate.instant("diagnosis.Msgwait")+"</p><i class='fa fa-spinner fa-spin fa-3x fa-fw pink'></i>",
                       showCancelButton: false,
                       showConfirmButton: false,
                       allowOutsideClick: false
                   }).then((result) => {

                   });
                   setTimeout(()=>{
                     this.onSubmitToExtractor();
                   }, 25000);
                 }else{
                   this.loadingHpoExtractor = false;
                   this.toastr.error('', this.translate.instant("generics.error try again"));
                 }
               }));
            }
          }

        }, (err) => {
          console.log(err);
          this.loadingHpoExtractor = false;
          this.toastr.error('', this.translate.instant("generics.error try again"));
        }));
    }

    public async test(trozos, index){
      var error = false;
      for(var i = this.posicionTrozo; i < trozos.length && !error; i++) {
        var result = await this.apiDx29ServerService.getTranslationDictionary(trozos[i])
        .toPromise()
        .then(response => {
          Swal.close();
          console.log(response);
          this.posicionTrozo++;
          this.medicalText = this.medicalText.concat(" ");
          var outString = (response[0].translations[0].text).replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
          this.medicalText = this.medicalText.concat(outString);
          if(this.posicionTrozo==this.cantidadTrozos){
            //console.log('ha terminado');
            //console.log(this.medicalText);
            setTimeout(function () {
                this.callNCR();
            }.bind(this), 1000);

          }
        })
        .catch(error => {
          Swal.close();
          console.log(error);
          if(error.status==429){
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                html: "<p>"+this.translate.instant("diagnosis.Msgwait")+"</p><i class='fa fa-spinner fa-spin fa-3x fa-fw pink'></i>",
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false
            }).then((result) => {

            });
            error = true;
            setTimeout(()=>{
              this.test(trozos, this.posicionTrozo);
            }, 25000);
          }

        });


      }
    }

    public getSomethingFromAnAPI(trozos: any[]): any {
        return Observable.from(trozos).pipe(
          concatMap(trozo =>
            <Observable<any>> this.apiDx29ServerService.getTranslationDictionary(trozo))

        );
    }

    continueToGenes(){
      this.hasSymptomsToSave();
    }

    backToSymtoms(){
      document.getElementById("idShowPanelSymptoms").click();
    }

    showPanelAddTextSymptoms(contentAddTextSymptoms){
      this.modalReference = this.modalService.open(contentAddTextSymptoms);
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
        this.phenotype.data.push({id: symptom.id,name: symptom.name, new: true, checked: true, percentile:-1, inputType: inputType, importance: '1', polarity: '0'});
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
            this.toastr.success('', this.msgDataSavedOk);
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
            this.toastr.success('', this.msgDataSavedOk);
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

    goToGenesStep(){
      //comprobar genes
      document.getElementById("idShowPanelGenes").click();
      this.loadGenes();
    }


    loadGenes(){
      //quito el primer caracter, ya que solo deja poner contenedores de 63 caracteres, y tenemos 64
      this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
      this.accessToken.patientId = this.authService.getCurrentPatient().sub;
      this.blob.createContainerIfNotExists(this.accessToken, '');
      this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
      this.blob.loadFilesOnBlobPhenolyzer(this.accessToken.containerName);
    }

    loadFromBlob(){
      this.subscription.add( this.http.get(this.accessToken.blobAccountUrl+this.accessToken.containerName+'/'+this.filesOnBlob[0].name+this.accessToken.sasToken)
        .subscribe( (res : any) => {
          this.infoGenesAndConditions = [];
          this.infoGenesAndConditionsExomizer = [];
          this.sizeOfDiseases = 0;
          for (var i = 0; i < 100; i++) {
            var dataForGene = [];
            if(res[i]!=undefined){
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
              this.infoGenesAndConditions.push({"name": res[i].geneSymbol, "data": dataForGene, "score": res[i].combinedScore});
              this.infoGenesAndConditionsExomizer.push({"name": res[i].geneSymbol, "data": dataForGene, "score": res[i].combinedScore});
            }

          }

          if(document.getElementById("idShowPanelWorkbench")!=null){
            document.getElementById("idShowPanelWorkbench").click();
          }else{
            document.getElementById("buttonChangeTab").click();
          }
          this.uploadingGenotype = false;


          if(this.newVcf){
            this.startDiagnosis();
            this.newVcf = false;
          }else{
            if(this.diagnosisInfo.infoGenesAndConditionsExomizer.length == 0){
              //this.getRelatedConditions();
            }
            this.numberOfSymptoms = this.phenotype.data.length;
            this.actualPosGen = 0;
            this.actualPosDisease = 0;
            this.globalPosDisease = 1;
            this.actualDisease = {};
            this.unknownSymptoms = [];
            this.symptomsLoaded = [];
          }
          this.checkExomiser();

         }, (err) => {
           console.log(err);
         }));
    }

    callExomizerSameVcf(){
      this.uploadingGenotype = true;
      this.getExomiserSettings();
      if(this.settingExomizer.VariantEffectFilters!=undefined){
        if(this.settingExomizer.VariantEffectFilters.remove!=undefined){
          if(this.settingExomizer.VariantEffectFilters.remove.length==0){
            delete this.settingExomizer.VariantEffectFilters;
          }
        }
      }
      this.subscription.add( this.http.post(environment.exomiserUrl,this.settingExomizer)
      .subscribe( (res : any) => {
        this.getExomizer(this.accessToken.patientId);

      }, (err) => {
        console.log(err);
      }));
    }

    getExomizer(patientId){
      this.subscription.add( this.http.get(environment.api+'/api/exomizerservice/'+patientId)
      .subscribe( (res2 : any) => {
        if(this.uploadingGenotype){
          if(res2.message){
            if(res2.message=='timeout'){
              this.getExomizer(patientId);
            }else if(res2.error!=undefined){
              console.log(res2);
              if(res2.message.body!=undefined){

                var test = (res2.message.body).split("\n\n");
                if(test[1]!=undefined){
                  var result = test[0]+'<br><br>'+test[1]
                  Swal.fire(res2.message.title, result, "error");
                }else{
                  Swal.fire(res2.message.title, res2.message.body, "error");
                }
              }else{
                Swal.fire('Error when processing the VCF file', (res2.message).toString(), "error");
              }
              this.uploadingGenotype = false;
            }else{
              this.newVcf = true;
              this.blob.loadFilesOnBlobExomizer(this.accessToken.containerName,null);
              //this.uploadingGenotype = false;
            }

          }else{
          }
        }

        this.loading = false;
       }, (err) => {
         if(this.uploadingGenotype){
           this.getExomizer(patientId);
         }
         console.log(err);
         this.loading = false;
       }));
    }

    /*retrygetExomizer(patientId){
      setTimeout(function () {
        this.getExomizer(patientId);
      }.bind(this), 30000);
    }*/

    onFileChangeVCF(event)  {
      this.preparingFile = true;
      console.log(event);
      if (event.target.files && event.target.files[0]) {

        var reader = new FileReader();
        //reader.readAsDataURL(event.target.files[0]); // read file as data url
        reader.onload = (event2:any) => { // called once readAsDataURL is completed
          this.preparingFile = false;
          //this.filename = event.target.files[0].name;
          console.log(event2);
          var filename = event.target.files[0].name;
          var extension = filename.substr(filename.lastIndexOf('.'));
          filename = filename.split(extension)[0];
          filename = filename + extension;
          console.log(filename);
          if(extension!='.vcf'){
            Swal.fire('The VCF file must have .vcf extension.', '', "error");
          }else{
            this.filename = '';
            this.relatedConditions = [];
            this.infoGenesAndConditionsExomizer = [];
            this.saveNotes2();
            //this.filename = event.target.files[0].name;
            this.uploadingGenotype = true;
            this.uploadProgress = this.blob
              .uploadToBlobStorage(this.accessToken, event.target.files[0], filename, 'vcf');
          }


        }
        reader.readAsArrayBuffer(event.target.files[0]);

      }
    }

    startDiagnosis(){
      //this.subscription.unsubscribe();
      this.actualPosGen = 0;
      this.actualPosDisease = 0;
      this.globalPosDisease = 1;
      this.actualDisease = {};
      this.unknownSymptoms = [];
      this.symptomsLoaded = [];
      this.numberOfSymptoms = this.phenotype.data.length;
      this.getSymptomsOfDisease('Forward', 'actual');
      document.getElementById("openModalButton").click();
    }

    editDiagnosis(){
      this.infoGenesAndConditions = this.infoGenesAndConditionsExomizer;

      this.sizeOfDiseases = 0;
      for (var i = 0; i < this.infoGenesAndConditions.length; i++) {
        if(this.infoGenesAndConditions[i].data.length>0){
          for (var j = 0; j < this.infoGenesAndConditions[i].data.length; j++) {
            this.sizeOfDiseases++;
          }
        }
      }
      this.actualPosGen = 0;
      this.actualPosDisease = 0;
      this.globalPosDisease = 1;
      this.actualDisease = {};
      this.unknownSymptoms = [];
      this.symptomsLoaded = [];
      document.getElementById("buttonChangeTab").click();
      while(this.infoGenesAndConditions[this.actualPosGen].data.length==0){
        //console.log('no info for:' + this.infoGenesAndConditions[this.actualPosGen].name);
        this.actualPosGen++;
      }
      //console.log(this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease]);
      if (typeof this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease].symptoms == 'undefined') {
        this.getSymptomsOfDisease('Forward', 'actual');
      }else{
        this.actualDisease = this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease];
      }
      document.getElementById("openModalButton").click();
    }

    selectOldVcf(contentSelectVcf){
      if(this.filesVcf){
        if(this.filesVcf.length>1){
          console.log(this.filesVcf.length);
          this.modalReference = this.modalService.open(contentSelectVcf);
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
          console.log(res2);
         }, (err) => {
           console.log(err);
         }));
    }

    continueDiagnosis(){
      this.loadFromBlob();
    }

    getSymptomsOfDisease(direction, state){
      var posGen = this.actualPosGen;
      var posDisease = this.actualPosDisease;
      if(state== 'next'){
        posGen = this.nextPosGen;
        posDisease = this.nextPosDisease;
      }

      //this.loadingSymptomsOfDisease = true;
      while(this.infoGenesAndConditions[posGen].data.length==0){
        //console.log('no info for:' + this.infoGenesAndConditions[this.actualPosGen].name);
        posGen++;
      }

      var temporalDisease = this.infoGenesAndConditions[posGen].data[posDisease];
      if(state != 'next'){
        this.actualDisease = this.infoGenesAndConditions[posGen].data[posDisease];
      }else{
        this.nextDisease = this.infoGenesAndConditions[posGen].data[posDisease];
      }

      //console.log(this.infoGenesAndConditions);
      //console.log(this.actualDisease);
      var idOriginOmim = '';
      var idOriginOrpha = '';
      idOriginOmim = temporalDisease.idOMIM;
      idOriginOrpha = temporalDisease.idOrphanet;
      var hpolist =[];
      var lang = this.authService.getLang();
      if(idOriginOmim!=null && idOriginOrpha!= null){
        this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/disease/phenotypes/'+lang+'/tree/'+idOriginOmim)
        .subscribe( (res0 : any) => {
          var info0;
          for(var kinit in res0) {
            info0= res0[kinit]
            console.log(info0);
          }
          var listOfSymptoms0;
          if(info0!=undefined){
            listOfSymptoms0 = info0.phenotypes
            if(Object.keys(listOfSymptoms0).length>0){
              for(var k0 in listOfSymptoms0) {
                 hpolist.push(k0);
               }
             }
          }

          if(idOriginOrpha!=null){
            this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/disease/phenotypes/'+lang+'/tree/'+idOriginOrpha)
            .subscribe( (res1 : any) => {
              //this.loadingSymptomsOfDisease = false;
              var info1;
              for(var kinit in res1) {
                info1= res1[kinit]
                console.log(info1);
              }
              if(info1!=undefined){
                var listOfSymptoms1 = info1.phenotypes
                if(listOfSymptoms1>0){
                  for(var k1 in listOfSymptoms1) {
                    var foundid = false;
                    for(var k0 in listOfSymptoms0) {
                      if(k1==k0){
                        foundid=true;
                        break;
                      }
                    }
                    if(!foundid){
                      hpolist.push(k1);
                    }
                   }
                  this.getInforHpos(direction, state, posGen, posDisease, hpolist);
                }else{

                  if(listOfSymptoms0!=undefined){
                    if(Object.keys(listOfSymptoms0).length>0){
                      this.getInforHpos(direction, state, posGen, posDisease, hpolist);
                    }else{
                      if(state != 'next'){
                        if(direction=='Forward'){
                          this.getNextDisease();
                        }else{
                          this.getPreviousDiseasepo();
                        }
                      }else{
                        this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
                      }

                    }
                  }else{
                    if(state != 'next'){
                      if(direction=='Forward'){
                        this.getNextDisease();
                      }else{
                        this.getPreviousDiseasepo();
                      }
                    }else{
                      this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
                    }
                  }
                }
              }else{
                if(listOfSymptoms0!=undefined){
                  if(Object.keys(listOfSymptoms0).length>0){
                    this.getInforHpos(direction, state, posGen, posDisease, hpolist);
                  }else{
                    if(state != 'next'){
                      if(direction=='Forward'){
                        this.getNextDisease();
                      }else{
                        this.getPreviousDiseasepo();
                      }
                    }else{
                      this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
                    }

                  }
                }else{
                  if(state != 'next'){
                    if(direction=='Forward'){
                      this.getNextDisease();
                    }else{
                      this.getPreviousDiseasepo();
                    }
                  }else{
                    this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
                  }
                }

              }

            }, (err) => {
              console.log(err);
              //tratar el error
              this.reportError();
              this.closeAndShowMsg();
            }));
          }else{
            this.getInforHpos(direction, state, posGen, posDisease, hpolist);
          }
         }, (err) => {
           console.log(err);
           //tratar el error
           this.reportError();
           this.closeAndShowMsg();
         }));
      }else if(idOriginOmim!=null){
        this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/disease/phenotypes/'+lang+'/tree/'+idOriginOmim)
        .subscribe( (res2 : any) => {
          var info2;
          for(var kinit in res2) {
            info2= res2[kinit]
            console.log(info2);
          }
          if(info2!=undefined){
            var listOfSymptoms2 = info2.phenotypes
            if(Object.keys(listOfSymptoms2).length>0){
              for(var k2 in listOfSymptoms2) {
                 hpolist.push(k2);
               }
                this.getInforHpos(direction, state, posGen, posDisease, hpolist);
             }else{
               if(state != 'next'){
                 if(direction=='Forward'){
                   this.getNextDisease();
                 }else{
                   this.getPreviousDiseasepo();
                 }
               }else{
                 this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
               }
             }
          }else{
            if(state != 'next'){
              if(direction=='Forward'){
                this.getNextDisease();
              }else{
                this.getPreviousDiseasepo();
              }
            }else{
              this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
            }
          }

           //this.loadingSymptomsOfDisease = false;
         }, (err) => {
           console.log(err);
           //tratar el error
           this.reportError();
           this.closeAndShowMsg();
         }));
      }else if(idOriginOrpha!= null){
        this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/disease/phenotypes/'+lang+'/tree/'+idOriginOrpha)
          .subscribe( (res3 : any) => {
            var info3;
            for(var kinit in res3) {
              info3= res3[kinit]
              console.log(info3);
            }
            if(info3!=undefined){
              var listOfSymptoms3 = info3.phenotypes
              if(Object.keys(listOfSymptoms3).length>0){
                for(var k3 in listOfSymptoms3) {
                   hpolist.push(k3);
                 }
                  this.getInforHpos(direction, state, posGen, posDisease, hpolist);
               }else{
                 if(state != 'next'){
                   if(direction=='Forward'){
                     this.getNextDisease();
                   }else{
                     this.getPreviousDiseasepo();
                   }
                 }else{
                   this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
                 }
               }
            }else{
              if(state != 'next'){
                if(direction=='Forward'){
                  this.getNextDisease();
                }else{
                  this.getPreviousDiseasepo();
                }
              }else{
                this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
              }
            }

             //this.loadingSymptomsOfDisease = false;
          }, (err) => {
            console.log(err);
            //tratar el error
            this.reportError();
            this.closeAndShowMsg();
          }));

      }
    }

    closeAndShowMsg(){
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
       this.toastr.error('', this.translate.instant("generics.error try again"));
    }

    getInforHpos(direction, state, posGen, posDisease, hpolist){
      this.infoGenesAndConditions[posGen].data[posDisease].symptoms = [];

      if(hpolist.length>50){
        //trocear, porque si no la url es muy larga y falla
        var contador2 = Math.ceil(hpolist.length / 50);

        var posHposStrins2 = 0;
        for(var i = 0; i < contador2; i++) {
          var hposStrins2 = "";
          for(var j = 0; i*contador2 < hpolist.length && j<49 ; j++) {
            if(hpolist[posHposStrins2]!=undefined){
              if(hposStrins2 != ""){
                hposStrins2 = hposStrins2+ ", ";
              }
              hposStrins2 = hposStrins2+ hpolist[posHposStrins2]
            }
            posHposStrins2++;
          }
          //content
          this.getInforHposParts(direction, state, posGen, posDisease, hposStrins2);

        }

      }else{
         var hposStrins3 = "";
         for(var i = 0; i < hpolist.length; i++) {
             if(hposStrins3 != ""){
               hposStrins3 = hposStrins3+ ", ";
             }
             hposStrins3 = hposStrins3+ hpolist[i].id
         }
         //content
         this.getInforHposParts(direction, state, posGen, posDisease, hposStrins3);
      }


    }

    getInforHposParts(direction, state, posGen, posDisease, httpParams2){
      var lang = this.authService.getLang();
      this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/phenotypes/'+lang+'/'+httpParams2)
      .subscribe( (res : any) => {


        for(var k = 0; k < res.length; k++) {
          var oneSymptom = {id:  res[k].id, name: res[k].name, def: res[k].desc, comment: res[k].comment}
          var foundElement = this.searchService.search(this.phenotype.data,'id', oneSymptom.id);
          if(!foundElement){
            if(this.symptomsLoaded.indexOf(oneSymptom.id)==-1){
              this.symptomsLoaded.push(oneSymptom.id);
              this.infoGenesAndConditions[posGen].data[posDisease].symptoms.push({id: oneSymptom.id,name: oneSymptom.name, new: true, checked: 'false', percentile:-1, def: oneSymptom.def, comment: oneSymptom.comment});
            }
          }


        }

        if(this.infoGenesAndConditions[posGen].data[posDisease].symptoms.length>0){
          var hposStrins =[];
            this.infoGenesAndConditions[posGen].data[posDisease].symptoms.forEach(function(element) {
            hposStrins.push(element.id);
          });

          //this.idPhenotype = res.phenotype._id;
          let httpParams = new HttpParams();
          if(hposStrins.length>50){
            //trocear, porque si no la url es muy larga y falla
            var contador = Math.ceil(hposStrins.length / 50);

            var posHposStrins = 0;
            for(var i = 0; i < contador; i++) {
              httpParams = new HttpParams();
              for(var j = 0; i*contador < hposStrins.length && j<49 ; j++) {
                if(hposStrins[posHposStrins]!=undefined){
                  httpParams = httpParams.append('symtomCodes', hposStrins[posHposStrins]);
                }
                posHposStrins++;
              }
              this.loadPercentilesInfoGenesAndConditions(httpParams, state, posGen, posDisease);
            }

          }else{
            hposStrins.forEach(id => {
               httpParams = httpParams.append('symtomCodes', id);
             });
             this.loadPercentilesInfoGenesAndConditions(httpParams, state, posGen, posDisease);
          }
        }else{
          if(state== 'next'){
            this.loadNextDisease(posGen, posDisease);
          }else{
            if(direction=='Forward'){
              this.getNextDisease();
            }else{
              this.getPreviousDiseasepo();
            }
          }
        }

       }, (err) => {
         console.log(err);
         //tratar el error
         //this.reportError();
       }));
    }

    goTo(url){
      document.getElementById(url).scrollIntoView(true);
    }

    /*getNextDisease(){
      console.log(this.actualDisease);
      console.log(this.nextDisease);
      if(this.actualDisease.symptoms!=undefined){
        this.previousDisease = JSON.parse(JSON.stringify(this.actualDisease));
        if(this.nextDisease.symptoms!=undefined){
          if(this.nextDisease.condition == this.actualDisease.condition){
            this.loadNextDisease(this.nextPosGen,this.nextPosDisease);
          }else{
            this.actualDisease = JSON.parse(JSON.stringify(this.nextDisease));
            this.loadNextDisease(this.nextPosGen,this.nextPosDisease);
          }

        }else{
          this.loadNextDisease(this.nextPosGen,this.nextPosDisease);
        }
        this.globalPosDisease++;
      }else{
        this.getActualDisease();
      }
      //this.getActualDisease();
      this.goTo('idHeader');
    }*/

    getNextDisease(){
      console.log('entra getActualDisease');
      if(this.infoGenesAndConditions[this.actualPosGen]){
        if(this.actualPosDisease<(this.infoGenesAndConditions[this.actualPosGen].data.length)-1){
          this.actualPosDisease++;
        }else if(this.actualPosDisease==(this.infoGenesAndConditions[this.actualPosGen].data.length)-1){
          this.actualPosDisease = 0;
          this.actualPosGen++;
        }
        if(this.infoGenesAndConditions[this.actualPosGen].data.length == 0){
          this.actualPosDisease = 0;
          this.actualPosGen++;
          this.getNextDisease();
        }else{
          this.globalPosDisease++;
          if(this.globalPosDisease<this.sizeOfDiseases){
            if (typeof this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease].symptoms == 'undefined') {
              console.log('aqui entra');
              this.getSymptomsOfDisease('Forward', 'actual');
              if(this.numToLoad==0){
                if(this.infoGenesAndConditions[this.nextPosGen] != undefined){
                  if(this.nextPosDisease<(this.infoGenesAndConditions[this.nextPosGen].data.length)-1){
                    this.nextPosDisease++;
                  }else if(this.nextPosDisease==(this.infoGenesAndConditions[this.nextPosGen].data.length)-1){
                    this.nextPosDisease = 0;
                    this.nextPosGen++;
                  }
                }

                if(this.infoGenesAndConditions[this.nextPosGen] != undefined){
                  if(this.infoGenesAndConditions[this.nextPosGen].data.length == 0){
                    this.nextPosDisease = 0;
                    this.nextPosGen++;
                  }else{
                    this.numToLoad++;
                  }
                }
                this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
              }
            }else{
              this.numToLoad++;
              this.actualDisease = this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease];
              this.cambiarOrdenSintomas();
              if(this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease].symptoms==0){
                this.getNextDisease();
              }else{
                this.loadNextDisease(this.actualPosGen, this.actualPosDisease);
              }
            }
          }

        }
      }


      this.goTo('idHeader');
    }

    loadNextDisease(pos1, pos2){
      console.log(pos1+ '--'+ pos2);
      if(pos1==undefined){
        this.nextPosGen = this.actualPosGen;
        this.nextPosDisease = this.actualPosDisease;
      }else{
        this.nextPosGen = pos1;
        this.nextPosDisease = pos2;
      }
      //this.actualPosGen = pos1;
      //this.actualPosDisease = pos2;
      if(this.infoGenesAndConditions[this.nextPosGen] != undefined){
        if(this.nextPosDisease<(this.infoGenesAndConditions[this.nextPosGen].data.length)-1){
          this.nextPosDisease++;
        }else if(this.nextPosDisease==(this.infoGenesAndConditions[this.nextPosGen].data.length)-1){
          this.nextPosDisease = 0;
          this.nextPosGen++;
        }
      }

      if(this.infoGenesAndConditions[this.nextPosGen] != undefined){
        if(this.infoGenesAndConditions[this.nextPosGen].data.length == 0){
          this.nextPosDisease = 0;
          this.nextPosGen++;
          this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
        }else{
        //  this.globalPosDisease++;
          if(this.globalPosDisease<this.sizeOfDiseases){
            if (typeof this.infoGenesAndConditions[this.nextPosGen].data[this.nextPosDisease].symptoms == 'undefined') {
              console.log('load symtoms: '+ JSON.stringify(this.infoGenesAndConditions[this.nextPosGen].data[this.nextPosDisease]));
              this.getSymptomsOfDisease('Forward', 'next');
            }else{
              //this.actualDisease = this.infoGenesAndConditions[nextPosGen].data[nextPosDisease];
              if(this.infoGenesAndConditions[this.nextPosGen].data[this.nextPosDisease].symptoms==0){
                this.loadNextDisease(this.nextPosGen, this.nextPosDisease);
              }
            }
          }else{
            console.log('el fin');
          }

        }
      }


    }

    getPreviousDiseasepo(){
      if(this.actualPosDisease!=0){
        this.actualPosDisease--;
      }else if(this.actualPosDisease==0 && this.actualPosGen !=0){
        this.actualPosGen--;
        this.actualPosDisease = this.infoGenesAndConditions[this.actualPosGen].data.length-1;
      }
      if(this.actualPosGen !=0 || (this.actualPosGen ==0 && this.actualPosDisease!=0) || (this.actualPosGen ==0 && this.actualPosDisease==0 && this.infoGenesAndConditions[this.actualPosGen].data.length != 0)){
        if(this.infoGenesAndConditions[this.actualPosGen].data.length == 0){
          if(this.actualPosGen>0){
            this.actualPosGen--;
            if(this.infoGenesAndConditions[this.actualPosGen].data.length>0){
              this.actualPosDisease = this.infoGenesAndConditions[this.actualPosGen].data.length-1;
            }else{
              this.actualPosDisease = 0;
            }

            this.getPreviousDiseasepo();
          }

        }else{
          if(this.globalPosDisease>0){
            this.globalPosDisease--;
            if (typeof this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease].symptoms == 'undefined') {
              console.log('entra qui');
              this.getSymptomsOfDisease('back', 'actual');
            }else{
              this.actualDisease = this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease];
              this.cambiarOrdenSintomas();
              if(this.infoGenesAndConditions[this.actualPosGen].data[this.actualPosDisease].symptoms==0){
                this.getPreviousDiseasepo();
              }
            }
          }

        }
      }
      this.goTo('idHeader');
    }

    getPreviousDisease(PosGen,PosDisease){
      this.goTo('idHeader');
      var copyActualactualPosGen= 0;
      var copyActualPosDisease = 0;
      if(PosGen== undefined || PosGen == undefined){
        copyActualactualPosGen = this.actualPosGen;
        copyActualPosDisease = this.actualPosDisease;
      }else{
        copyActualactualPosGen = PosGen;
        copyActualPosDisease = PosDisease;
      }
      if(copyActualPosDisease!=0){
        copyActualPosDisease--;
      }else if(copyActualPosDisease==0 && copyActualactualPosGen !=0){
        copyActualactualPosGen--;
        copyActualPosDisease = this.infoGenesAndConditions[copyActualactualPosGen].data.length-1;
      }
      this.actualPosGen= copyActualactualPosGen;
      this.actualPosDisease = copyActualPosDisease;

      this.globalPosDisease--;
      if(copyActualactualPosGen !=0 || (copyActualactualPosGen ==0 && copyActualPosDisease!=0) || (copyActualactualPosGen ==0 && copyActualPosDisease==0 && this.infoGenesAndConditions[copyActualactualPosGen].data.length != 0)){
        if(this.infoGenesAndConditions[copyActualactualPosGen].data.length == 0){
          copyActualactualPosGen--;
          if(this.infoGenesAndConditions[copyActualactualPosGen].data.length>0){
            copyActualPosDisease = this.infoGenesAndConditions[copyActualactualPosGen].data.length-1;
          }else{
            copyActualPosDisease = 0;
          }

          this.getPreviousDisease(copyActualactualPosGen, copyActualPosDisease);
        }else{
          if (typeof this.infoGenesAndConditions[copyActualactualPosGen].data[copyActualPosDisease].symptoms == 'undefined') {
            console.log('no debería de entrar aki');
            //this.getSymptomsOfDisease('back', 'actual');
            this.getPreviousDisease(copyActualactualPosGen, copyActualPosDisease);
          }else{
            this.nextDisease = this.infoGenesAndConditions[PosGen].data[PosDisease];
            this.previousDisease = this.infoGenesAndConditions[copyActualactualPosGen].data[copyActualPosDisease];
            this.cambiarOrdenSintomas();
            if(this.infoGenesAndConditions[copyActualactualPosGen].data[copyActualPosDisease].symptoms==0){
              this.getPreviousDisease(copyActualactualPosGen, copyActualPosDisease);
            }
          }
        }
      }


      this.goTo('idHeader');
    }

    changeSymptomTrue(index){
      this.actualDisease.symptoms[index].checked = 'true';
      this.numberOfSymptoms++;
    }

    changeSymptomFalse(index){
      this.actualDisease.symptoms[index].checked = 'false';
      this.numberOfSymptoms--;
    }

    changeSymptomUnknownToFalse(index){
      this.actualDisease.symptoms[index].checked = 'false';

    }

    changeSymptomUnknown(index){
      if(this.actualDisease.symptoms[index].checked == 'true'){
        this.numberOfSymptoms--;
      }
      this.actualDisease.symptoms[index].checked = 'unknown';
    }

    finishDiagnosis(){
      var haschanged = false;
      for (var i = 0; i < this.infoGenesAndConditions.length; i++) {
        for (var j = 0; j < this.infoGenesAndConditions[i].data.length; j++) {
          if (typeof this.infoGenesAndConditions[i].data[j].symptoms != 'undefined') {
            for (var k = 0; k < this.infoGenesAndConditions[i].data[j].symptoms.length; k++) {
              if(this.infoGenesAndConditions[i].data[j].symptoms[k].checked == 'true'){
                var foundElement = this.searchService.search(this.phenotype.data,'id', this.infoGenesAndConditions[i].data[j].symptoms[k].id);
                if(!foundElement){
                  this.phenotype.data.push(
                    {id: this.infoGenesAndConditions[i].data[j].symptoms[k].id,
                      name: this.infoGenesAndConditions[i].data[j].symptoms[k].name,
                      new: true,
                      checked: true,
                      percentile: this.infoGenesAndConditions[i].data[j].symptoms[k].percentile,
                      def: this.infoGenesAndConditions[i].data[j].symptoms[k].def,
                      comment: this.infoGenesAndConditions[i].data[j].symptoms[k].comment,
                      inputType: 'proposed',
                      importance: '1',
                      polarity: '0'
                    });

                      haschanged =true;
                }
              }else if(this.infoGenesAndConditions[i].data[j].symptoms[k].checked == 'unknown'){
                this.unknownSymptoms.push(
                  {id: this.infoGenesAndConditions[i].data[j].symptoms[k].id,
                    name: this.infoGenesAndConditions[i].data[j].symptoms[k].name,
                    new: true,
                    checked: true,
                    percentile: this.infoGenesAndConditions[i].data[j].symptoms[k].percentile,
                    def: this.infoGenesAndConditions[i].data[j].symptoms[k].def,
                    comment: this.infoGenesAndConditions[i].data[j].symptoms[k].comment,
                    inputType: 'proposed',
                    importance: '1',
                    polarity: '0'
                  });

                    haschanged =true;
              }else if(this.infoGenesAndConditions[i].data[j].symptoms[k].checked == 'false'){
                var foundElement = this.searchService.search(this.phenotype.data,'id', this.infoGenesAndConditions[i].data[j].symptoms[k].id);
                if(foundElement){
                  for(var m = 0; m < this.phenotype.data.length; m++) {
                    if(this.phenotype.data[m].id==this.infoGenesAndConditions[i].data[j].symptoms[k].id){
                      this.phenotype.data[m].checked=false;
                      haschanged =true;
                    }
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
         //this.getRelatedConditions();
       }

    }

    addSymptomToPhenotype(symptom, index){
      var foundElement = this.searchService.search(this.phenotype.data,'id', symptom.id);
      if(!foundElement){
        this.phenotype.data.push({id: symptom.id,name: symptom.name, new: true, checked: true, percentile:symptom.percentile, def: symptom.def, comment: symptom.comment, inputType: symptom.inputType, importance: symptom.importance, polarity: symptom.polarity});
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

    switchOriginEvent(event){
      this.switchOrigin = event;
      this.startDiagnosis();
    }

    resetSavedSymptoms(){
      this.phenotype = JSON.parse(JSON.stringify(this.phenotypeCopy));
      this.geneName = '';
    //  this.getRelatedConditions();
    }

    addSymptomsManual(contentAddSymptomsManual){
      this.modalReference = this.modalService.open(contentAddSymptomsManual);
    }

    continueAndCallPhenolyzer(){

      console.log("continueAndCallPhenolyzer")

      this.gettingRelatedConditions=false;
      this.loadingDiagnosisInfo=false;
      this.launchingPhenolyzer=false;
      this.uploadingGenotype=false;
      this.selectedItemsFilter=[];
      this.relatedConditions=[];


      console.log("Values: RelatedConditions Length "+this.relatedConditions.length+", Getting Related Conditions: "+this.gettingRelatedConditions+", loadingDiagnosisInfo: "+this.loadingDiagnosisInfo+", selectedItemsFilter Length: "+this.selectedItemsFilter.length+", launchingPhenolyzer: "+this.launchingPhenolyzer)
      //Swal.fire('Done', '', "success");
      document.getElementById("idShowPanelWorkbench").click();
      setTimeout(function () {
        document.getElementById("tabPhenolyzer").click();
        console.log(this.filePhenolyzerOnBlob);
        if(this.filePhenolyzerOnBlob!=''){
          this.loadPhenolyzerFromBlob();
        }else{
          this.launchPhenolyzer();
        }

      }.bind(this), 200);

    }

    launchPhenolyzer(){
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

    getPhenolyzer(patientId){
      this.subscription.add( this.http.get(environment.api+'/api/phenolyzerservice/'+patientId)
      .subscribe( (res2 : any) => {
        if(this.launchingPhenolyzer){
          if(res2.message){
            if(res2.message=='timeout'){
              this.getPhenolyzer(patientId);
            }else if(res2.error!=undefined){
              console.log(res2);
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
      this.actualPosGen = 0;
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
        this.sizeOfDiseases = 0;
        for (var i = 0; i < this.infoGenesAndConditions.length; i++) {
          if(this.infoGenesAndConditions[i].data.length>0){
            for (var j = 0; j < this.infoGenesAndConditions[i].data.length; j++) {
              this.sizeOfDiseases++;
            }
          }
        }

        if(!this.exploreSymptomsPhenolizer){
          if(document.getElementById("idShowPanelWorkbench")!=null){
            document.getElementById("idShowPanelWorkbench").click();
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

            if(document.getElementById("idShowPanelWorkbench")!=null){
              document.getElementById("idShowPanelWorkbench").click();
            }else{
              if(document.getElementById("buttonChangeTab")!=null){
                document.getElementById("buttonChangeTab").click();
              }

            }



            if(this.exploreSymptomsPhenolizer){
              this.exploreMoreSymptomsPhenolyzer();
            }else{
              if(this.diagnosisInfo.infoGenesAndConditionsPhenolyzer.length == 0 && this.filesOnBlob.length == 0){
                //this.getRelatedConditions();
              }
            }
            this.checkPhenolyzer();
           }, (err) => {
             console.log(err);
             this.checkPhenolyzer();
           }));
      }

    }

    getDiagnosisInfo(){
      this.accessToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
      this.accessToken.patientId = this.authService.getCurrentPatient().sub;

      this.blob.createContainerIfNotExists(this.accessToken, 'ncr');
      this.loadingDiagnosisInfo = true;
      var para= this.authService.getCurrentPatient();
      //cargar el fenotipo del usuario
      this.subscription.add( this.http.get(environment.api+'/api/diagnosis/'+para.sub)
      .subscribe( (res : any) => {
        console.log(res);
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
          this.infoGenesAndConditionsPhenolyzer = this.diagnosisInfo.infoGenesAndConditionsPhenolyzer;
          this.relatedConditions = this.diagnosisInfo.relatedConditions;
          this.settingExomizer = this.diagnosisInfo.settingExomizer;
          if(this.relatedConditions.length>0){
            this.renderMap(this.relatedConditions.slice(0, 10), 'h29');
          }

        }

       }, (err) => {
         console.log(err);
       }));
    }

    saveNotes(){
      if(this.authGuard.testtoken()){
        if(this.modalReference!=undefined){
          this.modalReference.close();
        }
        this.diagnosisInfo.infoGenesAndConditionsExomizer = this.infoGenesAndConditionsExomizer;
        this.diagnosisInfo.infoGenesAndConditionsPhenolyzer = this.infoGenesAndConditionsPhenolyzer;
        this.diagnosisInfo.settingExomizer = this.settingExomizer;
        this.diagnosisInfo.relatedConditions = this.relatedConditions;
        this.diagnosisInfo.hasVcf = this.hasVcf;
        if(this.diagnosisInfo._id==null){
          this.subscription.add( this.http.post(environment.api+'/api/diagnosis/'+this.authService.getCurrentPatient().sub, this.diagnosisInfo)
          .subscribe( (res : any) => {
            this.diagnosisInfo = res.diagnosis;
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"));

           }, (err) => {
             console.log(err);
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));
        }else{
          this.subscription.add( this.http.put(environment.api+'/api/diagnosis/'+this.diagnosisInfo._id, this.diagnosisInfo)
          .subscribe( (res : any) => {
            this.diagnosisInfo = res.diagnosis;
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
           }, (err) => {
             console.log(err.error);
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));
        }
      }
    }

    saveNotes2(){
      if(this.authGuard.testtoken()){
        this.diagnosisInfo.infoGenesAndConditionsExomizer = this.infoGenesAndConditionsExomizer;
        this.diagnosisInfo.infoGenesAndConditionsPhenolyzer = this.infoGenesAndConditionsPhenolyzer;
        this.diagnosisInfo.settingExomizer = this.settingExomizer;
        this.diagnosisInfo.relatedConditions = this.relatedConditions;
        this.diagnosisInfo.hasVcf = this.hasVcf;
        if(this.diagnosisInfo._id==null){
          this.subscription.add( this.http.post(environment.api+'/api/diagnosis/'+this.authService.getCurrentPatient().sub, this.diagnosisInfo)
          .subscribe( (res : any) => {
            this.diagnosisInfo = res.diagnosis;
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"));

           }, (err) => {
             console.log(err);
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));
        }else{
          this.subscription.add( this.http.put(environment.api+'/api/diagnosis/'+this.diagnosisInfo._id, this.diagnosisInfo)
          .subscribe( (res : any) => {
            this.diagnosisInfo = res.diagnosis;
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
           }, (err) => {
             console.log(err.error);
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));
        }
      }
    }

    addTemporalSymptom(symptom, inputType){
      var foundElement = this.searchService.search(this.temporalSymptoms,'id', symptom.id);
      if(!foundElement){
        this.temporalSymptoms.push({id: symptom.id,name: symptom.name, new: true, checked: true, percentile:-1, inputType: inputType, importance: '1', polarity: '0', similarity: symptom.similarity, positions: symptom.positions});
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

    changeStateSymptom(index){
      this.temporalSymptoms[index].checked = !(this.temporalSymptoms[index].checked);
    }

    callNCR(){
    this.temporalSymptoms = [];
      var jsonMedicalText = {"data": this.medicalText };
      console.log(this.medicalText);
      this.subscription.add( this.http.post(environment.ncrService, jsonMedicalText)
      .subscribe( (res : any) => {
        console.log(res);
        var docUrl= '';
        if(this.fileUploadInfo!=undefined){
          var extension = (this.fileUploadInfo).name.substr((this.fileUploadInfo).name.lastIndexOf('.'));
          var rightNow = new Date();
          var dateparse = rightNow.toISOString().slice(0,10).replace(/-/g,"");
          docUrl = "uploadedFile-"+dateparse+extension;
        }
        var actualDate = Date.now();
        this.infoNcrToSave = {ncrVersion:environment.ncrVersion, originalText: this.medicalText, result: res, rejectedSymptoms: [], date: actualDate, docUrl: docUrl};
        var infoNcr = res.result;
        if(res.message == 'Replica closed connection before replying' || res == null){
          Swal.fire(this.translate.instant("generics.Warning"), 'Replica closed connection before replying', "error");
        }else if(res.message == 'Too many requests for service ncr-gpu (overloaded)'){
          Swal.fire(this.translate.instant("generics.Warning"), 'Too many requests for service ncr-gpu (overloaded)', "error");
        }else{
          if(infoNcr.length>0){
            infoNcr.sort(this.sortService.GetSortOrderNumberInverse("characters"));
            console.log(infoNcr);
            for(var i = 0; i < infoNcr.length; i++) {
              var positions = [];
              positions.push(infoNcr[i].characters);
              var symptomExtractor = {id: infoNcr[i].id,name: infoNcr[i].concept, new: true, similarity: parseFloat(infoNcr[i].probability), positions: positions};
              this.addTemporalSymptom(symptomExtractor, 'ncr');
              //this.addSymptom(symptomExtractor, 'auto')
            }
            this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
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
                console.log(infoNcr[j-1].characters[1]);
                console.log(infoNcr[j].characters[0]);
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
            this.isNewNcrFile = true;
            //var actualDate = Date.now();
            //this.infoNcrToSave = {ncrVersion:environment.ncrVersion, originalText: '', result: {}, rejectedSymptoms: [], date: actualDate, docUrl: ''};
            document.getElementById("openModalSymptomsNcrButton").click();
          }else{
            this.toastr.warning('', this.translate.instant("phenotype.No symptoms found"));
          }
          this.loadingHpoExtractor = false;
        }

       }, (err) => {
         Swal.fire(this.translate.instant("generics.Warning"), err.error.message, "error");
         this.loadingHpoExtractor = false;
       }));
    }

   onFileChangePDF(event)  {
     if (event.target.files && event.target.files[0]) {
       var reader = new FileReader();
       reader.readAsDataURL(event.target.files[0]); // read file as data url
       reader.onload = (event2:any) => { // called once readAsDataURL is completed
         var the_url = event2.target.result

         var extension = (event.target.files[0]).name.substr((event.target.files[0]).name.lastIndexOf('.'));
         console.log(extension);
         if(event.target.files[0].type=='application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension == '.docx'){
           this.loadFile(the_url,function(err,content){
               if (err) { console.log(err);};
               var doc = new Docxgen(content);
               var text = doc.getFullText();
               this.medicalText = text;
               //this.callNCR();
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
          Swal.fire('The uploaded file must have a .pdf, .docx extension, or image files', '', "error");
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
     oReq.open("PUT", environment.f29api+'/api/Document/Parse?Timeout=5000&language='+lang+'&Strategy='+this.parserObject.parserStrategy, true);

     var self = this;
     oReq.onload = function (oEvent) {
       Swal.close();
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
       }

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
           }
         });

       }else{
         self.parserObject.parserStrategy = 'Auto'
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

    cambiarOrdenSintomas(){
      console.log(this.modelRadio);
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
      this.blobped.createContainerIfNotExists(this.accessToken);

      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false
      };
      this.modalReference = this.modalService.open(contentSettingsExomiser, ngbModalOptions);
      //this.modalReference = this.modalService.open(contentSettingsExomiser);
      this.goTo('settingExomiser');
    }

    onFileChange(event: any): void {
      console.log(event.target.files[0]);
      if(event.target.files[0].size > 12048){
         Swal.fire('File is too big!', '', "error");
      }else{
        var filename = event.target.files[0].name;
        var extension = filename.substr(filename.lastIndexOf('.'));
        filename = filename.split(extension)[0];
        filename = filename + extension;
        console.log(filename);
        if(extension!='.ped'){
          Swal.fire('The ped file must have .ped extension.', '', "error");
        }else{
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

    }

    saveSettingsExomiser(){
      if(!this.loadingSymptoms && !this.sending && (this.phenotypeCopy.data.length != this.phenotype.data.length || this.checksChanged)){
        this.saveSymptomsToDb();
      }

      this.variantEffectFiltersState = false;
      console.log(this.settingExomizer);
      this.saveNotes();
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
    }

    cancelSettingsExomiser(){
      this.variantEffectFiltersState = false;
      this.settingExomizer = this.diagnosisInfo.settingExomizer;
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      this.goTo('idup');
    }

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
    }

    clearValuesFrequencySources(){
      this.settingExomizer.FrequencySources = [];
    }

    clearValuesVariantEffectFilters(){
      this.settingExomizer.VariantEffectFilters.remove = [];
    }

    isGenomeChangedEvent(state){
      if(state && !this.variantEffectFiltersState){
        this.settingExomizer.VariantEffectFilters.remove = [];
      }
    }

    variantEffectFiltersChanged(){
      this.variantEffectFiltersState = true;
    }

    showPanelSymptomsNcr(contentSymptomsNcr){
      if(this.modalReference!=undefined){
        this.modalReference.close();
      }
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false
      };
      this.modalReference = this.modalService.open(contentSymptomsNcr, ngbModalOptions);
    }

    markText(text, pos1, pos2){
      this.searchTerm = text.substring(pos1, pos2);
      this.resultTextNcrCopy = this.highlightSearch.transform(this.resultTextNcr, this.searchTerm);
    }

    markAllText(text, hpo){
      var words = [];
      for(var j = 0; j < hpo.positions.length; j++) {
        var value = text.substring(hpo.positions[j][0], hpo.positions[j][1]);
        words.push({args:value})
      }
      this.resultTextNcrCopy = this.highlightSearch.transformAll(this.resultTextNcr, words);
    }

    saveSymptomsNcr(){
      for(var i = 0; i < this.temporalSymptoms.length; i++) {
        if(this.temporalSymptoms[i].checked){
          var symptomExtractor = {id: this.temporalSymptoms[i].id,name: this.temporalSymptoms[i].name, new: true};
          this.addSymptom(symptomExtractor, 'ncr');
        }else{
          var foundElement = this.searchService.search(this.infoNcrToSave.rejectedSymptoms,'id', this.temporalSymptoms[i].id);
          if(!foundElement){
            this.infoNcrToSave.rejectedSymptoms.push(this.temporalSymptoms[i]);
          }

        }

      }
      if(this.isNewNcrFile){
        this.saveResultsNcr();
      }

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
              console.log(res);
            }, (err) => {
              console.log(err);
            }));
          }
        });
      }
    }

    changeSymptomsOfDisease(row, contentSeeSymptomsOfDisease){
      console.log(row);
      this.actualProposedDisease = row;
      //genes
      this.listOfGenes = [];

      if(row.genes!=undefined){
        if(this.infoGenesAndConditionsExomizer.length>0 && row.genes.length>0){
          for(var i = 0; i < row.genes.length; i++) {
            var enc= false;
            for(var j = 0; j < this.infoGenesAndConditionsExomizer.length && !enc; j++) {
              console.log(this.infoGenesAndConditionsExomizer[j]);
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
              console.log(this.infoGenesAndConditionsPhenolyzer[j]);
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

      console.log(this.listOfGenes);

      //síntomas
      this.listOfSymptoms = [];
      for(var i = 0; i < row.matches.length; i++) {
        var enc= false;
        for(var j = 0; j < this.phenotype.data.length && !enc; j++) {
          //if(this.phenotype.data[j].id == row.matches[i].a.id){
          if(this.phenotype.data[j].id == row.matches[i].reference.id){
            enc=true;
            console.log(this.phenotype.data[j]);
            this.listOfSymptoms.push({id: this.phenotype.data[j].id, name: this.phenotype.data[j].name, def: this.phenotype.data[j].desc, comment: this.phenotype.data[j].comment, checked: true});
          }
        }
        /*if(!enc){
          this.listOfSymptoms.push({id: row.matches[i].a.id, name: row.matches[i].a.label, checked: false});
        }*/
        /*if(!enc){
          this.listOfSymptoms.push({id: row.matches[i].reference.id, name: row.matches[i].reference.label, checked: false});
        }*/
      }
      for(var i = 0; i < row.symptoms.length; i++) {
        var enc= false;
        for(var j = 0; j < this.listOfSymptoms.length && !enc; j++) {
          if(this.listOfSymptoms[j].id == row.symptoms[i].id){
            enc=true;
          }
        }
        if(!enc){
          var enc2 = false;
          for(var k = 0; k < this.phenotype.data.length && !enc2; k++) {
            if(row.symptoms[i].id==this.phenotype.data[k].id){
              enc2 = true;
            }
          }
          if(enc2){
            this.listOfSymptoms.push({id: row.symptoms[i].id, name: row.symptoms[i].name, def: row.symptoms[i].desc, comment: row.symptoms[i].comment, checked: true});
          }else{
            this.listOfSymptoms.push({id: row.symptoms[i].id, name: row.symptoms[i].name, def: row.symptoms[i].desc, comment: row.symptoms[i].comment, checked: false});
          }

        }
      }
      //this.listOfSymptoms.sort(this.sortService.GetSortOrderNames("name"));

      var hposStrins =[];
      this.listOfSymptoms.forEach(function(element) {
        hposStrins.push(element.id);
      });


      let httpParams = new HttpParams();
      console.log(hposStrins.length);
      if(hposStrins.length>50){
        //trocear, porque si no la url es muy larga y falla
        var contador = Math.ceil(hposStrins.length / 50);

        var posHposStrins = 0;
        for(var i = 0; i < contador; i++) {
          var hposStrins2 = "";
          for(var j = 0; i*contador < hposStrins.length && j<49 ; j++) {
              if(hposStrins[posHposStrins]!=undefined){
                if(hposStrins2 != ""){
                  hposStrins2 = hposStrins2+ ", ";
                }
                hposStrins2 = hposStrins2+ hposStrins[posHposStrins]
              }
              posHposStrins++;
          }

           var lang = this.authService.getLang();
           this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/phenotypes/'+lang+'/'+hposStrins2)
           .subscribe( (res : any) => {
             for (var i = 0; i < res.length; i++) {
               for (var j = 0; j < this.listOfSymptoms.length; j++) {
                 if(res[i].id==this.listOfSymptoms[j].id){
                   this.listOfSymptoms[j].name = res[i].name;
                   this.listOfSymptoms[j].def = res[i].desc;
                   this.listOfSymptoms[j].synonyms = res[i].synonyms;
                   this.listOfSymptoms[j].comment = res[i].comment;
                   if(this.listOfSymptoms[j].importance==undefined){
                     this.listOfSymptoms[j].importance = 1;
                   }
                 }
               }
             }

           }, (err) => {
            console.log(err);
            //tratar el error
            this.reportError();
           }));
        }

      }else{
          var hposStrins3 = "";
          for(var i = 0; i < this.listOfSymptoms.length; i++) {
              if(hposStrins3 != ""){
                hposStrins3 = hposStrins3+ ", ";
              }
              hposStrins3 = hposStrins3+ this.listOfSymptoms[i].id
          }

          var lang = this.authService.getLang();
          this.subscription.add( this.http.get(environment.f29bio+'/api/BioEntity/phenotypes/'+lang+'/'+hposStrins3)
          .subscribe( (res : any) => {
            for (var i = 0; i < res.length; i++) {
              for (var j = 0; j < this.listOfSymptoms.length; j++) {
                if(res[i].id==this.listOfSymptoms[j].id){
                  this.listOfSymptoms[j].name = res[i].name;
                  this.listOfSymptoms[j].def = res[i].desc;
                  this.listOfSymptoms[j].synonyms = res[i].synonyms;
                  this.listOfSymptoms[j].comment = res[i].comment;
                  if(this.listOfSymptoms[j].importance==undefined){
                    this.listOfSymptoms[j].importance = 1;
                  }
                }
              }
            }

          }, (err) => {
           console.log(err);
           //tratar el error
           this.reportError();
          }));
      }
      this.listOfSymptoms.sort(this.sortService.GetSortOrderInverse("checked"));
      this.modalReference = this.modalService.open(contentSeeSymptomsOfDisease);


    }

    changeStateDiseaseSymptom(index){
      this.listOfSymptoms[index].checked = !(this.listOfSymptoms[index].checked);
    }


    saveSymptomsOfDisease(){
      console.log(this.listOfSymptoms);
      for (var k = 0; k < this.listOfSymptoms.length; k++) {
        if(this.listOfSymptoms[k].checked){
          var foundElement = this.searchService.search(this.phenotype.data,'id', this.listOfSymptoms[k].id);
          console.log(foundElement);
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
            console.log(this.phenotype.data);
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
      console.log(this.phenotype.data);

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
            console.log(event.row);
            this.changeSymptomsOfDisease(event.row, contentSeeSymptomsOfDisease);
        }
    }

    setFitersDiseases(contentFilterDiseases){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false
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
          console.log(this.selectedItemsFilterWithIndex[i].id)
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
          console.log(this.relatedConditionsCopy);
        }*/
        if(this.relatedConditionsCopy.length == 0){
          this.relatedConditionsCopy= JSON.parse(JSON.stringify(this.relatedConditions));
        }else{
          this.relatedConditions = JSON.parse(JSON.stringify(this.relatedConditionsCopy));
        }
        var tempRelatedConditions = [];
        var counterFilters = 0;
        console.log(this.relatedConditions.length);
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
            console.log("Numero de filtros: "+this.selectedItemsFilter.length);
            console.log("counter of filters applied: "+ counterFilters);
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
    }

    renderMap(data, param){
      if(document.getElementById("idShowPanelWorkbench")!=null){
        document.getElementById("idShowPanelWorkbench").click();
      }else{
        document.getElementById("buttonChangeTab").click();
      }

      var tempParam = 'Dx29';

      if(param == 'matches'){
        tempParam = 'C1';
      }else if(param == 'scoregenes'){
        tempParam = 'C3';
      }else if(param == 'score'){
        tempParam = 'C2';
      }

      var tempdata = [];
      for(var i = 0; i < data.length; i++) {
        var tempColor= this.getColor(data[i].h29);
        var tempValue= data[i].h29;
        if(param == 'matches'){
          tempValue= data[i].matches.length;
        }else if(param == 'scoregenes'){
          tempValue= data[i].scoregenes;
        }else if(param == 'score'){
          tempValue= data[i].score;
        }
        tempdata.push({name: data[i].name.label, value: tempValue, color: tempColor});
      }

      if(this.container==undefined){
        (async () => {
            // Do something before delay
            console.log('before delay')

            await this.delay(1000);

            // Do something after
            console.log('after delay')
            Highcharts.chart(this.container.nativeElement, {
              series: [{
                  type: 'treemap',
                  layoutAlgorithm: 'squarified',
                  data: tempdata
              }],
              title: {
                  text: tempParam+' score'
              },
              legend: {
                  enabled: false
              }
            })
        })();
      }else{
        Highcharts.chart(this.container.nativeElement, {
          series: [{
              type: 'treemap',
              layoutAlgorithm: 'squarified',
              data: tempdata
          }],
          title: {
              text: tempParam+' score'
          },
          legend: {
              enabled: false
          }
        })
      }


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

    delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    saveResultsNcr(){

       var str = JSON.stringify(this.infoNcrToSave);
       var random_name = Math.random().toString(36).substr(2, 9);
       //var fileNameNcr = random_name+"-"+this.accessToken.containerName+'ncrresult.json';
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
         console.log(res);
         if(this.modalReference!=undefined){
           this.modalReference.close();
         }
         this.medicalText = res.originalText
         this.resultTextNcrCopy = res.result.result
         this.infoNcrToSave = res;
         console.log(this.infoNcrToSave);
         var infoNcr = res.result.result
         infoNcr.sort(this.sortService.GetSortOrderNumberInverse("characters"));
         console.log(infoNcr);
         for(var i = 0; i < infoNcr.length; i++) {
           var positions = [];
           positions.push(infoNcr[i].characters);
           var symptomExtractor = {id: infoNcr[i].id,name: infoNcr[i].concept, new: true, similarity: parseFloat(infoNcr[i].probability), positions: positions};
           this.addTemporalSymptom(symptomExtractor, 'ncr');
           //this.addSymptom(symptomExtractor, 'auto')
         }
         this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
         for(var j = 0; j < this.temporalSymptoms.length; j++) {

           for(var k = 0; k < res.rejectedSymptoms.length; k++) {
             if(this.temporalSymptoms[j].id == res.rejectedSymptoms[k].id){
               this.changeStateSymptom(j);
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
             console.log(infoNcr[j-1].characters[1]);
             console.log(infoNcr[j].characters[0]);
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
        }, (err) => {
          console.log(err);
        }));
    }
  }
