title: HTTP Caching 101
tags: http, performance
author: FND
created: 2018-06-23
_origin_: https://gist.github.com/FND/7b39cea74df8ba69b5b6477fb152f42f

```intro
After repeatedly teaching the basics of HTTP caching in an ad-hoc fashion, I
decided it was worth briefly summarizing the fundamental mechanisms.
```

Circumstances at the time meant that giving an internal presentation was
incumbent, so I opted for an approach that steps through HTTP request/response
cycles; slides work reasonably well for that.

The [slide deck](./slides.html) explains various scenarios and corresponding
headers. It starts by introducing conditional `GET` requests (via
`Last-Modified`/`If-Modified-Since` or `ETag`/`If-None-Match`), followed by
resource expiry (via `Expires` or `Cache-Control`). From there, we can
distinguish immutable from volatile resources and point out common patterns like
stale and private resources.

```aside
I actually ended up writing my own
[web-based presentation framework](https://github.com/FND/quaynaut) for this --
as one does... It's a bit rough around the edges and not something I'd
recommend, but it worked well enough for this particular purpose.
```

Steve Souders's
[Cache is King](https://www.stevesouders.com/blog/2012/10/11/cache-is-king/)
served as inspiration for this trimmed-down introduction (cf.
[slides](https://www.slideshare.net/souders/cache-is-king) 30 ff.; 00:10:41 in
the [video](https://youtu.be/HKNZ-tQQnSY?t=641)). Also worth reading are Jake
Archibald's
[Caching best practices & max-age gotchas](https://jakearchibald.com/2016/caching-best-practices/)
along with Fastly's real-world analysis in
[The headers we want](https://www.fastly.com/blog/headers-we-want) and
[The headers we don't want](https://www.fastly.com/blog/headers-we-dont-want).
