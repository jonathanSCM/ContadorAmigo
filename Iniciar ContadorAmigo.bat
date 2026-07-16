@echo off
chcp 65001 >nul
title ContadorAmigo - Servidor
color 0E

echo.
echo   ============================================
echo             C O N T A D O R   A M I G O
echo      Finanzas claras para el emprendedor BO
echo   ============================================
echo.

REM --- Ir a la carpeta del proyecto (ruta fija, funciona desde cualquier lugar) ---
cd /d "D:\Tarea.Emprendeurismo\SISTEMA"

REM --- Verificar que Node.js este instalado ---
where node >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] No se encontro Node.js en tu computadora.
  echo   Instalalo desde https://nodejs.org  y vuelve a intentar.
  echo.
  pause
  exit /b
)

REM --- Instalar dependencias la primera vez ---
if not exist "node_modules" (
  echo   Primera vez: instalando dependencias, esto puede tardar unos minutos...
  echo.
  call npm install
  echo.
)

REM --- Crear la base de datos local la primera vez ---
if not exist "data\app.db" (
  echo   Primera vez: creando la base de datos local (data\app.db)...
  echo.
  call npx drizzle-kit push
  echo.
)

echo   Iniciando el sistema...
echo   Se abrira solo en tu navegador:  http://localhost:8080
echo.
echo   Para APAGAR el sistema, cierra esta ventana negra.
echo   ============================================
echo.

REM --- Abrir el navegador despues de 5 segundos (en paralelo) ---
start "" /b cmd /c "timeout /t 5 >nul & start "" http://localhost:8080"

REM --- Arrancar el servidor de desarrollo ---
call npm run dev

pause
