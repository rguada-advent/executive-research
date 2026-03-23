@echo off
echo ======================================
echo  PSG Human Capital Executive Intelligence
echo ======================================
echo.
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
echo.
echo Starting backend server...
start "PSG Backend" cmd /c "python server.py"
cd ..
echo.
echo Installing frontend dependencies...
cd frontend
call npm install
echo.
echo Starting frontend...
call npm run dev
