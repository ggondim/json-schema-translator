const dot = require('dot-object');
const deepmerge = require('deepmerge');

const DEFAULT_PROVIDERS = require('./src/default-pipeline');
const TypeCast = require('./src/TypeCastProvider');

module.exports = {
  translateObject,
  translateValue,
};

/**
 * Checks if a JSON Schema has the required conditions to be translatable from another object
 * @param {object} propertySchema JSON Schema
 */
function _isTransleatable(propertySchema) {
  return propertySchema.from || (propertySchema.translation && propertySchema.translation.from);
}

/**
 * Translates an object given a JSON Schema with translation specification.
 * @param {object} sourceObject The object to be translated.
 * @param {object} targetSchema The JSON Schema containing translation specification.
 * @param {object} [options={}] Translation default options to use in each property translation. 
 * @returns
 */
async function translateObject(sourceObject, targetSchema, options = {}) {
  const logger = options.logger || console.log;
  const methodOptions = options;
  let providers = DEFAULT_PROVIDERS;
  if (options.providers) {
    providers = [...DEFAULT_PROVIDERS, ...options.providers];
    Reflect.deleteProperty(methodOptions, 'providers');
  }

  const schemas = options.schemas || [];
  const schemaOptions = deepmerge(methodOptions, targetSchema.translation || {});

  const newObjectResult = {};

  // TODO: deep schema translation
  for (const targetKey in targetSchema.properties) {
    const targetPropertySchema = targetSchema.properties[targetKey];
    const { translation } = targetPropertySchema;

    if (_isTransleatable(targetPropertySchema)) {
      const sourceKey = targetPropertySchema.from || (translation && translation.from);
      const propertyOptions = deepmerge(schemaOptions, targetPropertySchema.translation || {});
      const currentValue = dot.pick(sourceKey, sourceObject) || undefined;

      const value = await translateValue(currentValue, targetPropertySchema, {
        schemas,
        methodOptions,
        sourceKey,
        sourceObject,
        targetSchema,
        providers,
        logger,
        options: propertyOptions,
        targetKey,
      });

      newObjectResult[targetKey] = value;
    }
  }

  return newObjectResult;
}

/**
 * Sort a list of translation providers by convert a sortered list of strings.
 * @param {string[]} keys The list containing providers' names or collection names (collections must be prefixed with '#'). 
 * @param {object[]} providers List of providers objects.
 * @returns {object[]} List of sorted providers objects.
 */
function _pipelineKeysToProviders(keys, providers) {
  return keys
    .map((stepName) => {
      let steps;
      if (stepName.startsWith('#')) {
        steps = providers.filter(p => p.collection === stepName.replace('#', ''));
      } else {
        steps = providers.find(p => p.name === stepName);
      }
      return steps;
    })
    .reduce((a, b) => [...a, ...b], []);
}

/**
 * Determines the execution list of providers and its order based on property options.
 * @param {object} propertyOptions Options that may include a 'pipeline' property.
 * @param {object[]} providers List of providers to be selected and sorted.
 * @returns
 */
function _determinePipelineExecution(propertyOptions, providers) {
  if (typeof propertyOptions.pipeline === 'object' && propertyOptions.pipeline.length) {
    return _pipelineKeysToProviders(propertyOptions.pipeline, providers);
  } else if (typeof propertyOptions.pipeline === 'object') {
    let startPipeline = [];
    let middlePipeline = providers;
    let endPipeline = [];

    if (propertyOptions.start) {
      startPipeline = _pipelineKeysToProviders(propertyOptions.start, providers);
      middlePipeline = providers.filter(p => {
        return !propertyOptions.start.includes(p.name)
          && !propertyOptions.start.includes(`#${p.collection}`);
      });
    }

    if (propertyOptions.end) {
      endPipeline = _pipelineKeysToProviders(propertyOptions.start, middlePipeline);
      middlePipeline = middlePipeline.filter(p => {
        return !propertyOptions.end.includes(p.name)
          && !propertyOptions.end.includes(`#${p.collection}`);
      });
    }

    return [...startPipeline, ...middlePipeline, ...endPipeline];
  }
  return providers;
}

function _typecastStartOrBoth(typecastOption) {
  return typecastOption
    && typecastOption !== 'off'
    && (typecastOption === 'start' || typecastOption === 'both');
}

function _typecastEndOrBoth(typecastOption) {
  return typecastOption
    && typecastOption !== 'off'
    && (typecastOption === 'end' || typecastOption === 'both');
}

function _anyProviderRequiresTypecastOnStart(providers, ) {
  return providers.find(provider => provider.typecast && _typecastStartOrBoth(provider.typecast))
}

function _anyProviderRequiresTypecastOnEnd(providers, ) {
  return providers.find(provider => provider.typecast && _typecastEndOrBoth(provider.typecast))
}

function _anyProviderDisablesTypecast(providers, ) {
  return providers.find(provider => provider.typecast && provider.typecast === 'off')
}

/**
 * Translates a value given a JSON Schema with translation specification.
 * @param {*} currentValue Value to be translated.
 * @param {*} targetPropertySchema JSON Schema containing translation specification.
 * @param {*} {
 *   sourceKey,
 *   sourceObject,
 *   targetSchema,
 *   providers,
 *   options,
 * } translateValueOptions
 * @param {string?} translateValueOptions.sourceKey The property key of source object corresponding to currentValue.
 * @param {object?} translateValueOptions.sourceObject The source object which the currentValue was obtained from. 
 * @param {object?} translateValueOptions.targetSchema The target schema which the targetPropertySchema was obtained from. 
 * @param {object[]} translateValueOptions.providers List of additional translation providers to be used.
 * @param {object{}} translateValueOptions.options Additional translation options.
 * @returns
 */
async function translateValue(currentValue, targetPropertySchema, {
  targetKey,
  sourceKey,
  sourceObject,
  targetSchema,
  providers,
  options,
  schemas,
  methodOptions,
}) {
  const argumentsAsOptions = {
    targetKey,
    currentValue,
    targetPropertySchema,
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    options,
    schemas,
    methodOptions,
  };
  if (!sourceKey.startsWith('$$') && typeof currentValue === 'undefined') return;

  let value = currentValue;

  const providersPipeline = _determinePipelineExecution(options, providers);
  const providersToRun = providersPipeline.filter(p => p.shouldRun(argumentsAsOptions));

  const typecastStart = _anyProviderRequiresTypecastOnStart(providersToRun);
  const typecastEnd = _anyProviderRequiresTypecastOnEnd(providersToRun);
  const typecastDisabled = _anyProviderDisablesTypecast(providersToRun);

  if(typecastStart && typecastEnd) {
    throw new Error('pipeline requires explicitly start or end together');
  }
  if ((typecastStart && typecastDisabled) || (typecastEnd && typecastDisabled)) {
    throw new Error('pipeline both disables and requires typecast');
  }

  if (!typecastDisabled
      && (typeof options.typecast === 'undefined'
        || _typecastStartOrBoth(options.typecast)
        || typecastStart)
      && TypeCast.shouldRun(argumentsAsOptions)) {
    value = await TypeCast.getValue(value, targetPropertySchema, argumentsAsOptions);
  }

  for (let i = 0; i < providersToRun.length; i++) {
    const provider = providersToRun[i];
    value = await provider.getValue(value, targetPropertySchema, argumentsAsOptions);
  }

  if (!typecastDisabled
      && ((options.typecast && _typecastEndOrBoth(options.typecast)) || typecastEnd)
      && TypeCast.shouldRun(argumentsAsOptions)) {
    value = await TypeCast.getValue(value, targetPropertySchema, argumentsAsOptions);
  }

  return value;
}
