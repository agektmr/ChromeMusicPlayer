# Chrome Music Player
Music Player using Chrome App technology is here.

![screenshot](https://raw.github.com/agektmr/ChromeMusicPlayer/master/resources/screenshot.png)

## Features:
* Local music import (`chrome.mediaGalleries`)
* Drag and drop music import
* ID3 tag support
* Sync music files across clients (`chrome.syncFileSystem`)
* Quota indicator

## Exciting part:
By using the power of `chrome.syncFileSystem` API, imported music files will be saved on Google Drive and you can sync them across clients!
To feel the power, go Google Drive > Chrome Syncable FileSystem > [app's extension-id] and drop any music file onto it. The music will be imported to Chrome Music Player shortly after you launch the app next time.

## Note:
* Currently files can't be actually removed from Google Drive by a bug of syncFileSystem && filer.js. Remove it manually by going to Google Drive > Chrome Syncable FileSystem > [app's extension-id]
* There are many other issues. Contribution will be welcomed!
https://github.com/agektmr/ChromeMusicPlayer

## Installation:
1. `> git clone git@github.com:agektmr/ChromeMusicPlayer.git`
2. `> cd ChromeMusicPlayer/`
3. `> git submodule init`
4. `> git submodule update`
5. Open `chrome://extensions` and check `Developer mode`
6. Click `Load unpacked extension...` and select `ChromeMusicPlayer/src`
7. Now you will see Chrome Music Player app on your new tab page
