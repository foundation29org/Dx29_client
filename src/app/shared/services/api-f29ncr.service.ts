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

    constructor(private authService: AuthService, private http: HttpClient) {}

    getAnnotate_batch(segments){
        let headers = new HttpHeaders().set('Authorization', 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxOTdmN2YyNmJhOTE3YmI5ZmYwNWYyNWQ2YmQzYTk3NzJhZjk2ZjJjMDk4YmUwYzY2YWVhYjQyYzVmZmJjZmQ4IiwiaWF0IjoxNjI0ODc2MjY4LCJleHAiOjE2NTY0MTIyNjgsInJvbGUiOiJDbGluaWNhbCIsImdyb3VwIjoiTm9uZSJ9.7v2Jvw4Q2mkIrF2uRDbt6bAt8eDwgfl9idnVPo_cfv4'); // create header object
        return this.http.post(environment.api+'/api/annotate_batch', segments, { headers: headers })
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
