let cachedRate = 1500;
let lastFetch = 0;

export const getExchangeRate = async () => {
  const now = Date.now();
  if (now - lastFetch < 3600000) return cachedRate; // Cache for 1 hour

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    if (data && data.rates && data.rates.NGN) {
      cachedRate = data.rates.NGN;
      lastFetch = now;
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
  }
  return cachedRate;
};

export const formatCurrency = (amount: number, currency: 'NGN' | 'USD', privacyMode: boolean = false, rate: number = 1500) => {
  if (privacyMode) return '••••••';
  
  const value = currency === 'USD' ? amount / rate : amount;
  const symbol = currency === 'USD' ? '$' : '₦';
  
  return `${symbol}${value.toLocaleString(undefined, { 
    minimumFractionDigits: currency === 'USD' ? 2 : 0, 
    maximumFractionDigits: currency === 'USD' ? 2 : 0 
  })}`;
};
