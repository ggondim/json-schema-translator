const currency = require('currency.js');

class CurrencyParseProvider {
  constructor() {
    this.name = 'CurrencyParse';
    this.collection = 'Currency';
  }

  shouldRun({
    currentValue,
    targetPropertySchema,
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    return targetPropertySchema.type === 'number' && options.currency;
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    let currencyOptions;
    if (typeof options.currency === 'object') {
      currencyOptions = options.currency;
    } else {
      currencyOptions = options.currencyDefaults;
    }
    
    return currency(currentValue, currencyOptions).value;
  }
}

module.exports = [
  new CurrencyParseProvider(),
];
