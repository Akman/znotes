<?xml version="1.0" encoding="UTF-8"?>
<!-- ***** BEGIN LICENSE BLOCK *****
  -
  - Version: GPL 3.0
  -
  - ZNotes
  - Copyright (C) 2012 Alexander Kapitman
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU General Public License
  - along with this program.  If not, see <http://www.gnu.org/licenses/>.
  -
  - The Original Code is ZNotes.
  -
  - Initial Developer(s):
  -   Alexander Kapitman <akman.ru@gmail.com>
  -
  - Portions created by the Initial Developer are Copyright (C) 2012
  - the Initial Developer. All Rights Reserved.
  -
  - Contributor(s):
  -
  - ***** END LICENSE BLOCK ***** -->

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="xml" indent="yes" />
<xsl:template match="//application">
<xsl:text>&#xa;</xsl:text>
<xsl:comment> ***** BEGIN LICENSE BLOCK *****
  -
  - Version: GPL 3.0
  -
  - ZNotes
  - Copyright (C) 2012 Alexander Kapitman
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU General Public License
  - along with this program.  If not, see &lt;http://www.gnu.org/licenses/>.
  -
  - The Original Code is ZNotes.
  -
  - Initial Developer(s):
  -   Alexander Kapitman &lt;akman.ru@gmail.com>
  -
  - Portions created by the Initial Developer are Copyright (C) 2012
  - the Initial Developer. All Rights Reserved.
  -
  - Contributor(s):
  -
  - ***** END LICENSE BLOCK ***** </xsl:comment>
<xsl:text>&#xa;</xsl:text>
<xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html&gt;</xsl:text>
<xsl:text>&#xa;</xsl:text>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <link href="skin/znotes.ico" rel="shortcut icon" />
    <title>ZNotes - is a program for creating and managing notes</title>
    <meta name="author" content="Alexander Kapitman" />
    <meta name="copyright" content="Copyright (C) 2012, 2013 Alexander Kapitman" />
    <meta name="description" content="Save everything you like. Simple text notes and pages downloaded from the Internet, rich multimedia. Store any files and contacts from your address book with notes. Store notes in notebooks, organize them into a hierarchy of categories and use color tags. View and edit the note's source code." />
    <meta name="keywords" content="ZNotes xul zool notes thunderbird чудесные заметки" />
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <meta http-equiv="content-language" content="en" />
    <script type="application/javascript" src="script/googleanalytics.js" />
  </head>
  <body>
    <script type="application/javascript" src="script/liveinternet.js" />
    <script type="text/javascript">
    <xsl:text disable-output-escaping="yes">
      &#xa;//&lt;![CDATA[
      function readCookie( name ) {
        var pattern = name + "=";
        var chain = document.cookie.split(';');
        for( var i = 0; i &lt; chain.length; i++ ) {
          var part = chain[i];
          while ( part.charAt( 0 ) == ' ' ) {
            part = part.substring( 1, part.length );
          }
          if ( part.indexOf( pattern ) == 0 ) {
            return part.substring( pattern.length, part.length );
          }
        }
        return null;
      };
      function createCookie( name, value, period ) {
        var expires = "";
        if ( period ) {
          var date = new Date();
          date.setTime( date.getTime() + ( period * 24 * 60 * 60 * 1000 ) );
          expires = "; expires=" + date.toGMTString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
      };
      var languages = {
    </xsl:text>
    <xsl:for-each select="//application/site/localized/locale">
      <xsl:text>'</xsl:text><xsl:value-of select="@name" /><xsl:text>': '</xsl:text><xsl:value-of select="@name" /><xsl:text>',</xsl:text>
    </xsl:for-each>
    <xsl:text disable-output-escaping="yes">
      };
      var languageDirectory = 'en';
      var browserLanguage = 'en';
      var cookieLanguage = readCookie( 'lang' );
      if ( cookieLanguage == null ) {
        cookieLanguage = 'en';
        if ( navigator &amp;&amp; navigator.language ) {
          cookieLanguage = navigator.language.replace( /(\w{2})(.*)/, '$1' );
        }
        createCookie( 'lang', cookieLanguage, 3000 );
      }
      browserLanguage = cookieLanguage;
      if ( browserLanguage in languages ) {
        languageDirectory = languages[browserLanguage];
      }
      var href = document.location.href;
      var hrefFileName = 'index.xhtml';
      var index = href.lastIndexOf( hrefFileName );
      if ( index &gt;= 0 ) {
        href = href.substring( 0, index );
      }
      href += languageDirectory + '/' + hrefFileName;
      document.location.replace( href );
      &#xa;//]]&gt;
    </xsl:text>
    </script>
  </body>
</html>
</xsl:template>
</xsl:stylesheet>
