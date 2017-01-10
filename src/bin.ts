#!/bin/env node
// import { leafify } from './objs/base'
// import { Args, Command, end, loadDefaultCommands } from './objs/commands'
// import { Tree } from './tree'
import {  Command , parseArgv} from './objs/command'
import ROOT from './ROOT';


function main(argv: string[]): never {
  let cmdName: string;
  if (argv.length < 1) {
    cmdName = 'usage';
  } else {
    cmdName = argv.shift() as string;
  }
  //
  return (ROOT.resolve(`commands/${cmdName}`) as Command)(parseArgv(argv));
}

// console.log(_.summary);
// main(['args', '-a', '-b=3','value']);
main(process.argv.slice(2))
