import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';

@Injectable()
export class Apif29NcrService {

    constructor(private http: HttpClient) {}

    getAnnotate_batch(segments){
        return this.http.post(environment.api+'/api/annotate_batch', segments);
    }

    getNoSegmentation(medicalText){
        var callJson= {"data":medicalText};
        return this.http.post(environment.ncrService, callJson);
    }
}
