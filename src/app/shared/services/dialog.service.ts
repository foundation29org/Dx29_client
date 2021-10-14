import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class DialogService {
  public constructor(public translate : TranslateService) {
  }
  confirm(message?: string, text?: string): Promise<boolean> {
    /*const confirmation = window.confirm(message || 'Are you sure?');
    return Observable.of(confirmation);*/
    return new Promise((resolve, reject) => {
        Swal.fire({
        title: message,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#f9423a',
        confirmButtonText: this.translate.instant("generics.Yes"),
        cancelButtonText: this.translate.instant("generics.No, cancel"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false,
        reverseButtons: true
      }).then(result => {
        if (result.value) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
}