// Imports for all tests
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

// Component import
import {AdminGTPComponent} from '../../../../src/app/admin/dashboard/adminGTP/adminGTP.component';

// External services for testing
import { TranslateModule } from "@ngx-translate/core";
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Component particular imports
import { AuthService } from 'app/shared/auth/auth.service';
import { delay } from 'rxjs/operators';

// Imports for the execution

describe('Unit test: Admin GTP', () => {
  let component: AdminGTPComponent;
  let fixture: ComponentFixture<AdminGTPComponent>;
  
  // Configuration
  beforeEach((() => {
    TestBed.configureTestingModule({
      imports:[HttpClientModule,HttpClientTestingModule,TranslateModule.forRoot(),RouterTestingModule],
      declarations: [
        AdminGTPComponent
      ],
      providers: [AuthService]
    }).compileComponents()
  }));

  // Execution before each test
  beforeEach(() => {
      fixture = TestBed.createComponent(AdminGTPComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

  });

  it('Admin-adminGTP dashboard component created', () => {
    expect(component).toBeTruthy();
  });

  it('Admin-adminGTP createTable:without info', () => {
    var table = component.createTable();
    expect(table).toBeDefined();
  });

  it('Admin-adminGTP loadGTPData: lists with programs info defined', () => {
    component.authService.setIdUser("091c79c1d032708c99b66dba6adf40f68636f5c599bb41502351f6b38f739b1d")
    component.loadGTPData();
    expect(component.programsInfo).toBeDefined();
    expect(component.programsInfoNotPatient).toBeDefined();
  });
});

