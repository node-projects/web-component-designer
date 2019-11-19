rem @echo off
cd ..

echo Run typescript convert...

rmdir build /S /Q
rmdir dist /S /Q
node .\node_modules\typescript\bin\tsc
mkdir build
xcopy assets build /E
call polymer build
copy src\sample\*.json dist\sample
copy src\sample\*.json build\dist\sample

pause