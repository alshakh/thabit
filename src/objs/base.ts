import { Leaf } from './../tree'

export type DirStructure = {} | { [dir: string]: DirStructure };
export function leafify(obj: any, summary? : string): Leaf {
  obj.nodeType = 'leaf';
  obj.summary = summary || String(obj);
  return obj;
}