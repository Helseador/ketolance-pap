# Script de prueba — simula respuestas completas de un paciente por WhatsApp
$base = "http://localhost:3000/api/whatsapp/webhook"
$phone = "573000000001"

function Send-Reply($body) {
    $payload = @{
        entry = @(@{
            changes = @(@{
                value = @{
                    messages = @(@{
                        from = $phone
                        type = "text"
                        text = @{ body = $body }
                    })
                }
            })
        })
    } | ConvertTo-Json -Depth 10

    $response = Invoke-WebRequest -Uri $base -Method POST `
        -ContentType "application/json" -Body $payload -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Enviado: '$body' -> $($response.StatusCode) | next: $($data.next)" -ForegroundColor Cyan
    Start-Sleep -Milliseconds 400
}

Write-Host ""
Write-Host "== Simulando encuesta completa ==" -ForegroundColor Magenta
Write-Host ""

Write-Host "1. Vomitos (numero):" -ForegroundColor Yellow
Send-Reply "0"

Write-Host "2. Diarrea (numero):" -ForegroundColor Yellow
Send-Reply "0"

Write-Host "3. Fiebre (numero):" -ForegroundColor Yellow
Send-Reply "1"

Write-Host "4. Crisis epilepticas (numero):" -ForegroundColor Yellow
Send-Reply "2"

Write-Host "5. Transgresion dieta (SI/NO):" -ForegroundColor Yellow
Send-Reply "NO"

Write-Host "6. Cambio FAE (SI/NO):" -ForegroundColor Yellow
Send-Reply "NO"

Write-Host "7. Glucosa mg/dl (numero):" -ForegroundColor Yellow
Send-Reply "85"

Write-Host "8. Cetonas (numero):" -ForegroundColor Yellow
Send-Reply "3.2"

Write-Host "9. Estado de animo (BIEN/REGULAR/MAL):" -ForegroundColor Yellow
Send-Reply "BIEN"

Write-Host "10. Peso kg (solo turno manana):" -ForegroundColor Yellow
Send-Reply "18.5"

Write-Host "11. Observaciones (texto libre):" -ForegroundColor Yellow
Send-Reply "El paciente estuvo activo toda la manana, durmio bien."

Write-Host ""
Write-Host "== Encuesta completada ==" -ForegroundColor Green
Write-Host "Revisa la hoja de vida del paciente en http://localhost:3000/dashboard" -ForegroundColor Green
Write-Host ""
