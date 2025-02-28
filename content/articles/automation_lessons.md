title: Automation Lessons
tags: software engineering, collaboration
author: cdent
created: 2025-02-28

```intro
> When creating software, ensure there are working harnesses for testing,
> installation, and upgrade first.
```

This is a lesson from long ago that has stuck with me and been proven valuable
over and over. I recently shared the following with colleagues.

As development technologies have matured the lesson has evolved to assert the
harnesses must be _automated_ and the automation _must_ run before changes
are merged.

Throughout my experience with our previous teams we frequently ignored
this lesson for a variety of reasons, all of which are at least inconvenient
but most of the time invalid:

1. We're in too much of a hurry to add tests, we need to get this out now.
2. This is too complicated to automate.
3. This is too time consuming to run in pull request workflows.
4. This is too resource consuming to run in pull request workflows.

Most of these reasons only feel correct when viewed from the perspective of the
individual developer who needs to do the work to make things go, or is waiting
on CI for the pull request to merge.

For other developers, other teammates, or the customer (who might be a "real"
customer, or someone internal) these reasons don't have much relevance.

If you don't test now, then it is the other people who end up doing the testing
for you, finding issues. Turnaround time on resolving those issues is vastly
higher than it would be otherwise, the other person has to do extra work to get
what they want and you have to do extra work to understand the problem. Instead
you could experience the problem yourself, sooner, and not cascade the wasted
time to others. That wasted time adds up, exponentially, and any time savings
you thought you were getting by pushing things out quickly are dramatically
shrunk.

If you don't automate the tests or the installation, you then have to spend
time doing those things by hand. You do. Your teammates do. The customer does.
And no matter how much you think "oh we're only going to do this by hand once
or twice" that always turns out to be a lie.

Even when it doesn't turn out to be a lie, eventually you'll need test and
installation automation. Paying the price up front has many advantages:

-   There is a significant risk that there won't be time later.

-   Existing test and installation automation provides an exceptionally valuable
    design constraint when adding or modifying features. If something is hard to
    test or hard to install (or upgrade) as designed then that design is _bad_.
    Existing harnesses help you recognize when that is about to happen.

-   The time investment is amortized against the savings gained, sooner.

With regards to "too complicated to automate". Sit with that for a moment. If
that's true, what does it say a) about trying to use the software, b) about
trying to maintain the software over the long run. Let's be honest here.

Okay, say you've managed time well enough to have built tooling that can
automatically test the software to a significant degree as well as
automatically install it somewhere. Great. Then that tooling should be required
to run (automatically) for any pull request and required to pass all tests and
properly do an install before that pull request can merge to its target.
Ideally it would also do an upgrade. That is what _continuous_ integration
means.

We've argued about this being too human-time and compute-resource consuming
many times over. Meanwhile:

-   We encourage developers to run cloud VMs for their own development and manual
    testing work at a vast aggregate monetary cost. Effective local (to the
    laptop!) testing (to be covered in future writing) combined with
    _comprehensive_ centralized testing would be much cheaper.

-   Most developers are probably working multiple independent tasks. Going into a
    wait state for testing to complete and not having something else to do in the
    meantime is unlikely. If it is happening then it suggests that tasks are not
    being decomposed and planned effectively.

-   If the waiting is because tests or testing infrastructure is too flakey, or
    because installation takes too long, imagine what that implies for the
    experience of the customer. Flakey tests and slow installation are problems
    to be solved, not worked around, because if those problems exist for you,
    then they will exist for other people, people who pay.

-   You, individually, spending some time waiting if it means other people do not
    have to wait, later, and do not have to experience bugs, later, is a more
    than worthwhile trade.

We often find ourselves saying a version of the following:

> Once we have it working in context X we'll look into making it work on pull
> requests.

If you can only take one thing (but please take more!) from this document take
the awareness that that is backwards. Instead:

> Make it work on pull requests. Once it is working there, use it in other
> contexts.
