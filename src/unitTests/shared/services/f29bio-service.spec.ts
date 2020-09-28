// Imports for all tests
import { TestBed,ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

// Component import
import {DiagnosisComponent} from '../../../app/clinical/diagnosis/diagnosis.component'
import {Apif29BioService} from '../../../app/shared/services/api-f29bio.service'


// Particular imports for this tests
import { AuthInterceptor } from 'app/shared/auth/auth.interceptor';
import { EventsService } from 'app/shared/services/events.service';
import { environment } from 'environments/environment';

// External services for testing
import { TranslateModule } from "@ngx-translate/core";
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
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
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import { NgxHotjarService } from 'ngx-hotjar';
import { TextTransform } from 'app/shared/services/transform-text.service';
import { TokenService } from 'app/shared/auth/token.service';

// Files
import * as expectedDiseasesData from 'unitTests/shared/services/Jsons/expectedDiseases.json';
import * as expectedGenesData from 'unitTests/shared/services/Jsons/expectedGenes.json';
import * as expectedSymptomsData from 'unitTests/shared/services/Jsons/symptoms.json';
import * as expectedInfoOfDiseasesData from 'unitTests/shared/services/Jsons/expectedInfoOfDiseases.json';

describe('[F29 bio service]',  () => {

    let component: DiagnosisComponent;
    let fixture: ComponentFixture<DiagnosisComponent>;
    
    let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    let expectedDiseases = expectedDiseasesData;
    let expectedGenes = expectedGenesData;
    let expectedSymptoms = expectedSymptomsData;
    let expectedInfoOfDiseases = expectedInfoOfDiseasesData;

    // Configuration
    beforeEach(() => {
       TestBed.configureTestingModule({
        imports:[HttpClientModule,ToastrModule.forRoot(),TranslateModule.forRoot(),RouterTestingModule.withRoutes(
            [{path: 'clinical/dashboard/home', component: DiagnosisComponent}]),FormsModule],
        declarations: [
            DiagnosisComponent
        ],
        providers: [AuthService,AuthGuard,PatientService,SortService,SearchService, NgbModal,BlobStorageService,BlobStoragePedService, SearchFilterPipe,HighlightSearch,  
            ApiDx29ServerService,ExomiserService,ExomiserHttpService,Apif29SrvControlErrors, Apif29BioService,Apif29NcrService,NgxHotjarService,TextTransform,TokenService,
            {
                provide: HTTP_INTERCEPTORS,
                useClass: AuthInterceptor,
                multi: true,
              },EventsService]
      }).compileComponents()
    });

    // Execution before each test
    beforeEach(() => {
        fixture = TestBed.createComponent(DiagnosisComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    
    // 1. Get diseases of genes
    it('Get diseases of genes', (done: DoneFn) => {
        component.authService.setAuthenticated(environment.tokenTest)
        let genes=['KCNQ2', 'MECP2', 'UBE3A', 'KCNQ3', 'PRRT2', 'PEX3', 'PEX19',
            'FGFR2', 'SCN2A', 'KAT6B', 'PEX1', 'TCF4', 'RARS2', 'ATP7A', 'PEX12', 'PEX5', 'PEX10', 'PEX6',
            'PEX26', 'PEX13', 'PEX11B', 'PEX16', 'PEX2', 'PEX14', 'FOXG1', 'ARSA', 'ALG2', 'ALG9', 'ASPA',
            'ARG1', 'SNRPN', 'SPG11', 'MVK', 'GFAP', 'COX10', 'ARID1B', 'SMARCB1', 'PDGFRB', 'HMBS',
            'VPS13A', 'ACOX1', 'GNAQ', 'SMARCA4', 'MPDU1', 'SMARCE1', 'ARID1A', 'ATRX', 'PAH', 'TSC2',
            'TSC1', 'HLCS', 'SURF1', 'ACTG1', 'ACTB', 'GAMT', 'TSEN54', 'PDGFB', 'NELFA', 'GMPPA', 'EXOSC3',
            'AAAS', 'CDKL5', 'SLC20A2', 'FGFR3', 'ERCC6', 'ATM', 'PDHA1', 'EZH2', 'MED12', 'WFS1',
            'NSD1', 'ALDH7A1', 'FH', 'ABCD1', 'NHLRC1', 'ASL', 'GNE', 'PAX2', 'LETM1', 'NTNG1',
            'RECQL4', 'ALDH5A1', 'EPM2A', 'OCRL', 'ZEB2', 'COL4A1', 'GCK', 'PROP1', 'ABCC8',
            'STAMBP', 'PEX7', 'OFD1', 'MLH1', 'SCN1A', 'KCNJ11', 'FA2H', 'GSS', 'KANSL1', 'SHH',
            'CEP290'];

        component.apif29BioService.getDiseaseOfGenes(genes).subscribe(value => {
            console.log(value)
            if(Object.keys(value).length>0){
                for(var disease in value){
                    for (var expectedDisease in expectedDiseases){
                        if(expectedDisease==disease){
                            expect(expectedDiseases[expectedDisease]).toEqual(value[disease])
                        }
                    }
                }
                done();
            }
            else{
                expect(Object.keys(value).length).toBe(0)
                done();
            }
          });
    });


    // 2. Get genes of disease
    it('Get genes of diseases',(done: DoneFn) => {
        component.authService.setAuthenticated(environment.tokenTest)
        let diseases=[ 'MONDO:0007366', 'MONDO:0007365', 'MONDO:0011593', 'MONDO:0013388', 'MONDO:0011461', 'MONDO:0012723', 'MONDO:0010898', 'MONDO:0011545', 'MONDO:0011416', 'MONDO:0013741', 'MONDO:0014903', 'MONDO:0013470', 'MONDO:0014517', 'MONDO:0024566', 'MONDO:0011891', 'MONDO:0010899', 'MONDO:0010429', 'MONDO:0020853', 'MONDO:0014924', 'MONDO:0014925', 'MONDO:0014328', 'MONDO:0012946', 'MONDO:0014842', 'MONDO:0014150', 'MONDO:0013322', 'MONDO:0014333', 'MONDO:0010451', 'MONDO:0010317', 'MONDO:0013970' ];
        component.apif29BioService.getGenesOfDiseases(diseases).subscribe((value)=>{
            //expect(res).toEqual(expectedGenes)
            console.log(value)
            if(Object.keys(value).length>0){
                for(var gen in value){
                    for (var expectedGen in expectedGenes){
                        if(expectedGen==gen){
                            expect(expectedGenes[expectedGen]).toEqual(value[gen])
                        }
                    }
                }
                done();
            }
            else{
                expect(Object.keys(value).length).toBe(0)
                done();
            }
        })
       
    });

    

    //3. Get symptoms of disease
    it('Get symptoms',(done: DoneFn) => {
        component.authService.setAuthenticated(environment.tokenTest)
        let lang="es"
        let diseases=["MONDO:0014639","MONDO:0014650","MONDO:0013103","MONDO:0007366","MONDO:0007367","MONDO:0014308","MONDO:0010898","MONDO:0011965","MONDO:0011990","MONDO:0010682","MONDO:0017949","MONDO:0011875","MONDO:0008041","MONDO:0060671","MONDO:0054847","MONDO:0011443","MONDO:0011461","MONDO:0011491","MONDO:0012843","MONDO:0011545","MONDO:0100092","MONDO:0011416","MONDO:0011231","MONDO:0013741","MONDO:0013665","MONDO:0012346","MONDO:0012224","MONDO:0012226","MONDO:0007713","MONDO:0014903","MONDO:0014734","MONDO:0013470","MONDO:0014517","MONDO:0020752","MONDO:0010918","MONDO:0011892","MONDO:0012707","MONDO:0024566","MONDO:0020772","MONDO:0012655","MONDO:0012705","MONDO:0011891","MONDO:0020759","MONDO:0007560","MONDO:0010899","MONDO:0010694","MONDO:0011844","MONDO:0011733","MONDO:0010429","MONDO:0009013","MONDO:0016160","MONDO:0013919","MONDO:0020853","MONDO:0014924","MONDO:0014925","MONDO:0012113","MONDO:0014328","MONDO:0014545","MONDO:0007365","MONDO:0008588","MONDO:0014167","MONDO:0011593","MONDO:0009077","MONDO:0012706","MONDO:0011297","MONDO:0009976","MONDO:0010608","MONDO:0009497","MONDO:0015345","MONDO:0011876","MONDO:0012946","MONDO:0024508","MONDO:0012618","MONDO:0012629","MONDO:0013629","MONDO:0014842","MONDO:0032662","MONDO:0032699","MONDO:0014815","MONDO:0013388","MONDO:0019448","MONDO:0014055","MONDO:0014150","MONDO:0009696","MONDO:0013322","MONDO:0008836","MONDO:0018097","MONDO:0014333","MONDO:0010652","MONDO:0010388","MONDO:0010451","MONDO:0010454","MONDO:0010317","MONDO:0010329","MONDO:0009186","MONDO:0013970","MONDO:0012723","MONDO:0016025","MONDO:0013581","MONDO:0008945"];
        component.apif29BioService.getSymptomsOfDisease(lang,diseases,0).subscribe(value => {
            console.log(value)
            //expect(value).toEqual(expectedSymptoms);
            if(Object.keys(value).length>0){
                for(var symptom in value){
                    for (var expectedSymptom in expectedSymptoms){
                        if(expectedSymptom==symptom){
                            expect(expectedSymptoms[expectedSymptom]).toEqual(value[symptom])
                        }
                    }
                }
                done();
            }
            else{
                expect(Object.keys(value).length).toBe(0)
                done();
            }
          });
    });

    //4. Get info of diseases
    it('Get info of diseases',(done: DoneFn) => {
        component.authService.setAuthenticated(environment.tokenTest)
        let diseases=["MONDO:0014639","MONDO:0014650","MONDO:0013103","MONDO:0007366","MONDO:0007367","MONDO:0014308","MONDO:0010898","MONDO:0011965","MONDO:0011990","MONDO:0010682","MONDO:0017949","MONDO:0011875","MONDO:0008041","MONDO:0060671","MONDO:0054847","MONDO:0011443","MONDO:0011461","MONDO:0011491","MONDO:0012843","MONDO:0011545","MONDO:0100092","MONDO:0011416","MONDO:0011231","MONDO:0013741","MONDO:0013665","MONDO:0012346","MONDO:0012224","MONDO:0012226","MONDO:0007713","MONDO:0014903","MONDO:0014734","MONDO:0013470","MONDO:0014517","MONDO:0020752","MONDO:0010918","MONDO:0011892","MONDO:0012707","MONDO:0024566","MONDO:0020772","MONDO:0012655","MONDO:0012705","MONDO:0011891","MONDO:0020759","MONDO:0007560","MONDO:0010899","MONDO:0010694","MONDO:0011844","MONDO:0011733","MONDO:0010429","MONDO:0009013","MONDO:0016160","MONDO:0013919","MONDO:0020853","MONDO:0014924","MONDO:0014925","MONDO:0012113","MONDO:0014328","MONDO:0014545","MONDO:0007365","MONDO:0008588","MONDO:0014167","MONDO:0011593","MONDO:0009077","MONDO:0012706","MONDO:0011297","MONDO:0009976","MONDO:0010608","MONDO:0009497","MONDO:0015345","MONDO:0011876","MONDO:0012946","MONDO:0024508","MONDO:0012618","MONDO:0012629","MONDO:0013629","MONDO:0014842","MONDO:0032662","MONDO:0032699","MONDO:0014815","MONDO:0013388","MONDO:0019448","MONDO:0014055","MONDO:0014150","MONDO:0009696","MONDO:0013322","MONDO:0008836","MONDO:0018097","MONDO:0014333","MONDO:0010652","MONDO:0010388","MONDO:0010451","MONDO:0010454","MONDO:0010317","MONDO:0010329","MONDO:0009186","MONDO:0013970","MONDO:0012723","MONDO:0016025","MONDO:0013581","MONDO:0008945"];
        component.apif29BioService.getInfoOfDiseases(diseases).subscribe(value => {
            console.log(value)
            if(Object.keys(value).length>0){
                for(var disease in value){
                    for (var expectedDisease in expectedInfoOfDiseases){
                        if(expectedDisease==disease){
                            expect(expectedInfoOfDiseases[expectedDisease]).toEqual(value[disease])
                        }
                    }
                }
                done();
            }
            else{
                expect(Object.keys(value).length).toBe(0)
                done();
            }
          });
    });

    afterEach(() => {
        fixture.destroy();
        TestBed.resetTestingModule();
    });




  
    
});