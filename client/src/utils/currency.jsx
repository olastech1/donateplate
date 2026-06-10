import { useState, useEffect, createContext, useContext } from 'react';

let cachedData = null;
let fetchPromise = null;

const detectCurrencyFromTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Europe/London') || tz.includes('Europe/Belfast')) {
      return 'GBP';
    }
    if (tz.startsWith('Europe/')) {
      return 'EUR';
    }
    return 'USD';
  } catch (e) {
    return 'USD';
  }
};

export const fetchCurrencyData = async () => {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      let currency = detectCurrencyFromTimezone();

      if (currency === 'USD') {
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData.error) throw new Error('ipapi.co rate limited');
            if (ipData.currency === 'GBP' || ipData.country_code === 'GB') {
              currency = 'GBP';
            } else if (ipData.currency === 'EUR' || ipData.in_eu || ['AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU','MT','NL','PT','SK','SI','ES'].includes(ipData.country_code)) {
              currency = 'EUR';
            }
          } else {
            throw new Error('ipapi.co failed');
          }
        } catch (e) {
          try {
            const backupIpRes = await fetch('https://ipwho.is/');
            if (backupIpRes.ok) {
              const backupIpData = await backupIpRes.json();
              if (backupIpData?.currency?.code === 'GBP' || backupIpData.country_code === 'GB') {
                currency = 'GBP';
              } else if (backupIpData?.currency?.code === 'EUR' || backupIpData?.is_eu || ['AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU','MT','NL','PT','SK','SI','ES'].includes(backupIpData.country_code)) {
                currency = 'EUR';
              }
            }
          } catch (e2) {
            console.log('IP detect blocked, sticking to TimeZone result:', currency);
          }
        }
      }

      let rate = 1;
      if (currency !== 'USD') {
        try {
          const rateRes = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
          if (rateRes.ok) {
            const rateData = await rateRes.json();
            const currKey = currency.toLowerCase();
            if (rateData && rateData.usd && rateData.usd[currKey]) {
              rate = rateData.usd[currKey];
            } else {
              currency = 'USD';
            }
          } else {
            const backupRes = await fetch('https://open.er-api.com/v6/latest/USD');
            const backupData = await backupRes.json();
            if (backupData && backupData.rates && backupData.rates[currency]) {
              rate = backupData.rates[currency];
            } else {
              currency = 'USD';
            }
          }
        } catch (e) {
          console.error('Rate fetch failed, falling back to USD', e);
          currency = 'USD';
        }
      }

      cachedData = { currency, rate };
      return cachedData;
    } catch (err) {
      console.error('Currency fetch error:', err);
      cachedData = { currency: 'USD', rate: 1 };
      return cachedData;
    }
  })();

  return fetchPromise;
};

export const formatEquivalent = (usdAmount, currencyData) => {
  if (!currencyData || currencyData.currency === 'USD') return null;
  
  const converted = usdAmount * currencyData.rate;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyData.currency
  });
  return `(~ ${formatter.format(converted)} ${currencyData.currency})`;
};

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currencyData, setCurrencyData] = useState({ currency: 'USD', rate: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencyData().then(data => {
      setCurrencyData(data);
      setLoading(false);
    });
  }, []);

  const changeCurrency = async (newCurrency) => {
    if (newCurrency === 'USD') {
      setCurrencyData({ currency: 'USD', rate: 1 });
      return;
    }
    
    let rate = 1;
    try {
      const rateRes = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        const currKey = newCurrency.toLowerCase();
        if (rateData && rateData.usd && rateData.usd[currKey]) {
          rate = rateData.usd[currKey];
        }
      }
    } catch (e) {
      console.error(e);
    }
    setCurrencyData({ currency: newCurrency, rate });
  };

  return (
    <CurrencyContext.Provider value={{ ...currencyData, loading, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    return { currency: 'USD', rate: 1, loading: false };
  }
  return context;
};
