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
<xsl:param name="lang" />
<xsl:output method="text" />
<xsl:template match="//application">
<xsl:variable name="name" select="//application/name" />
<xsl:variable name="vendor" select="//application/vendor" />
<xsl:text># ***** BEGIN LICENSE BLOCK *****
#
# Version: GPL 3.0
#
# ZNotes
# Copyright (C) 2012 Alexander Kapitman
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see &lt;http://www.gnu.org/licenses/>.
#
# The Original Code is ZNotes.
#
# Initial Developer(s):
#   Alexander Kapitman &lt;akman.ru@gmail.com>
#
# Portions created by the Initial Developer are Copyright (C) 2012
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# ***** END LICENSE BLOCK *****

brandShortName=</xsl:text><xsl:value-of select="$name" /><xsl:text>
brandFullName=</xsl:text><xsl:value-of select="concat($vendor,' ',$name)" /><xsl:text>
vendorShortName=</xsl:text><xsl:value-of select="$vendor" /><xsl:text>
</xsl:text>
</xsl:template>
</xsl:stylesheet>
