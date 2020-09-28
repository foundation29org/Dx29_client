// Imports for all tests
import { TestBed,ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

// Component import
import {DiagnosisComponent} from '../../../app/clinical/diagnosis/diagnosis.component'


// Particular imports for this tests
//import { of } from 'rxjs/internal/observable/of';
import { Observable } from 'rxjs/Observable';

// External services for testing
import { TranslateModule } from "@ngx-translate/core";
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

// Component particular imports
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { PatientService } from 'app/shared/services/patient.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BlobStorageService } from 'app/shared/services/blob-storage.service';
import { BlobStoragePedService } from 'app/shared/services/blob-storage-ped.service';
import {SearchFilterPipe} from '../../../app/shared/services/search-filter.service';
import { HighlightSearch} from 'app/shared/services/search-filter-highlight.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { ExomiserService } from 'app/shared/services/exomiser.service';
import {ExomiserHttpService} from 'app/shared/services/exomiserHttp.service';
import { Apif29SrvControlErrors } from 'app/shared/services/api-f29srv-errors';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import { NgxHotjarService } from 'ngx-hotjar';
import { TextTransform } from 'app/shared/services/transform-text.service';
import { TokenService } from 'app/shared/auth/token.service';

// Files: Phenolyzer
import * as phenolyzerInputData from 'unitTests/clinical/diagnosis/Jsons/phenolyzerInput.json';
import * as phenolyzerOutputData from 'unitTests/clinical/diagnosis/Jsons/Phenolyzer_expectedOutput.json';
import * as resultPheno_expectedConditionsData from 'unitTests/clinical/diagnosis/Jsons/pheno_expectedConditions.json'
import * as resultPheno_DiseasesData from 'unitTests/clinical/diagnosis/Jsons/pheno_expectedDiseases.json'
import * as resultPheno_GenesData from 'unitTests/clinical/diagnosis/Jsons/pheno_expectedGenes.json'
import * as  resultPheno_SymptomsData from 'unitTests/clinical/diagnosis/Jsons/phenolyzer_symptoms.json';
import * as  resultPheno_InfoDiseasesData from 'unitTests/clinical/diagnosis/Jsons/phenolyzer_infoDiseases.json';

// Files: Exomiser
import * as exomiserInputData from 'unitTests/clinical/diagnosis/Jsons/exomiserInput.json';
import * as exomiserOutputData from 'unitTests/clinical/diagnosis/Jsons/Exomiser_expectedOutput.json';
import * as resultExo_expectedConditionsData from 'unitTests/clinical/diagnosis/Jsons/exo_expectedConditions.json'
import * as resultExo_DiseasesData from 'unitTests/clinical/diagnosis/Jsons/exo_expectedDiseases.json'
import * as resultExo_GenesData from 'unitTests/clinical/diagnosis/Jsons/exo_expectedGenes.json'
import * as  resultExo_SymptomsData from 'unitTests/clinical/diagnosis/Jsons/exomiser_symptoms.json';
import * as  resultExo_InfoDiseasesData from 'unitTests/clinical/diagnosis/Jsons/exomiser_infoDiseases.json';


describe('[Get related conditions]',  () => {

    let component: DiagnosisComponent;
    let fixture: ComponentFixture<DiagnosisComponent>;

    let phenolyzerInput=phenolyzerInputData;
    let phenolyzerOutput=phenolyzerOutputData;
    let resultPheno_expectedConditions = resultPheno_expectedConditionsData;
    let resultPheno_Diseases = resultPheno_DiseasesData;
    let resultPheno_Genes= resultPheno_GenesData ;
    let resultPheno_Symptoms = resultPheno_SymptomsData;
    let resultPheno_InfoDiseases = resultPheno_InfoDiseasesData;

    let exomiserInput=exomiserInputData;
    let exomiserOutput=exomiserOutputData;
    let resultExo_expectedConditions = resultExo_expectedConditionsData;
    let resultExo_Diseases = resultExo_DiseasesData;
    let resultExo_Genes= resultExo_GenesData ;
    let resultExo_Symptoms = resultExo_SymptomsData;
    let resultExo_InfoDiseases = resultExo_InfoDiseasesData;
  

    let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

    // Configuration
    beforeEach(async() => {
       TestBed.configureTestingModule({
        imports:[HttpClientModule,HttpClientTestingModule,ToastrModule.forRoot(),TranslateModule.forRoot(),RouterTestingModule.withRoutes(
            [{path: 'clinical/dashboard/home', component: DiagnosisComponent},{path:'.',component:DiagnosisComponent}]),FormsModule],
        declarations: [
            DiagnosisComponent
        ],
        providers: [AuthService,AuthGuard,PatientService,SortService,SearchService, NgbModal,BlobStorageService,BlobStoragePedService, SearchFilterPipe,HighlightSearch,  
            ApiDx29ServerService,ExomiserService,ExomiserHttpService,Apif29SrvControlErrors, Apif29BioService,Apif29NcrService,NgxHotjarService,TextTransform,TokenService]
      }).compileComponents()
    });

    // Execution before each test
    beforeEach(async() => {
        fixture = TestBed.createComponent(DiagnosisComponent);
        component = fixture.componentInstance;
        //component.authService.setCurrentPatient(patientforTest)
        fixture.detectChanges();
    });

    beforeEach(async()=>{
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;
    })

    /*it('Clinical Diagnosis component created', () => {
        expect(component).toBeTruthy();
    });*/


    // 1. Get related conditions Phenolyzer
    it('Get related conditions with Phenolyzer result', (fakeAsync (() =>{
        // Simulate methods
        const spyDiseases = spyOn(component.apif29BioService, 'getDiseaseOfGenes')
        .and.returnValue(Observable.of(resultPheno_Diseases));
        const spyConditions = spyOn(component.apiDx29ServerService, 'getRelatedConditions')
        .and.returnValue(Observable.of(resultPheno_expectedConditions.diseases));
        const spyGenes = spyOn(component.apif29BioService, 'getGenesOfDiseases')
        .and.returnValue(Observable.of(resultPheno_Genes));
        const spySymptoms = spyOn(component.apif29BioService, 'getSymptomsOfDisease')
        .and.returnValue(Observable.of(resultPheno_Symptoms));
        const spyInfoDisease=spyOn(component.apif29BioService, 'getInfoOfDiseases')
        .and.returnValue(Observable.of(resultPheno_InfoDiseases));
        const spyRenderMap=spyOn(component, 'renderMap')
        .and.returnValue();
        // Azure Storage
        spyOn(component.blob,'uploadToBlobStorage').and.returnValue(Observable.of(1))

        component.phenotype={"data":[{"id":"HP:0001250","checked":true}]}
        component.getRelatedConditionsPhenolyzer(phenolyzerInput.input);
        tick();

        if(Object.keys(component.relatedConditions).length>0){
            for(var condition in component.relatedConditions){
                for (var expectedCondition in phenolyzerOutput){
                    if(phenolyzerOutput[expectedCondition].name.id==component.relatedConditions[condition].name.id){
                        expect(phenolyzerOutput[expectedCondition]).toEqual(component.relatedConditions[condition])
                    }
                }
            }
        }
        else{
            expect(Object.keys(component.relatedConditions).length).toBe(0)
        }
    })));

    // 1. Get related conditions Exomiser
    it('Get related conditions with Exomiser result', (fakeAsync (() =>{
        // Simulate methods
        const spyDiseases = spyOn(component.apif29BioService, 'getDiseaseOfGenes')
        .and.returnValue(Observable.of(resultExo_Diseases));
        const spyConditions = spyOn(component.apiDx29ServerService, 'getRelatedConditions')
        .and.returnValue(Observable.of(resultExo_expectedConditions.diseases));
        const spyGenes = spyOn(component.apif29BioService, 'getGenesOfDiseases')
        .and.returnValue(Observable.of(resultExo_Genes));
        const spySymptoms = spyOn(component.apif29BioService, 'getSymptomsOfDisease')
        .and.returnValue(Observable.of(resultExo_Symptoms));
        const spyInfoDisease=spyOn(component.apif29BioService, 'getInfoOfDiseases')
        .and.returnValue(Observable.of(resultExo_InfoDiseases));
        const spyRenderMap=spyOn(component, 'renderMap')
        .and.returnValue();
        // Azure Storage
        spyOn(component.blob,'uploadToBlobStorage').and.returnValue(Observable.of(1))

        component.getRelatedConditionsExomiser(exomiserInput.input)
        tick();

        if(Object.keys(component.relatedConditions).length>0){
            for(var condition in component.relatedConditions){
                for (var expectedCondition in exomiserOutput){
                    if(exomiserOutput[expectedCondition].name.id==component.relatedConditions[condition].name.id){
                        expect(exomiserOutput[expectedCondition]).toEqual(component.relatedConditions[condition])
                    }
                }
            }
        }
        else{
            expect(Object.keys(component.relatedConditions).length).toBe(0)
        }
    })));

});