title: Image Manipulation
tags: miscellaneous, shell
author: FND
created: 2024-07-08
syntax: true

cf. [Video Manipulation](page://wip/video-manipulation)


Convert SVG
-----------

```shell
$ convert -antialias -resize 128x128 -background none sample.{svg,png}
```


Set Transparency
----------------

```shell
$ convert -transparent white -fuzz 10% sample.{jpg,png}
```


Crop
----

```shell
$ convert -crop +20+10 input.jpg output.jpg
$ convert -crop -20-10 input.jpg output.jpg
```

The first command removes 20 pixels from the left and 10 pixels from the top,
the second command removes 20 pixels from the right, 10 pixels from the bottom.

In some cases such trimming might be automated:

```shell
$ convert -trim input.jpg output.jpg
```


Resize GIF
----------

```shell
$ convert input.gif -coalesce -resize 128x -deconstruct output.gif
```
