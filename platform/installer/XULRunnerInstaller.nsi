;*****************************************************************************;
; Script       : NSIS based XULRunner Installer
; Written by   : Natarajan Thanikachalam
; version      : 0.14
; NSIS Version : 2.35
; License      : MPL 1.1/GPL 2.0/LGPL 2.1
; Release Date : 2008-12-26
;*****************************************************************************;

;*****************************************************************************;
; Use lzma.
;*****************************************************************************;
  SetCompressor /SOLID /FINAL lzma

;*****************************************************************************;
; Reserve Files
;*****************************************************************************;
  ;We are using solid compression, files that are required before
  ;the actual installation should be stored first in the data block,
  ;this will make the installer start faster.

  ReserveFile "${NSISDIR}\Plugins\InstallOptions.dll"
  ReserveFile "${NSISDIR}\Plugins\UserInfo.dll"
  ReserveFile "${NSISDIR}\Plugins\ZipDLL.dll"
  ReserveFile "setupType.ini"
  ReserveFile "summary.ini"
  
;*****************************************************************************;
; XRE Settings
;*****************************************************************************;
  !define XRE_NAME                "XULRunner"
  !define XRE_VENDOR              "mozilla.org"
  !define XRE_VERSION             "1.9.0.4"
  !define XRE_LOCALE              "en-US"
  !define XRE_PRODUCTNAME         "Mozilla XULRunner"
  !define XRE_DIR                 "$PROGRAMFILES\${XRE_PRODUCTNAME}"
  !define XRE_REG_KEY             "Software\${XRE_VENDOR}\GRE\${XRE_VERSION}"
  !define XRE_UNINST_REG_KEY      "Software\Microsoft\Windows\CurrentVersion\Uninstall\${XRE_PRODUCTNAME} (${XRE_VERSION})"
  !define XRE_LICENSE             "License"

;*****************************************************************************;
; General Settings
;*****************************************************************************;
 ;Name and file
  Name          "${XRE_PRODUCTNAME} ${XRE_VERSION}"

  OutFile 	XULRunner-1.9.0.4_en-US_win32_installer-0.14.exe

  XPStyle       on
  
  BrandingText  " "

;*****************************************************************************;
; MUI Interface Settings
;*****************************************************************************;
  ;Common
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_RIGHT
  !define MUI_HEADERIMAGE_BITMAP "XULRunnerInstallerHeader.bmp"
  !define MUI_ABORTWARNING

  ;Installer
  !define MUI_LICENSEPAGE_CHECKBOX
  !define MUI_WELCOMEFINISHPAGE_BITMAP XULRunnerInstallerWaterMark.bmp
  !define MUI_ICON               "xulrunner.ico"

  ;UnInstaller
  !define MUI_UNICON             "xulrunner.ico"
  !define MUI_UNWELCOMEFINISHPAGE_BITMAP XULRunnerInstallerWaterMark.bmp

;*****************************************************************************;
; Includes
;*****************************************************************************;
  !include "MUI.nsh"
  !include "InstallOptions.nsh"
  !include "LogicLib.nsh"
  !include "WinMessages.nsh"
  !include "ZipDLL.nsh"

  !include "FileFunc.nsh"
  !insertmacro GetTime

;*****************************************************************************;
; Variables
;*****************************************************************************;
  Var   registerGlobal      ;Global/User
  Var   setupType           ;Standard/Custom

;*****************************************************************************;
; Macro : getUserPrivilages
;*****************************************************************************;
!macro getUserPrivilages
  ClearErrors
  UserInfo::GetName
  IfErrors 0 +3
   ;we are in Win9x
   StrCpy $registerGlobal "1"
   Return

  UserInfo::GetAccountType
  Pop $1
  ${If} $1 == "Admin"
    StrCpy $registerGlobal "1"
  ${ElseIf} $1 == "Power"
    StrCpy $registerGlobal "1"
  ${Else}
    StrCpy $registerGlobal "0"
  ${EndIf}
!macroend

;*****************************************************************************;
; Macro : detectXREInstallation
;*****************************************************************************;
!macro detectXREInstallation

  ${If} $registerGlobal == "1"
    ReadRegStr $1 HKLM "${XRE_REG_KEY}" "GreHome"
  ${Else}
    ReadRegStr $1 HKCU "${XRE_REG_KEY}" "GreHome"
  ${EndIf}

  ${If} $1 == ""
    StrCpy $INSTDIR "${XRE_DIR}"
  ${Else}
    StrCpy $INSTDIR $1
  ${EndIf}
!macroend

;*****************************************************************************;
; Pages
;*****************************************************************************;

  ;--------------------------------------------------------------;
  ;Installation Pages
  ;--------------------------------------------------------------;
  !insertmacro MUI_PAGE_WELCOME

  !insertmacro MUI_PAGE_LICENSE ${XRE_LICENSE}
  
  Page custom setupTypePage readSetupType

  !define MUI_PAGE_CUSTOMFUNCTION_PRE checkSetupType
  !insertmacro MUI_PAGE_COMPONENTS

  !define MUI_PAGE_CUSTOMFUNCTION_PRE checkSetupType
  !insertmacro MUI_PAGE_DIRECTORY

  Page custom summaryPage

  !insertmacro MUI_PAGE_INSTFILES

  !insertmacro MUI_PAGE_FINISH
  ;--------------------------------------------------------------;


  ;--------------------------------------------------------------;
  ;Uninstallation Pages
  ;--------------------------------------------------------------;
  !insertmacro MUI_UNPAGE_WELCOME

  !insertmacro MUI_UNPAGE_CONFIRM

  !insertmacro MUI_UNPAGE_INSTFILES

  !insertmacro MUI_UNPAGE_FINISH
  ;--------------------------------------------------------------;

;*****************************************************************************;
; Installer Section
;*****************************************************************************;

Section "!XULRunner" XULRunnerSection
  SetOutPath "$INSTDIR"
  AddSize 23658

  call copyFilesToInstallDir
  call registerXULRunner
  call createUnInstallRegEntries
SectionEnd

;*****************************************************************************;
; Uninstaller Section
;*****************************************************************************;

Section "Uninstall"
  call un.registerXULRunner
  call un.removeFilesFromInstallDir
  call un.createUnInstallRegEntries
SectionEnd

;*****************************************************************************;
; Function : onInit
;*****************************************************************************;
Function .onInit
  ;Allow only one instance to run
  System::Call 'kernel32::CreateMutexA(i 0, i 0, t "${XRE_PRODUCTNAME} installer") i .r1 ?e'
  Pop $R0
  ${If} $R0 <> 0
   MessageBox MB_OK|MB_ICONEXCLAMATION "${XRE_PRODUCTNAME} installer is already running"
   Abort
  ${EndIf}
  
  ; set section 'XULRunner' as selected and read-only
  IntOp $0 ${SF_SELECTED} | ${SF_RO}
  IntOp $0 $0 | ${SF_BOLD}
  SectionSetFlags ${XULRunnerSection} $0

  !insertmacro getUserPrivilages
  !insertmacro detectXREInstallation

 ;Extract InstallOptions INI files
  !insertmacro INSTALLOPTIONS_EXTRACT "setupType.ini"
  !insertmacro INSTALLOPTIONS_EXTRACT "summary.ini"
FunctionEnd

;*****************************************************************************;
; Function : setupTypePage
;*****************************************************************************;
Function setupTypePage
  !insertmacro MUI_HEADER_TEXT "$(TEXT_IO_TITLE)" "$(TEXT_IO_SUBTITLE)"
  !insertmacro INSTALLOPTIONS_DISPLAY "setupType.ini"
FunctionEnd

;*****************************************************************************;
; Function : readSetupType
;*****************************************************************************;
Function readSetupType
  ;Read the users setup type choice
  !insertmacro INSTALLOPTIONS_READ $setupType "setupType.ini" "Field 3" "State"
FunctionEnd

;*****************************************************************************;
; Function : checkSetupType
;*****************************************************************************;
Function checkSetupType
  ${If} $setupType == "1"
    ;Dont show this page, skip to next
    abort
  ${EndIf}
FunctionEnd

;*****************************************************************************;
; Function : summaryPage
;*****************************************************************************;
Function summaryPage
  !insertmacro MUI_HEADER_TEXT "$(TEXT_SMRY_TITLE)" "$(TEXT_SMRY_SUBTITLE)"
  !insertmacro INSTALLOPTIONS_WRITE "summary.ini" "Field 2" "State" $INSTDIR
  !insertmacro INSTALLOPTIONS_DISPLAY "summary.ini"
FunctionEnd

;*****************************************************************************;
; Function : copyFilesToInstallDir
;*****************************************************************************;
Function copyFilesToInstallDir

  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  strcpy $9 "$TEMP\$2$1$0$4$5$6"
  SetOutPath "$9"
  
  ;All your Installation files goes here
  File xulrunner-1.9.0.4.en-US.win32.zip
  
  ;This is extracted to the Temp Directory
  !insertmacro ZIPDLL_EXTRACT "$9\xulrunner-1.9.0.4.en-US.win32.zip" "$9" "<ALL>"
  CopyFiles /SILENT $9\xulrunner\*.* $INSTDIR

  SetOutPath "$INSTDIR"
  RMDir /r $9

  ;Write the uninstaller
  CreateDirectory $INSTDIR\uninstall
  WriteUninstaller "$INSTDIR\uninstall\helper.exe"
FunctionEnd

;*****************************************************************************;
; Function : registerXulrunner
;*****************************************************************************;
Function registerXULRunner
  ${If} $registerGlobal == "1"
    ExecWait '"$INSTDIR\xulrunner.exe" --register-global'
  ${Else}
    ExecWait '"$INSTDIR\xulrunner.exe" --register-user'
  ${EndIf}
FunctionEnd

;*****************************************************************************;
; Function : createUnInstallRegEntries
;*****************************************************************************;
Function createUnInstallRegEntries
  ${If} $registerGlobal == "1"
    WriteRegStr   HKLM "${XRE_UNINST_REG_KEY}" "DisplayName" "${XRE_PRODUCTNAME} (${XRE_VERSION})"
    WriteRegStr   HKLM "${XRE_UNINST_REG_KEY}" "UninstallString" "$INSTDIR\uninstall\helper.exe"
    WriteRegStr   HKLM "${XRE_UNINST_REG_KEY}" "InstallLocation" "$INSTDIR"
    WriteRegStr   HKLM "${XRE_UNINST_REG_KEY}" "DisplayIcon" "$INSTDIR\xulrunner.exe"
    WriteRegStr   HKLM "${XRE_UNINST_REG_KEY}" "Publisher" "Mozilla"
    WriteRegStr   HKLM "${XRE_UNINST_REG_KEY}" "DisplayVersion" "${XRE_VERSION} (${XRE_LOCALE})"
    WriteRegDWORD HKLM "${XRE_UNINST_REG_KEY}" "NoModify" 0x00000001
    WriteRegDWORD HKLM "${XRE_UNINST_REG_KEY}" "NoRepair" 0x00000001
    WriteRegStr   HKLM "${XRE_UNINST_REG_KEY}" "URLInfoAbout" "http://www.mozilla.org"
  ${Else}
    WriteRegStr   HKCU "${XRE_UNINST_REG_KEY}" "DisplayName" "${XRE_PRODUCTNAME} (${XRE_VERSION})"
    WriteRegStr   HKCU "${XRE_UNINST_REG_KEY}" "UninstallString" "$INSTDIR\uninstall\helper.exe"
    WriteRegStr   HKCU "${XRE_UNINST_REG_KEY}" "InstallLocation" "$INSTDIR"
    WriteRegStr   HKCU "${XRE_UNINST_REG_KEY}" "DisplayIcon" "$INSTDIR\xulrunner.exe"
    WriteRegStr   HKCU "${XRE_UNINST_REG_KEY}" "Publisher" "Mozilla"
    WriteRegStr   HKCU "${XRE_UNINST_REG_KEY}" "DisplayVersion" "${XRE_VERSION} (${XRE_LOCALE})"
    WriteRegDWORD HKCU "${XRE_UNINST_REG_KEY}" "NoModify" 0x00000001
    WriteRegDWORD HKCU "${XRE_UNINST_REG_KEY}" "NoRepair" 0x00000001
    WriteRegStr   HKCU "${XRE_UNINST_REG_KEY}" "URLInfoAbout" "http://www.mozilla.org"
  ${EndIf}
FunctionEnd

;*****************************************************************************;
; Function : un.onInit
;*****************************************************************************;
Function un.onInit
  ;Allow only one instance to run
  System::Call 'kernel32::CreateMutexA(i 0, i 0, t "${XRE_PRODUCTNAME} uninstaller") i .r1 ?e'
  Pop $R0
  ${If} $R0 <> 0
   MessageBox MB_OK|MB_ICONEXCLAMATION "${XRE_PRODUCTNAME} uninstaller is already running"
   Abort
  ${EndIf}

  !insertmacro getUserPrivilages
  !insertmacro detectXREInstallation
FunctionEnd

;*****************************************************************************;
; Function : un.registerXulrunner
;*****************************************************************************;
Function un.registerXULRunner
  ${If} $registerGlobal == "1"
    ExecWait '"$INSTDIR\xulrunner.exe" --unregister-global'
  ${Else}
    ExecWait '"$INSTDIR\xulrunner.exe" --unregister-user'
  ${EndIf}
FunctionEnd

;*****************************************************************************;
; Function : un.removeFilesFromInstallDir
;*****************************************************************************;
Function un.removeFilesFromInstallDir
  Delete "$INSTDIR\uninstall\helper.exe"
  RMDir /r "$INSTDIR"
FunctionEnd

;*****************************************************************************;
; Function : un.createUnInstallRegEntries
;*****************************************************************************;
Function un.createUnInstallRegEntries
  ${If} $registerGlobal == "1"
    DeleteRegKey  HKLM "${XRE_UNINST_REG_KEY}"
  ${Else}
    DeleteRegKey  HKCU "${XRE_UNINST_REG_KEY}"
  ${EndIf}
FunctionEnd

;*****************************************************************************;
; Language Settings
;*****************************************************************************;
  !insertmacro MUI_LANGUAGE "English"

  ;Language strings
  LangString TEXT_IO_TITLE          ${LANG_ENGLISH} "Setup Type"
  LangString TEXT_IO_SUBTITLE       ${LANG_ENGLISH} "Choose setup options"
  LangString TEXT_SMRY_TITLE        ${LANG_ENGLISH} "Summary"
  LangString TEXT_SMRY_SUBTITLE     ${LANG_ENGLISH} "Ready to start installing ${XRE_PRODUCTNAME} ${XRE_VERSION}"
  
  LangString DESC_XULRunner         ${LANG_ENGLISH} "${XRE_PRODUCTNAME} ${XRE_VERSION} Runtime Environment"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${XULRunnerSection} $(DESC_XULRunner)
!insertmacro MUI_FUNCTION_DESCRIPTION_END