# Translate — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

`translate` gồm các dịch vụ nền cho dịch văn bản, câu học tập, từ điển và search/highlight result. Một số API chạy trong Background, một số helper được tạo trong Content/Dashboard. Đây không phải một UI duy nhất; consumer và storage/cache khác nhau theo use case.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/translate/translate.js`](../../js/translate/translate.js) | `LHN_TRANSLATE` | Dịch song ngữ đa provider và phát hiện ngôn ngữ từ Background. |
| [`js/translate/study-translation.js`](../../js/translate/study-translation.js) | `LHN_STUDY_TRANSLATION.create` | Dịch câu học tập theo queue/rate limit, Google rồi MyMemory fallback. |
| [`js/translate/dictionary.js`](../../js/translate/dictionary.js) | `LHN_DICTIONARY` | Kiểm tra từ tiếng Anh, translation/IPA, related words, forms, collocations và câu ví dụ (`examples`, `exampleWordRegExp`); `isIncomplete(value)` báo kết quả dựng khi có nguồn lỗi. |
| [`js/translate/search.js`](../../js/translate/search.js) | `LHN_SEARCH` | Xếp hạng trường tìm và tô highlight match. |
| [`js/background/background.js`](../../js/background/background.js) | message router | Nhận `BILINGUAL_TRANSLATE`, `DETECT_READ_LANGUAGE`, cache và usage message. |
| [`js/core/cache.js`](../../js/core/cache.js) | `LHN_CACHE` | Cache dịch song ngữ được gọi từ provider trong Background. |

## 3. Luồng chính

1. Content/Reader/Dashboard gửi `BILINGUAL_TRANSLATE` qua `LHN_MESSAGING`; Background gọi `LHN_TRANSLATE`, kiểm cache và thử các provider theo code hiện tại.
2. Câu học tập dùng `LHN_STUDY_TRANSLATION.create({ browser })`; queue giới hạn request, dedupe, lưu cache và dùng MyMemory khi Google lỗi.
3. Dictionary consumer gọi `LHN_DICTIONARY` trực tiếp cho English word lookup; kết quả phụ như IPA/related words/forms/collocations/câu ví dụ có thể chạy qua provider phụ. Câu ví dụ: tối đa 3 câu Free Dictionary, câu chứa từ (kể cả dạng thêm đuôi) xếp trước, mỗi câu dịch bằng `translate`; Syn/Ant tối đa 4 mỗi loại; collocations tối đa 4 = 2 tính từ đứng trước từ + 2 danh từ đứng sau (đúng thứ tự, bỏ trùng). Cache full dict theo prefix `lhnFullDictionary:v4:`. Syn/Ant: Datamuse lỗi hoặc không có từ → loại đó lấy từ Free Dictionary (tối đa 4, bỏ chính từ tra; dùng chung request với câu ví dụ trong cùng lượt tra). Forms/Colloc chỉ có Datamuse, câu ví dụ chỉ có Free Dictionary: lỗi → ẩn mục. Bất kỳ nguồn nào lỗi (HTTP ≠ 404, mạng, timeout, dịch chính/dịch chip, IPA) → kết quả vẫn hiện nhưng không cache, lượt tra sau gọi lại; 404 = không có từ, không phải lỗi.
4. Search consumer có thể gọi `LHN_SEARCH.rank/highlightMatches`; search index/debounce dùng chung nằm ở `js/shared/search.js`, API khác.
5. Usage limit chỉ áp dụng ở những provider có gửi `USAGE_CONSUME`; không giả định mọi helper trong thư mục tự đi qua cùng một tầng.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ API `LHN_TRANSLATE`, `LHN_STUDY_TRANSLATION`, `LHN_DICTIONARY`, `LHN_SEARCH` và mọi sender/receiver tương ứng.
- Không gộp hai cache domain: `LHN_CACHE` dịch song ngữ/TTS và các key cache riêng của Dictionary/Study Translation có schema/TTL khác nhau.
- Giữ timeout, abort signal, dedupe, rate-limit/cooldown và fallback; khi đổi provider phải thử lỗi mạng, HTTP error và kết quả rỗng.
- `study-translation.js` là factory nhận `browser`/`fetchImpl`, tiện cho mock; đừng biến module này thành phụ thuộc UI.
- Search API của `translate/search.js` khác `shared/search.js`; xác nhận đúng consumer trước khi chuyển hàm.
- Provider ngoài có thể đổi giới hạn/kết quả; tài liệu không bảo đảm availability hay chất lượng dịch.

## 5. Kiểm tra và xác minh

- Static: `for f in js/translate/*.js; do node --check "$f" || exit; done`; parse `manifest.json` và kiểm tra thứ tự nạp trong manifest/HTML.
- Unit/mock: dịch thành công, dedupe/cache hit, timeout/abort, HTTP error, fallback và storage failure; Dictionary test cancellation/empty fields; Search test rank/no-match/highlight exclusion.
- Integration: gọi dịch từ Reader, sentence note, YouTube và Dashboard; xác nhận target language, usage count, cache key và lỗi được hiển thị đúng.
- Không tuyên bố provider thật hoạt động nếu chỉ dùng mock.
