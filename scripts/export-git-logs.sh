#!/usr/bin/env bash
echo "=========================================="
echo "THỐNG KÊ ĐÓNG GÓP COMMIT THEO THÀNH VIÊN"
echo "=========================================="
git shortlog -sne

echo ""
echo "=========================================="
echo "LỊCH SỬ COMMIT CHI TIẾT (20 COMMIT GẦN NHẤT)"
echo "=========================================="
git log -20 --pretty=format:"* %h - %an (%ad): %s" --date=short

echo ""
echo "Lưu ý: Bạn có thể sao chép kết quả trên vào docs/contributions.md để hoàn thiện minh chứng Câu 10."

