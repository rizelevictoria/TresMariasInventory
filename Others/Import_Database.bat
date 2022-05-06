set /p directory="Enter " InventorySystem.sql " file url: "
move "%directory%\InventorySystem.sql" "C:\Program Files\MySQL\MySQL Server 8.0\bin"
cd C:\Program Files\MySQL\MySQL Server 8.0\bin
mysql -uroot -p < InventorySystem.sql

timeout /t 2 /nobreak >nul
cd %directory%
start ISM.cmd