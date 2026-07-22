Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """C:\Users\asus vivobook\AppData\Local\npm-cache\_npx\8a26fc3a61fe4212\node_modules\cloudflared\bin\cloudflared.exe"" tunnel --url http://localhost:3000", 0, False
