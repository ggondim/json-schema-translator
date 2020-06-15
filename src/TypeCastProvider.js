class TypeCastProvider {
  constructor() {
    this.name = 'TypeCast';
    this.collection = 'GLOBAL';
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
    return (
      typeof currentValue === 'object' &&
      Array.isArray(currentValue) &&
      targetPropertySchema.type !== 'array'
    ) || (
      typeof currentValue !== 'object' &&
      typeof currentValue !== targetPropertySchema.type
    );
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    targetKey,
    options,
  }) {
    if (!this.shouldRun({ currentValue, targetPropertySchema })) return currentValue;
    
    let value = currentValue;

    switch(targetPropertySchema.type) {
      case "string":
        value = this._toString(value, options.joinSeparator);
        break;
      case "number":
        value = this._toNumber(value);
        if (isNaN(value)) value = undefined;
        break;
      case "boolean":
        value = this._toBoolean(value);
        break;
      case "object":
        value = this._toObject(value, options.valueProperty);
        break;
      case "array":
        value = this._toArray(value);
        break;
    }

    return value;
  }

  _toString(value, joinSeparator) {
    switch(typeof value) {
      case "object":
        if (Array.isArray(value) && joinSeparator) {
          return value.join(joinSeparator);
        } 
        return JSON.stringify(value);
      case "undefined":
        return;
      default:
        return value.toString();
    }
  }

  _toNumber(value) {
    switch(typeof value) {
      case "boolean":
        return value ? 1 : 0;
      case "string":
        return parseFloat(value);
      case "undefined":
        return;
      default:
        throw new Error(`Cannot cast type ${typeof value} to number`);
    }
  }

  _toBoolean(value) {
    switch(typeof value) {
      case "string":
        return value.toLowerCase().trim() === 'true';
      case "number":
        return value !== 0;
      case "undefined":
        return;
      default:
        return !!value;
    }
  }

  _toObject(value, valueProp = '$value') {
    const result = {};
    result[valueProp] = value;
    return result;
  }

  _toArray(value) {
    return [ value ];
  }
}

module.exports = new TypeCastProvider();
