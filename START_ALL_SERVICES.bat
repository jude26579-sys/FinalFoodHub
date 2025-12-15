@echo off
REM ================================================================
REM Startup Script for FoodHub Microservices
REM ================================================================
REM This script starts all required services in the correct order
REM ================================================================

echo.
echo ================================================================
echo        FoodHub Microservices - Startup Script
echo ================================================================
echo.

REM Check if Java is installed
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java and add it to your PATH
    pause
    exit /b 1
)

REM Get Java version
for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /r "version"') do (
    set JAVA_VERSION=%%g
)
echo Detected Java: %JAVA_VERSION%
echo.

REM Set workspace paths
set CONFIG_SERVER_PATH=c:\Users\2398158\Downloads\FinalCafeteriaApp\FinalCafeteriaApp\config-server 2
set REPORTING_SERVICE_PATH=c:\Users\2398158\Downloads\Reporting 13\Reporting 11\Reporting
set AUTH_SERVER_PATH=c:\Users\2398158\Downloads\FinalCafeteriaApp\FinalCafeteriaApp\authserver
set FRONTEND_PATH=c:\Users\2398158\Downloads\FoodApp-UI-main (1) 2\FoodApp-UI-main\FoodApp-UI-main

REM ================================================================
REM Step 1: Start Config Server (Port 8888)
REM ================================================================
echo [1/4] Starting Config Server on port 8888...
if not exist "%CONFIG_SERVER_PATH%\target\config-server-0.0.1-SNAPSHOT.jar" (
    echo Building Config Server...
    cd /d "%CONFIG_SERVER_PATH%"
    call mvnw clean package -DskipTests
)
cd /d "%CONFIG_SERVER_PATH%"
start "Config Server" cmd /k "java -jar target/config-server-0.0.1-SNAPSHOT.jar"
echo Waiting for Config Server to start...
timeout /t 10 /nobreak

REM ================================================================
REM Step 2: Start Reporting Service (Port 8091)
REM ================================================================
echo.
echo [2/4] Starting Reporting Service on port 8091...
if not exist "%REPORTING_SERVICE_PATH%\target\Reporting-0.0.1-SNAPSHOT.jar" (
    echo Building Reporting Service...
    cd /d "%REPORTING_SERVICE_PATH%"
    call mvnw clean package -DskipTests
)
cd /d "%REPORTING_SERVICE_PATH%"
start "Reporting Service" cmd /k "java -jar target/Reporting-0.0.1-SNAPSHOT.jar"
echo Waiting for Reporting Service to start...
timeout /t 10 /nobreak

REM ================================================================
REM Step 3: Start Auth Server (Port 9001) - Optional
REM ================================================================
echo.
echo [3/4] Starting Auth Server on port 9001...
cd /d "%AUTH_SERVER_PATH%"
start "Auth Server" cmd /k "mvnw spring-boot:run"

REM ================================================================
REM Step 4: Start Frontend (Port 8084)
REM ================================================================
echo.
echo [4/4] Starting Frontend on port 8084...
cd /d "%FRONTEND_PATH%"
start "Frontend - FoodApp-UI" cmd /k "npm run dev"

echo.
echo ================================================================
echo All services starting...
echo ================================================================
echo.
echo Config Server:     http://localhost:8888
echo Reporting Service: http://localhost:8091
echo Auth Server:       http://localhost:9001
echo Frontend:          http://localhost:8084
echo.
echo Wait 30-60 seconds for all services to fully start, then:
echo   1. Open http://localhost:8084/admin
echo   2. Login as admin
echo   3. Go to Reports tab
echo   4. Select dates and click "Generate Report"
echo.
echo ================================================================
pause
