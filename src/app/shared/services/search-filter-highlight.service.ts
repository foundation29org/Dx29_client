import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highlight'
})

@Injectable()
export class HighlightSearch implements PipeTransform {

    transform(value: any, args: any): any {
        if (!args) {return value;}
        var re = new RegExp(args, 'gi'); //'gi' for case insensitive and can use 'g' if you want the search to be case sensitive.
        return value.replace(re, "<mark class='actualPosition'>" + args + "</mark>");
    }

    transformAll(value: any, args: any): any {
        if (!args) {return value;}

        for(var i = 0; i < args.length; i++) {
          value = this.transform(value, args[i].args)
        }
        return value;
    }
}
