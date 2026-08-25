import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';

@Injectable()
export class ApiDx29ServerService {
    constructor(private http: HttpClient) {}

    getDetectLanguage(text){
      var jsonText = [{ "text": text }];
      return this.http.post(environment.api+'/api/getDetectLanguage', jsonText);
    }
    getTranslationDictionary(text){
      var jsonText = [{ "text": text }];
      return this.http.post(environment.api+'/api/getTranslationDictionary', jsonText);
    }

    calculate(info, lang) {
      return this.http.post(environment.api + '/api/gateway/Diagnosis/calculate/'+lang, info);
    }

    searchDiseases(info) {
      return this.http.post(environment.api + '/api/gateway/search/disease/', info);
    }

    searchSymptoms(info) {
      return this.http.post(environment.api + '/api/gateway/search/symptoms/', info);
    }

    sendEmailResultsUndiagnosed(info) {
      return this.http.post(environment.api + '/api/sendEmailResultsUndiagnosed', info);
    }

    sendEmailResultsDiagnosed(info) {
      return this.http.post(environment.api + '/api/sendEmailResultsDiagnosed', info);
    }

    sendEmailRevolution(info) {
      return this.http.post(environment.api + '/api/sendEmailRevolution', info);
    }

    createblobOpenDx29(symptoms) {
      return this.http.post(environment.api + '/api/blobOpenDx29', symptoms);
    }

    createblobOpenDx29Timeline(symptoms) {
      return this.http.post(environment.api + '/api/blobOpenDx29Timeline', symptoms);
    }

    chekedSymptomsOpenDx29(info) {
      return this.http.post(environment.api + '/api/chekedSymptomsOpenDx29', info);
    }

    searchwiki(info) {
      return this.http.post(environment.api + '/api/wiki', info);
    }

    searchwikiSearch(info) {
      return this.http.post(environment.api + '/api/wikiSearch', info);
    }

    getPatientGroups(idDisease) {
      return this.http.get(environment.api + '/api/patientgroups/'+idDisease);
    }
}
