import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <span class="footer__name">ngx-digit-flow</span>
          <span class="footer__tag">Built for Angular 21</span>
        </div>
        <div class="footer__links">
          <a href="https://github.com/barvian/number-flow" target="_blank" rel="noopener">
            Inspired by number-flow
          </a>
          <span class="footer__dot">·</span>
          <a href="https://angular.dev" target="_blank" rel="noopener">Angular</a>
        </div>
        <p class="footer__copy">
          MIT License · Signals-first · Zero runtime dependencies
        </p>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
