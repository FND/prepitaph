title: Data URIs
tags: web
author: FND
created: 2020-11-05
syntax: true

```intro
The `data:` URI scheme is an underappreciated trick for virtual files.
```

A while back, I unintentionally amazed meeting attendees when spawning an ad-hoc
notepad by entering `data:text/html,<textarea>` into my browser's address bar.

```aside
For correctness, you might wanna add a few details to the above (e.g. to avoid
[quirks mode](https://en.wikipedia.org/wiki/Quirks_mode) or
[mojibake](https://en.wikipedia.org/wiki/Mojibake)):

'''
data:text/html;charset=utf-8,<!DOCTYPE html><textarea></textarea>
'''

(cf.
[A Minimal HTML5 Document](https://brucelawson.co.uk/2010/a-minimal-html5-document/))
```

I first learned about this trick from SVG folks (e.g. to
[embed icons within a style sheet](https://github.com/AanZee/harbour/blob/0f8ab5d61e64e6da935703f35274d763f3826913/scss/utilities/get-svg-uri.scss#L16)):

```
data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100%" height="100%" /></svg>
```

Note that the SVG string needs to be
[URL-encoded](https://en.wikipedia.org/wiki/URL_encoding) there; e.g. using
`%23` instead of `#` for hex colors.

Binary data can be inserted via Base64 encoding -- for which I'd created a
little Python script:

```figure filename=b64encode
'''python
#!/usr/bin/env python3

"""
Usage:
  $ ./b64encode "image/png" "/path/to/image.png"
"""

import sys

from base64 import b64encode


def main(_, mime_type, filepath):
    with open(filepath, "rb") as fh:
        data = fh.read()
    print("data:%s;base64,%s" % (mime_type, b64encode(data).decode("utf-8")))
    return True


if __name__ == "__main__":
    status = not main(*sys.argv)
    sys.exit(status)
'''
```

[Chris Coyier's article](https://css-tricks.com/data-uris/) on the subject
provides more context and details worth considering.
