title: Subgrid for Nested Alignment
tags: css
author: FND
created: 2023-12-19
syntax: true

Say we have a list of value groups:

```markdown allowHTML
<ol>
    <li>
        <var>📐 30</var>
        <var>📏 30</var>
        <var>🔗 7</var>
    </li>
    <li>
        <var>📐 70</var>
        <var>📏 43.5</var>
        <var>🔗 17</var>
    </li>
    <li>
        <var>📐 83.5</var>
        <var>📏 100</var>
        <var>🔗 49</var>
    </li>
</ol>
```

Similar fields should be aligned for visual consistency; vertically stacked
(i.e. columns).

We cannot make assumptions about fields' values, so assigning fixed widths is
not an option.

`<table>` seems the obvious solution, but is semantically undesirable in this
case (in part because text messages might be interspersed among tabular data).

```markdown allowHTML
<table>
    <tr>
        <td>📐 30</td>
        <td>📏 30</td>
        <td>🔗 7</td>
    </tr>
    <tr>
        <td>📐 70</td>
        <td>📏 43.5</td>
        <td>🔗 17</td>
    </tr>
    <tr>
        <td>📐 83.5</td>
        <td>📏 100</td>
        <td>🔗 49</td>
    </tr>
</table>
```

Let's assume that `display: table` is equally undesirable.

That leaves [subgrid](https://dev.to/kenbellows/why-we-need-css-subgrid-53mh):

```markdown allowHTML
<ol class="grid">
    <li>
        <var>📐 30</var>
        <var>📏 30</var>
        <var>🔗 7</var>
    </li>
    <li>
        <var>📐 70</var>
        <var>📏 43.5</var>
        <var>🔗 17</var>
    </li>
    <li>
        <var>📐 83.5</var>
        <var>📏 100</var>
        <var>🔗 49</var>
    </li>
</ol>
```

This also allows us to add arbitrary text content in between tabular items:

```markdown allowHTML
<ol class="grid">
    <li>
        <var>📐 30</var>
        <var>📏 30</var>
        <var>🔗 7</var>
    </li>
    <li>
        <var>📐 70</var>
        <var>📏 43.5</var>
        <var>🔗 17</var>
    </li>
    <li class="text">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
        eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </li>
    <li>
        <var>📐 83.5</var>
        <var>📏 100</var>
        <var>🔗 49</var>
    </li>
</ol>
```

(Note that we added an extra column to avoid unnecessarily extending tabular
items.)

```css
.grid {
    --cell-padding: calc(0.5 * var(--spacing)) var(--spacing);
    --cell-border: 1px dashed #CCC;

    display: inline-grid;
    grid-template-columns: repeat(4, auto);
    padding-inline: 0;
    list-style-type: none;

    > * {
        grid-column: 1 / -1;
    }
    > .text {
        font-size: small;
    }
    > :not(.text) {
        display: grid;
        grid-template-columns: subgrid;

        > * {
            border: var(--cell-border);
            padding: var(--cell-padding);

            & + * {
                border-left: none; /* collapse */
            }
        }
        & + * > * {
            border-top: none; /* collapse */
        }

        > :nth-child(1) {
            grid-column: 1 / 2;
        }
        > :nth-child(2) {
            grid-column: 2 / 3;
        }
        > :nth-child(3) {
            grid-column: 3 / 4;
        }
    }
}
```

```markdown allowHTML
<style class="visually-hidden">
.snippet var {
    font-style: normal;
}

.snippet table,
.snippet .grid {
    --cell-padding: calc(0.5 * var(--spacing)) var(--spacing);
    --cell-border: 1px dashed #CCC;

    margin-inline: var(--spacing-l3);
}

.snippet table {
    border-collapse: collapse;

    & td {
        border: var(--cell-border);
        padding: var(--cell-padding);
    }
}

.snippet .grid {
    display: inline-grid;
    grid-template-columns: repeat(4, auto);
    padding-inline: 0;
    list-style-type: none;

    > * {
        grid-column: 1 / -1;
    }
    > .text {
        font-size: small;
    }
    > :not(.text) {
        display: grid;
        grid-template-columns: subgrid;

        > * {
            border: var(--cell-border);
            padding: var(--cell-padding);

            & + * {
                border-left: none; /* collapse */
            }
        }
        & + * > * {
            border-top: none; /* collapse */
        }

        > :nth-child(1) {
            grid-column: 1 / 2;
        }
        > :nth-child(2) {
            grid-column: 2 / 3;
        }
        > :nth-child(3) {
            grid-column: 3 / 4;
        }
    }
}
</style>
```
