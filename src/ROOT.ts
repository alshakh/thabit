import { Tree, Link } from './tree';
import { Args, parseArgv, end, Command } from './objs/command';
import { libTree as libQurraTree } from './lib/qurra';
import { resolve as resolvePath } from 'path';
// import { loadFiles } from './objs/file-tree';
//
function makeCmd(func: (args: Args) => never, usage: string): Command {
  let a: any = func;
  a.usage = usage;
  return a
}
let defaultTree: Tree = Tree.makeTree({
  _: undefined,
  commands: {
    _: undefined,
    'args': makeCmd((args: Args): never => {
      console.log('recieved args', args);
      return end(0);
    }, 'prints the args'),
    'list-commands': makeCmd((args: Args): never => {
      console.log((defaultTree.resolve('commands') as Tree).list());
      return end(0);
    }, 'lists the possible commands'),
    'usage': makeCmd((args: Args): never => {
      let cmdName = args.__[0];
      if (cmdName === undefined) {
        console.error("please specify a command, list-commands will list the possible commands");
        return end(1);
      }
      console.log((defaultTree.resolve(`commands/${cmdName}`) as Command).usage);
      return end(0);
    }, 'prints usage information'),
    'show-tree': makeCmd((args: Args): never => {
      console.log(defaultTree.toString());
      return end(0);
    }, 'outputs the whole tree'),
    'help': new Link('usage')
  },
  configs: {
    _: undefined,
    'site-root': undefined,
    'config-file' : './thabit.json',
    // 'archetype-dir': './archetypes',
    'layout-dir' : './layout',
    // 'theme-dir': './theme',
    // 'themebase-dir' : './themebase'
  },
  actions: {
    _: undefined,
    render: undefined,
    'set-site-dir': (absPath: string): void => {
      let configs = defaultTree.resolve('/configs') as Tree;
      let updateDirEntry = (d: string) => {
        configs.mount(d, resolvePath(absPath, configs.resolve(d) as string));
      }
      configs.mount('site-root', absPath);
      updateDirEntry('config-file');
      updateDirEntry('layout-dir');
    }
  },
  lib: {
    '_': undefined,
    'qurra': libQurraTree(),
  },
  files: {
    '_': undefined,
    layout: undefined, 
    
  }
});
//
export default defaultTree;
