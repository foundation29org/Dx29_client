import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ApiExternalServices {

    constructor(private http: HttpClient) {}

    getClinicalTrials(name){
        return this.http.get('https://classic.clinicaltrials.gov/api/query/full_studies?expr='+name+'&fmt=json&max_rnk=50')
        //return this.http.get('https://classic.clinicaltrials.gov/api/query/field_values?expr='+name+'&field=Condition&fmt=json')
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getFromWiki(text, lang){
        return this.http.get('https://'+lang+'.wikipedia.org/w/rest.php/v1/page/'+text)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getInfoLocation(){
        return this.http.get('https://ipinfo.io?token=77f94ec6489670')
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
}
