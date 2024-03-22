title: Default Map in JavaScript
tags: javascript
author: FND
created: 2024-03-22
syntax: true

I've always liked
[Python's `defaultdict`](https://docs.python.org/3/library/collections.html#collections.defaultdict)
and occasionally find myself reimplementing it in other languages, notably
JavaScript -- typically for some kind of dynamic indexing:

```javascript
let index = new DefaultMap(() => []);
// …
for(let category of ["good", "bad", "ugly"]) {
    let values = index.get(category);
    values.push(/* … */);
}
```

That's often much cleaner than using a regular `Map` and branching inline
(because separation of concerns, plus it's easy to make subtle mistakes):

```javascript
let index = new Map();
// …
for(let category of ["good", "bad", "ugly"]) {
    let values = index.get(category);
    if(values === undefined) {
        values = [];
        index.set(category, values);
    }
    values.push(/* … */);
}
```

My implementation always ends up looking like this (reluctantly
[augmented](page://articles/typed-javascript) with static types here, just in
case):

```javascript
/**
 * @template Key
 * @template Value
 * @extends Map<Key, Value>
 */
class DefaultMap extends Map {
    #initializer;

    /** @param {(key: Key) => Value} initializer */
    constructor(initializer) {
        super();
        this.#initializer = initializer;
    }

    /**
     * @param {Key} key
     * @returns {Value}
     */
    get(key) {
        if(this.has(key)) {
            return /** @type {Value} */ (super.get(key));
        }

        let value = this.#initializer(key);
        this.set(key, value);
        return value;
    }
}
```

```aside compact
Note that we're using `.has` instead of checking for `undefined` here: That's a
little safer, accounting for cases where `undefined` might be an acceptable
value.
```
