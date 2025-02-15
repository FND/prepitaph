title: Memoization with Lazy Getters
tags: javascript
author: FND
created: 2024-12-15
syntax: true

[TIL](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#smart_self-overwriting_lazy_getters)
JavaScript getters can simply be deleted, even if there's no corresponding
setter:

```javascript
let obj = {
    data: 123,
    get hash() {
        return this.data * Math.random();
    }
};

obj.hash = 666; // 💥 TypeError: setting getter-only property "hash"

delete obj.hash;
obj.hash = 888; // ✅
```

We can use this to avoid redundant computations, replacing our getter with the
respective value upon first invocation:

```javascript
let obj = {
    data: 123,
    get hash() {
        let value = this.data * Math.random();
        delete this.hash;
        this.hash = value;
        return value;
    }
};
```

We could alternatively employ
[`Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
to the same effect:

```javascript
let obj = {
    data: 123,
    get hash() {
        let value = this.data * Math.random();
        Object.defineProperty(this, "hash", {
            value,
            writable: false
        });
        return value;
    }
};
```

This _might_ be preferable because it doesn't (temporarily) change our object's
shape; `delete` can trip up
[engines' performance optimizations](https://phillcode.io/javascript-delete#heading-why-delete-can-be-problematic-understanding-v8-engine-optimizations-and-deoptimizations) --
though I haven't researched this particular scenario.

```aside
As with any caching technique, we need to carefully consider whether the
respective values might change in the future. In this case, we assume that
`data` is immutable.
```

Note that for some scenarios, we might need to distinguish between instance and
prototype properties. That also opens up an intriguing opportunity:

```javascript
class Record {
    set data() {
        this._data = data;
        delete this.hash; // resets memoization
    }

    get hash() {
        let value = this._data * Math.random();
        Object.defineProperty(this, "hash", {
            value,
            configurable: true, // enables reset
        });
        return value;
    }
}
```

Here we're caching our value in an instance property, which takes precedence
over the prototype's getter. We can later `delete` that instance property so
that `hash` is recalculated via the prototype when accessed again.
