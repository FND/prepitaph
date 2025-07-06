title: Exfiltrating Exchange E-Mails
tags: miscellaneous
author: FND
created: 2024-11-15
syntax: true

```intro
If you're forced to use Microsoft's Outlook/Exchange infrastructure or
erroneously employed IMAP, you might need an exit strategy.
```

A failed attempt to re-organize my extensive e-mail archives recently resulted
in a corrupted mailbox: Apparently Thunderbird remains unable to reliably
transfer large amounts of messages via IMAP.[tbird](footnote://)

```footnote tbird
Thunderbird's process stalled, but messages had been deleted server-side without
successfully creating local copies. Afterwards there was all sorts of vexing
weirdness, probably due to inconsistent synchronization state, which I was
unable to fix.
```

```aside compact
'''markdown allowHTML
Of course I should never have let myself be talked into using IMAP in the first
place: Since I don't <s>need</s> want to keep my mailbox in sync across several
devices (secondary devices are for triage only), I prefer the
more-primitive-but-reliable POP3 approach with a local source of truth that I
actually control. (In fact, I'd only used IMAP for <s>professional</s> corporate
e-mails; personal mailboxes have always employed POP3.)
'''
```

I was eventually able to
[recover those messages from backups](#converting-outlook’s-proprietary-archive),
which I realized only after struggling with IMAP for a while.


Mirroring
---------

After arduously researching options, I decided to try
[mbsync](https://isync.sourceforge.io) for downloading the entire mailbox so I
could safely examine the state of corruption. Thankfully
[jeeger](https://thenybble.de) pointed me at
[Local email from Office365 using OAUTH2 with mbsync](https://simondobson.org/2024/02/03/getting-email/);
a detailed walkthrough for my exact scenario (the OAuth dance is necessary due
to two-factor authentication). He additionally provided a simplified template
for mbsync's otherwise somewhat daunting configuration -- the latter was also
why I'd rejected mutt and similar old-school tools in this emergency situation.

```figure filename=.mbsyncrc
'''shell
IMAPAccount work
Host outlook.office365.com
Port 993
SSLType IMAPS
AuthMechs XOAUTH2
User fnd@example.com
#PassCmd "./mutt_oauth2.py -t ./token"
PassCmd "cat ./token"

IMAPStore work-remote
Account work

MaildirStore work-local
SubFolders Verbatim
Path /home/fnd/Mail/
Inbox /home/fnd/Mail/INBOX

Channel work
Far :work-remote:
Near :work-local:
Patterns *
Create Near
SyncState *
Sync Pull
'''
```

I then acquired and customized `mutt_oauth2.py` as described in the
aforementioned article, additionally disabling token encryption because I deemed
that unnecessary for my one-time operation:

```python
ENCRYPTION_PIPE = ["cat"]
DECRYPTION_PIPE = ["cat"]

registrations = {
    "microsoft": {
        # …
        "client_id": "08162f7c-0fd2-4200-a84a-f25a4db0b584",
        "client_secret": "TxRBilcHdC6WGBee]fs?QR:SJ8nI[g82"
    }
}
```

Executing `./mutt_oauth2.py -t --authorize` then generated an access token,
which I stored in the clipboard.

Having spent too much time battling macOS, I decided to run mbsync in a Docker
container for easier cyrus-sasl-xoauth2 support:

```figure filename=Dockerfile
'''docker
# adapted from https://github.com/testcab/docker-yay
FROM archlinux/archlinux:base-devel

RUN pacman -Syu --needed --noconfirm git isync

# create user for makepkg purposes
ARG user=fnd
RUN useradd --system --create-home $user \
    && echo "$user ALL=(ALL:ALL) NOPASSWD:ALL" > /etc/sudoers.d/$user
USER $user
WORKDIR /home/$user

# install yay
RUN git clone https://aur.archlinux.org/yay.git \
    && cd yay \
    && makepkg -sri --needed --noconfirm \
    && cd - \
    && rm -rf .cache yay # cleanup

RUN yay -S --needed --noconfirm cyrus-sasl-xoauth2
'''
```

With this I could spin up a one-off container, mounting the current working
directory as shared volume for data exchange:

```shell
$ docker run --rm -v "$PWD:/tmp/mail" "-it $(docker build -q .)
```

... and launch the mbsync process within:

```shell
$ cat > ./token # paste previously acquired access token
$ mbsync --verbose -c ./.mbsyncrc work
```

After a while, this process had completed mirroring messages to
`/home/fnd/Mail`.

If I had actually set up the shared volume as described above, I could
have just moved that directory to `/tmp/mail` in order to transfer all e-mails
to the host environment. Because I had forgotten that part, I created a tarball
(`tar czf ./mail.tar.gz ./Mail`) and transferred that to the host system via
SSH.


Converting Outlook's Proprietary Archive
----------------------------------------

Unfortunately, examining this [Maildir](https://en.wikipedia.org/wiki/Maildir)
directory confirmed that a lot of messages had been erased. Fortunately though,
our sysadmins had backups (only slightly out of date), so they sent me a few
[`.pst` files](https://en.wikipedia.org/wiki/Personal_Storage_Table).

[Turns out](https://infosec.exchange/@dazo/113472423694558928) those are fairly
easy to convert[debian](footnote://) to
[mbox](https://en.wikipedia.org/wiki/Mbox):

```shell
$ apt-get install pst-utils
$ mkdir ./mail
$ readpst -r ./archives.pst -o ./mail
```


```footnote debian
Again using Docker: `docker run -v "$PWD:/tmp/mail" -it --rm debian sh`
```
