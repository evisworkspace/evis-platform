@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\nova-obra.ps1" %*
endlocal
