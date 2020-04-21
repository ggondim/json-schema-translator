const { ArrayBehaviors, ObjectBehaviors, TRANSLATION_DEFAULTS } = require('./constants');
const _utils = require('./utils');

module.exports = {
  translateObject,
};

/**
 * Translates an object to another object given a target schema.
 *
 * @param {object} targetSchema Target schema to match the output object.
 * @param {object} sourceObject Source object to translate from.
 * @param {object} [providers={}] Translation providers to support translation schema providers.
 * @returns
 */
async function translateObject(targetSchema, sourceObject, providers = {}) {
  const newObject = {};
  const { translationDefaults, properties: dictionary } = targetSchema;

  for (const targetKey in dictionary) {
    const { translation } = dictionary[targetKey];
    const sourceKey = translation.from;
    let value;

    value = _utils.getValue(sourceKey, sourceObject);

    if (!translation.conversion && value) {
      value = _translateValue(value, dictionary[targetKey], translation.options || translationDefaults);
    } else if (translation.conversion && translation.conversion.provider) {
      const { provider } = translation.conversion;
      if (provider && !providers[provider]) {
        throw new Error('Required provider not registered');
      }
      value = await providers[provider].getValue({
        sourceKey,
        sourceObject,
        currentValue: value,
        translation,
        targetSchema,
        _utils,
      });
    }

    newObject[targetKey] = value;
  }

  return newObject;
}

/**
 * Translate a property value given its schema type and translation configuration
 *
 * @param {any} value Primitive value fetched from source object.
 * @param {object} property Property schema.
 * @param {object} [translationOptions=TRANSLATION_DEFAULTS] Translation options.
 * @returns
 */
function _translateValue(value, property, translationOptions = TRANSLATION_DEFAULTS) {
  const { arrayBehavior, arraySeparator, objectBehavior } = translationOptions;

  if (Array.isArray(value) && arrayBehavior === ArrayBehaviors.JOIN) {
    value = value.join(arraySeparator);
  } else if (typeof value === 'object' && objectBehavior === ObjectBehaviors.STRINGIFY) {
    value = JSON.stringify(value);
  }

  if (property.type && (typeof value !== property.type)) {
    if (property.type === 'string') {
      value = value.toString();
    }
    // TODO: typecast
  }

  return value;
}

