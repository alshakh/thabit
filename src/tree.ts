import { inspect } from 'util';
export type Leaf = string | number | boolean | Object | Function;
export type Node = Tree | Leaf | Link;
//
export class Link {
  readonly path: string;
  toString(): string {
    return `Link --> ${this.path}`;
  }
  constructor(path: string) {
    this.path = path;
  }
}
//
export class ResolveError extends Error {
  readonly name: string = 'ResolveError';
  constructor(msg: string) {
    super(msg);
  }
}
//
export class Tree {
  private subnodes: { [mountPoint: string]: Node };
  private parent: Tree | undefined = undefined;
  private _mount(newChild: Node, parentParts: string[], mountPoint: string): string | true {
    if (mountPoint === '' || mountPoint === '.' || mountPoint === '..') {
      return `cannot mount on '', . or ..`;
    }
    if (newChild instanceof Tree && newChild.parent !== undefined) {
      return 'Cannot mount a <tree> twice';
    }

    let p: Tree = this;
    if (parentParts.length > 0) {
      let q = this._resolve(parentParts, false);
      if (q === null || !(q instanceof Tree)) {
        return `parent is not a tree`;
      }
      p = q
    }

    // unmount previous value;
    let prevNode = p.subnodes[mountPoint];
    if (prevNode !== undefined && prevNode instanceof Tree) {
      prevNode.parent = undefined;
    }

    // mount new value
    p.subnodes[mountPoint] = newChild;
    if (newChild instanceof Tree) {
      newChild.parent = p;
    }
    return true;
  }
  mount(on: string, node: Node): void {
    on = normalizePath(on);
    let q = on.split('/');
    let t = this._mount(node, q.slice(0, q.length - 1), q[q.length - 1]);
    if (typeof t === 'string') {
      throw Error(`error! (${on}) : ${t}`);
    }
  }
  /**
   * ignoring links makes things easier to manage
   * and avoid confusion when unmount /path/to/link
   *    is the link going to be unmounted
   *    or the pointed to value!
   */
  unmount(path: string): Node | null {
    path = normalizePath(path);
    let q = path.split('/');
    let parent = this.resolve(q.slice(0, q.length - 1).join('/'), true);
    let basename = q[q.length - 1];
    if (!(parent instanceof Tree)) {
      return null;
    }
    let c = parent.subnodes[basename];
    delete parent.subnodes[basename];
    if (c instanceof Tree) {
      c.parent = undefined;
    }
    return c;
  }
  private _resolve(parts: string[], ignoreLinks: boolean): Node | null {
    let head = parts[0] as string; // assert parts.length >= 1 

    let result: Node | undefined;
    switch (head) {
      case "..": {
        result = this.parent;
        break;
      }
      default: {
        result = this.subnodes[head];

        // resolve links
        // TODO : Error is not clear
        if (!ignoreLinks && result instanceof Link) {
          result = this.resolve(result.path);
        }
      }
    }
    // Cannot resolve
    if (result === undefined) {
      return null;
    }
    // Resolved
    let resolved: Node = result as Node;
    if (parts.length === 1) {
      return resolved;
    } else { // more resolving required
      if (resolved instanceof Tree) {
        return resolved._resolve(parts.slice(1), ignoreLinks);
      } else {
        return null;
      }
    }
  }
  resolve(query: string, ignoreLinks: boolean = false): Node {
    query = normalizePath(query);
    // abs links
    if (query.charAt(0) === '/') {
      let q = query.split('/').slice(1);
      let t: Tree = this;
      while (t.parent !== undefined) {
        t = t.parent
      }
      let r = t._resolve(q, ignoreLinks);
      if (r === null) {
        throw new ResolveError(`Cannot resolve ${query}`);
      }
      return r
    }
    //
    let r = this._resolve(query.split('/'), ignoreLinks);
    if (r === null) {
      throw new ResolveError(`Cannot resolve ${query}`);
    }
    return r;
  }
  resolveTree(query: string): Tree {
    let q = this.resolve(query, false);
    if (!(q instanceof Tree)) {
      throw new ResolveError(`${query} is not a tree`);
    }
    return q;
  }
  resolveStr(query: string): string {
    let q = this.resolve(query, false);
    if (!(typeof q === 'string')) {
      throw new ResolveError(`${query} is not a string`);
    }
    return q;
  }
  resolveFn(query: string): Function {
    let q = this.resolve(query, false);
    if (!(typeof q === 'function')) {
      throw new ResolveError(`${query} is not a function`);
    }
    return q;
  }
  resolveNum(query: string): number {
    let q = this.resolve(query, false);
    if (!(typeof q === 'number')) {
      throw new ResolveError(`${query} is not a number`);
    }
    return q;
  }
  resolveBool(query: string): boolean {
    let q = this.resolve(query, false);
    if (!(typeof q === 'boolean')) {
      throw new ResolveError(`${query} is not a number`);
    }
    return q;
  }
  resolveObj(query: string): Object {
    let q = this.resolve(query, false);
    if (!(typeof q === 'object') || q instanceof Tree || q instanceof Link) {
      throw new ResolveError(`${query} is not an object`);
    }
    return q;
  }
  list(): string[] {
    let l = [];
    for (let i in this.subnodes) {
      if (i === '' || i === '.') {
        continue;
      }
      l.push(i);
    }
    return l;
  }
  private _leafSummary(q: any): string {
    if (typeof q === 'function') {
      return q.toString().substr(0, q.toString().indexOf('{'));
    } else if (typeof q === 'string') {
      return q;
    } else if (q instanceof Link) {
      return q.toString();
    } else if (typeof q === 'object') {
      return inspect(q, false)
    } else {
      return q;
    }
  }
  private _summary(prefix: string, prefixUnit: string): string {
    let output = '';
    output += `\n${prefix}<EMPTY> : ! `;
    if (this.parent !== undefined) {
      output += `\n${prefix}.. : ! `;
    }
    for (let i in this.subnodes) {
      if (i === '') {
        continue;
      }
      if (i === '.') {
        output += `\n${prefix}${i} : ! `;
        continue;
      }
      let q = this.subnodes[i];
      output += `\n${prefix}${i} ${q instanceof Tree ? '/' + q._summary(prefix + prefixUnit, prefixUnit) : ': ' + this._leafSummary(q)}`;
    }
    return output;
  }
  toString(): string {
    return '/' + this._summary('   ', '   ');
  }
  static makeTree(schema: { [subnode: string]: any }): Tree {
    let treeRoot = new Tree();
    delete schema['_'];
    for (let i in schema) {
      let q = schema[i];
      if (typeof q === 'object' && ('_' in q)) {
        treeRoot.mount(i, Tree.makeTree(q));
      } else {
        treeRoot.mount(i, q);
      }
    }
    return treeRoot;
  }
  absorb(overTree: Tree): void {
    // will override this subnodes and destroys overtree
    for (let i in overTree.subnodes) {
      if (i === '' || i === '.') {
        continue;
      }
      let mySubnode = this.subnodes[i];
      let otherSubnode = overTree.subnodes[i];
      if (mySubnode === undefined
        || !(otherSubnode instanceof Tree && mySubnode instanceof Tree)) {
        // I don't have the subnode
        // OR we both don't have trees
        overTree.unmount(i);
        this.mount(i, otherSubnode);
      } else {
        mySubnode.absorb(otherSubnode);
      }
    }
  }
  constructor() {
    this.subnodes = {
      '': this,
      '.': this
    };
  }
}
function normalizePath(path: string): string {
  // */ --> */.
  if ((path.substring(path.length - 1)) === '/') {
    path += '.';
  }
  return path;
}