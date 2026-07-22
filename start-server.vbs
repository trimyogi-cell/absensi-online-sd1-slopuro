Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\asus vivobook\Documents\New OpenCode Project\absensi-online"
WshShell.Run "node server.js", 0, False
