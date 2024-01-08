title: Two-Factor Authentication on the Command Line
tags: shell
author: FND
created: 2024-01-07
syntax: true

Prerequisite is [PyOTP](https://pyauth.github.io/pyotp/), which we set up within
a [virtual environment](https://docs.python.org/3/library/venv.html):

```shell
$ python3 -m venv venv
$ . venv/bin/activate
$ pip install pyotp
$ deactivate
```

With that, we can use the following script to generate
[TOTPs](https://en.wikipedia.org/wiki/One-time_password):

```shell
#!/usr/bin/env sh

set -e

secret="…"
root=`dirname "$0"`
root=`realpath "$root"`

generate() {
    python3 -c "import pyotp; totp = pyotp.TOTP('$secret'); print(totp.now())"
}

cd "$root"
. venv/bin/activate

if [ "$1" = "-c" ]; then
    generate | pbcopy
else
    generate
fi
```

* `secret` (l. 5) must be populated with the respective value
* `pbcopy` provides access to macOS's clipboard

```aside
Because `realpath` is not portable, Node might be used as compatibility shim:

'''shell
# using Node as realpath(1) substitute
realpath() {
    filepath="${1:?}"

    node -r fs -p "fs.realpathSync(process.argv[1])" "$filepath"
}
'''

Of course
[Python could be used](https://docs.python.org/3/library/os.path.html#os.path.realpath)
just as well, or even just `readlink -f` (as suggested by
[cdent](https://anticdent.org)).

However, turns out there's a good chance realpath(1) might actually be portable
these days; at least it's available in FreeBSD -- and thus macOS? -- now
(thanks, [mkhl](https://mkhl.codeberg.page)).
```
