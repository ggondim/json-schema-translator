const JST = require('json-schema-translator');
const Airtable = require('airtable');
const { objectToAirtableFields } = require('airtable-to-json-schema');

class AirtableLinkProvider {
  constructor(apiKey, apiUrl, baseName) {
    this.name = 'AirtableLink';
    this.collection = 'Airtable';
    this.typecast = 'off';

    this.apiKey = apiKey;
    this.baseName = baseName;
    this.apiUrl = apiUrl;
    this.base = new Airtable({
      apiKey,
      endpointUrl: apiUrl,
    }).base(baseName);
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
    return options.airtableLink
      && options.airtableLink.table
      && options.airtableLink.findFormula
      && options.airtableLink.recordIdField
      && currentValue;
  }

  async getValue(currentValue, targetPropertySchema, {
    sourceKey,
    sourceObject,
    targetSchema,
    providers,
    schemas,
    options,
    methodOptions,
  }) {
    const { table: tableName, findFormula, recordIdField, createIfNotExists } = options.airtableLink;
    const table = this.base(tableName);
    const filterByFormula = findFormula.replace('$val', currentValue);

    let id, records;
    try {
      records = await table.select({
        maxRecords: 1,
        filterByFormula,
      }).firstPage();
      
    } catch (error) {
      if (!error.statusCode || error.statusCode !== 404) throw error;
    }
    if (records && records.length) {
      id = records[0].fields[recordIdField];
    }

    const schema = schemas && createIfNotExists ? schemas.find(s => s.$id === createIfNotExists) : null;

    if (!id && createIfNotExists && schema) {
      id = await this.createIfNotExists(schema, {
        table,
        sourceObject,
        schemas,
        providers,
        methodOptions,
      });
    }

    return id ? [id] : [];
  }

  async createIfNotExists(schema, {
    table,
    sourceObject,
    schemas,
    providers,
    methodOptions,
  }) {
    const translated = await JST.translateObject(sourceObject, schema, methodOptions);
    const fields = objectToAirtableFields(translated, schema);

    let record;
    try {
      record = await table.create(fields);
    } catch (error) {
      debugger;
    }

    if (record) return record.getId();
  }
}

module.exports = { AirtableLinkProvider };
