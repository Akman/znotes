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
<xsl:param name="key" select="''" />
<xsl:param name="url" select="''" />
<xsl:param name="amo" select="'yes'" />
<xsl:output method="xml" indent="yes"/>
<xsl:template match="//application">
<xsl:text>&#xa;</xsl:text>
<RDF xmlns="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
     xmlns:em="http://www.mozilla.org/2004/em-rdf#">
  <Description about="urn:mozilla:install-manifest">
    <em:id><xsl:value-of select="//application/id" /></em:id>
    <em:version><xsl:value-of select="//application/version" /></em:version>
    <em:type>2</em:type>
    <em:targetApplication>
      <Description>
        <!-- Thunderbird -->
        <em:id><xsl:value-of select="//application/gecko/id" /></em:id>
        <em:minVersion><xsl:value-of select="//application/gecko/version/min" /></em:minVersion>
        <em:maxVersion><xsl:value-of select="//application/gecko/version/max" /></em:maxVersion>
      </Description>
    </em:targetApplication>
    <em:unpack>true</em:unpack>
    <em:optionsURL>chrome://znotes/content/options.xul</em:optionsURL>
    <em:optionsType>1</em:optionsType>
    <em:aboutURL>chrome://znotes/content/about.xul</em:aboutURL>
    <em:iconURL>chrome://znotes_images/skin/icon.png</em:iconURL>
    <em:icon64URL>chrome://znotes_images/skin/icon64.png</em:icon64URL>
    <xsl:if test="$amo='no'">
    <em:updateURL><xsl:value-of select="$url" /></em:updateURL>
    <em:updateKey><xsl:value-of select="$key" /></em:updateKey>
    </xsl:if>
    <em:name><xsl:value-of select="//application/name" /></em:name>
    <em:description><xsl:value-of select="//application/description" /></em:description>
    <em:homepageURL><xsl:value-of select="//application/site/url" /></em:homepageURL>
    <em:creator><xsl:value-of select="//application/creator/name" /></em:creator>
    <xsl:for-each select="//application/contributor">
    <em:contributor><xsl:value-of select="name" /></em:contributor>
    </xsl:for-each>
    <xsl:for-each select="//application/localized/locale">
    <xsl:variable name="lang" select="@name" />
    <xsl:variable name="siteurl" select="//application/site/url" />
    <xsl:variable name="sitelocalized" select="//application/site/localized/locale[@name=$lang]" />
    <xsl:variable name="sitelocalizeddefault" select="//application/site/localized/locale[@name='en']" />
    <em:localized>
      <Description>
        <em:locale><xsl:value-of select="$lang" /></em:locale>
        <em:translator><xsl:value-of select="translator/name" /></em:translator>
        <em:name><xsl:value-of select="//application/name" /></em:name>
        <em:description><xsl:value-of select="description" /></em:description>
        <em:homepageURL>
          <xsl:choose>
            <xsl:when test="$sitelocalized">
              <xsl:value-of select="concat( $siteurl, $sitelocalized/url )" />
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="concat( $siteurl, $sitelocalizeddefault/url )" />
            </xsl:otherwise>
          </xsl:choose>
        </em:homepageURL>
        <em:creator><xsl:value-of select="creator/name" /></em:creator>
        <xsl:for-each select="contributor">
        <em:contributor><xsl:value-of select="name" /></em:contributor>
        </xsl:for-each>
      </Description>
    </em:localized>
    </xsl:for-each>
  </Description>
</RDF>
</xsl:template>
</xsl:stylesheet>
