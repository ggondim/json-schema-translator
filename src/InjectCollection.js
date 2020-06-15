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

class CoalesceProvider {
  constructor() {
    this.name = 'InjectCoalesce';
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
    const shouldValue = sourceObject[sourceKey];
    return (typeof shouldValue === 'undefined' || shouldValue === '' || shouldValue === null)
      && options.coalesce;
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
  }) {
    let value = currentValue;
    const coalesce = Array.isArray(options.coalesce) ? options.coalesce : [options.coalesce];

    for (let i = 0; i < coalesce.length; i++) {
      const key = coalesce[i];
      const tryValue = sourceObject[key];
      if (tryValue) {
        value = tryValue;
        break;
      }
    }

    return value;
  }
}

module.exports = [
  new InjectRootProvider(),
  new InjectGlobalProvider(),
  new CoalesceProvider()
];
