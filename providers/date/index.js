const { parse, toDate, parseISO, isValid } = require('date-fns');

class DateParseProvider {
  constructor() {
    this.name = 'DateParse';
    this.collection = 'Date';
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
    return currentValue && 
      targetPropertySchema.type === 'string' &&
      targetPropertySchema.format && (
        targetPropertySchema.format === 'date' ||
        targetPropertySchema.format === 'time' ||
        targetPropertySchema.format === 'date-time'
      );
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    const date = this.parseDate(currentValue, options);
    return isValid(date) ? date.toISOString() : currentValue;
  }

  parseDate(value, options) {
    if (typeof value === 'number'
      || (value && value.getMonth && typeof value.getMonth === 'function')) {
      return toDate(value);
    }

    if (options.format) {
      return parse(value.trim(), options.format, new Date());
    }

    return parseISO(value);
  }
}

module.exports = [
  new DateParseProvider(),
];
