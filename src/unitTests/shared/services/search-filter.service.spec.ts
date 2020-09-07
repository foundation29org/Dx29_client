// Imports for all tests
import { TestBed, async, ComponentFixture } from '@angular/core/testing';

// Component import
import {NodiagnosisComponent} from '../../../../src/app/user/dashboard/nodiagnosis/nodiagnosis.component'

// External services for testing
import { TranslateModule } from "@ngx-translate/core";
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Component particular imports
import {SearchFilterPipe} from '../../../../src/app/shared/services/search-filter.service';
import { ToastrModule } from 'ngx-toastr';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { SortService} from 'app/shared/services/sort.service';
import { PatientService } from 'app/shared/services/patient.service';
import { SearchService } from 'app/shared/services/search.service';
import { BlobStorageService } from 'app/shared/services/blob-storage.service';
import { BlobStoragePedService } from 'app/shared/services/blob-storage-ped.service';
import { HighlightSearch} from 'app/shared/services/search-filter-highlight.service';
import { TextTransform } from 'app/shared/services/transform-text.service';
import { DateService } from 'app/shared/services/date.service';
import { Data} from 'app/shared/services/data.service';
import { FormBuilder } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgxHotjarService } from 'ngx-hotjar';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { TokenService } from 'app/shared/auth/token.service';
import { DatePipe } from '@angular/common';
import { doesNotMatch } from 'assert';

describe('Unit test: Search Filter Pipe Service functions: using no diagnosis patient', () => {
    let component: NodiagnosisComponent;
    let fixture: ComponentFixture<NodiagnosisComponent>;

    // Configuration

    beforeEach(( () => {
      TestBed.configureTestingModule({
        imports:[HttpClientModule,HttpClientTestingModule,ToastrModule.forRoot(),TranslateModule.forRoot(),RouterTestingModule],
        declarations: [
            NodiagnosisComponent
        ],
        providers: [AuthService,AuthGuard,SortService,PatientService,Data,FormBuilder,NgbModal,Apif29BioService,Apif29NcrService,NgxHotjarService,SearchService,DateService,BlobStorageService,BlobStoragePedService,SearchFilterPipe,HighlightSearch,TextTransform,ApiDx29ServerService,TokenService,DatePipe]
      }).compileComponents()
    }));

    // Execution before each test
    beforeEach( () => {
        fixture = TestBed.createComponent(NodiagnosisComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Transform function without accents',  () => {
        var listItems=[{id:"prueba1_value1"},{id:"prueba1_value2"},{id:"prueba1_value3"}];
        var key="id";
        var valueToFind="prueba1_value1"
        var result = component.searchFilterPipe.transform(listItems,key,valueToFind);
        expect(result[0].id).toEqual(valueToFind)
    });

    it('Transform function with accents',  () => {
        var listItemsAccents=[]
        listItemsAccents.push({"id":"prueba2_epiléptico"})
        listItemsAccents.push({"id":"prueba2_value2"})
        listItemsAccents.push({"id":"prueba2_value3"})
        var key="id";
        var valueToFind="prueba2_epileptico"
        var resultAccents =  component.searchFilterPipe.transform(listItemsAccents,key,valueToFind);
        expect(resultAccents[0].id).toEqual("prueba2_epiléptico");
    });

    it('Transform Diseases function without accents',  () => {
        var listItemsDisease=[]
        listItemsDisease.push({id2:"prueba3_epileptico",synonyms:["lalala"]})
        listItemsDisease.push({id2:"prueba3_value2",synonyms:["lalala"]})
        listItemsDisease.push({id2:"prueba3_value3",synonyms:["lalala"]})
        var key="id2";
        var valueToFindAccents="prueba3_epileptico"
        var resultDiseases = component.searchFilterPipe.transformDiseases(listItemsDisease,key,valueToFindAccents);
        expect(resultDiseases[0].id2).toEqual(valueToFindAccents)
    });

    it('Transform Diseases function with accents',  () => {
        var listItemnsAccentsDisease=[]
        listItemnsAccentsDisease.push({id2:"prueba4_epiléptico",synonyms:["lalala"]})
        listItemnsAccentsDisease.push({id2:"prueba4_value2",synonyms:["lalala"]})
        listItemnsAccentsDisease.push({id2:"prueba4_value3",synonyms:["lalala"]})
        var key="id2";
        var valueToFindAccents="prueba4_epileptico"
        var resultAccentsDisease = component.searchFilterPipe.transformDiseases(listItemnsAccentsDisease,key,valueToFindAccents);
        expect(resultAccentsDisease[0].id2).toEqual("prueba4_epiléptico")
    });
  });