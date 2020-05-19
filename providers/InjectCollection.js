class InjectRootProvider {
  constructor() {
    this.name = 'InjectRoot';
    this.collection = 'Inject';
    this.typecast = 'end';
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
    return sourceKey === '$$ROOT';
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    return sourceObject;
  }
}

class InjectGlobalProvider {
  constructor() {
    this.name = 'InjectGlobal';
    this.collection = 'Inject';
    this.typecast = 'end';
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
    return sourceKey !== '$$ROOT'
      && sourceKey.startsWith('$$')
      && options.inject
      && options.inject[sourceKey];
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    return options.inject[sourceKey];
  }
}

module.exports = [
  new InjectRootProvider(),
  new InjectGlobalProvider(),
];



