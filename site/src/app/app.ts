import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="top-bar">
        <a class="wordmark" routerLink="/">ngx-digit-flow</a>
        <nav class="nav">
          <a class="nav-link" routerLink="/demos" routerLinkActive="is-active">demos</a>
          <a class="nav-link" routerLink="/docs" routerLinkActive="is-active">docs</a>
          <a
            class="nav-link nav-ext github-link"
            href="https://github.com/ayangabryl/ngx-digit-flow"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ngx-digit-flow on GitHub, 13 stars"
          >
            <svg class="github-mark" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.24.49-2.71-1.08-2.71-1.08-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.79-.2-3.67-.89-3.67-3.98 0-.88.31-1.6.83-2.16-.08-.2-.36-1.02.08-2.13 0 0 .68-.22 2.2.82A7.66 7.66 0 0 1 8 3.84c.68 0 1.36.09 2 .27 1.52-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.52.56.83 1.28.83 2.16 0 3.1-1.89 3.77-3.69 3.97.29.25.55.74.55 1.49v2.17c0 .21.14.46.55.38A8 8 0 0 0 8 0Z"
              />
            </svg>
            <span>GitHub</span>
            <span class="github-stars" aria-label="13 stars">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M8 1.2 9.9 5l4.2.61-3.05 2.97.72 4.2L8 10.8l-3.77 1.98.72-4.2L1.9 5.61 6.1 5 8 1.2Z"
                />
              </svg>
              13
            </span>
          </a>
        </nav>
      </header>
      <div class="outlet">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100dvh;
        overflow: hidden;
      }

      .shell {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .top-bar {
        flex-shrink: 0;
        height: 52px;
        padding: 0 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #fff;
        border-bottom: 1px solid oklch(91% 0.001 265);
      }

      .wordmark {
        font-family: var(--mono);
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.01em;
        color: var(--ink);
        text-decoration: none;
        transition: color 0.15s;
      }
      .wordmark:hover {
        color: var(--muted);
      }

      .nav {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .nav-link {
        font-family: var(--font);
        font-size: 14px;
        font-weight: 500;
        color: var(--muted);
        text-decoration: none;
        transition: color 0.15s;
      }
      .nav-link:hover,
      .nav-link.is-active {
        color: var(--ink);
      }

      .github-link {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 8px 5px 7px;
        border: 1px solid oklch(90% 0.004 265);
        border-radius: 999px;
        color: var(--ink);
        background: oklch(99% 0.002 265);
      }
      .github-link:hover {
        border-color: oklch(76% 0.006 265);
        background: #fff;
      }
      .github-mark {
        width: 15px;
        height: 15px;
        fill: currentColor;
        flex: 0 0 auto;
      }
      .github-stars {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding-left: 7px;
        border-left: 1px solid oklch(88% 0.005 265);
        font-family: var(--mono);
        font-size: 12px;
        color: var(--muted);
      }
      .github-stars svg {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }

      .outlet {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;
      }

      @media (max-width: 600px) {
        .top-bar {
          padding: 0 20px;
        }
        .nav {
          gap: 16px;
        }
        .nav-ext {
          display: none;
        }
      }
    `,
  ],
})
export class App {}
