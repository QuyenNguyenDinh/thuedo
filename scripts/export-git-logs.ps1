# Script xuất Git Log thực tế cho Câu 10 (Chạy trong PowerShell)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "THỐNG KÊ ĐÓNG GÓP COMMIT THEO THÀNH VIÊN" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
git --no-pager shortlog -sne

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "LỊCH SỬ COMMIT CHI TIẾT (20 COMMIT GẦN NHẤT)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
git --no-pager log -20 --pretty=format:"* %h - %an (%ad): %s" --date=short

Write-Host "`n`nLưu ý: Bạn có thể sao chép kết quả trên vào docs/contributions.md để hoàn thiện minh chứng Câu 10." -ForegroundColor Yellow

