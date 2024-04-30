title: Video Manipulation
tags: miscellaneous
author: FND
created: 2024-04-30


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

this will skip the first 10s and retain 60s after that


Rescale
-------

see above

```shell
… -vf scale=800:-1 …
```

this will set the width to 800 pixels and will calculate the height of the
output image according to the input's aspect ratio
