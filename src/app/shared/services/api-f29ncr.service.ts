import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class Apif29NcrService {

    constructor(private http: HttpClient) {}

    getAnnotate_batch(segments){
        return this.http.post(environment.api+'/api/annotate_batch', segments)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getNoSegmentation(medicalText){
        return this.http.post(environment.ncrService, medicalText)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
}
