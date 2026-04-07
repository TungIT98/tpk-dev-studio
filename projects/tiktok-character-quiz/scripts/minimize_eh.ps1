$eh = Get-Process -Name "Effect House" -ErrorAction SilentlyContinue
if ($eh) {
    $eh.MainWindowHandle | ForEach-Object {
        [void][System.Runtime.InteropServices.Marshal]::ShowWindow($_, 6)
    }
}
Start-Process "https://tiktok-character-quiz.vercel.app"
