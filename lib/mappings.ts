import * as _ from 'lodash';
import mongoose from 'mongoose';

export const typeStrings = {
  'string': String,
  'boolean': Boolean,
  'number': Number,
  'integer': Number
};

export const typeRefs = {
  '#/definitions/objectid': mongoose.Schema.Types.ObjectId,
  '#/definitions/dateOrDatetime': Date
};

export const schemaParams = {
  /**
   * default value
   */
  default: (default_: string) => {
    const func = (_.last(/^\[Function=(.+)\]$/.exec(default_)) || '')
    .replace(/\\_/g, '`underscore`')
    .replace(/_/g, ' ')
    .replace(/`underscore`/g, '_');

    // noinspection ReservedWordAsName,DynamicallyGeneratedCodeJS
    return {default: eval(func) || default_};
  },

  /**
   * Pattern for value to match
   */
  pattern: (pattern: string) => ({match: RegExp(pattern)}),
  type: (type: string) => ({type: (<any>typeStrings)[type]}),
  minLength: (min: number) => ({minlength: min}),
  maxLength: (max: number) => ({maxlength: max}),
  minimum: (min: number) => ({min: min}),
  maximum: (max: number) => ({max: max}),
  enum: (members: any[]) => ({enum: members})
};
