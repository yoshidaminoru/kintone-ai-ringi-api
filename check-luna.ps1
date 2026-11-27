# Run from PowerShell. The key is read without echo and used for one OpenAI request.
$secret = Read-Host 'Render OPENAI_API_KEY' -AsSecureString
if ($secret.Length -eq 0) {
    Write-Output 'No API key was entered.'
    return
}

$keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $headers = @{ Authorization = 'Bearer ' + [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer).Trim() }
    $body = @{
        model = 'gpt-6-luna'
        input = 'Reply with OK.'
        reasoning = @{ effort = 'none' }
        max_output_tokens = 64
        store = $false
    } | ConvertTo-Json -Compress

    try {
        $result = Invoke-RestMethod -Method Post -Uri 'https://api.openai.com/v1/responses' `
            -Headers $headers -ContentType 'application/json' -Body $body -TimeoutSec 30 -ErrorAction Stop
        $answer = $result.output | Where-Object { $_.type -eq 'message' -and $_.role -eq 'assistant' } |
            ForEach-Object { $_.content } | Where-Object { $_.type -eq 'output_text' -and $_.text }

        if ($result.status -eq 'completed' -and $answer) {
            Write-Output 'SUCCESS: GPT-6 Luna responded.'
        } else {
            Write-Output 'The API responded, but generation did not complete.'
        }
    } catch {
        $response = $_.Exception.Response
        if ($response) {
            $status = [int]$response.StatusCode
            $code = $null
            try { $code = ($_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction Stop).error.code } catch {}
            if ($code -cmatch '^[a-z0-9_]{1,60}$') {
                Write-Output "OpenAI API returned HTTP $status ($code)."
            } else {
                Write-Output "OpenAI API returned HTTP $status."
            }
        } else {
            Write-Output 'Could not connect to the OpenAI API.'
        }
    }
} finally {
    $headers = $null
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
    $secret.Dispose()
}
