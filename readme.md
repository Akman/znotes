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

Download *commons-net* <http://commons.apache.org/net/download_net.cgi> and *jakarta-oro* <http://archive.apache.org/dist/jakarta/oro/> jars and place them into ${ANT\_HOME}/lib (Unix) or %ANT\_HOME%/lib (Windows). This files are used by ant's *ftp* task.

Ant-Contrib Tasks
-----------------
<http://ant-contrib.sourceforge.net/>

The Ant-Contrib project is a collection of tasks ( and at one point maybe types and other tools ) for Apache Ant.

Download latest binary release and uncompress the downloaded file into suitable directory, then copy ant-contrib-0.3.jar to the ${ANT\_HOME}/lib (Unix) or %ANT\_HOME%/lib (Windows) directory.

Xalan Java XSLT processor
-------------------------
<http://xml.apache.org/xalan-j/downloads.html#latest-release>

Xalan-Java is an XSLT processor for transforming XML documents into HTML, text, or other XML document types. It implements XSL Transformations (XSLT) Version 1.0 and XML Path Language (XPath) Version 1.0 and can be used from the command line, in an applet or a servlet, or as a module in other program.

Download Xalan Java XSLT processor and uncompress the downloaded file into suitable directory.

Xerces Java Parser
------------------
<http://archive.apache.org/dist/xml/xerces-j/>

The Xerces Java Parser supports the XML 1.0 recommendation and contains advanced parser functionality, such as support for the W3C's XML Schema recommendation version 1.0, DOM Level 2 version 1.0, and SAX Version 2, in addition to supporting the industry-standard DOM Level 1 and SAX version 1 APIs.

Download Xerces Java Parser and uncompress the downloaded file into suitable directory.

Copy *resolver.jar* to the ${ANT\_HOME}/lib (Unix) or %ANT\_HOME%/lib (Windows) directory.

Mozilla XULRunner
-----------------
<https://developer.mozilla.org/en/XULRunner>

XULRunner is a Mozilla runtime package that can be used to bootstrap XUL+XPCOM applications that are as rich as Firefox and Thunderbird.

Download latest releases of runtime for all platforms (win32, mac, linux-x86_64, linux-i686) and uncompress the downloaded files into suitable directories.

* * *

OpenSSL
-------
<http://www.openssl.org>

The OpenSSL project is a collaborative effort to develop a robust, commercial-grade, full-featured, and open source toolkit implementing the Secure Sockets Layer (SSL v2/v3) and Transport Layer Security (TLS v1) protocols as well as a full-strength general purpose cryptography library.

Plain OpenSSL 0.9.8 or newer installation is sufficient.

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

* * *

Build properties
================

Copy *build.properties.template* to *build.properties* and use your own values in all sections:

* product.xml
* Ant-Contrib
* Xalan
* Xerces
* XULRunner runtimes
* OpenSSL
* Uhura
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
