import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: (input: RequestInfo | URL) =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ stargazers_count: 42 }),
          url: String(input),
        }),
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: originalFetch,
    });
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app shell navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.wordmark')?.textContent).toContain('ngx-digit-flow');
    expect(
      [...compiled.querySelectorAll('.nav-link')].map((link) => link.textContent?.trim()),
    ).toEqual(['demos', 'docs', 'GitHub 42']);
    expect(compiled.querySelector('.github-mark')).toBeTruthy();
  });
});
