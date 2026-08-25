import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { SortService} from 'app/shared/services/sort.service';
import { map } from 'rxjs/operators';

@Injectable()
export class LangService {

    langs: any = [];

    constructor(public translate : TranslateService, private http: HttpClient, private sortService: SortService) {}

    getLangs(){
      return this.http.get(environment.api+'/api/langs')
        .pipe(map( (res : any) => {
            this.langs = res;
            res.sort(this.sortService.GetSortOrder("name"));
            return res;
         }));
    }

    getAllLangs(){
      return this.http.get('assets/jsons/all-languages.json');
    }

    loadDataJson(lang: string){
      return this.http.get(environment.api+'/assets/i18n/'+lang+'.json')
        .pipe(map( (res : any) => {
            return { lang: lang, jsonData: res };
         }));
    }
}
