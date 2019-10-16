@echo off
cd ..

	echo Run typescript convert...
	node .\node_modules\typescript\bin\tsc
	IF %ERRORLEVEL% EQU 0 (
		echo no error
		timeout /T 15
		exit 1
	) ELSE (
		echo Errorlevel was %ERRORLEVEL%
		pause
	)