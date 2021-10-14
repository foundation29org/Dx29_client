import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class ApiDx29ServerService {
    constructor(private authService: AuthService, private http: HttpClient) {}

    getRelatedConditions(jsonHpos){
      return this.http.post(environment.api+'/api/phenotype/conditions/100', jsonHpos)
        .map( (res : any) => {
          return res["diseases"];
         }, (err) => {
           console.log(err);
           return err;
         })
    }

    getSymptoms(id){
      return this.http.get(environment.api+'/api/phenotypes/'+id)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
           return err;
         })
    }

    getPendingJobs(patientId){
      var date = Date.now();
      return this.http.get(environment.api+'/api/patients/pendingJobs/'+patientId+'&'+date)
      .map( (res : any) => {
        return res;
       }, (err) => {
         console.log(err);
         return err;
       })
    }

    setPendingJobs(patientId,token){
      var body={pendingJob:token,pendingJobType:"exomiser"}
      return this.http.put(environment.api+'/api/patients/pendingJobs/'+patientId,body)
      .map( (res : any) => {
        return res;
       }, (err) => {
         console.log(err);
         return err;
       })
    }

    deletePendingJob(patientId,token,type){
      var body={pendingJob:token,pendingJobType:type}
      return this.http.put(environment.api+'/api/patients/deletePendingJobs/'+patientId,body)
      .map( (res : any) => {
        return res;
       }, (err) => {
         console.log(err);
         return err;
       })
    }

    moveCorruptedVCF(patientId,filename){
      var body = {filename:filename}
      return this.http.post(environment.api+'/api/exomizerservices/moveCorruptedVCF/'+patientId,body)
      .map( (res : any) => {
        return res;
       }, (err) => {
         console.log(err);
         return err;
       })
    }

    getDetectLanguage(text){
      var jsonText = [{ "text": text }];
        return this.http.post(environment.api+'/api/getDetectLanguage', jsonText)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
    getTranslationDictionary(text){
      var jsonText = [{ "text": text }];
        return this.http.post(environment.api+'/api/getTranslationDictionary', jsonText)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getAzureBlobSasToken(containerName){
        return this.http.get(environment.api+'/api/getAzureBlobSasTokenWithContainer/'+containerName)
        .map( (res : any) => {
            return res.containerSAS;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    lauchPhene2Gene(patientId, data){
        return this.http.post(environment.api+'/api/phen2Gene/'+patientId, data)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getLastPhen2GenesResults(patientId){
        return this.http.get(environment.api+'/api/lastPhen2Gene/'+patientId)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    calculate(info, lang) {
      return this.http.post(environment.api + '/api/gateway/Diagnosis/calculate/'+lang, info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    searchDiseases(info) {
      return this.http.post(environment.api + '/api/gateway/search/disease/', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    searchSymptoms(info) {
      return this.http.post(environment.api + '/api/gateway/search/symptoms/', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    sendEmailResultsUndiagnosed(info) {
      return this.http.post(environment.api + '/api/sendEmailResultsUndiagnosed', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    sendEmailResultsDiagnosed(info) {
      return this.http.post(environment.api + '/api/sendEmailResultsDiagnosed', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    sendEmailRevolution(info) {
      return this.http.post(environment.api + '/api/sendEmailRevolution', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    createblobOpenDx29(symptoms) {
      return this.http.post(environment.api + '/api/blobOpenDx29', symptoms)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    createblobOpenDx29Timeline(symptoms) {
      return this.http.post(environment.api + '/api/blobOpenDx29Timeline', symptoms)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    chekedSymptomsOpenDx29(info) {
      return this.http.post(environment.api + '/api/chekedSymptomsOpenDx29', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }
    
    searchwiki(info) {
      return this.http.post(environment.api + '/api/wiki', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    searchwikiSearch(info) {
      return this.http.post(environment.api + '/api/wikiSearch', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    getPatientGroups(idDisease) {
      return this.http.get(environment.api + '/api/patientgroups/'+idDisease)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

}
