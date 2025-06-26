# CEE Lab Equipment Backup Script
# PowerShell version for Windows users

Write-Host "================================" -ForegroundColor Cyan
Write-Host "CEE Lab Equipment Backup Tool" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating backup of equipment database..." -ForegroundColor Yellow

try {
    # Run the backup script
    $process = Start-Process -FilePath "node" -ArgumentList "backup-equipment.js" -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "Backup process completed successfully!" -ForegroundColor Green
        Write-Host ""
        
        # List created files
        $backupFiles = Get-ChildItem -Name "equipment_backup_*.json" | Select-Object -Last 5
        $restoreFiles = Get-ChildItem -Name "equipment_restore_*.json" | Select-Object -Last 5
        
        if ($backupFiles) {
            Write-Host "Files created:" -ForegroundColor White
            Write-Host "  - Full backups with metadata:" -ForegroundColor Gray
            foreach ($file in $backupFiles) {
                Write-Host "    $file" -ForegroundColor Green
            }
        }
        
        if ($restoreFiles) {
            Write-Host "  - Restore-ready files:" -ForegroundColor Gray
            foreach ($file in $restoreFiles) {
                Write-Host "    $file" -ForegroundColor Green
            }
        }
        
        Write-Host ""
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  To restore: node restore-equipment.js <backup-file>" -ForegroundColor Gray
        Write-Host "  Or use: npm run restore <backup-file>" -ForegroundColor Gray
        
    } else {
        Write-Host "Backup process failed!" -ForegroundColor Red
        Write-Host "Exit code: $($process.ExitCode)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error running backup script: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
