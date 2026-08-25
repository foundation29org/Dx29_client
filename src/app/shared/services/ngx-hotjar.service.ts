import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NgxHotjarService {
  trigger(scenario: string): void {
    const hj = (window as any).hj;
    if (typeof hj === 'function') {
      hj('trigger', scenario);
    }
  }
}
