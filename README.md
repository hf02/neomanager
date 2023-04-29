# Neomanager

An unofficial CLI for [Neocities](https://neocities.org). It uploads folders quicker than the official CLI by batching them, and comes with the ability to download your website.

_Note: I'm new when it comes to FOSS and CLI_

## Comparison

https://user-images.githubusercontent.com/55464333/235323025-f2452a68-461e-4bc7-8390-0d3b22c64054.mp4

|                           | Neomanager | Official CLI |
| :------------------------ | :--------: | :----------: |
| Uploading                 |     ✅     |      ✅      |
| Speed (240 new, 256 same) |  **21s**   |    2m 5s     |
| Downloading               |     ✅     |      ❌      |
| Progress bar              |     ✅     |      ❌      |
| Install method            |    npm     |   RubyGems   |
| File list                 |     ❌     |      ✅      |
| Deleting                  |     ❌     |     ✅¹      |
| .gitignore support        |    ✅²     |      ✅      |
| Site info                 |     ❌     |      ✅      |
| Pizza                     |     ❌     |      ✅      |

---

¹: Manual

²: Uses `.neomanager-ignore`. Lacks an option to disable or set using flags, but includes a catch-all for supporter-only files.

---

## Install

Make sure you have [Node](https://nodejs.org/en) installed, and then run:

```
$ npm install --global neomanager
```

## Usage

```
$ neomanager upload .
Neomanager

224 uploading (4364 skipped)
[=========================] 100%
507.15KB/507.15KB


Done.
```

### Skipping

If Neomanager detects that the exact file is already uploaded to your website, it'll skip it.

It also supports an ignore file called `.neomanager-ignore`. It uses the same syntax as `.gitignore`, but with some differences:

-   Adding `#*supporter` will ignore all supporter-only file types.
-   You have to specifically ignore `.neomanager-ignore`.
