const ArrayBehaviors = {
  JOIN: 'JOIN',
  LITERAL: 'LITERAL',
};

const ObjectBehaviors = {
  STRINGIFY: 'STRINGIFY',
  LITERAL: 'LITERAL',
};

const TRANSLATION_DEFAULTS = {
  arrayBehavior: ArrayBehaviors.JOIN,
  arraySeparator: ',',
  objectBehavior: ObjectBehaviors.STRINGIFY,
  excludeNulls: true
};

module.exports = {
  ArrayBehaviors,
  ObjectBehaviors,
  TRANSLATION_DEFAULTS,
};