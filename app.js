"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_schema_1 = __importDefault(require("./lib/json-schema"));
const refs = {
    yep: {
        type: 'string', pattern: '^\\d{3}$'
    }, a: {
        type: 'array', items: {
            type: 'object', properties: {
                num: { type: 'number' }, str: { type: 'string' }
            }
        }
    }, idSpec: {
        type: 'object', properties: {
            id: { $ref: 'yep' }, arr: { $ref: 'a' }
        }
    }
};
// noinspection ReservedWordAsName
const valid = {
    type: 'object', properties: {
        id: { $ref: 'yep' }, arr: { $ref: 'a' }, address: {
            type: 'object', properties: {
                street: { type: 'integer', default: 44, minimum: 0, maximum: 50 },
                houseColor: { type: 'string', default: '[Function=Date.now]', format: 'date-time' }
            }
        }
    }
};
const result = (0, json_schema_1.default)(refs, valid);
console.dir(result, { depth: null });
