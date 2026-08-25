import { Directive, HostListener } from '@angular/core';

import * as screenfull from 'screenfull';

@Directive({
  standalone: false,
  selector: '[appToggleFullscreen]'
})
export class ToggleFullscreenDirective {

  @HostListener('click') onClick() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  }
}
