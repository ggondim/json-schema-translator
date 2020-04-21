const Airtable = require('airtable');

class AirtableLinkProvider {

  /**
   * Creates an instance of AirtableLinkProvider.
   * @param {string} apiKey Airtable base API key
   * @param {string} apiUrl Airtable base API enpoint
   * @param {string} baseName AIrtable base name
   * @memberof AirtableLinkProvider
   */
  constructor(apiKey, apiUrl, baseName) {
    this.apiKey = apiKey;
    this.baseName = baseName;
    this.apiUrl = apiUrl;
    this.base = new Airtable({
      apiKey,
      endpointUrl: apiUrl,
    }).base(baseName);
  }

  /**
   * Convert a property value to an Airtable Link reference to a record using the property's own value or other object properties injected to an Airtable find formula.
   *
   * @param {*} {sourceKey, sourceObject, currentValue, translation, targetSchema, _utils } options
   * @param {string} options.sourceKey Key name of property in source object.
   * @param {object} options.sourceObject Source object without any translation.
   * @param {any} options.currentValue Current primitive value of property.
   * @param {object} options.translation Translation options for property schema.
   * @param {object} options.targetSchema Object's target schema.
   * @param {object} options._utils Utilities library from json-schema-translator.
   * @returns {Promise<string[]>} Reference to a record ID (if found) in an array-form, i.e. `[recordId]`
   * @memberof AirtableLinkProvider
   */
  async getValue({sourceKey, sourceObject, currentValue, translation, targetSchema, _utils }) {
    const { table: tableName, findFormula, recordIdField } = translation.conversion;
    const table = this.base(tableName);
    const filterByFormula = findFormula.replace('$val', currentValue);

    const records = await table.select({
      maxRecords: 1,
      filterByFormula,
    }).firstPage();
    if (records && records.length) {
      const id = records[0].fields[recordIdField];
      return [id];
    }
    return [];
  }
}

module.exports = AirtableLinkProvider;
