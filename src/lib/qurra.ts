import makeTemplate = require('lodash.template'); // This is because old typings definition
import * as fs from 'fs';
import * as pth from 'path';
import ROOT from './../ROOT'

let magicIndicators = ['+', '$', '@']
/**
 * + for partial and additional files
 * $ for static files
 * @ for archetypes
 */

type RenderingInfo = { currentFile: string };
type Context = { [name: string]: any, __renderingInfo__: RenderingInfo };
export type Callback = (err: null | Error, result: string | '') => void;


function objMerge(obj: any, ...srcs: any[]): any{
  // similar to Object.assign in es5
  for (let s of srcs) {
    for (let p in s) {
      obj[p] = s[p];
    }
  }
  return obj
}
function resolveNewFile(rootDir: string, currentFile: string, newFile: string): string {
  // cases :-
  //    /abc ==> rootDir + /abc
  //    ./abc & workingDir = s ==> workingDir + ./abc
  if (pth.isAbsolute(newFile)) {
    return pth.join(rootDir, newFile);
  } else {
    return pth.resolve(pth.dirname(currentFile), newFile);
  }
}

export function render(filepath: string, context: any, layoutDir: string, callback: Callback): void {
  let __layoutDir = layoutDir;
  let __context: Context = context;
  __context['resolve'] = resolveFn;
  __context['include'] = includeFn;
  __context['register'] = registerFn;
  __context['ROOT'] = ROOT;
  __context.__renderingInfo__ = { currentFile: filepath };
  // ///////////////////
  function includeFn(fileToRender: string, newContext?:{[name : string] : any}): string {
    let oldCtx = __context;
    __context = objMerge
  ({}, __context, newContext || {});
    //TODO : newContext should not have [$$$,resolve,include]
    __context.__renderingInfo__.currentFile = resolveNewFile(__layoutDir, __context.__renderingInfo__.currentFile, fileToRender); 
    //
    let result = makeTemplate(fs.readFileSync(__context.__renderingInfo__.currentFile , 'utf8'))(__context);
    __context = oldCtx;
    return result;
  }

  // returns the file url in the output dir
  // ./$pic ---> ./pic
  function resolveFn(file: string): string {
    return `! Unimplemented !`;
  }
  // add to context once and propigates to lower files
  function registerFn(name: string, value : any): string {
    return `! Unimplemented !`;
  }
  // ///////////////////
  try {
    let r = includeFn(filepath, {})
    callback(null, r);
  } catch (e) {
    callback(e as Error, '')
  }
}

import { Tree } from './../tree';
export function libTree() : Tree {
  let t = new Tree();
  t.mount('renderFile', render);
  t.mount('setup', ()=>{throw Error('unimplemented')});
  return t;
} 

// render('/home.html', { title: 'TIT', org_name: 'ORG', qqqq: 'outer' , users : ['a','b']}, '/home/shak/desk/repos/thabit/tmp/layout', (err, res: string) => {
//   if (err) throw err;
//   console.log(res)
// });