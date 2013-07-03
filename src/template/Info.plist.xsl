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
<xsl:output method="xml" indent="yes"/>
<xsl:template match="//application">
<xsl:text>&#xa;</xsl:text>
<xsl:text disable-output-escaping="yes">&lt;!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"&gt;</xsl:text>
<xsl:text>&#xa;</xsl:text>
<plist version="1.0">
  <dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>English</string>
    <key>CFBundleExecutable</key>
    <string>xulrunner</string>
    <key>CFBundleGetInfoString</key>
    <string><xsl:value-of select="//application/name" /><xsl:text> </xsl:text><xsl:value-of select="//application/version" /></string>
    <key>CFBundleIconFile</key>
    <string>znotes</string>
    <key>CFBundleIdentifier</key>
    <string><xsl:value-of select="//application/bundle" /></string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string><xsl:value-of select="//application/name" /></string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string><xsl:value-of select="//application/version" /></string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleVersion</key>
    <string><xsl:value-of select="//application/version" /></string>
  </dict>
</plist>
</xsl:template>
</xsl:stylesheet>
