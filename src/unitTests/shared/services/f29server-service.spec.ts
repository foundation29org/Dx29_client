// Imports for all tests
import { TestBed,ComponentFixture, fakeAsync, tick, inject } from '@angular/core/testing';

// Component import
import {DiagnosisComponent} from '../../../app/clinical/diagnosis/diagnosis.component'


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
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import { NgxHotjarService } from 'ngx-hotjar';
import { TextTransform } from 'app/shared/services/transform-text.service';
import { TokenService } from 'app/shared/auth/token.service';

// Files
import * as expectedConditionsData from 'unitTests/shared/services/Jsons/expectedConditions.json';


describe('[F29 api server]',  () => {

    let component: DiagnosisComponent;
    let fixture: ComponentFixture<DiagnosisComponent>;
    
    let expectedConditions=expectedConditionsData.diseases;
    let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

    // Configuration
    beforeEach(() => {
       TestBed.configureTestingModule({
        imports:[HttpClientModule,ToastrModule.forRoot(),TranslateModule.forRoot(),RouterTestingModule.withRoutes(
            [{path: 'clinical/dashboard/home', component: DiagnosisComponent},{path:'.',component:DiagnosisComponent}]),FormsModule],
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
        //fixture.detectChanges();
    });


    
    it('Get related conditions f29 server',(done: DoneFn) => {
        let hpos=['HP:0001250'];
        component.authService.setAuthenticated(environment.tokenTest)
        component.apiDx29ServerService.getRelatedConditions(hpos).subscribe(
            () => {
                fail('Fail getRelatedConditions request');
            },
            (value) => {
                console.log(value)
                //expect(value).toEqual(expectedConditions);
                if(Object.keys(value).length>0){
                    for(var condition in value){
                        for (var expectedCondition in expectedConditions){
                            if(expectedConditions[expectedCondition].name.id==value[condition].name.id){
                                expect(expectedConditions[expectedCondition]).toEqual(value[condition])
                            }
                        }
                    }
                    done();
                }
                else{
                    expect(Object.keys(value).length).toBe(0)
                    done();
                }
            }
        );
    });

    afterEach(() => {
        fixture.destroy();
        TestBed.resetTestingModule();
      });

});