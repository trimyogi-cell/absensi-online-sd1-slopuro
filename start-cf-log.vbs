Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
WshShell.CurrentDirectory = "C:\Users\asus vivobook\Documents\New OpenCode Project\absensi-online"

Set f = fso.CreateTextFile("cf-output.txt", True)
f.WriteLine "Starting cloudflared..."
f.Close

WshShell.Run "cmd /c ""C:\Users\asus vivobook\AppData\Local\npm-cache\_npx\8a26fc3a61fe4212\node_modules\cloudflared\bin\cloudflared.exe"" tunnel --url http://localhost:3000 > cf-output.txt 2>&1", 0, False
