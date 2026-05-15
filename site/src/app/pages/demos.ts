import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DigitFlowComponent } from 'ngx-digit-flow';

@Component({
  selector: 'app-demos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DigitFlowComponent],
  templateUrl: './demos.html',
  styleUrl: './demos.scss',
})
export class DemosComponent implements OnInit, AfterViewInit {
  protected countdown = signal(30);
  protected countdownColor = computed(() => {
    const v = this.countdown();
    if (v > 15) return 'oklch(44% 0.18 145)';
    if (v > 8) return 'oklch(52% 0.20 65)';
    return 'oklch(48% 0.22 25)';
  });
  protected countdownRingOffset = computed(() => 2 * Math.PI * 28 * (1 - this.countdown() / 30));
  protected score = signal(0);
  protected scoreBest = signal(0);
  protected scoreTrend = signal<'up' | 'down' | 'neutral'>('neutral');
  protected scoreDelta = signal(0);
  private scoreTrendTimer: ReturnType<typeof setTimeout> | null = null;

  protected compactFmt: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
  } as Intl.NumberFormatOptions;

  // XP / Level card
  private readonly xpRequired = 6000;
  protected xpLevel = signal(12);
  protected xpCurrent = signal(4820);
  protected xpLeveling = signal(false);
  private xpLevelingTimer: ReturnType<typeof setTimeout> | null = null;
  protected xpFmt: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };
  protected xpPct = computed(() => Math.min(100, (this.xpCurrent() / this.xpRequired) * 100));
  protected xpPctDisplay = computed(() => Math.floor(this.xpPct()));
  protected xpToNext = computed(() => Math.max(0, this.xpRequired - this.xpCurrent()));

  protected progress = signal(0);
  protected progressPaused = signal(false);
  protected progressStyle = signal<'linear' | 'steps' | 'ring'>('linear');
  protected progressFmt: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

  protected progressSegments = computed(() =>
    Array.from({ length: 10 }, (_, i) => this.progress() >= (i + 0.5) / 10),
  );

  protected readonly ringCircumference = 2 * Math.PI * 28;
  protected ringOffset = computed(() => this.ringCircumference * (1 - this.progress()));

  // AAPL stock
  protected readonly ticker = 'AAPL';
  protected stockPrice = signal(182.5);
  protected trendUp = signal(true);
  protected trendPctNum = signal(0);
  private priceHistory = signal<number[]>([182.5]);

  protected stockFmt: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  };
  protected trendPctFmt: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  protected sparklinePoints = computed(() => {
    const prices = this.priceHistory();
    if (prices.length < 2) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 200,
      h = 56;
    const step = Math.max(1, Math.floor(prices.length / 15));
    const sampled = prices.filter((_, i) => i % step === 0 || i === prices.length - 1);
    return sampled
      .map((p, i) => {
        const x = (i / (sampled.length - 1)) * w;
        const y = h - ((p - min) / range) * (h - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  protected sparklineArea = computed(() => {
    const prices = this.priceHistory();
    if (prices.length < 2) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 200,
      h = 56;
    const step = Math.max(1, Math.floor(prices.length / 15));
    const sampled = prices.filter((_, i) => i % step === 0 || i === prices.length - 1);
    const pts = sampled.map((p, i) => {
      const x = (i / (sampled.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(' L ')} L 200,${h} L 0,${h} Z`;
  });

  // Slider
  protected sliderVal = signal(50_000);
  protected sliderFmt: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  };

  // Pricing tiers
  private pricingTiers = [
    { label: 'Starter', price: 9.99 },
    { label: 'Pro', price: 29.99 },
    { label: 'Business', price: 79.99 },
    { label: 'Enterprise', price: 199.0 },
  ];
  private pricingIdx = 0;
  protected pricingVal = signal(this.pricingTiers[0].price);
  protected pricingTier = signal(this.pricingTiers[0].label);
  protected pricingTierSlug = computed(() => this.pricingTier().toLowerCase());
  protected pricingFmt: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  };

  // Temperature
  protected tempCelsius = signal(true);
  private tempC = signal(22);
  protected tempDisplay = computed(() => {
    const c = this.tempC();
    return this.tempCelsius() ? c : parseFloat(((c * 9) / 5 + 32).toFixed(1));
  });
  protected tempFmt: Intl.NumberFormatOptions = { maximumFractionDigits: 1 };
  protected tempUnit = computed(() => (this.tempCelsius() ? ' °C' : ' °F'));
  protected tempColor = computed(() => {
    const c = this.tempC();
    if (c < 5) return 'oklch(52% 0.20 255)';
    if (c < 15) return 'oklch(50% 0.18 210)';
    if (c < 25) return 'oklch(46% 0.16 150)';
    if (c < 32) return 'oklch(52% 0.22 55)';
    return 'oklch(48% 0.24 25)';
  });
  protected tempCondition = computed(() => {
    const c = this.tempC();
    if (c < 0) return 'Freezing';
    if (c < 10) return 'Cold';
    if (c < 18) return 'Cool';
    if (c < 25) return 'Comfortable';
    if (c < 32) return 'Warm';
    return 'Hot';
  });
  protected thermPct = computed(() => {
    const MIN = -10,
      MAX = 45;
    return Math.min(100, Math.max(0, ((this.tempC() - MIN) / (MAX - MIN)) * 100));
  });

  // Transfer card
  protected readonly transferPairs = [
    {
      code: 'EUR',
      baseRate: 0.9245,
      fmt: {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
      } as Intl.NumberFormatOptions,
    },
    {
      code: 'GBP',
      baseRate: 0.7892,
      fmt: {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
      } as Intl.NumberFormatOptions,
    },
    {
      code: 'JPY',
      baseRate: 149.85,
      fmt: {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
      } as Intl.NumberFormatOptions,
    },
  ];
  protected transferPairIdx = signal(0);
  protected transferAmount = signal(1000);
  protected transferRate = signal(0.9245);
  protected transferPair = computed(() => this.transferPairs[this.transferPairIdx()]);
  protected transferFmt = computed(() => this.transferPairs[this.transferPairIdx()].fmt);
  protected transferRateFmt = computed(
    (): Intl.NumberFormatOptions =>
      this.transferPairs[this.transferPairIdx()].code === 'JPY'
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { minimumFractionDigits: 4, maximumFractionDigits: 4 },
  );
  protected transferReceive = computed(() => {
    const isJpy = this.transferPairs[this.transferPairIdx()].code === 'JPY';
    const raw = this.transferAmount() * this.transferRate();
    return isJpy ? Math.round(raw) : parseFloat(raw.toFixed(2));
  });
  protected transferSendFmt: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  protected localeOptions = [
    {
      label: 'USD',
      locale: 'en-US',
      currency: 'USD',
      flag: '🇺🇸',
      localeFmt: { style: 'currency', currency: 'USD' } as Intl.NumberFormatOptions,
    },
    {
      label: 'EUR',
      locale: 'de-DE',
      currency: 'EUR',
      flag: '🇩🇪',
      localeFmt: { style: 'currency', currency: 'EUR' } as Intl.NumberFormatOptions,
    },
    {
      label: 'JPY',
      locale: 'ja-JP',
      currency: 'JPY',
      flag: '🇯🇵',
      localeFmt: {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
      } as Intl.NumberFormatOptions,
    },
  ];
  protected localeStr = signal('en-US');
  protected localeFmt = computed(
    () => this.localeOptions.find((o) => o.locale === this.localeStr())!.localeFmt,
  );
  protected localeActive = computed(
    () => this.localeOptions.find((o) => o.locale === this.localeStr())!,
  );
  protected localeOthers = computed(() =>
    this.localeOptions.filter((o) => o.locale !== this.localeStr()),
  );
  protected localeNum = signal(1_234_567.89);

  // Social counter
  protected socialComments = signal(40);
  protected socialReposts = signal(2_100);
  protected socialLikes = signal(21_000);
  protected socialViews = signal(429_000);
  protected socialLiked = signal(false);

  // Cart
  protected cartQty1 = signal(1);
  protected cartQty2 = signal(2);
  protected cartFmt: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  };
  protected cartTotal = computed(() =>
    parseFloat((this.cartQty1() * 29.99 + this.cartQty2() * 9.99).toFixed(2)),
  );

  private destroyRef = inject(DestroyRef);
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private visibleCards = new Set<string>();
  private assumeCardsVisible = true;
  private cardObserver?: IntersectionObserver;
  private isMobileViewport = false;
  private pageVisible = true;

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      setTimeout(() => {
        this.assumeCardsVisible = false;
      }, 8000);
      return;
    }

    requestAnimationFrame(() => {
      this.assumeCardsVisible = false;
      const cards = this.elRef.nativeElement.querySelectorAll<HTMLElement>('[data-demo-card]');
      this.cardObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset['demoCard'];
            if (!id) continue;
            if (entry.isIntersecting) {
              this.visibleCards.add(id);
            } else {
              this.visibleCards.delete(id);
            }
          }
        },
        {
          root: null,
          rootMargin: this.isMobileViewport ? '0px 0px -18% 0px' : '200px 0px',
          threshold: this.isMobileViewport ? 0.35 : 0,
        },
      );

      cards.forEach((card) => this.cardObserver?.observe(card));
    });
    this.destroyRef.onDestroy(() => this.cardObserver?.disconnect());
  }

  ngOnInit() {
    const ids: ReturnType<typeof setInterval>[] = [];
    const doc = this.elRef.nativeElement.ownerDocument;
    const win = doc.defaultView;
    const mobileQuery = win?.matchMedia('(max-width: 640px)');
    const updateMobileState = () => {
      this.isMobileViewport = mobileQuery?.matches ?? (win?.innerWidth ?? 1024) < 640;
    };
    updateMobileState();
    mobileQuery?.addEventListener('change', updateMobileState);

    const updatePageVisibility = () => {
      this.pageVisible = doc.visibilityState === 'visible';
    };
    updatePageVisibility();
    doc.addEventListener('visibilitychange', updatePageVisibility);
    const mobileInterval = (desktopMs: number, mobileMs: number) =>
      this.isMobileViewport ? mobileMs : desktopMs;

    const countdownInterval = setInterval(
      () => {
        if (!this.shouldRunCard('countdown')) return;
        this.countdown.update((v) => (v <= 0 ? 30 : v - 1));
      },
      mobileInterval(600, 1000),
    );
    ids.push(countdownInterval);

    const xpInterval = setInterval(
      () => {
        if (!this.shouldRunCard('xp')) return;
        const gained = this.isMobileViewport
          ? Math.floor(Math.random() * 45 + 35)
          : Math.floor(Math.random() * 70 + 50);
        const next = this.xpCurrent() + gained;
        if (next >= this.xpRequired) {
          this.xpLevel.update((l) => l + 1);
          this.xpCurrent.set(next - this.xpRequired);
          this.xpLeveling.set(true);
          if (this.xpLevelingTimer) clearTimeout(this.xpLevelingTimer);
          this.xpLevelingTimer = setTimeout(() => {
            this.xpLeveling.set(false);
            this.xpLevelingTimer = null;
          }, 500);
        } else {
          this.xpCurrent.set(next);
        }
      },
      mobileInterval(900, 2600),
    );
    ids.push(xpInterval);

    const progressInterval = setInterval(
      () => {
        if (!this.shouldRunCard('progress')) return;
        if (!this.progressPaused()) {
          const step = this.isMobileViewport ? 0.05 : 0.025;
          this.progress.update((v) => (v >= 1 ? 0 : parseFloat((v + step).toFixed(3))));
        }
      },
      mobileInterval(200, 800),
    );
    ids.push(progressInterval);

    const stockInterval = setInterval(
      () => {
        if (!this.shouldRunCard('stock')) return;
        const prev = this.stockPrice();
        const change = (Math.random() - 0.48) * 4;
        const next = Math.max(100, parseFloat((prev + change).toFixed(2)));
        const pct = parseFloat(Math.abs(((next - prev) / prev) * 100).toFixed(2));
        this.trendUp.set(next >= prev);
        this.trendPctNum.set(pct);
        this.stockPrice.set(next);
        const historyLimit = this.isMobileViewport ? 15 : 29;
        this.priceHistory.update((h) => [...h.slice(-historyLimit), next]);
      },
      mobileInterval(2000, 5000),
    );
    ids.push(stockInterval);

    const pricingInterval = setInterval(
      () => {
        if (!this.shouldRunCard('pricing')) return;
        this.pricingIdx = (this.pricingIdx + 1) % this.pricingTiers.length;
        const tier = this.pricingTiers[this.pricingIdx];
        this.pricingTier.set(tier.label);
        this.pricingVal.set(tier.price);
      },
      mobileInterval(2500, 4500),
    );
    ids.push(pricingInterval);

    let tempPhase = 0;
    const tempInterval = setInterval(
      () => {
        if (!this.shouldRunCard('temperature')) return;
        tempPhase += 0.15;
        const c = parseFloat((22 + Math.sin(tempPhase) * 8).toFixed(1));
        this.tempC.set(c);
      },
      mobileInterval(800, 2200),
    );
    ids.push(tempInterval);

    const socialLikeInterval = setInterval(
      () => {
        if (!this.shouldRunCard('social')) return;
        this.socialLikes.update((v) => v + Math.floor(Math.random() * 12 + 4));
        this.socialViews.update((v) => v + Math.floor(Math.random() * 300 + 80));
      },
      mobileInterval(1200, 5000),
    );
    ids.push(socialLikeInterval);

    const socialRepostInterval = setInterval(
      () => {
        if (!this.shouldRunCard('social')) return;
        this.socialReposts.update((v) => v + Math.floor(Math.random() * 3 + 1));
      },
      mobileInterval(3500, 8000),
    );
    ids.push(socialRepostInterval);

    const socialCommentInterval = setInterval(
      () => {
        if (!this.shouldRunCard('social')) return;
        this.socialComments.update((v) => v + 1);
      },
      mobileInterval(6000, 12000),
    );
    ids.push(socialCommentInterval);

    const localeInterval = setInterval(
      () => {
        if (!this.shouldRunCard('locale')) return;
        this.localeNum.update((v) => parseFloat((v + Math.random() * 400 - 80).toFixed(2)));
      },
      mobileInterval(2800, 6000),
    );
    ids.push(localeInterval);

    let transferPhase = 0;
    const transferInterval = setInterval(
      () => {
        if (!this.shouldRunCard('transfer')) return;
        const pair = this.transferPairs[this.transferPairIdx()];
        transferPhase += 0.1;
        const base = pair.baseRate;
        const jpy = pair.code === 'JPY';
        const rate = jpy
          ? parseFloat((base + Math.sin(transferPhase) * base * 0.003).toFixed(2))
          : parseFloat((base + Math.sin(transferPhase) * base * 0.003).toFixed(4));
        this.transferRate.set(rate);
      },
      mobileInterval(1100, 4500),
    );
    ids.push(transferInterval);

    const handleDestroy = () => {
      ids.forEach((id) => clearInterval(id));
      mobileQuery?.removeEventListener('change', updateMobileState);
      doc.removeEventListener('visibilitychange', updatePageVisibility);
      if (this.scoreTrendTimer) clearTimeout(this.scoreTrendTimer);
      if (this.xpLevelingTimer) clearTimeout(this.xpLevelingTimer);
    };

    this.destroyRef.onDestroy(handleDestroy);
  }

  protected changeScore(delta: number): void {
    this.score.update((v) => v + delta);
    this.scoreBest.update((v) => Math.max(v, this.score()));
    this.scoreTrend.set(delta > 0 ? 'up' : 'down');
    this.scoreDelta.set(0);
    setTimeout(() => this.scoreDelta.set(delta));
    if (this.scoreTrendTimer) clearTimeout(this.scoreTrendTimer);
    this.scoreTrendTimer = setTimeout(() => {
      this.scoreTrend.set('neutral');
      this.scoreDelta.set(0);
      this.scoreTrendTimer = null;
    }, 650);
  }

  private shouldRunCard(id: string): boolean {
    if (!this.pageVisible) return false;
    if (this.isMobileViewport) return this.visibleCards.has(id);
    return this.assumeCardsVisible || this.visibleCards.has(id);
  }

  protected setTransferPair(idx: number): void {
    this.transferPairIdx.set(idx);
    this.transferRate.set(this.transferPairs[idx].baseRate);
  }

  protected onTransferChange(event: Event): void {
    this.transferAmount.set(+(event.target as HTMLInputElement).value);
  }

  protected setLocale(opt: { locale: string }): void {
    this.localeStr.set(opt.locale);
  }

  protected onSliderChange(event: Event): void {
    this.sliderVal.set(+(event.target as HTMLInputElement).value);
  }

  protected toggleLike(): void {
    const liked = !this.socialLiked();
    this.socialLiked.set(liked);
    this.socialLikes.update((v) => (liked ? v + 1 : v - 1));
  }
}
