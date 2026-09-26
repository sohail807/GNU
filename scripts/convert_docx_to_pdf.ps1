$docxPath = (Resolve-Path "design\frontend_wireframes\FRONTEND_WIREFRAME_CONCEPTS.docx").Path
$pdfPath = [System.IO.Path]::ChangeExtension($docxPath, ".pdf")

Write-Host "Converting DOCX to PDF..."
Write-Host "Input:  $docxPath"
Write-Host "Output: $pdfPath"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open($docxPath)
    # wdFormatPDF = 17
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    $doc.Close([ref]0) # wdDoNotSaveChanges
    Write-Host "Successfully converted DOCX to PDF: $pdfPath"
} catch {
    Write-Host "Error during conversion: $_"
    exit 1
} finally {
    $word.Quit()
}
