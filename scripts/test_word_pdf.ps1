try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    Write-Output "Word COM successfully initialized. Version: $($word.Version)"
    $word.Quit()
} catch {
    Write-Output "Error: $_"
}
