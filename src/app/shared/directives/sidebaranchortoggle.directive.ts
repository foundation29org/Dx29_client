import { Directive, HostListener, Inject } from '@angular/core';

import { SidebarLinkDirective } from "./sidebarlink.directive";

@Directive({
  standalone: false,
  selector: "[appSidebarAnchorToggle]"
})
export class SidebarAnchorToggleDirective {
  protected navlink: SidebarLinkDirective;

  constructor(
    @Inject(SidebarLinkDirective) navlink: SidebarLinkDirective
  ) {
    this.navlink = navlink;
  }

  @HostListener("click")
  onClick() {
    this.navlink.toggle();
  }
}
