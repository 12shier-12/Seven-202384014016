@echo off
setlocal
cd /d "%~dp0"

rem This machine's PATH is missing C:\Windows\System32, so every external
rem command below is called by its absolute path or avoided entirely.

set "PY=python"
python --version >nul 2>&1
if errorlevel 1 (
  if exist "D:\develop\python\python.exe" (
    set "PY=D:\develop\python\python.exe"
  ) else if exist "%SystemRoot%\py.exe" (
    set "PY=%SystemRoot%\py.exe"
  ) else (
    echo.
    echo Python was not found on this computer.
    echo Install it from https://www.python.org/downloads/ and run this file again.
    echo.
    pause
    exit /b 1
  )
)

echo Starting Triply on http://localhost:8080/ ...
start "" /b "%PY%" "%~dp0serve.py" 8080
"%SystemRoot%\System32\timeout.exe" /t 2 /nobreak >nul
start "" "http://localhost:8080/"

echo.
echo Triply is running at http://localhost:8080/
echo Keep this window open while you use the app.
echo Close this window to stop the server.
echo.
pause >nul
