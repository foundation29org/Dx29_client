// Imports for all tests
import { TestBed, async, ComponentFixture } from '@angular/core/testing';

// Component import
import {DiagnosisComponent} from '../../../src/app/clinical/diagnosis/diagnosis.component';

// External services for testing
import { TranslateModule } from "@ngx-translate/core";
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Component particular imports
import { ExomiserService } from '../../../src/app/shared/services/exomiser.service';
import { ToastrModule } from 'ngx-toastr';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { PatientService } from 'app/shared/services/patient.service';
import { BlobStorageService } from 'app/shared/services/blob-storage.service';
import { BlobStoragePedService } from 'app/shared/services/blob-storage-ped.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { HighlightSearch} from 'app/shared/services/search-filter-highlight.service';
import { TextTransform } from 'app/shared/services/transform-text.service';
import { TokenService } from 'app/shared/auth/token.service';


// Imports for the execution

// Authorization

describe('Unit test: Exomiser Service functions', () => {
    let component: DiagnosisComponent;
    let fixture: ComponentFixture<DiagnosisComponent>;

    // Configuration
    beforeEach((() => {
      TestBed.configureTestingModule({
        imports:[HttpClientModule,HttpClientTestingModule,ToastrModule.forRoot(),TranslateModule.forRoot(),RouterTestingModule],
        declarations: [
          DiagnosisComponent
        ],
        providers: [AuthService,ExomiserService,AuthGuard,SortService,PatientService,SearchService,BlobStorageService,BlobStoragePedService,SearchFilterPipe,HighlightSearch,TextTransform,TokenService]
      }).compileComponents()
    }));

    // Execution before each test
    beforeEach(() => {
        fixture = TestBed.createComponent(DiagnosisComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Clinical Diagnosis component created', () => {
      expect(component).toBeTruthy();
    });

    it('Set actual token', () => {
        component.exomiserService.setActualToken("123");
        expect(component.exomiserService.actualToken).toEqual("123");
    });

    it('Get actual token', () => {
       let actualToken = component.exomiserService.getActualToken();
       expect(actualToken).toEqual(component.exomiserService.actualToken);
    });
  });

  /*describe('Unit test: Clinical diagnosis exomiser functions', () => {
    let component: DiagnosisComponent;
    let fixture: ComponentFixture<DiagnosisComponent>;

    // Configuration
    beforeEach((() => {
      TestBed.configureTestingModule({
        imports:[HttpClientModule,HttpClientTestingModule,ToastrModule.forRoot(),TranslateModule.forRoot(),RouterTestingModule],
        declarations: [
          DiagnosisComponent
        ],
        providers: [AuthService,ExomiserService,AuthGuard,SortService,PatientService,SearchService,BlobStorageService,BlobStoragePedService,SearchFilterPipe,HighlightSearch]
      }).compileComponents()
    }));

    // Execution before each test
    beforeEach(() => {
        fixture = TestBed.createComponent(DiagnosisComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Clinical Diagnosis component created', () => {
      expect(component).toBeTruthy();
    });
  });*/
