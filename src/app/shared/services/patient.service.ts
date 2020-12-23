import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class PatientService {
    constructor(private authService: AuthService, private http: HttpClient) {}

    getPatientId(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
        .map( (res : any) => {
          if(res.listpatients.length>0){
            this.authService.setPatientList(res.listpatients);
            this.authService.setCurrentPatient(res.listpatients[0]);
            return this.authService.getCurrentPatient();
          }else{
            return null;
          }
         }, (err) => {
           console.log(err);
         })
    }

    getPatientsClinical(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
        .map( (res : any) => {
          if(res.listpatients.length>0){
            this.authService.setPatientList(res.listpatients);
            /*
            if(this.authService.getCurrentPatient()==null){
              this.authService.setCurrentPatient(res.listpatients[0]);
            }
            */
            return res.listpatients;
          }else{
            return [];
          }
         }, (err) => {
           console.log(err);
         })
    }

    getPatientsClinicalSuperAdmin(idUser){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/patients-all/'+idUser)
        .map( (res : any) => {
          if(res.listpatients.length>0){
            this.authService.setPatientList(res.listpatients);
            /*
            if(this.authService.getCurrentPatient()==null){
              this.authService.setCurrentPatient(res.listpatients[0]);
            }
            */
            return res.listpatients;
          }else{
            return [];
          }
         }, (err) => {
           console.log(err);
         })
    }

}
