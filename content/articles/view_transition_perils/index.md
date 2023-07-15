title: Perils of View Transitions
tags: web, javascript
author: FND
created: 2023-07-09
updated: 2023-07-15
syntax: true

```intro
[View transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
are excellent, but might block concurrent animations as well as interactions
while transitioning.

'''infobox
This article was updated a week after publication to include helpful comments
from Mr. View Transitions himself, [Jake Archibald](https://jakearchibald.com),
who was kind enough to respond in private.
'''
```

Wanting to add some flourish to a web application recently, I considered using
[AutoAnimate](https://auto-animate.formkit.com) to more effectively visualize
CRUD operations on lists. Then I realized I might not need this dependency
because we have view transitions now -- and indeed, those make it fairly
straightforward to add animations which are
[both snazzy and useful](https://chriscoyier.net/2023/01/16/intuitive-list-item-transitions-with-the-view-transitions-api/)
(employed as a [progressive enhancement](https://adactio.com/journal/20195), of
course).

In my case, we're stuck with a single-page application consisting of two parts:
Continuous data visualization in one half of the screen, mundane data management
(such as our CRUD lists) in the other.

This is how I realized that view transitions always take over the entire
document: By
[capturing before and after state](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API#the_view_transition_process)
(essentially creating a static bitmap, as I understand it), they momentarily
lock the page in whatever state it's in when `startViewTransition` is invoked.
Thus our list animation briefly freezes visualizations in the other half of the
screen, making it all look a little janky. In fact, even animations within our
very list might be frozen mid-animation (think `transition`s or
[drag'n'drop ghost images](https://www.kryogenix.org/code/browser/custom-drag-image.html)).

```aside compact
Jake clarifies that
[only the outgoing view is frozen](https://developer.chrome.com/docs/web-platform/view-transitions/#transitioning-without-freezing)
while the incoming view is a live representation, so snapshots aren't entirely
static after all.

That article also includes suggestions on how to work around the effect
described above -- notably the
[recommendation](https://developer.chrome.com/docs/web-platform/view-transitions/#async-dom-updates-and-waiting-for-content)
to only invoke `startViewTransition` _after_ all relevant data has been
retrieved, which seems like the principal issue
[in my case](https://github.com/FND/prepitaph/blob/1ae2609d38f5ea736bab0861f5ed8df5dc34f1e6/content/articles/view_transition_perils/demo.js#L31).
```

More importantly, though, it appears those static snapshots result in a loss of
interactivity during transitions: We have to wait for any transition to conclude
before links, buttons or form fields accept our input again. Among other things,
this means users can't rapidly delete multiple list items because only one
operation can be kicked off at a time.

```aside compact
Jake adds:

> It's a design decision that the transitioning area is not interactive, and
> that only one transition can happen at a time. This avoids the case where the
> user clicks something that looks like the old thing, but it's actually the new
> thing.
```

In accordance with local regulations, I've created a not-quite-minimal test case
which simulates a mutable list along with a few simple animations:

```markdown allowHTML
<iframe src="./demo.html"></iframe>
```

Hopefully the
[code](https://github.com/FND/prepitaph/blob/main/content/articles/view_transition_perils/)
is simple enough to grok what's going on: `render` annotates the respective list
item to initiate the aforementioned `transition` before invoking
`startViewTransition`, whose callback rewrites the list's DOM based on the
updated data model (corresponding modifications in `onAction` should be largely
irrelevant).

So unless I'm missing something here (e.g. some technique to limit view
transitions to a subtree of the DOM), it seems that for the moment, "page
transitions" might be a more accurate [name](https://adactio.com/journal/19573)
after all?

```aside compact
Jake points out that
[future efforts](https://developer.chrome.com/blog/spa-view-transitions-land/#but-were-not-done-yet)
include scoped transitions; the very thing I was hoping for above. This should
also allow for concurrent transitions.
```
