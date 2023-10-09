import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

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
        var callJson= {"data":medicalText};
        return this.http.post(environment.ncrService, callJson)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
}
