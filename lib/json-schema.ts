import * as _ from "lodash";
import mongoose from "mongoose";
import { schemaParams, typeRefs, typeStrings } from "./mappings";

const subSchemaType = (
  schemaVersion: number,
  parentSchema: any,
  subschema: any,
  key: any
) => {
  if (parentSchema.required.includes(key)) {
    if (!_.isPlainObject(subschema)) {
      return {
        type: subschema,
        required: true,
      };
    } else if (
      schemaVersion === 4 &&
      Object.prototype.hasOwnProperty.call(subschema, "type")
    ) {
      return _.assign(subschema, { required: true });
    }
  }

  return subschema;
};

const toMongooseParams = (acc: any, val: any, key: any) => {
  const func = (<any>schemaParams)[key];

  if (func) {
    return _.assign(acc, func(val));
  }

  return acc;
};

const unsupportedRefValue = (jsonSchema: any) => {
  throw new Error("Unsupported $ref value: " + jsonSchema.$ref);
};

const unsupportedJsonSchema = (jsonSchema: any) => {
  throw new Error("Unsupported JSON schema type, `" + jsonSchema.type + "`");
};

const convertV = (version: any, refSchemas: any, jsonSchema: any): any => {
  if (!_.isPlainObject(jsonSchema)) {
    unsupportedJsonSchema(jsonSchema);
  }

  const format = jsonSchema.format;
  const isRef = !_.isEmpty(jsonSchema.$ref);
  const isTypeDate =
    "string" === jsonSchema.type &&
    ("date" === format || "date-time" === format);
  const mongooseRef = (<any>typeRefs)[jsonSchema.$ref];
  const isMongooseRef = "undefined" != typeof mongooseRef;
  const subSchema = _.isEmpty(refSchemas) ? false : refSchemas[jsonSchema.$ref];

  if (isRef) {
    if (isMongooseRef) {
      return mongooseRef;
    }

    if (subSchema) {
      return convertV(version, refSchemas, subSchema);
    }

    return unsupportedRefValue(jsonSchema);
  }

  if (isTypeDate) {
    return _.reduce(
      <any>_.omit(jsonSchema, "type", "format"),
      toMongooseParams,
      { type: typeRefs["#/definitions/dateOrDatetime"] }
    );
  }

  if (_.has(typeStrings, jsonSchema.type)) {
    return _.reduce(jsonSchema, toMongooseParams, {});
  }

  if (jsonSchema.type === "object") {
    if (_.isEmpty(jsonSchema.properties)) {
      return mongoose.Schema.Types.Mixed;
    }

    const converted = _.mapValues(
      jsonSchema.properties,
      convertV.bind(null, version, refSchemas)
    );

    if (jsonSchema.required) {
      return _.mapValues(
        converted,
        subSchemaType.bind(null, version, jsonSchema)
      );
    }

    return converted;
  } else if (jsonSchema.type === "array") {
    if (!_.isEmpty(jsonSchema.items)) {
      return [convertV(version, refSchemas, jsonSchema.items)];
    }

    return [];
  }

  if (!_.has(jsonSchema, "type")) {
    return mongoose.Schema.Types.Mixed;
  }

  return unsupportedJsonSchema(jsonSchema);
};

const convert = (refSchemas: any, jsonSchema: any): any => {
  let version = 3;

  if (jsonSchema.$schema === "http://json-schema.org/draft-04/schema#") {
    version = 4;
  }

  return convertV(version, refSchemas, jsonSchema);
};

interface CreateMongooseSchema {
  (refSchemas: any, jsonSchema: any): any;
  (refSchemas: any): (jsonSchema: any) => any;
}

// noinspection JSUnusedGlobalSymbols
export default <CreateMongooseSchema>_.curry(convert);
