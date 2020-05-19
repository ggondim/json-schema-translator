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
      && options.arrayIndex 
      && Array.isArray(currentValue);
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