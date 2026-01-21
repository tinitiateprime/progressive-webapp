@echo off
echo Installing dependencies...
call npm ci --production=false

echo Building Next.js app...
call npm run build

echo Copying static files for standalone...
xcopy .next\static .next\standalone\.next\static /E /I /Y
xcopy public .next\standalone\public /E /I /Y

echo Deployment complete!
```

**5. Create `.deployment` file:**
```
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
command = deploy.cmd