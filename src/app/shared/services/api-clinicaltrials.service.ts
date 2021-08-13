import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class ApiClinicalTrialsService {

    constructor(private http: HttpClient) {}

    getClinicalTrials(name){
        return this.http.get('https://clinicaltrials.gov/api/query/full_studies?expr='+name+'&fmt=json')
        //return this.http.get('https://clinicaltrials.gov/api/query/field_values?expr='+name+'&field=Condition&fmt=json')
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
}
