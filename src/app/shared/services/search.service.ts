import { Injectable } from '@angular/core';
@Injectable()
export class SearchService {

  constructor() {}

  search(items: any[], field: string, value: string): boolean {
    if (!items) return false;

    var element = items.filter(it => it[field] == value);
    if(element.length > 0 ){
      return true;
    }else{
      return false
    }

  }

  search2Levels(items: any[], field: string, field2: string, value: string): boolean {
    if (!items) return false;

    var element = items.filter(it => it[field][field2] == value);
    if(element.length > 0 ){
      return true;
    }else{
      return false
    }

  }


}
