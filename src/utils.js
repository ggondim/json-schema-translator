module.exports = {
  isNullOrUndefined,
  getValue,
};

function isNullOrUndefined(value) {
  return value === null || (typeof value === 'undefined');
}

/**
 * Get a property value given its path (dot & array notation supported)
 * @param {string} key Path of the key to be fetched
 * @param {object} object Object to be searched
 * @example Examples of keys: ab.c.d | a.bc[1].e
 */
function getValue(key, object) {
  let currentValue = object;
  let hasValue = true;

  if (key.indexOf('.') !== -1 || key.indexOf('[') !== -1) {
    const srcKeyLevels = key.split('.');
    for (let i = 0; i < srcKeyLevels.length; i++) {
      const currentPropLevel = srcKeyLevels[i];

      if (currentPropLevel.indexOf('[') !== -1) {
        // is array element
        const splitCurrentPropLevel = currentPropLevel.split('[');
        const index = parseInt(splitCurrentPropLevel[1].replace(']'));
        currentValue = currentValue[splitCurrentPropLevel[0]][index];
      } else {
        currentValue = currentValue[currentPropLevel];
      }

      hasValue = hasValue && !sNullOrUndefined(currentValue);
      if (!hasValue) break;
    }
  } else {
    currentValue = object[key];
    hasValue = !isNullOrUndefined(currentValue);
  }

  if (hasValue) return currentValue;
}