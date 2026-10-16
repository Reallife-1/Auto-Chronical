import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type RatePayload = {
  result?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

type CachedRates = {
  rates: Record<string, number>;
  asOf: string | null;
  expiresAt: number;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

@Injectable()
export class ExchangeRateService {
  private readonly cache = new Map<string, CachedRates>();

  async getRate(baseCurrency: string, targetCurrency: string) {
    if (baseCurrency === targetCurrency) {
      return { rate: 1, asOf: null };
    }

    const rates = await this.getLatestRates(baseCurrency);
    const rate = rates.rates[targetCurrency];

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new ServiceUnavailableException(
        `No exchange rate is available for ${baseCurrency} to ${targetCurrency}`,
      );
    }

    return { rate, asOf: rates.asOf };
  }

  private async getLatestRates(baseCurrency: string): Promise<CachedRates> {
    const cached = this.cache.get(baseCurrency);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    try {
      const response = await fetch(
        `https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
      );

      if (!response.ok) {
        throw new Error('Exchange-rate service returned an unsuccessful response');
      }

      const payload = (await response.json()) as RatePayload;
      if (payload.result !== 'success' || !payload.rates) {
        throw new Error('Exchange-rate service returned invalid data');
      }

      const rates: CachedRates = {
        rates: payload.rates,
        asOf: payload.time_last_update_utc ?? null,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };

      this.cache.set(baseCurrency, rates);
      return rates;
    } catch {
      throw new ServiceUnavailableException(
        'Exchange rates are temporarily unavailable. Please try again later.',
      );
    }
  }
}
