title: EditorConfig
tags: software engineering, collaboration
author: FND
created: 2024-01-10
syntax: true

As a big believer in both consistency and individual autonomy[ide](footnote://),
I consider [EditorConfig](https://editorconfig.org) an important part of
projects' standard setup:

```ini
# https://editorconfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
max_line_length = 80
indent_style = tab
indent_size = 4

[*.md]
indent_style = space

[COMMIT_EDITMSG]
trim_trailing_whitespace = false
max_line_length = 72
indent_style = space
```

NB:

* While line length is capped at 80 characters here, I typically use a more
  lenient 90 characters for [automated tools](page://articles/banishing-npm)
  (i.e. linting and formatting).
* Naturally, I advocate [using tabs](https://chriscoyier.net/2022/12/13/tabs/)
  by default.
* Strictly speaking, `indent_size = 4` invalidates the "tabs can be configured"
  argument (as pointed out by [mkhl](https://mkhl.codeberg.page)) -- including
  it here is a pragmatic compromise; YMMV.

----

```footnote ide
AKA Don't Make Me Use Your IDE[config](footnote://)
```

```footnote config
... and don't you dare adding your IDE-specific configuration to our common
repository.
```
