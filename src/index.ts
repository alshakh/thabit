import ROOT from './ROOT';
import { loadFiles } from './objs/file-tree';

// ROOT.mount('files/layout', loadFiles(ROOT.resolve('configs/layout-dir') as string));
ROOT.resolveFn('actions/set-site-dir')('/home/shak/desk/repos/thabit/tmp');
console.log(ROOT.toString())