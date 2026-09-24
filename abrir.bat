@echo off
rem Levanta un servidor local y abre la demo (hace falta Python instalado).
cd /d "%~dp0"
start "" http://localhost:5500/
python -m http.server 5500
