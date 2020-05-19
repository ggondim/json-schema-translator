class StringReplaceProvider {
  constructor() {
    this.name = 'StringReplace';
    this.collection = 'String';
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
    return currentValue && options.replace && typeof options.replace === 'object';
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    return Object
      .keys(options.replace)
      .reduce((value, toReplace) => {
        const replaceBy = options.replace[toReplace];
        return value.split(toReplace).join(replaceBy);
      }, currentValue);
  }
}

class StringCleanProvider {
  constructor() {
    this.name = 'StringClean';
    this.collection = 'String';
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
    return currentValue && options.clean && Array.isArray(options.clean);
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    return options.clean.reduce((value, toClean) => {
      return value.split(toClean).join('');
    }, currentValue);
  }
}

module.exports = [
  new StringReplaceProvider(),
  new StringCleanProvider(),
];

