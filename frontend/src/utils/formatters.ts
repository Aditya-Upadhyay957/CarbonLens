export const formatCurrency = (amountInr: number, currency: 'INR' | 'USD' = 'INR'): string => {
  if (currency === 'USD') {
    const usdAmount = amountInr / 83.5;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: usdAmount >= 100 ? 0 : 2
    }).format(usdAmount);
  }

  // Indian number format (Lakhs, Crores)
  if (amountInr >= 10000000) {
    return `₹${(amountInr / 10000000).toFixed(2)} Cr`;
  }
  if (amountInr >= 100000) {
    return `₹${(amountInr / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amountInr);
};

export const formatCarbon = (gco2: number): string => {
  if (gco2 >= 1000000) {
    return `${(gco2 / 1000000).toFixed(2)} tCO₂e`;
  }
  if (gco2 >= 1000) {
    return `${(gco2 / 1000).toFixed(1)} kgCO₂e`;
  }
  return `${Math.round(gco2)} gCO₂e`;
};

export const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
};
