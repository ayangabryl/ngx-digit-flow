import { Component, computed, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DigitFlowComponent } from 'ngx-digit-flow';

const SHOWCASE = [1000000, 42, 3.14159, 99.9, 1234567.89, 0, 888888];

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [DigitFlowComponent],
  template: `
    <section class="hero">
      <div class="hero__badge">Angular 21 · Signals-first · Zero deps</div>

      <h1 class="hero__title">
        Numbers that<br>
        <span class="hero__title--accent">feel alive</span>
      </h1>

      <p class="hero__subtitle">
        Individual digit animations for Angular — powered by Web Animations API
        and <code>Intl.NumberFormat</code>. No dependencies. SSR-safe.
      </p>

      <div class="hero__demo">
        <ngx-digit-flow
          [value]="heroValue()"
          [format]="heroFormat"
          [duration]="800"
          class="hero__number"
        />
      </div>

      <div class="hero__actions">
        <a class="btn btn--primary" href="#install">Get started</a>
        <a class="btn btn--ghost" href="#examples">See examples</a>
      </div>

      <div class="hero__scroll-hint">scroll to explore</div>
    </section>
  `,
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private index      = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  heroFormat: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  };

  heroValue = computed(() => SHOWCASE[this.index()]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.timer = setInterval(() => {
        this.index.update(i => (i + 1) % SHOWCASE.length);
      }, 2200);
    }
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
