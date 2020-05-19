class EnumDictionaryProvider {
  constructor() {
    this.name = 'EnumDictionary';
    this.collection = 'Enum';
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
    return options.dictionary
      && typeof currentValue === 'string';
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    return options.dictionary[currentValue];
  }
}

module.exports = [
  new EnumDictionaryProvider(),
];
