const JST = require('json-schema-translator');
const { MongoClient } = require('mongodb');
const XJSON = require('mongodb-extjson');

class MongoDbLinkProvider {
  constructor(mongoUri, databaseName) {
    this.name = 'AirtableLink';
    this.collection = 'Airtable';
    this.typecast = 'off';

    this.mongoUri = mongoUri;
    this.databaseName = databaseName;
    this.client = null;
  }

  async connect() {
    this.client = await MongoClient.connect(connectionString);
  }

  close() {
    if (!this.client || !this.client.isConnected()) return null;
    return this.client.close();
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
    return options.mongoDbLink
      && options.mongoDbLink.collection
      && options.mongoDbLink.query
      && (
        (targetPropertySchema.type === 'object' && options.mongoDbLink.idType)
        || targetPropertySchema.type === 'string'
      );
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
    await this.connect();

    const {
      collection: collectionName,
      query: queryJson,
      createIfNotExists,
      idType,
    } = options.mongoDbLink;

    const collection = this.client.db(this.databaseName).collection(collectionName);
    const queryJsonReplaced = queryJson.replace('$val', currentValue);
    const query = JSON.parse(queryJsonReplaced);

    let result = await collection.findOne(query);

    const schema = schemas && createIfNotExists ? schemas.find(s => s.$id === createIfNotExists) : null;
    if (!result && createIfNotExists && schema) {
      result = await this.createIfNotExists(schema, {
        collection,
        sourceObject,
        schemas,
        providers,
        methodOptions,
      });
    }
    
    let id;
    if (targetPropertySchema.type === 'string' || idType === 'string') {
      id = result._id.toHexString();
    } else if (idType === 'extended') {
      id = JSON.parse(XJSON.stringify(result))._id;
    } else {
      id = result._id;
    }

    await this.close();

    return id;
  }

  async createIfNotExists(schema, {
    collection,
    sourceObject,
    schemas,
    providers,
    methodOptions,
  }) {
    const translated = await JST.translateObject(sourceObject, schema, methodOptions);
    const result = await collection.insertOne(translated);
    if (result.insertedCount === 1) {
      result._id = result._id || result.insertedId;
      return result;
    }
  }
}

module.exports = { MongoDbLinkProvider };
