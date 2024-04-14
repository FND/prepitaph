title: Unicode Symbols
tags: miscellaneous
author: FND
created: 2024-04-14

```intro
A personal selection.
```

```aside compact
More comprehensive collections include [symbol.wtf](https://symbol.wtf) and
[SYMBL](https://symbl.cc).
```

```markdown allowHTML
<unicode-symbols>
    <table>
        <thead>
            <tr>
                <th>Symbol</th>
                <th>Shortcut</th>
                <th>Comment</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>⌘</td>
                <td>cmd</td>
                <td></td>
            </tr>
            <tr>
                <td>↹</td>
                <td>tab</td>
                <td></td>
            </tr>
            <tr>
                <td>✓</td>
                <td>tick</td>
                <td></td>
            </tr>
            <tr>
                <td>✗</td>
                <td>check</td>
                <td></td>
            </tr>
            <tr>
                <td>☐ ☑ ☒</td>
                <td>checkboxes</td>
                <td></td>
            </tr>
            <tr>
                <td>★ ⭑ ☆ ⭒</td>
                <td>stars</td>
                <td></td>
            </tr>
            <tr>
                <td>‽</td>
                <td>interro</td>
                <td></td>
            </tr>
            <tr>
                <td>…</td>
                <td>hellip</td>
                <td></td>
            </tr>
            <tr>
                <td>—</td>
                <td>mdash</td>
                <td></td>
            </tr>
            <tr>
                <td>–</td>
                <td>ndash</td>
                <td></td>
            </tr>
            <tr>
                <td>∞</td>
                <td>infinity</td>
                <td></td>
            </tr>
            <tr>
                <td>°</td>
                <td>deg</td>
                <td></td>
            </tr>
            <tr>
                <td>•</td>
                <td>bullet</td>
                <td></td>
            </tr>
            <tr>
                <td>Δ</td>
                <td>delta</td>
                <td></td>
            </tr>
            <tr>
                <td>⚠</td>
                <td>warn</td>
                <td></td>
            </tr>
            <tr>
                <td>←</td>
                <td>larr</td>
                <td></td>
            </tr>
            <tr>
                <td>→</td>
                <td>rarr</td>
                <td></td>
            </tr>
            <tr>
                <td>⇒</td>
                <td>rArr</td>
                <td></td>
            </tr>
            <tr>
                <td>↔</td>
                <td>harr</td>
                <td></td>
            </tr>
            <tr>
                <td>™</td>
                <td>tm</td>
                <td></td>
            </tr>
            <tr>
                <td>©</td>
                <td>c</td>
                <td></td>
            </tr>
            <tr>
                <td>≈</td>
                <td>approx</td>
                <td></td>
            </tr>
            <tr>
                <td>≙</td>
                <td>correspond</td>
                <td></td>
            </tr>
            <tr>
                <td>≟</td>
                <td>mequal</td>
                <td></td>
            </tr>
            <tr>
                <td>≠</td>
                <td>nequal</td>
                <td></td>
            </tr>
            <tr>
                <td>×</td>
                <td>multi</td>
                <td></td>
            </tr>
            <tr>
                <td>±</td>
                <td>plusminus</td>
                <td></td>
            </tr>
            <tr>
                <td>¼ ½ ¾</td>
                <td>fract</td>
                <td></td>
            </tr>
            <tr>
                <td>¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁰</td>
                <td>sup</td>
                <td></td>
            </tr>
            <tr>
                <td>¹</td>
                <td>sup1</td>
                <td></td>
            </tr>
            <tr>
                <td>²</td>
                <td>sup2</td>
                <td></td>
            </tr>
            <tr>
                <td>³</td>
                <td>sup3</td>
                <td></td>
            </tr>
            <tr>
                <td>₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉</td>
                <td>sub</td>
                <td></td>
            </tr>
            <tr>
                <td>€</td>
                <td>eur</td>
                <td></td>
            </tr>
            <tr>
                <td>“”‘’«»</td>
                <td>quot</td>
                <td></td>
            </tr>
            <tr>
                <td>∎</td>
                <td>tomb</td>
                <td><a href="https://en.wikipedia.org/wiki/Tombstone_%28typography%29">Tombstone (typography)</a></td>
            </tr>
            <tr>
                <td>⏻</td>
                <td>power</td>
                <td><a href="https://en.wikipedia.org/wiki/Power_symbol#Unicode">power symbols</a></td>
            </tr>
            <tr>
                <td>¯\_(ツ)_/¯</td>
                <td>shrug</td>
                <td></td>
            </tr>
            <tr>
                <td>(╯°□°）╯︵ ┻━┻</td>
                <td>flip</td>
                <td></td>
            </tr>
        </tbody>
    </table>
</unicode-symbols>
<style class="nonvisual">
unicode-symbols {
    table {
        --spacing-inline: var(--spacing-sm1);

        margin-inline: calc(-1 * var(--spacing-inline)); /* accounts for padding */
        border-collapse: collapse;
    }

    tbody tr:hover {
        background-color: #EEE;
    }

    :is(th, td) {
        padding: var(--spacing-sm3) var(--spacing-inline);
    }

    th {
        text-align: left;
    }

    button {
        font-size: inherit;
        transition: none var(--animation-duration) ease-in-out;
        transition-property: scale, opacity;

        &.is-pending {
            scale: 0.8;
        }

        &.is-success {
            scale: 0.9;
            opacity: 0.5;
        }
    }
}
</style>
<script type="module" class="nonvisual">
let ANIMATION_DURATION = 150;

customElements.define("unicode-symbols", class extends HTMLElement {
    connectedCallback() {
        let table = this.querySelector("table");
        table.querySelector("thead").appendChild(document.createElement("th"));
        table.style.setProperty("--animation-duration", `${ANIMATION_DURATION}ms`);

        let tbody = table.querySelector("tbody");
        for(let row of tbody.querySelectorAll("tr")) {
            let btn = document.createElement("button");
            btn.type = "button";
            btn.innerHTML = `
<span aria-hidden="true">📋</span>
<span class="nonvisual">Copy to clipboard</span>
            `.trim();

            let cell = document.createElement("td");
            cell.appendChild(btn);
            row.appendChild(cell);
        }

        this.addEventListener("click", this);
    }

    async handleEvent(ev) {
        let btn = ev.target.closest("button");
        if(!btn) {
            return;
        }

        let txt = btn.closest("tr").querySelector("td").textContent;
        btn.classList.add("is-pending");
        await navigator.clipboard.writeText(txt);
        btn.classList.add("is-success");
        setTimeout(() => {
            btn.classList.remove("is-pending", "is-success");
        }, ANIMATION_DURATION);
    }
});
</script>
```

```disclosure caption="shell script"
'''shell
#!/usr/bin/env bash

set -eu

clipboard=""
if [ "${1:-""}" = "-c" ]; then
    clipboard=true
    shift
fi
symbol=${1:-""}

function emit {
    symbol=${1:?}

    if [ -z "$clipboard" ]; then
        echo "$symbol"
    else
        echo -n "$symbol" | pbcopy
    fi
}

case $symbol in
    cmd)
        emit "⌘"
        ;;
    tab)
        emit "↹"
        ;;
    tick)
        emit "✓"
        ;;
    check)
        emit "✗"
        ;;
    checkboxes)
        emit "☐ ☑ ☒"
        ;;
    stars)
        emit "★ ⭑ ☆ ⭒"
        ;;
    interro)
        emit "‽"
        ;;
    hellip)
        emit "…"
        ;;
    mdash)
        emit "—"
        ;;
    ndash)
        emit "–"
        ;;
    infinity)
        emit "∞"
        ;;
    deg)
        emit "°"
        ;;
    bullet)
        emit "•"
        ;;
    delta)
        emit "Δ"
        ;;
    warn)
        emit "⚠"
        ;;
    larr)
        emit "←"
        ;;
    rarr)
        emit "→"
        ;;
    rArr)
        emit "⇒"
        ;;
    harr)
        emit "↔"
        ;;
    tm)
        emit "™"
        ;;
    c)
        emit "©"
        ;;
    approx)
        emit "≈"
        ;;
    correspond)
        emit "≙"
        ;;
    mequal)
        emit "≟"
        ;;
    nequal)
        emit "≠"
        ;;
    multi)
        emit "×"
        ;;
    plusminus)
        emit "±"
        ;;
    fract)
        emit "¼ ½ ¾"
        ;;
    sup)
        emit "¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁰"
        ;;
    sup1)
        emit "¹"
        ;;
    sup2)
        emit "²"
        ;;
    sup3)
        emit "³"
        ;;
    sub)
        emit "₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉"
        ;;
    eur)
        emit "€"
        ;;
    quot)
        emit "“”‘’«»"
        ;;
    tomb)
        emit "∎"
        ;;
    power)
        emit "⏻"
        ;;
    shrug)
        emit '¯\_(ツ)_/¯'
        ;;
    flip)
        emit "(╯°□°）╯︵ ┻━┻"
        ;;
    *)
        echo "invalid symbol" >&2
        exit 1
        ;;
esac
'''
```
