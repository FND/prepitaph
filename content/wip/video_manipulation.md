title: Video Manipulation
tags: miscellaneous, shell
author: FND
created: 2024-04-30
syntax: true

cf. [Image Manipulation](page://wip/image-manipulation)


Reduce File Size
----------------

```shell
$ ffmpeg -i input.mp4 -vcodec libx264 -crf 20 output.mp4
```

> Vary the CRF between around 18 and 24 -- the lower, the higher the bitrate.

or

```shell
$ ffmpeg -i input.mp4 -b 1000000 output.mp4
```

source: [How can I reduce a video's size with ffmpeg?](https://unix.stackexchange.com/questions/28803/how-can-i-reduce-a-videos-size-with-ffmpeg)


Cut
---

```shell
$ ffmpeg -i input.mp4 -ss 00:00:10 -t 60 output.mp4
```

This will skip the first 10 seconds retain 60 seconds after that.


Crop
----

```shell
$ ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
        -of compact input.mp4
$ ffmpeg -i input.mp4 -filter:v "crop=$width:$height:$x:$y" output.mp4
```

This reduces the visible area to the given dimensions (e.g.
`"crop=640:360:320:180"`).

source: [How to Crop and Resize a Video Using FFmpeg](https://www.baeldung.com/linux/ffmpeg-crop-resize-video)


Rescale
-------

```shell
$ ffmpeg … -vf scale=800:-1 …
```

This will set the width to 800 pixels, calculating the height of the output
image according to the input's aspect ratio.


Split
-----

```shell
$ ffmpeg -v quiet -y -i input.mp4 \
        -vcodec copy -acodec copy -ss 00:00:00 -t 00:45:00 -sn output1.mp4 \
        -vcodec copy -acodec copy -ss 00:45:00 -t 01:30:00 -sn output2.mp4
```

NB: This might result in audio being out of sync.


Convert Movie to GIF
--------------------

```shell
$ ffmpeg -i input.mp4 -s 800x450 -r 14 -f gif output.gif
```

`-ss 1.25` additionally skips the first 1.25 seconds
