; Script       : NSIS based XULRunner Installer
; Written by   : Natarajan Thanikachalam
; version      : 0.14
; NSIS Version : 2.35
; License      : MPL 1.1/GPL 2.0/LGPL 2.1
; Release Date : 2008-12-26

XULRunnerInstaller is NSIS Script for installing Mozilla XULrunner runtime environment on a windows machine.

You can get the Mozilla XULRunner runtime environment binaries here 
http://releases.mozilla.org/pub/mozilla.org/xulrunner/releases/1.9.0.4/runtimes/xulrunner-1.9.0.4.en-US.win32.zip

Release notes 0.14
------------------
- updated to install XULrunner 1.9.0.4
- Corrected Installation Size

Release notes 0.13
------------------
- bug fix, uninstaller was not getting written

Release notes 0.12
------------------
- updated to install XULRunner 1.9

Release notes 0.11
------------------
- Bug fixes - now correctly detect any previous XRE installation.
- Bug fixes - deletes the temp directory, and uninstall directory correctly. 
- Code Enhancements - uses ZipDLL to extract from the original mozilla binary distribution.

Release notes 0.1
-----------------
 - First release

if you have any comments, please drop me a mail at natarajan@aadima.com