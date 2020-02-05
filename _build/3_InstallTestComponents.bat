@echo off
cd ..
call npm install --no-save @vanillawc/wc-marquee
cd build
xcopy /e ..\node_modules\@vanillawc\wc-marquee node_modules\@vanillawc\wc-marquee\
pause
