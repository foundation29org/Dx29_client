import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
 name: 'searchfilter'
})

@Injectable()
export class SearchFilterPipe implements PipeTransform {
 transform(items: any[], field: string, value: string): any[] {
   if (!items) return [];
   return items.filter(it => it[field] == value);
 }

 transformDiseases(items: any[], field: string, value: string): any[] {

   if (!items) {return [];}
   var resul = [];
   for(var i = 0; i < items.length; i++) {
     var temp = items[i][field].toLowerCase();
     if(temp.indexOf(value.toLowerCase()) != -1){
       resul.push(items[i]);
     }else{
       var enc = false;
       for(var j = 0; j < items[i].synonyms.length && !enc; j++) {
         var temp2 = items[i].synonyms[j].toLowerCase();
         if(temp2.indexOf(value.toLowerCase()) != -1){
           enc = true;
           resul.push(items[i]);
         }
       }

     }
   }
   return resul;
 }
}
