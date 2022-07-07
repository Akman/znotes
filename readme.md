[ZNotes](http://znotes.net/)
==================================

To get up and running quickly, you need:

Java environment
----------------
<http://www.oracle.com/technetwork/java/javase/downloads/>

Make sure you have a Java environment installed. Set environmental variable JAVA\_HOME to your Java environment, and add ${JAVA\_HOME}/bin (Unix) or %JAVA\_HOME%/bin (Windows) to your PATH.

Apache Ant
----------
<http://ant.apache.org/>

Apache Ant is a Java library and command-line tool whose mission is to drive processes described in build files as targets and extension points dependent upon each other.

Download binary edition of Ant, then uncompress the downloaded file into
suitable directory. Set environmental variable ANT\_HOME to the directory
you uncompressed Ant to, and add ${ANT\_HOME}/bin (Unix) or
%ANT\_HOME%/bin (Windows) to your PATH.

Ant-Contrib Tasks
-----------------
<http://ant-contrib.sourceforge.net/>

The Ant-Contrib project is a collection of tasks ( and at one point maybe types and other tools ) for Apache Ant.

Download latest binary release and uncompress the downloaded file into suitable directory.

Mozilla XULRunner
-----------------
<https://developer.mozilla.org/en/XULRunner>

XULRunner is a Mozilla runtime package that can be used to bootstrap XUL+XPCOM applications that are as rich as Firefox and Thunderbird.

Download latest releases of runtime for all platforms (win32, mac, linux-x86_64, linux-i686) and uncompress the downloaded files into suitable directories.

* * *

OpenSSL
-------
<https://www.openssl.org/community/binaries.html>

The OpenSSL project is a collaborative effort to develop a robust, commercial-grade, full-featured, and open source toolkit implementing the Secure Sockets Layer (SSL v2/v3) and Transport Layer Security (TLS v1) protocols as well as a full-strength general purpose cryptography library.

For Windows platform download latest release from <https://indy.fulgan.com/SSL/>

* * *

MX-Tools / Uhura
----------------
<http://www.softlights.net/projects/mxtools>

MX-Tools is a set of command line tools that can be used during development of extensions for applications built on Mozilla platform. It simplifies such extension creation steps as signing installation packages or generating and signing update manifests.

Download latest release and uncompress the downloaded file into suitable directory.

* * *

Markdown
----------------
<http://daringfireball.net/projects/markdown>

Markdown is a text-to-HTML conversion tool for web writers. Markdown allows you to write using an easy-to-read, easy-to-write plain text format, then convert it to structurally valid XHTML (or HTML).

Download latest release and uncompress the downloaded file into suitable directory.

If you're using *MS Windows*, just copy *markdown.pl* to *markdown.bat* and add the folowing lines to the beginning of the file:

    @perl -x "%~f0" %*
    @goto end

and add the folowing line to the end of the file:

    :end

* * *

Perl
----
<http://www.perl.org>

MX-Tools and Markdown requires Perl 5.8 or newer.

For Windows platform download latest release from <http://strawberryperl.com/>


* * *

Build properties
================

Copy *build.properties.template* to *build.properties* and use your own values in all sections:

* Product
* Ant-Contrib Tasks
* XULRunner runtimes
* OpenSSL
* MX-Tools / Uhura
* Markdown
* Local development environment

* * *

Build ZNotes
============

To list of all project targets run command:

    ant -p

* * *

Translate ZNotes
================

If the necessary language is not supported, visit the downloads section of ZNotes website. For each supported language, you can download localization package (archive):

    znotes-XX.zip

Select a language suitable for the translation and download the corresponding file. For example, to translate from English, download the following file: znotes-en.zip. Then unpack downloaded archive and translate all the information in these files into the desired language. Pack the translated files back into the appropriate archive and email them to me.

Caution! The files should have the UTF-8 encoding without BOM.
