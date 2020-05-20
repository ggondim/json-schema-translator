class ArrayIndexProvider {
  constructor() {
    this.name = 'ArrayIndex';
    this.collection = 'Array';
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
    return currentValue
      && typeof options.arrayIndex === 'number';
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    return currentValue[options.arrayIndex];
  }
}

module.exports = [
  new ArrayIndexProvider(),
];
