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
const assert = __importStar(require("assert"));
const _ = __importStar(require("lodash"));
const mongoose_1 = __importDefault(require("mongoose"));
const json_schema_1 = __importDefault(require("../lib/json-schema"));
describe('mongoose schema conversion:', function () {
    describe('createMongooseSchema', function () {
        _.each([
            { type: 'objectttttt' }, {
                type: 'object', properties: 'not an object'
            }, {
                type: 'object', properties: { email: { type: 'not a type' } }
            }
        ], function (invalid) {
            it('throws when the incorrect type is given', () => {
                assert.throws(() => {
                    // noinspection VoidExpressionJS
                    (0, json_schema_1.default)(void 0, invalid);
                }, /Unsupported JSON schema/);
                // expect(() => {
                //   createMongooseSchema(void 0, invalid);
                // }).toThrowError(/Unsupported JSON schema/);
            });
        });
        _.each([
            {
                type: 'object', properties: { id: { $ref: '#/nope/nope/nope' } }
            }
        ], function (invalid) {
            it('throws on unsupported ref, ' + invalid, () => {
                assert.throws(() => {
                    // noinspection VoidExpressionJS
                    (0, json_schema_1.default)(void 0, invalid);
                }, /Unsupported .ref/);
                // expect(() => {
                //   createMongooseSchema(void 0, invalid);
                // }).toThrowError(/Unsupported .ref/);
            });
        });
        it('should convert a valid json-schema', () => {
            const refs = {
                yep: { type: 'string', pattern: '^\\d{3}$' },
                a: {
                    type: 'array', items: { type: 'object', properties: { num: { type: 'number' }, str: { type: 'string' } } }
                },
                anyValue: { description: 'This can be any value.' },
                idSpec: { type: 'object', properties: { id: { $ref: 'yep' }, arr: { $ref: 'a' } } }
            };
            // noinspection ReservedWordAsName
            const valid = {
                type: 'object', properties: {
                    id: { $ref: 'yep' }, arr: { $ref: 'a' }, anyValue: { a: 'b' }, address: {
                        type: 'object', properties: {
                            street: { type: 'integer', default: 44, minimum: 0, maximum: 50 },
                            houseColor: { type: 'string', default: '[Function=Date.now]', format: 'date-time' }
                        }
                    }
                }
            };
            // noinspection ReservedWordAsName
            assert.deepEqual((0, json_schema_1.default)(refs, valid), {
                id: { type: String, match: /^\d{3}$/ },
                arr: [{ num: { type: Number }, str: { type: String } }],
                anyValue: mongoose_1.default.Schema.Types.Mixed,
                address: {
                    street: { type: Number, default: 44, min: 0, max: 50 }, houseColor: { type: Date, default: Date.now }
                }
            });
            // noinspection ReservedWordAsName
            // expect(createMongooseSchema(refs, valid)).toEqual({
            //   id: {type: String, match: /^\d{3}$/},
            //   arr: [{num: {type: Number}, str: {type: String}}],
            //   anyValue: mongoose.Schema.Types.Mixed,
            //   address: {
            //     street: {type: Number, default: 44, min: 0, max: 50}, houseColor: {type: Date, default: Date.now}
            //   }
            // });
        });
    });
});
