import { Tree , Link } from './../tree'
//
export type Args = { [arg: string]: string | string[] , __ : string[]};
export type Command = {
  (args: Args): never,
  usage: string
}
//
export function parseArgv(argv: string[]): Args {
  let a: Args = { __ : []};
  for (let i of argv) {
    if (i.charAt(0) === '-') {
      let q = i.split('=');
      a[q[0]] = q[1] || '';
    } else {
      a.__.push(i);
    }
  }
  return a;
}
//
export function end(exitCode: number): never {
  process.exit(exitCode);
  throw "should be exited now"
}
