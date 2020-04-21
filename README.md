# json-schema-translator
An implementation of schema translation/migration definition for JavaScript.

> 🆘 **Help** this project by conttributing to its documentation or developing its [roadmap](#roadmap).

## Definition

JSON Schema translation was created to map dictionaries of source-target properties, a.k.a. "from-to". It considers that a schema is a collection of "to" properties, where each property has a "from" key.

It adds a `translation` property to JSON Schema definition, which you can use to set the source `from` value.

```json
{
  "$id": "my-schema",
  "properties": {
    "targetKey": {
      "type": "string",
      "translation": {
        "from": "sourceKey"
      }
    }
  }
}
```
#

## Use it in code

### 1. Define a schema for output object

Define a `translation` property for each property of your destination schema.

So, if you have a schema like this (where "targetKey" is a property of output object)...

```json
{
  "$id": "my-schema",
  "properties": {
    "targetKey": {
      "type": "string"
    }
  }
}
```
...you should end up with the following schema:

```json
{
  "$id": "my-schema",
  "properties": {
    "targetKey": {
      "type": "string",
      "translation": {
        "from": "sourceKey"
      }
    }
  }
}
```

(Where "sourceKey" is a property from input object).

### 2. Require json-schema-translator library

```
$ npm install --save json-schema-translator
```

```javascript
const JST = require(`json-schema-translator`);
```

### 3. Translate an object using your schema with translation options

```javascript
const JST = require(`json-schema-translator`);
const mySchema = require('./my-schema.json');

const input = {
  sourceKey: 'value'
};

const output = await JST.translateObject(mySchema, input);

// output should be { targetKey: 'value' }
```
#

## Features

### ⭐ Dot and array-notation support

You can specify dot-notation key paths and also array-notation key paths in `from` property, i.e.:

```
"from": "my.source.key"

"from": "my.source[1].element
```

### ⭐ Automatic casting of values

#### Arrays and objects

```
[1, 2, 3] → '1,2,3'
```

```
{ ob: "ject" } → '{ "ob": "ject" }'
```

When it finds a property value that is an object or an array, json-schema-translator tries to convert the value to the form specified in: 1) property options; 2) schema options; or 3) global defaults.

The global default array behavior is a join operation using the global array separator "," and the default object behavior is a stringify operation.

Find how to define translation options for schemas and properties in [options reference](#Translation-Options),

#### Strings

```
123 → "123"
```

If the translator finds a property value which its type is explicity defined in target schema as a string, it will apply the `toString()` method to the source value.

#### Other types

> ⚠ Automatic casting of other primitive values (boolean, number, date, etc.) was not developed yet. Help us developing it in our [roadmap](#roadmap).

### ⭐ Custom conversion providers

You can use community-made providers to convert source values from properties.

Just set a `conversion` property inside the `translation` property, containing:

1. A `provider` property with the name of provider
2. Other required provider options

An example of a custom conversion provider is [AirtableLinkProvider](./providers/AirtableLinkProvider.js), which produces target values with Airtable Link References, using a specified formula and the own property source value:

```javascript
const AirtableLinkProvider = require(`airtable-link-provider`);
const mySchema = {
  "properties": {
    "User": {
      "type": "string",
      "translation": {
        "from": "userId",
        "conversion": {
          "provider": "AirtableLink",
          "table": "Users",
          "findFormula": "id=\"$val\"",
          "recordIdField": "recid"
        }
      }
    }
  }
};

const input = {
  User: '123'
};

const AirtableLink = new AirtableLinkProvider(apiKey, apiUrl, baseName);

const output = await JST.translateObject(mySchema, input, { AirtableLink });

// output should be { User: ['rec1x81731018xajq'] }
```

When using custom community providers, you need to specify the optional `providers` parameter of `translateObject` method. Every `providers`'s key must match the name of the providers referenced inside the target schema.

```javascript
translateObject(targetSchema: object, sourceObject: object, providers: object?)
```

> ℹ You can find community providers in the [/providers](./providers) folder. If you want to write a custom provider and make it avaiable for the community, refer to the [Creating custom providers section](#Creating-custom-providers).

#

## JSON Schema Translator reference

### ArrayBehaviors

```javascript
const ArrayBehaviors = {
  JOIN: 'JOIN',
  LITERAL: 'LITERAL',
};
```

### ObjectBehaviors

```javascript
const ObjectBehaviors = {
  STRINGIFY: 'STRINGIFY',
  LITERAL: 'LITERAL',
};
```

### Translation Options

```javascript
{
  arrayBehavior: string, // accepted values from ArrayBehaviors enum constant, default is 'JOIN'
  arraySeparator: string, // default is ','
  objectBehavior: string, // accepted values from ObjectBehaviors enum constant, default is 'STRINGIFY'
  excludeNulls: boolean
}
```

Define default options for an **entire schema** using `tranlationOptions` property, i.e.:

```json
{
  "$id": "my-schema",
  "translationOptions": {

  }
}
```

Define options for a **single property** using `options` property, i.e.:

```json
{
  "$id": "my-schema",
  "properties": {
    "targetKey": {
      "type": "string",
      "translation": {
        "from": "sourceKey",
        "options": {

        }
      }
    }
  }
}
```

### translateObject

```javascript
translateObject(targetSchema: object, sourceObject: object, providers: object?): Promise<object>
```

#

## Creating custom providers

A custom provider is just an object with an async  `getValue` method:

```javascript
/**
   *
   * @param {*} {sourceKey, sourceObject, currentValue, translation, targetSchema, _utils } options
   * @param {string} options.sourceKey Key name of property in source object.
   * @param {object} options.sourceObject Source object without any translation.
   * @param {any} options.currentValue Current primitive value of property.
   * @param {object} options.translation Translation options for property schema.
   * @param {object} options.targetSchema Object's target schema.
   * @param {object} options._utils Utilities library from json-schema-translator.
   */
  async function getValue({sourceKey, sourceObject, currentValue, translation, targetSchema, _utils }) {
    const myProviderOptions = translation.conversion;
    ...
  }
```
You can use additional options for your provider by defining them in `translation.conversion` property.

Setup global provider options by using a class approach:

```javascript
class CustomProvider {
  constructor(flags) {
    this.flags = flags;
  }

  async getValue({sourceKey, sourceObject, currentValue, translation, targetSchema, _utils }) {
    const propertyOptions = translation.conversion;
    const globalFlags = this.flags;
  }
}

const providers = {
  Custom: new CustomProvider(flags)
};

const output = JST.translateObject(mySchema, input, providers);
const output2 = JST.translateObject(otherSchema, otherInput, providers);
```

#

## Roadmap

- [ ] Automatic cast for `boolean`
- [ ] Automatic cast for `number`
- [ ] Automatic cast for `Date`
- [ ] Automatic cast for `string` making possible use `toString` or `stringify`
- [ ] Create more providers
- [ ] Improve this documentation
- [ ] Publish json-schema-translator meta schema to SchemaStore
- [ ] Spread json-schema-translator to JSON Schema website users
