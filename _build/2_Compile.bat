rem @echo off
cd ..

echo Run typescript convert...

rmdir build /S /Q
rmdir dist /S /Q
node .\node_modules\typescript\bin\tsc
mkdir build
xcopy assets build /E
call polymer build

pause