title: "JSON is faster"
tags: web, javascript, performance
author: FND
created: 2014-11-18
syntax: true

```intro
Discussing [isomorphic JavaScript](https://isomorphic.net/javascript) at
[dotJS](https://www.dotjs.io), I questioned the value of client-side templating --
and was confronted once again with the "but ... JSON is faster!?" assertion.
```

So I ended up drawing this crude diagram (in the air), successfully arguing that
delivering JSON to generate web UIs does in fact merely add complexity and
[overhead](https://jakearchibald.com/2013/progressive-enhancement-still-important/#reduce-your-testing-efforts-in-older-browsers):

```
     server | client
            |
        +-- | --> HTML ------------------> DOM
        |   |                               ^
    ----+   |                               |
        |   |                               |
        +-- | --> JSON                      |
            |       |         e.g. React    |
            |     parse   + - - - - - - - ->+
            |       |    /                  |
            |       v   /                   |
            |    JS object --templating-> HTML
```

Might come in handy again sometime...
