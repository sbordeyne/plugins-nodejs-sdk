/**
 * Normalize an array of object like the following :
 *
 * In this example, key = 'id'
 * [{id:"x", other: "some value"},{id:"y", other: "some value"}]
 *
 * TO
 *
 * {
 *  x: {id:"x", other: "some value"}
 *  y: {id:"y", other: "some value"}
 * }
 * @param {*} arr input array of object to convert
 * @param {*} key object key to extract
 */
import {Index} from './index';

export function normalizeArray<T, K extends keyof T>(arr: Array<T>, key: K): Index<T> {
  if (!Array.isArray(arr)) throw new Error(`${arr} is not an array`);
  return arr.reduce((acc, object) => {
    const keyValue = String(object[key]);
    return {
      ...acc,
      [keyValue]: object,
    };
  }, {});
}

export function denormalize<T>(index: Index<T>): Array<[string, T]> {
  return Object.keys(index).map(k => [k, index[k]] as [string, T]);
}