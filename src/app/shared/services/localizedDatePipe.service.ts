import { DatePipe } from '@angular/common';
import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'localizedDate',
    pure: false
})

@Injectable()
export class LocalizedDatePipe implements PipeTransform {
    constructor() {
    }
    transform(value: any, pattern: string, lang: string): any {
        var localeLang = 'en-US'
        if(lang=='es'){
            localeLang = 'es-ES'
        }
        const datePipe: DatePipe = new DatePipe(localeLang);
        return datePipe.transform(value, pattern);
      }
}
//mediumDate