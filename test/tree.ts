import { Tree, Leaf, Link } from './../src/tree';
import * as assert from 'assert'

class V extends Leaf {
  summary = "Value!"
}

describe('Tree', () => {
  describe('#resolve', () => {
    let t: Tree = Tree.makeTree({
      a: new V(),
      b: {
        ba: 'invalid-link',
        bb: undefined,
        bc: {},
        bd: '../a',
        be: new V(),
        bf: '/a',
        bg: './be'
      },
      c: '/b/bc',
      d: 'b/bd',
      e: '/b/be'
    });
    describe('value', () => {
      it('shallow value', () => {
        assert(t.resolve('a') instanceof V);
      });
      it('abs shallow value', () => {
        assert(t.resolve('/a') instanceof V);
      });
      it('deep value', () => {
        assert(t.resolve('b/be') instanceof V);
      });
    })

    describe('links', () => {
      it('link to value', () => {
        assert(t.resolve('e'));
      });
      it('link to link to value', () => {
        assert(t.resolve('d') instanceof V);
      });
      it('abs link', () => {
        assert(t.resolve('b/bf') instanceof V);
      });
      it('local link', () => {
        assert(t.resolve('b/bg') instanceof V);
      });
      it('invalid link', () => {
        assert.throws(() => t.resolve('b/a'));
      });
    })
    it('tree', () => {
      assert(t.resolve('b/bc') instanceof Tree)
    })
  });
  describe('#mount (depnds on resolve())', () => {
    let t: Tree;

    beforeEach(() => {
      t = Tree.makeTree({
        a: {},
        b: {
          ba: {},
          bb: {}
        },
        c: new V()
      })
    })
    it('sallow value', () => {
      t.mount('v', new V());
      assert(t.resolve('v') instanceof V);
    });
    it('valid deep value', () => {
      t.mount('a/aa', new V());
      assert(t.resolve('a/aa') instanceof V);
    });
    it('invalid deep value', () => {
      assert.throws(() => { t.mount('q/qa', new V()) });
    });
    it('override value', () => {
      let v = new V();
      t.mount('c', v);
      assert.strictEqual(t.resolve('c'), v);
    });
    it('set parent correctly for Tree', () => {
      let vt = new Tree();
      t.mount('t', vt);
      assert.strictEqual(vt.resolve('..'), t);
    });
    it(`can't mount a tree twice`, () => {
      let vt = new Tree();
      t.mount('t', vt);
      assert.throws(() => {
        t.mount('q', vt);
      });
    });
    it('unmount the prevous Tree value when overridden', () => {
      let old = t.resolve('a') as Tree;
      t.mount('a', new V());
      assert.throws(() => { old.resolve('..') });
    });
  });
  describe("#unmount", () => {
    let t: Tree;
    beforeEach(() => {
      t = Tree.makeTree({
        a: {},
        b: {
          ba: {},
          bb: new V()
        },
        c: new V()
      })
    })
    it('unmount value', () => {
      t.unmount('c');
      assert.throws(() => { t.resolve('c') });
    });
    it('deep unmount', () => {
      t.unmount('b/bb');
      assert.throws(() => { t.resolve('b/bb') });
    });
    it('unset parent when tree is unmounted', () => {
      let a = t.resolve('a') as Tree;
      t.unmount('a');
      assert.throws(() => { a.resolve('..') });
    });

  })
  it("#absorb (comprehensive test)", () => {
    let a = Tree.makeTree({
      a: {
        aa: {
        },
        ac: "/bin"
      },
      b: undefined,
      c: '/a/aa',
      d: '/a/aa/tttt'
    })
    let b = Tree.makeTree({
      a: {
        aa: '/',
        ab: undefined,
        ad: new V()
      },
      b: {
        ba: "ABC"
      }
    })
    a.absorb(b);
    let result = Tree.makeTree({
      a: {
        aa: '/',
        ab: undefined,
        ac: "/bin",
        ad: new V()
      },
      b: {
        ba: "ABC"
      },
      c: '/a/aa',
      d: '/a/aa/tttt'
    })
    assert.deepEqual(a, result);
  })

});