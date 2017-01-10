import { readdirSync, lstatSync } from 'fs';
import { resolve as resolvePath } from 'path';
import { Tree } from './../tree';

export function loadFiles(absPath: string): Tree | string {
   absPath = resolvePath(absPath);
  if (lstatSync(absPath).isFile()) {
    return resolvePath(absPath);
  }
  let t = new Tree();
  let files = readdirSync(absPath);
  for (let f of files) {
    let fp = absPath + '/' + f;
    t.mount(f, loadFiles(fp));
  }
  return t;
}

// console.log(loadFiles('/home/shak/desk/repos/thabit/tmp/').toString())