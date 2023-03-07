title: Lazy Custom Elements: An Undercover Primer
tags: web components, javascript
author: FND
created: 2023-02-13
_origin_: https://gist.github.com/FND/27c7b25d7463fcb73a9e6ac0f20bb9a6

```intro
At face value,
[An Approach to Lazy Loading Custom Elements](https://css-tricks.com/an-approach-to-lazy-loading-custom-elements/)
appears to propose a solution for on-demand loading of web components. It's
actually subtle propaganda for custom elements.
```

```aside
That article was published shortly before another round of
[unfortunate layoffs](https://news.stanford.edu/2022/12/05/explains-recent-tech-layoffs-worried/)
was [announced](https://geoffgraham.me/goodbye-css-tricks/). Had I anticipated
that, I might have chosen a different publisher.
```

At least that's how it was conceived: The auto-loader is merely a vehicle to
explain, step by step, various stages of implementing a non-trivial custom
element (thus the "you won't actually need all this" note).

This includes the basic setup and vanilla DOM APIs, but also design
considerations such as
[YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it) as well as
configurability and extensibility. A few recurring patterns also make an
appearance, such as using getters as a bridge between attributes and properties.
Plus we highlight the importance of taking performance into account.

Of course this article merely scratches the surface and there are
[more elaborate tutorials](https://webcomponents.guide/tutorials/mastodon-toot-embed/).
It might still be a handy reference, for myself and others -- and it's likely
more tangible than
[earlier attempts](https://gist.github.com/FND/3967cddfa35ff95820303dae52de29d3).
