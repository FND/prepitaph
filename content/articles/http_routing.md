title: HTTP Routing with Web Standards
tags: web, http, javascript
author: FND
created: 2024-11-22
syntax: true

```intro
Routing HTTP requests is now fairly straightforward in JavaScript thanks to the
[URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API).
That's useful both in a browser context (e.g. for service workers) and on the
server side with [WinterCG](https://wintercg.org)-compatible runtimes.
```

```aside
If routing performance is a concern, especially with complex routes, you might
consider a
[different approach](https://adventures.nodeland.dev/archive/you-should-not-use-urlpattern-to-route-http/).
```

[`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) can
appear daunting at first, but for our purposes here, we can ignore most of its
nuances: Typically all we want are path parameters à la `/items/:slug`, if any.
We can check whether a given request URL matches such a route:

```javascript
let pattern = new URLPattern({
    pathname: "/items/:slug"
});
let url = "https://example.org/items/hello-world?locale=en-dk";

let match = pattern.exec(url);
if(match) {
    console.log(200, match.pathname.groups);
} else {
    console.log(404);
}
```

This will emit `200 { slug: "hello-world" }`.

```infobox
Unfortunately, browser support for `URLPattern` is
[limited](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern#browser_compatibility)
right now.
```

A simplistic dispatching mechanism for incoming requests might look like this:

```javascript
let request = new Request("https://example.org/items/hello-world");
let response = dispatch(request);
console.log(response, "\n" + await response.text());

function dispatch(request) {
    let match = pattern.exec(request.url);
    if(match) {
        return handler(request, match.pathname.groups);
    }

    return new Response("", { status: 404 });
}

function handler(request, params) {
    return new Response(`This is ${params.slug}.`, {
        status: 200,
        headers: {
            "Content-Type": "text/plain"
        }
    });
}
```


Route Abstraction
-----------------

Usually we have more than one route, of course, with request processing
additionally depending on the respective HTTP method:

* `/` is our root, responding to `GET`
* `/items` is a collection, responding to `GET` and `POST`
* `/items/:slug` is an entity, responding to `GET` and `PUT`

Clearly we could use an abstraction to define request handlers (AKA controllers)
and to determine which is responsible for incoming requests:

```javascript
class Route {
    constructor(pattern, handlers) {
        this._pattern = new URLPattern({ pathname: pattern });
        this._handlers = handlers;
    }

    dispatch(request) {
        let match = this._pattern.exec(request.url);
        if(!match) {
            return null;
        }

        let handler = this._handlers[request.method];
        if(handler) {
            return handler(request, match.pathname.groups);
        }

        let supportedMethods = Object.keys(this._handlers);
        return new Response("405 Method Not Allowed\n", {
            status: 405,
            headers: {
                Allow: supportedMethods.join(", "),
                "Content-Type": "text/plain"
            }
        });
    }
}
```

With that a semi-declarative routing table might look like this:

```javascript
let ROUTES = {
    root: new Route("/", {
        GET: showRoot
    }),
    collection: new Route("/items", {
        GET: showCollection,
        POST: createEntity
    }),
    entity: new Route("/items/:slug", {
        GET: showEntity,
        PUT: updateEntity
    })
};

function showEntity(request, { slug }) {
    // …
}
```

```aside compact
Support for `OPTIONS` and `HEAD` methods was omitted here for brevity.
```

Request processing is then just a matter of delegation:

```javascript
function dispatch(request) {
    for(let route of Object.values(ROUTES)) {
        let res = route.dispatch(request);
        if(res) {
            return res;
        }
    }

    return new Response("404 Not Found\n", {
        status: 404,
        headers: {
            "Content-Type": "text/plain"
        }
    });
}
```


Reverse Routing
---------------

When generating URLs for resources within our system (yay hypermedia), we want
to avoid arbitrary string stitching as that undermines our routes' authority and
encapsulation.

While waiting for
[reverse routing to be standardized](https://github.com/whatwg/urlpattern/discussions/41),
we might extend our `Route` class with a crude-but-functional approximation:

```javascript
    url(params, query) {
        let res = this._pattern.pathname;
        if(params) {
            for(let [key, value] of Object.entries(params)) {
                res = res.replace(":" + key, value);
            }
        }
        if(query) {
            let url = new URL(res, "http://localhost");
            for(let [name, value] of Object.entries(query)) {
                url.searchParams.set(name, value);
            }
            res = url.pathname + url.search;
        }
        return res;
    }
```

This then allows us to generate URLs like this:

```javascript
ROUTES.entity.url({ slug: "hello-world"); // "/items/hello-world"
ROUTES.collection.url(null, { query: "lipsum" }); // "/items?query=lipsum"
```

A more elaborate system might want to consider type safety (if only for
autocompletion purposes) and other details, but this lightweight approach has
proven both sufficient and effective for me on many occasions.
