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
          <a class="nav-link" routerLink="/docs"  routerLinkActive="is-active">docs</a>
          <a class="nav-link nav-ext"
             href="https://github.com/ayangabryl/ngx-digit-flow"
             target="_blank" rel="noopener noreferrer">GitHub&nbsp;↗</a>
        </nav>
      </header>
      <div class="outlet">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100dvh; overflow: hidden; }

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
    .wordmark:hover { color: var(--muted); }

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
    .nav-link.is-active { color: var(--ink); }

    .outlet {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    @media (max-width: 600px) {
      .top-bar { padding: 0 20px; }
      .nav { gap: 16px; }
      .nav-ext { display: none; }
    }
  `],
})
export class App {}
