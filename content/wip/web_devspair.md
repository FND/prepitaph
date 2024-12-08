title: Web-Application Despair
tags: web
author: FND
created: 2022-12-13
syntax: true

I don't know how to write web applications anymore. At least not at scale, in
heterogeneous teams.

All I want is something sustainable, both in terms of end-user experience and
development complexity. These days I'm stumped though.

```markdown allowHTML
JavaScript is tricky: Can't recommend anything Node-based because there's no
<s>serious</s> sufficient web framework[express](footnote://) and the npm
ecosystem is a [dumpster fire](page://articles/banishing-npm)[npm](footnote://).
Deno is exciting, but doesn't currently have a satisfying framework either. The
situation's no better with edge providers' offerings.
```

```footnote express
Express barely qualifies as it requires a lot of choices and duct tape, leaving
you to effectively create your own framework.
```

```footnote npm
Responsibly managing dependencies takes far too much discipline to be a
realistic option in most scenarios, especially over time.
```

Ruby has Rails, obviously -- still the gold standard in many ways, except it's
fallen behind with regard to front-end assets (go read the
[Gospel of Lucas](https://leanpub.com/therails8way)). Structurally,
[boilerplate-driven development](https://railsdiff.org) persists. Plus there's
fascism now(?).

Python doesn't seem to be competitive these days: Django and Flask _feel_ like
they're not up to snuff anymore. The language itself, along with the ecosystem,
has also degraded in various ways. I might be totally wrong here, and I hope I
am; Python used to be my paragon.

Elixir's Phoenix is ... well, _too_ special. Interesting in a cute way, but not
a serious contender.

Go? Yeah, no. (Again I refer you to Lucas.)

Rust? Under the hood, of course.

PHP, well, sure, why not?

Java and its ilk? I hear there's proper component-based templating now. DX is
still terrible in many ways though.

Client-side frameworks are not even worth considering most of the time. (You'd
typically still need a server anyway, so that wouldn't even solve my problem.)
