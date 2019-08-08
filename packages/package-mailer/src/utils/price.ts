import { Money } from '@cxcloud/ct-types/common';

const formatterCache = new Map();

const getFormatter = (currency: string) => {
  if (formatterCache.has(currency)) {
    return formatterCache.get(currency);
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  });
  formatterCache.set(currency, formatter);
  return formatter;
};

export const getPriceText = (price: Money) => {
  const actualPrice = price.centAmount / 100;
  return getFormatter(price.currencyCode).format(actualPrice);
};
