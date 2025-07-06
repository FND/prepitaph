title: Elusive Markup Abstractions
tags: web, html
author: FND
created: 2025-04-27

```intro
Subpar templating remains an obstacle to generating usable HTML.
```

As a long-time proponent of progressive enhancement, I'm very much on board with
[HTML Web Components](https://cloudfour.com/thinks/html-web-components-are-having-a-moment/):
[Core functionality](page://journal/readcently-2024-07-26#ref:core-objectives)
can and should typically be expressed in HTML, delivered fully-assembled to the
client, where it can then be augmented with additional functionality.

This approach has plenty of benefits for users, but also tends to produce
[simpler](page://articles/constraints) architectures -- ergo: It's superior
engineering.

Yet many templating systems are insufficiently powerful to enable
[composable abstractions](https://www.innoq.com/en/articles/2024/04/ssr-components/)
for recurring markup patterns.[markup](footnote://) Frustratingly, that's a
major factor in the
[proliferation of client-side rendering](page://journal/readcently-2024-07-26#the-market-for-lemons)[rendering](footnote://):
Client-side frameworks, for
[all their faults](page://articles/progressive-web-components#s14), do provide
reasonable mechanisms for encapsulating markup definitions. Such client-side
abstractions additionally have the advantage of appearing to be portable and
thus reusable, as JavaScript is (somewhat
[naively](https://www.kryogenix.org/days/2015/06/28/availability/)) perceived
as a universal runtime -- in contrast to server-side scenarios, where different
systems might employ a variety of technologies for generating markup.

```footnote markup
In this context, "markup" refers to both HTML and DOM structures.
```

```footnote rendering
While I try to reject prescriptivism, it seems unfortunate that the community
has malappropriated the term
"[rendering](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work#render)"
to refer to markup generation. (Clearly I need to put more effort into
practicing the linguist's serenity prayer.)
```

Thus templating remains the Achilles' heel of HTML-first advocacy: A structural
disadvantage that I rarely see being addressed by fellow proponents of
progressive enhancement. In my experience, this seemingly mundane aspect
frequently lures people into architecturally unsound decisions.

After
[years of trying to grapple with this](page://journal/templating-2025-06-29) --
sometimes going to [absurd lengths](https://complate.org) -- I can only resort
to advising folks that templating should be a deciding factor in their
technology choices from the start.
