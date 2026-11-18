param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$RootDir = $PSScriptRoot
if (-not $RootDir) { $RootDir = (Get-Location).Path }

$DbDir = Join-Path $RootDir "database"
$SeedPath = Join-Path $DbDir "seed.json"
$DataPath = Join-Path $DbDir "data.json"
$EnvPath = Join-Path $RootDir ".env"

# Load .env variables into process environment
if (Test-Path $EnvPath) {
    Get-Content $EnvPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}

if (-not (Test-Path $DataPath) -and (Test-Path $SeedPath)) {
    Copy-Item $SeedPath $DataPath -Force
}

$Listener = New-Object System.Net.HttpListener
$Prefix = "http://localhost:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Stok Pintar Minimarket - Local Web Server Berjalan!" -ForegroundColor Green
Write-Host " URL Lokal    : $Prefix" -ForegroundColor Yellow
Write-Host " Supabase URL : $($env:SUPABASE_URL)" -ForegroundColor Cyan
Write-Host " JWKS URL     : $($env:SUPABASE_JWKS_URL)" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response
        $Path = $Request.Url.AbsolutePath

        $Response.Headers.Add("Access-Control-Allow-Origin", "*")
        $Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, x-user-role")

        if ($Request.HttpMethod -eq "OPTIONS") {
            $Response.StatusCode = 200
            $Response.Close()
            continue
        }

        if ($Path -eq "/" -or $Path -eq "/index.html") {
            $HtmlPath = Join-Path $RootDir "index.html"
            $Bytes = [System.IO.File]::ReadAllBytes($HtmlPath)
            $Response.ContentType = "text/html; charset=utf-8"
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.Close()
            continue
        }

        if ($Path -eq "/api/supabase-config" -and $Request.HttpMethod -eq "GET") {
            $ConfigObj = @{
                supabaseUrl = $env:SUPABASE_URL
                publishableKey = $env:SUPABASE_PUBLISHABLE_KEY
                jwksUrl = $env:SUPABASE_JWKS_URL
                hasSecretKey = [bool]($env:SUPABASE_SECRET_KEY -and -not $env:SUPABASE_SECRET_KEY.Contains("GANTI_DENGAN"))
            } | ConvertTo-Json
            $Bytes = [System.Text.Encoding]::UTF8.GetBytes($ConfigObj)
            $Response.ContentType = "application/json; charset=utf-8"
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.Close()
            continue
        }

        if ($Path -eq "/api/data") {
            if ($Request.HttpMethod -eq "GET") {
                $JsonRaw = [System.IO.File]::ReadAllText($DataPath, [System.Text.Encoding]::UTF8)
                $Bytes = [System.Text.Encoding]::UTF8.GetBytes($JsonRaw)
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $Bytes.Length
                $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
                $Response.Close()
                continue
            }
            if ($Request.HttpMethod -eq "POST") {
                $Reader = New-Object System.IO.StreamReader($Request.InputStream, [System.Text.Encoding]::UTF8)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()
                [System.IO.File]::WriteAllText($DataPath, $Body, [System.Text.Encoding]::UTF8)
                $RespJson = '{"success":true,"message":"Database data.json tersimpan"}'
                $Bytes = [System.Text.Encoding]::UTF8.GetBytes($RespJson)
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $Bytes.Length
                $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
                $Response.Close()
                continue
            }
        }

        # Serve static files if they exist
        $RelativePath = $Path.TrimStart('/') -replace '/', '\'
        $FilePath = Join-Path $RootDir $RelativePath
        if ((Test-Path $FilePath) -and -not (Get-Item $FilePath).PSIsContainer) {
            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            if ($FilePath.EndsWith(".json")) { $Response.ContentType = "application/json; charset=utf-8" }
            elseif ($FilePath.EndsWith(".sql")) { $Response.ContentType = "text/plain; charset=utf-8" }
            elseif ($FilePath.EndsWith(".css")) { $Response.ContentType = "text/css; charset=utf-8" }
            elseif ($FilePath.EndsWith(".js")) { $Response.ContentType = "application/javascript; charset=utf-8" }
            else { $Response.ContentType = "text/plain; charset=utf-8" }
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.Close()
            continue
        }

        $NotFound = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Not Found"}')
        $Response.StatusCode = 404
        $Response.ContentType = "application/json; charset=utf-8"
        $Response.ContentLength64 = $NotFound.Length
        $Response.OutputStream.Write($NotFound, 0, $NotFound.Length)
        $Response.Close()
    } catch {
        break
    }
}
