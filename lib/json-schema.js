"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const mongoose_1 = __importDefault(require("mongoose"));
const typeStringToMongooseType = { 'string': String, 'boolean': Boolean, 'number': Number, 'integer': Number };
const typeRefToMongooseType = {
    '#/definitions/objectid': mongoose_1.default.Schema.Types.ObjectId, '#/definitions/dateOrDatetime': Date
};
const subSchemaTypeV3 = (parentSchema, subschema, key) => {
    return (0 <= parentSchema.required.indexOf(key) && !_.isPlainObject(subschema)) ? {
        type: subschema, required: true
    } : subschema;
};
const subSchemaTypeV4 = (parentSchema, subschema, key) => {
    return (0 <= parentSchema.required.indexOf(key)) ? !_.isPlainObject(subschema) ? {
        type: subschema, required: true
    } : subschema.hasOwnProperty('type') ? _.assign(subschema, { required: true }) : subschema : subschema;
};
// noinspection ReservedWordAsName
const schemaParamsToMongoose = {
    /**
     * default value
     */
    default: (default_) => {
        const func = (_.last(/^\[Function=(.+)\]$/.exec(default_)) || '')
            .replace(/\\_/g, '`underscore`')
            .replace(/_/g, ' ')
            .replace(/`underscore`/g, '_');
        // noinspection ReservedWordAsName,DynamicallyGeneratedCodeJS
        return { default: eval(func) || default_ };
    },
    /**
     * Pattern for value to match
     */
    pattern: (pattern) => ({ match: RegExp(pattern) }),
    type: (type) => ({ type: typeStringToMongooseType[type] }),
    minLength: (min) => ({ minlength: min }),
    maxLength: (max) => ({ maxlength: max }),
    minimum: (min) => ({ min: min }),
    maximum: (max) => ({ max: max }),
    enum: (members) => ({ enum: members })
};
const toMongooseParams = (acc, val, key) => {
    let func;
    // noinspection AssignmentResultUsedJS
    return (func = schemaParamsToMongoose[key]) ? _.assign(acc, func(val)) : acc;
};
const unsupportedRefValue = (jsonSchema) => {
    throw new Error('Unsupported $ref value: ' + jsonSchema.$ref);
};
const unsupportedJsonSchema = (jsonSchema) => {
    throw new Error('Unsupported JSON schema type, `' + jsonSchema.type + '`');
};
const convertV = (version, refSchemas, jsonSchema) => {
    if (!_.isPlainObject(jsonSchema)) {
        unsupportedJsonSchema(jsonSchema);
    }
    let converted, format = jsonSchema.format, isRef = !_.isEmpty(jsonSchema.$ref), isTypeDate = ('string' === jsonSchema.type) && (('date' === format) || ('date-time' === format)), mongooseRef = typeRefToMongooseType[jsonSchema.$ref], isMongooseRef = ('undefined' != typeof (mongooseRef)), subSchema = _.isEmpty(refSchemas) ? false : refSchemas[jsonSchema.$ref], subSchemaType = (4 == version) ? subSchemaTypeV4 : subSchemaTypeV3;
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
        return _.reduce(_.omit(jsonSchema, 'type', 'format'), toMongooseParams, { type: typeRefToMongooseType['#/definitions/dateOrDatetime'] });
    }
    if (_.has(typeStringToMongooseType, jsonSchema.type)) {
        return _.reduce(jsonSchema, toMongooseParams, {});
    }
    if (jsonSchema.type === 'object') {
        if (_.isEmpty(jsonSchema.properties)) {
            return mongoose_1.default.Schema.Types.Mixed;
        }
        return (converted =
            _.mapValues(jsonSchema.properties, convertV.bind(null, version, refSchemas)), jsonSchema.required ?
            (_.mapValues(converted, subSchemaType.bind(null, jsonSchema))) :
            converted);
    }
    else if (jsonSchema.type === 'array') {
        if (!_.isEmpty(jsonSchema.items)) {
            return [convertV(version, refSchemas, jsonSchema.items)];
        }
        return [];
    }
    if (!_.has(jsonSchema, 'type')) {
        return mongoose_1.default.Schema.Types.Mixed;
    }
    return unsupportedJsonSchema(jsonSchema);
};
const convert = (refSchemas, jsonSchema) => {
    let version = 3;
    if (jsonSchema.$schema === "http://json-schema.org/draft-04/schema#") {
        version = 4;
    }
    return convertV(version, refSchemas, jsonSchema);
};
// noinspection JSUnusedGlobalSymbols
exports.default = _.curry(convert);
