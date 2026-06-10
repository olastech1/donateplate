import { useState, useEffect } from 'react';

let cachedData = null;
let fetchPromise = null;

export const fetchCurrencyData = async () => {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      // 1. Detect Country via IP
      const ipRes = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      
      let currency = 'USD';
      if (ipData.currency === 'GBP' || ipData.country_code === 'GB') {
        currency = 'GBP';
      } else if (ipData.currency === 'EUR' || ipData.in_eu || ['AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU','MT','NL','PT','SK','SI','ES'].includes(ipData.country_code)) {
        currency = 'EUR';
      }

      // 2. Fetch Exchange Rates if not USD
      let rate = 1;
      if (currency !== 'USD') {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateRes.json();
        if (rateData && rateData.rates && rateData.rates[currency]) {
          rate = rateData.rates[currency];
        } else {
          // Fallback to USD if rate fails
          currency = 'USD';
        }
      }

      cachedData = { currency, rate };
      return cachedData;
    } catch (err) {
      console.error('Currency fetch error:', err);
      // Fallback safely to USD
      cachedData = { currency: 'USD', rate: 1 };
      return cachedData;
    }
  })();

  return fetchPromise;
};

/**
 * Returns the estimated string (e.g. "~ £39.25 GBP") or null if USD.
 */
export const formatEquivalent = (usdAmount, currencyData) => {
  if (!currencyData || currencyData.currency === 'USD') return null;
  
  const converted = usdAmount * currencyData.rate;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyData.currency
  });
  return `(~ ${formatter.format(converted)} ${currencyData.currency})`;
};

/**
 * React Hook for consuming the detected currency.
 */
export const useCurrency = () => {
  const [currencyData, setCurrencyData] = useState({ currency: 'USD', rate: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencyData().then(data => {
      setCurrencyData(data);
      setLoading(false);
    });
  }, []);

  return { ...currencyData, loading };
};
