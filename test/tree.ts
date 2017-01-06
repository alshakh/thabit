import { Tree, Leaf, Link } from './../src/tree';
import * as assert from 'assert'

describe('Tree', () => {
  describe('#resolve', () => {
    let t: Tree = Tree.makeTree({
      _: '',
      'str': 'r',
      'num': 34,
      'bool': true,
      'obj': { a: true, b: 'abc' },
      'func': (a: string): string => { return 'ret' },
      subtree: {
        _: undefined,
        'str': 's',
        'invalid-link': new Link('invalid-link'),
        subsubtree: {
          _: undefined,
          'str': 'ss'
        },
        'rel-parental-link': new Link('../str'),
        'abs-link': new Link('/str'),
        'rel-self-link': new Link('./str')
      },
      'abs-inner-link': new Link('/subtree/str'),
      'rel-inner-link': new Link('subtree/str'),
      'object-link': new Link('/obj'),
      'shallow-link': new Link('str'),
      'link-to-link': new Link('subtree/rel-parental-link')
    });

    describe('resolving levels', () => {
      it('shallow', () => {
        assert.equal(t.resolve('str'), 'r');
      });
      it('abs shallow', () => {
        assert.equal(t.resolve('/str'), 'r');
      });
      it('deep', () => {
        assert.equal(t.resolve('subtree/str'), 's');
      });
      it('deeper', () => {
        assert.equal(t.resolve('subtree/subsubtree/str'), 'ss');
      });
      it('. & .. combo', () => {
        assert.equal(t.resolve('./subtree/../subtree/./subsubtree/.././../str'), 'r');
      });
      it('resoliving non existant path', () => {
        assert.throws(() => { t.resolve('./invalid/path') });
      });
      it('resolve a tree', () => {
        assert(t.resolve('subtree') instanceof Tree)
      })
    })

    describe('values', () => {
      it('string value', () => {
        assert.equal(t.resolve('/str'), 'r')
      });
      it('literal object', () => {
        assert.deepEqual(t.resolve('/obj'), { a: true, b: 'abc' })
      });
      it('boolean', () => {
        assert.equal(t.resolve('/bool'), true)
      });
      it('number', () => {
        assert.equal(t.resolve('/num'), 34)
      });
      it('function', () => {
        assert.equal(typeof t.resolve('/func'), 'function')
      });
    })

    describe('links', () => {
      //         'invalid-link': new Link('invalid-link'),
      //   subsubtree: {
      //     _ : undefined,
      //     'str' : 'ss'
      //   },
      //   'relativ-parental-link': new Link('../str'),
      //   'abs-link': new Link('/str'),
      //   'rel-self-link': new Link('./str')
      // },
      // 'abs-inner-link': new Link('/subtree/str'),
      // 'rel-inner-link': new Link('subtree/str'),
      // 'object-link': new Link('/obj')
      it('shallow link', () => {
        assert.equal(t.resolve('shallow-link'), 'r');
      });
      it('link to link ', () => {
        assert.equal(t.resolve('link-to-link'), 'r');
      });
      it('abs link', () => {
        assert.equal(t.resolve('abs-inner-link'), 's');
      });
      it('rel inner link', () => {
        assert.equal(t.resolve('rel-inner-link'), 's');
      });
      it('link to object', () => {
        assert.deepEqual(t.resolve('/object-link'), { a: true, b: 'abc' })
      });
      it('invalid link', () => {
        assert.throws(() => {
          t.resolve('subtree/invalid-link');
        })
      });
      it('parental link', () => {
        assert.equal(t.resolve('/subtree/rel-parental-link'), 'r')
      });
      it('inner abs link', () => {
        assert.equal(t.resolve('/subtree/abs-link'), 'r')
      });
      it('. link', () => {
        assert.equal(t.resolve('/subtree/rel-self-link'), 's')
      });
      it('ignore resolving links', () => {
        assert(t.resolve('shallow-link', true) instanceof Link)
      })
    })
  });
    describe('#mount (depnds on resolve())', () => {
      let t: Tree;

      beforeEach(() => {
        t = Tree.makeTree({
          _: '',
          a: {
             _: '',
          },
          b: {
             _: '',
            ba: { _ : ''},
            bb: { _ : ''}
          },
          c: {a : true, b:'abc'}
        })
      })
      it('sallow value', () => {
        t.mount('v', 's');
        assert(t.resolve('v') === 's');
      });
      it('valid deep value', () => {
        t.mount('a/aa', 's');
        assert(t.resolve('a/aa') === 's');
      });
      it('invalid deep value', () => {
        assert.throws(() => { t.mount('q/qa', 's') });
      });
      it('override value', () => {
        let v = 's';
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
        t.mount('a', 's');
        assert.throws(() => { old.resolve('..') });
      });
    });
    describe("#unmount", () => {
      let t: Tree;
      beforeEach(() => {
        t = Tree.makeTree({
          _: '',
          a: {},
          b: {
            _: '',
            ba: {_ : ''},
            bb: 'a'
          },
          c: 's'
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
        _: '',
        a: {
          _: '',
          aa: {
            _: '',
          },
          ac: new Link("/bin")
        },
        b: {'_':''},
        c: new Link('/a/aa'),
        d: new Link('/a/aa/tttt')
      })
      let b = Tree.makeTree({
        '_': '',
        a: {
          '_': '',
          aa: new Link('/'),
          ab: {'_':''},
          ad: 'q'
        },
        b: {
          '_': '',
          ba: new Link("ABC")
        }
      })
      a.absorb(b);
      let result = Tree.makeTree({
        _: '',
        a: {
          _: '',
          aa: new Link('/'),
          ab: {'_':''},
          ac: new Link("/bin"),
          ad: 'q'
        },
        b: {
          _: '',
          ba: new Link("ABC")
        },
        c: new Link('/a/aa'),
        d: new Link('/a/aa/tttt')
      })
      assert.deepEqual(a, result);
  })

});