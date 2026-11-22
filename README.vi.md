# Kịch bản khí hậu Việt Nam

Trang báo dữ liệu song ngữ (Việt/Anh) về việc khí hậu Việt Nam được dự tính sẽ thay đổi ra sao, viết cho sinh viên, giảng viên và nhà nghiên cứu. Đây là một trang tĩnh, viết bằng HTML, CSS và JavaScript thuần cùng D3 v7: không có máy chủ ứng dụng và không cần bước build.

Trang có hai bài:

- `index.html`, Việt Nam. Năm mô hình CMIP6 cho thấy Việt Nam nóng thêm +1,8 °C vào 2071–2100 theo SSP2-4.5 và +3,1 °C theo SSP5-8.5, so với 1985–2014. Hai con đường đi sát nhau trong khoảng nửa độ đến khoảng năm 2054, miền Bắc nóng lên nhanh hơn miền Nam, và hơi nóng thêm làm đổi cả vòng tuần hoàn nước: mưa lớn dồn hơn, tháng 10 và tháng 11 mưa nhiều hơn, miền Bắc có thêm tháng khô hạn. Một chương gần cuối nói về cái giá mà nóng và nước đã đặt lên con người, từ số ca nhập viện và giờ lao động bị mất đến đợt mất điện năm 2023 và bão Yagi.
- `hanoi.html`, Hà Nội ở +1,5, +2 và +3 °C. Ngày nắng nóng, đêm nóng, cái nóng ẩm, mưa to và khô hạn tính trung bình toàn thành phố ở từng mức ấm lên toàn cầu, theo các mô hình CMIP6-VN đã hiệu chỉnh theo trạm đo Việt Nam. Những năm quan trắc 2015–2025 đã gần với thế giới +1,5 °C của các mô hình, nên bài đề nghị lên kế hoạch cho mức +2 °C.

Mỗi bài kể theo ba phần (điều các mô hình cho thấy, bước ngoặt, và điều rút ra) và kết thúc bằng phần tự khám phá, nơi người đọc chọn biến số, kịch bản, mô hình và vùng. Có thể gửi đường dẫn tới đúng một góc nhìn trong phần tự khám phá của bài Hà Nội, ví dụ `hanoi.html?ind=drought&mode=anom`.

## Chạy trên máy

Các trang tải số liệu bằng `fetch`, nên cần mở qua một máy chủ web, không mở thẳng từ ổ đĩa:

```bash
python -m http.server 8765
```

Sau đó mở `http://localhost:8765/index.html` hoặc `http://localhost:8765/hanoi.html`. Các tệp số liệu mà trang cần đã có sẵn trong `data/`.

## Số liệu

| Nguồn | Dùng cho |
|---|---|
| CMIP6 trong kho công khai của NOAA trên Google Cloud: CESM2, GFDL-ESM4, MPI-ESM1-2-LR, MIROC6, IPSL-CM6A-LR, tính trung bình theo diện tích đất liền của 63 tỉnh (trước sáp nhập 2025) và 7 vùng khí hậu | Nhiệt độ, lượng mưa, mưa theo mùa và chỉ số khô hạn SPEI cho cả nước |
| CMIP6-VN (Tran-Anh và cộng sự 2023, CC0): MIROC6, MPI-ESM1-2-HR, MRI-ESM2-0, IPSL-CM6A-LR, UKESM1-0-LL ở độ phân giải 0,1°, cùng số liệu quan trắc dạng lưới 1980–2014 | Các chỉ số của Hà Nội |
| ERA5-Land và ERA5 qua kho Open-Meteo (CC BY 4.0), đã hiệu chỉnh theo số liệu lưới | Chuỗi quan trắc của Hà Nội cho 2015–2025 |
| NASA NEX-GDDP-CMIP6 (Thrasher và cộng sự 2022, CC BY 4.0) | Thay đổi của cái nóng ẩm (nhiệt độ bầu ướt) ở Hà Nội |
| CHIRPS v2.0 (Funk và cộng sự 2015) | Đã thử làm nguồn mưa quan trắc sau 2014; ERA5 khớp với số đo ở trạm tốt hơn nên không dùng |
| Chỉ số ONI về El Niño của NOAA CPC | Các năm El Niño trong chuỗi khô hạn của Hà Nội |
| Mức ấm lên toàn cầu của từng mô hình (theo cách của IPCC AR6, đối chiếu với Hauser và cộng sự và Atlas AR6); HadCRUT5 cho mức quan trắc | Các cửa sổ 20 năm ở từng mức ấm lên của bài Hà Nội |

Mọi con số trong bài đều được tính từ các tệp này, ở cả hai ngôn ngữ. Số liệu từ nguồn bên ngoài (IPCC AR6, Ngân hàng Thế giới, bản tin Việt Nam 2023 của Lancet Countdown, Forster và cộng sự 2026, UNEP, cùng báo cáo của cơ quan nhà nước và báo chí về đợt nóng năm 2023, bão Yagi và trận ngập ở Hà Nội năm 2025) được viết vào bài và ghi rõ trong dòng nguồn của từng biểu đồ.

Các tệp đầu ra:

- `data/vietnam_cmip6.json`, `data/vietnam_regions.json`, `data/vietnam_zones.json`: chuỗi số liệu cả nước và từng vùng, và bản đồ các vùng
- `data/vietnam_water.json`: lượng mưa từng tháng và khô hạn theo vùng
- `data/hanoi/hanoi.json`, `data/hanoi/water.json`, `data/hanoi/warming_levels.json`: bài Hà Nội
- `data/hanoi/stations_oscar.json`: vị trí các trạm khí tượng, từ danh mục WMO OSCAR

## Dựng lại số liệu

Các script trong `pipeline/` dựng lại toàn bộ `data/`. Chúng cần Python 3 với numpy, pandas, xarray, netCDF4, geopandas, shapely, topojson, gcsfs và zarr, cùng các tệp ranh giới hành chính cấp tỉnh và lãnh thổ Việt Nam của Natural Earth, giải nén vào một thư mục (truyền vào qua `--ne`). Số liệu thô được tải về các thư mục nằm ngoài kho mã: mặc định là trong `D:/`, và tùy chọn `--root` của từng script dùng để đổi chỗ lưu.

| Script | Việc làm |
|---|---|
| `build_data.py` | Chuỗi CMIP6 cả nước và từng vùng, và bản đồ các vùng |
| `build_water.py` | Lượng mưa từng tháng và khô hạn SPEI-6 theo vùng |
| `fetch_cmip6vn.py` | Tải CMIP6-VN (`--hanoi-set` tải năm mô hình bài Hà Nội dùng) |
| `fetch_era5land.py` | Tải ERA5-Land và ERA5 cho Hà Nội |
| `fetch_nexgddp.py` | Tải NEX-GDDP-CMIP6 cho Hà Nội; chạy lại thì tải tiếp từ chỗ đã dừng |
| `fetch_chirps.py` | Tải mưa CHIRPS cho Hà Nội và chỉ số El Niño; chạy lại thì tải tiếp từ chỗ đã dừng |
| `warming_levels.py` | Năm mỗi mô hình đạt +1,5, +2 và +3 °C, và mức ấm lên quan trắc của 2006–2025 |
| `build_hanoi.py` | Các chỉ số của Hà Nội, lịch nắng nóng, hiệu chỉnh tái phân tích và các phép kiểm tra; ghi ra `hanoi.json` |
| `build_hanoi_water.py` | Mưa từng tháng, khô hạn, cái nóng ẩm và các năm El Niño của Hà Nội; ghi ra `hanoi/water.json` |
| `fetch_oscar_stations.py` | Thông tin các trạm khí tượng Việt Nam từ WMO OSCAR |

Trình tự thường dùng khi dựng lại toàn bộ:

```bash
python pipeline/build_data.py --ne D:/ne_cache
python pipeline/build_water.py --ne D:/ne_cache
python pipeline/fetch_cmip6vn.py --hanoi-set --ne D:/ne_cache
python pipeline/fetch_era5land.py
python pipeline/warming_levels.py
python pipeline/fetch_nexgddp.py --ne D:/ne_cache
python pipeline/fetch_chirps.py --ne D:/ne_cache
python pipeline/build_hanoi.py
python pipeline/build_hanoi_water.py
```

Số liệu tải về khá lớn và một số máy chủ chậm: năm mô hình CMIP6-VN nặng khoảng 19 GB, và dịch vụ NEX-GDDP của NASA mất vài giờ cho bộ số liệu Hà Nội.

## Cấu trúc thư mục

```
index.html, hanoi.html   hai bài chính
about.html               trang này: README hiển thị trên website (README.vi.md cho tiếng Việt)
styles/                  main.css nạp các tệp dùng chung; hanoi.css cho bài Hà Nội; readme.css cho about.html
scripts/                 hàm dùng chung, biểu đồ và lời bài của trang cả nước
scripts/hanoi/           bài Hà Nội
data/                    các tệp JSON mà trang tải
pipeline/                các script dựng data/
docs/                    ghi chú, trong đó có bản kiểm tra số liệu Hà Nội
DESIGN.md, PRODUCT.md    hệ thống thiết kế, và người đọc cùng nguyên tắc của trang
PROJECT_SUMMARY.md       mô tả đầy đủ hơn về câu chuyện, số liệu, phương pháp và các vấn đề còn mở
```

## Giới hạn

- Năm mô hình là một tổ hợp nhỏ, và chỉ số khô hạn của cả nước chỉ dùng bốn (CESM2 không có nhiệt độ cao nhất và thấp nhất ngày của thời kỳ lịch sử trong kho).
- Từ 2015, chuỗi quan trắc của Hà Nội là tái phân tích đã hiệu chỉnh, không phải số đo ở trạm.
- Độ ẩm trong các dự tính lấy từ NEX-GDDP, bộ số liệu hiệu chỉnh theo cách khác với phần còn lại của bài Hà Nội, và trang chỉ dùng phần thay đổi của nó.
- Tác động lên sức khỏe, lao động và mùa màng lấy từ các nghiên cứu đã công bố, chưa được tính riêng cho từng mức ấm lên.
- Chưa so sánh với Kịch bản biến đổi khí hậu 2025 của Bộ Nông nghiệp và Môi trường.
