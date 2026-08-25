import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable()
export class ApiExternalServices {

    constructor(private http: HttpClient) {}

    getClinicalTrials(name){
        return this.http.get('https://classic.clinicaltrials.gov/api/query/full_studies?expr='+name+'&fmt=json&max_rnk=50');
    }

    getFromWiki(text, lang){
        return this.http.get('https://'+lang+'.wikipedia.org/w/rest.php/v1/page/'+text);
    }

    getInfoLocation(){
        return this.http.get('https://ipinfo.io?token=77f94ec6489670');
    }
}
