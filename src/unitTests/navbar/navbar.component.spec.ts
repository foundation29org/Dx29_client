// Imports for all tests
import { TestBed, async, ComponentFixture, inject } from '@angular/core/testing';

// Component import
import { NavbarComponent } from '../../../src/app/shared/navbar/navbar.component';

// External services for testing
import { TranslateModule } from "@ngx-translate/core";
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule, HttpRequest, HttpParams } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// Component particular imports
import { AuthService } from 'app/shared/auth/auth.service';
import { SortService} from 'app/shared/services/sort.service';
import { Router, RouterEvent } from '@angular/router';
import { PatientService } from 'app/shared/services/patient.service';
import { LayoutService } from 'app/shared/services/layout.service';
import { ConfigService } from 'app/shared/services/config.service';
import { Data } from 'app/shared/services/data.service';
import { NgbModal} from '@ng-bootstrap/ng-bootstrap';


// Imports for the execution
import { BehaviorSubject } from 'rxjs';
import "jquery"
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/filter'


// Authorization
import { AuthInterceptor } from 'app/shared/auth/auth.interceptor';

/*describe('NavbarComponent', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;
    let router: Router;
    const routerEvent$ = new BehaviorSubject<RouterEvent>(null);
    

    // Configuration
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports:[TranslateModule.forRoot(),HttpClientModule,HttpClientTestingModule,RouterTestingModule],
        declarations: [
            NavbarComponent
        ],
        providers: [
            LayoutService,ConfigService, AuthService, PatientService, NgbModal, SortService,Data
        ]
      }).compileComponents()
      router = TestBed.get(Router);
      (<any>router).events = routerEvent$.asObservable();
      spyOn(router,'navigate');
      //const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }));

    // Execution before each test
    beforeEach(() => {
        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(inject([HttpTestingController], (backend: HttpTestingController) => {
        backend.verify();
    }));

    // Test 1: Check component construction
    it('Test 1: Navbar should be created', async(inject([HttpTestingController],(backend: HttpTestingController) => {
        expect(component).toBeTruthy();
        backend.expectOne('http://localhost:8443/api/patients-all/undefined').flush(null, { status: 403, statusText: 'Forbidden' });

    })));

    // Test 2a: Share module
    it('Test 2a: Without http headers - inviteShare() behaviour', async(inject([HttpTestingController],(backend: HttpTestingController) => {
        //fixture.detectChanges();
        // Define inputs for testing
        component.email='testpatient@test.com';
        component.roleShare='User';
        component.selectedPatient= {patientName: "Margarita",sub: "b080eab58ffb3f805e3f94e57d582891ab059bc50de69c92ccad41de844995ab", surname: ""};
        //component.patients=[];
        // listpatients: [[patientName: "Margarita", sub: "b080eab58ffb3f805e3f94e57d582891ab059bc50de69c92ccad41de844995ab", surname: ""]]
        //component.loadPatients();
        component.patients=[{patientName: "Margarita", sub: "b080eab58ffb3f805e3f94e57d582891ab059bc50de69c92ccad41de844995ab", surname: ""}]
        //component.permissions;
        component.permissions.shareEmr = true;
        component.permissions.askFirst = false;
        component.permissions.shareWithAll = false;
        component.isMine=true;
        //component.listOfSharingAccounts;
        //component.loadDataFromSharingAccounts();

        // Execute the function
        component.inviteShare();
        backend.expectOne('http://localhost:8443/api/shareorinvite').flush(null, { status: 403, statusText: 'Forbidden' });
        backend.expectOne('http://localhost:8443/api/patients-all/undefined').flush(null, { status: 403, statusText: 'Forbidden' });

        //backend.expectOne('*///api/sharingaccountsclinical').flush(null, { status: 403, statusText: 'Forbidden' });
        //expect(component.sending).toBeFalsy();
    /*})));

    // Test 2b: Share module
    it('Test 2b: With http headers - inviteShare() behaviour', async(inject([HttpTestingController],(backend: HttpTestingController) => {
        //fixture.detectChanges();
        // Define inputs for testing
        component.email='testpatient@test.com';
        component.roleShare='User';
        component.selectedPatient= {patientName: "Margarita",sub: "b080eab58ffb3f805e3f94e57d582891ab059bc50de69c92ccad41de844995ab", surname: ""};
        //component.patients=[];
        // listpatients: [[patientName: "Margarita", sub: "b080eab58ffb3f805e3f94e57d582891ab059bc50de69c92ccad41de844995ab", surname: ""]]
        //component.loadPatients();
        component.patients=[{patientName: "Margarita", sub: "b080eab58ffb3f805e3f94e57d582891ab059bc50de69c92ccad41de844995ab", surname: ""}]
        //component.permissions;
        component.permissions.shareEmr = true;
        component.permissions.askFirst = false;
        component.permissions.shareWithAll = false;
        component.isMine=true;
        //component.listOfSharingAccounts;
        //component.loadDataFromSharingAccounts();

        // Execute the function
        component.inviteShare();
        backend.expectOne('http://localhost:8443/api/shareorinvite').flush(null, { status: 403, statusText: 'Forbidden' });
        backend.expectOne('http://localhost:8443/api/patients-all/undefined').flush(null, { status: 403, statusText: 'Forbidden' });

        //backend.expectOne('*///api/sharingaccountsclinical').flush(null, { status: 403, statusText: 'Forbidden' });
        //expect(component.sending).toBeFalsy();
    /*})));
    
  });*/
