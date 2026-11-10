// Keepit unified overlay — English / Korean labels for the Vietnamese source strings in unified-ui.js.
// The UI is written in Vietnamese (the approved demo); this layer swaps text nodes and title / aria-label /
// placeholder attributes in place, so dynamic renders (innerHTML / textContent) are covered by one observer.
// Content (subtitles, translations, notes the user types, video titles) is never touched.
globalThis.LHN_UNIFIED_TEXT = (() => {
  'use strict';
  const D = {
    "(Enter) Bắt đầu/dừng/tiếp · (Esc) Đáp án/làm lại · (`) Phát/tạm dừng · (Ctrl) Nghe lại": ["(Enter) Start/stop/next · (Esc) Reveal/retry · (`) Play/pause · (Ctrl) Replay", "(Enter) 시작/정지/다음 · (Esc) 정답/다시 하기 · (`) 재생/일시정지 · (Ctrl) 다시 듣기"],
    "(Enter) Câu tiếp · (Esc) Làm lại": ["(Enter) Next sentence · (Esc) Retry", "(Enter) 다음 문장 · (Esc) 다시 하기"],
    "(Enter) Kiểm tra · (Esc) Đáp án · (Ctrl) Nghe lại": ["(Enter) Check · (Esc) Answer · (Ctrl) Replay", "(Enter) 확인 · (Esc) 정답 · (Ctrl) 다시 듣기"],
    "(bỏ trống)": ["(missing)", "(누락)"],
    "(chưa viết)": ["(empty)", "(비어 있음)"],
    "(thừa)": ["(extra)", "(불필요)"],
    "1 từ": ["1 word", "1단어"],
    "Bình": ["Medium", "보통"],
    "Bạn đang làm chủ cách phát âm rất tốt. Nghe thôi đã thấy trình độ lên một tầm mới!": ["You're mastering the pronunciation. You sound like you've reached a new level!", "발음을 아주 잘 다루고 있어요. 듣기만 해도 실력이 한 단계 올라간 게 느껴져요!"],
    "Bạn đang làm rất tốt. Chỉnh thêm vài chi tiết nhỏ để câu nói mượt mà hơn nhé!": ["You're doing great. Polish a few small details to make it smoother!", "아주 잘하고 있어요. 작은 부분 몇 가지만 다듬으면 더 매끄러워져요!"],
    "Bạn đang rất gần mức tốt rồi. Thêm một chút tập trung là có thể chạm đích!": ["You're very close to a good score. A little more focus and you're there!", "좋은 점수에 거의 다 왔어요. 조금만 더 집중하면 도달할 수 있어요!"],
    "Bạn đã chép đúng cả câu. Nhấn Enter để sang câu tiếp.": ["You typed the whole sentence correctly. Press Enter for the next one.", "문장 전체를 정확히 받아 적었어요. Enter를 눌러 다음 문장으로 가세요."],
    "Bạn đã có những âm thanh đầu tiên. Chậm lại một chút, nghe kỹ và thử lại nhé!": ["You've got the first sounds. Slow down a little, listen closely and try again!", "첫 소리를 냈어요. 조금 천천히, 잘 듣고 다시 해 보세요!"],
    "Bạn đã nói rất rõ ràng và chính xác. Giờ hãy thêm chút ngữ điệu để nghe thật cuốn hút!": ["You spoke clearly and accurately. Now add some intonation to sound captivating!", "아주 또렷하고 정확하게 말했어요. 이제 억양을 더해 매력적으로 들리게 해 보세요!"],
    "Bạn đã nói được kha khá đấy. Tiếp tục luyện từng âm để câu nói rõ ràng hơn nhé!": ["You said quite a lot correctly. Keep practising each sound to be clearer!", "꽤 많이 말했어요. 소리 하나하나를 계속 연습해 더 또렷하게 말해 보세요!"],
    "Bạn đã nắm được phần lớn cách phát âm. Chú ý thêm những âm còn thiếu để bứt phá nhé!": ["You've got most of the pronunciation. Focus on the missing sounds to break through!", "발음 대부분을 익혔어요. 빠진 소리에 집중해 한 단계 도약해 보세요!"],
    "Bạn đã tiến gần hơn đến mục tiêu. Chỉnh thêm một chút phát âm và ngữ điệu nhé!": ["You're closer to the goal. Fine-tune your pronunciation and intonation a bit!", "목표에 더 가까워졌어요. 발음과 억양을 조금 더 다듬어 보세요!"],
    "Bạn đã đạt ngưỡng luyện nói. Luyện thêm để phát âm tự nhiên hơn nhé!": ["You've reached the speaking threshold. Keep practising to sound more natural!", "말하기 기준을 통과했어요. 더 연습해 자연스럽게 발음해 보세요!"],
    "Bản dịch hiện ở đây": ["The translation appears here", "번역이 여기에 표시됩니다"],
    "Bản ghi chỉ tạm trong bộ nhớ để phát tại chỗ; Keepit không lưu/tải lên. Trình duyệt có thể xử lý audio để nhận diện.": ["A temporary memory-only recording plays locally; Keepit does not save or upload it. Browser speech recognition may process your audio.", "임시 녹음은 메모리에서만 재생되며 Keepit은 저장하거나 업로드하지 않습니다. 브라우저가 음성을 처리할 수 있습니다."],
    "Bật": ["On", "켜짐"],
    "Bỏ qua": ["Skip", "건너뛰기"],
    "Chép": ["Write", "받아쓰기"],
    "Chính": ["Original", "원문"],
    "Chính xác 100%!": ["100% correct!", "100% 정확해요!"],
    "Chưa có từ sai trong video này.": ["No spelling mistakes yet.", "이 동영상에 기록된 오답이 없습니다."],
    "Chưa mở": ["Locked", "잠김"],
    "Chưa sao cả, cứ mạnh dạn nói tiếp. Mỗi lần thử là một bước gần hơn đến phát âm chuẩn!": ["No worries, keep speaking boldly. Every try brings you closer to accurate pronunciation!", "괜찮아요, 자신 있게 계속 말해 보세요. 시도할 때마다 정확한 발음에 가까워져요!"],
    "Chạm micro để bắt đầu, chạm lần nữa để dừng, nghe lại bản ghi và chấm điểm.": ["Tap the mic to start, tap again to stop, hear your recording and get scored.", "마이크를 눌러 시작하고 다시 눌러 멈추면 녹음을 듣고 점수를 받습니다."],
    "Chạm để đóng": ["Tap to close", "눌러서 닫기"],
    "Chế độ phụ đề": ["Subtitle mode", "자막 모드"],
    "Chế độ rạp": ["Theater mode", "극장 모드"],
    "Chế độ xem": ["View mode", "보기 모드"],
    "Chỉ còn một bước nữa!": ["Just one more step!", "한 걸음만 더!"],
    "Chủ đề": ["Theme", "테마"],
    "Cài đặt": ["Settings", "설정"],
    "Cài đặt video": ["Video settings", "동영상 설정"],
    "Câu": ["Sentence", "문장"],
    "Câu tiếp": ["Next", "다음"],
    "Câu tiếp theo": ["Next sentence", "다음 문장"],
    "Câu trước": ["Previous sentence", "이전 문장"],
    "Câu đã làm": ["Sentences done", "완료한 문장"],
    "Câu đúng": ["Correct sentence", "정답 문장"],
    "Có ghi chú": ["Has notes", "메모 있음"],
    "Có tín hiệu rồi đấy!": ["There's a signal!", "신호가 잡혔어요!"],
    "Cần sửa": ["Needs practice", "수정 필요"],
    "Cố lên nhé!": ["Keep going!", "힘내세요!"],
    "Cột video:": ["Video column:", "동영상 열:"],
    "Cỡ chữ": ["Font size", "글자 크기"],
    "Danh sách câu": ["Sentence list", "문장 목록"],
    "Dịch": ["Translate", "번역"],
    "Dịch sang": ["Translate to", "번역 언어"],
    "Ghi chú": ["Note", "메모"],
    "Ghi chú bài học": ["Lesson notes", "학습 노트"],
    "Ghi chú tại câu này": ["Note at this sentence", "이 문장에 메모"],
    "Ghi chú đang khóa": ["Notes are locked", "노트가 잠겨 있습니다"],
    "Ghi chú đang khóa · gõ đúng 100% câu này để mở": ["Notes locked · type this sentence 100% correctly to unlock", "메모 잠김 · 이 문장을 100% 정확히 입력하면 열립니다"],
    "Ghi chú đang khóa · nói đạt ≥ 70% câu này để mở": ["Notes locked · score ≥ 70% speaking this sentence to unlock", "메모 잠김 · 이 문장을 말하기 70% 이상 달성하면 열립니다"],
    "Ghi tại": ["Note at", "메모 위치"],
    "Giao diện sáng": ["Light theme", "밝은 테마"],
    "Giao diện tối": ["Dark theme", "어두운 테마"],
    "Gõ câu bạn nghe được…": ["Type the sentence you hear…", "들리는 문장을 입력하세요…"],
    "Gõ đúng 100% câu hiện tại để mở khóa ghi chú.": ["Type the current sentence with 100% accuracy to unlock these notes.", "현재 문장을 100% 정확하게 입력하면 노트가 열립니다."],
    "Gần như hoàn hảo!": ["Almost perfect!", "거의 완벽해요!"],
    "Gần như không có gì để bắt bẻ! Bạn đang tiến sát đến sự hoàn hảo rồi!": ["Hardly anything to fault! You're getting really close to perfect!", "흠잡을 데가 거의 없어요! 완벽에 아주 가까워졌어요!"],
    "Gợi ý": ["Hint", "힌트"],
    "Gợi ý chữ cái đầu": ["First-letter hints", "첫 글자 힌트"],
    "Hiển thị thời gian": ["Show timestamps", "타임스탬프 표시"],
    "Hiện Ghi chú bài học": ["Show lesson notes", "학습 노트 표시"],
    "Hiện bản dịch": ["Show translation", "번역 표시"],
    "Hiện danh sách câu": ["Show sentence list", "문장 목록 표시"],
    "Hiện lại khi rê chuột / chạm": ["Shows again on hover / tap", "마우스를 올리거나 탭하면 다시 표시"],
    "Hiện video": ["Show video", "동영상 표시"],
    "Hiệu ứng nền": ["Ambient effect", "배경 효과"],
    "Hiệu ứng nền: Bật": ["Ambient effect: On", "배경 효과: 켜짐"],
    "Hiệu ứng nền: Tắt": ["Ambient effect: Off", "배경 효과: 꺼짐"],
    "Hồng": ["Pink", "분홍"],
    "Không": ["None", "없음"],
    "Không có từ phù hợp.": ["No matching words.", "일치하는 단어가 없습니다."],
    "Không có — tuyệt vời!": ["None — great job!", "없음 — 훌륭해요!"],
    "Không thể tin được, bạn đã chinh phục câu nói này! Giữ vững phong độ và tiếp tục tỏa sáng!": ["Incredible, you've conquered this sentence! Keep it up and keep shining!", "믿을 수 없어요, 이 문장을 정복했어요! 이 기세로 계속 빛나세요!"],
    "Khởi sắc rồi!": ["Picking up!", "좋아지고 있어요!"],
    "Khởi động lại nào!": ["Let's warm up again!", "다시 시작해 봐요!"],
    "Kiểm tra": ["Check", "확인"],
    "Kéo để đổi độ rộng": ["Drag to resize", "드래그하여 너비 조절"],
    "Kéo để đổi độ rộng · nhấp đúp = mặc định": ["Drag to resize · double-click = default", "드래그하여 너비 조절 · 더블클릭 = 기본값"],
    "Kết hợp câu": ["Combine sentences", "문장 결합"],
    "Kết thúc": ["Finish", "종료"],
    "Kết thúc phiên": ["End session", "세션 종료"],
    "Liên tục": ["Continuous", "계속"],
    "Luyện lại câu dưới 85%": ["Redo sentences under 85%", "85% 미만 문장 다시 연습"],
    "Làm lại": ["Retry", "다시 하기"],
    "Làm tốt lắm!": ["Well done!", "잘했어요!"],
    "Làm xong câu hiện tại để mở câu tiếp": ["Finish the current sentence to unlock the next", "현재 문장을 끝내면 다음 문장이 열립니다"],
    "Lưu từ cần luyện vào ghi chú": ["Save practice words to notes", "연습할 단어를 노트에 저장"],
    "Lần gần nhất vẫn sai": ["Still wrong last time", "최근에도 틀림"],
    "Lần gần nhất đã đúng": ["Correct last time", "최근에는 맞음"],
    "Lặp câu liên tục": ["Repeat sentence continuously", "문장 계속 반복"],
    "Lặp lại câu": ["Repeat sentence", "문장 반복"],
    "Lặp lại câu — nhấn giữ: chọn số lần": ["Repeat sentence — press and hold: choose count", "문장 반복 — 길게 누르기: 횟수 선택"],
    "Lặp mỗi câu": ["Repeat each sentence", "문장마다 반복"],
    "Lỗi": ["Mistakes", "오류"],
    "Lớn": ["Large", "크게"],
    "Màn ngang · kéo vạch chia giữa video và danh sách cũng được": ["Landscape · you can also drag the divider between the video and the list", "가로 화면 · 동영상과 목록 사이 구분선을 드래그해도 됩니다"],
    "Màu chủ đề": ["Accent color", "테마 색상"],
    "Màu phụ đề chính": ["Primary subtitle color", "원문 자막 색상"],
    "Màu phụ đề dịch": ["Translated subtitle color", "번역 자막 색상"],
    "Màu video lan ra nền": ["Video colors spill into the background", "동영상 색이 배경으로 번집니다"],
    "Mười phút mỗi ngày tốt hơn hai giờ mỗi tuần.": ["Ten minutes a day beats two hours a week.", "하루 10분이 일주일에 두 시간보다 낫습니다."],
    "Mặc định": ["Default", "기본값"],
    "Một nửa chặng đường đã nằm trong tay bạn. Cố thêm chút nữa để lời nói tự nhiên hơn!": ["You're halfway there. Push a little more to sound more natural!", "절반은 이미 해냈어요. 조금만 더 노력해 자연스럽게 말해 보세요!"],
    "Một vài từ đã bắt đầu đúng hướng. Cứ kiên trì, miệng bạn đang dần quen với tiếng Anh!": ["Some words are heading the right way. Keep at it, your mouth is getting used to English!", "몇몇 단어는 제대로 나오기 시작했어요. 꾸준히 하면 입이 영어에 익숙해져요!"],
    "Mở thanh bên ghi chú": ["Open notes sidebar", "노트 사이드바 열기"],
    "Mở thanh bên ghi chú hiện có của Keepit (ghi chú theo trang, đồng bộ với Bảng điều khiển).": ["Opens Keepit's notes sidebar (page notes, synced with the Dashboard).", "Keepit 메모 사이드바를 엽니다(페이지별 메모, 대시보드와 동기화)."],
    "Nghe lại": ["Replay", "다시 듣기"],
    "Nghe lại (Ctrl)": ["Replay (Ctrl)", "다시 듣기 (Ctrl)"],
    "Nghe lại giọng bạn": ["Hear your voice", "내 목소리 듣기"],
    "Nghe mẫu": ["Listen", "원음 듣기"],
    "Nghe mẫu (`)": ["Listen (`)", "원음 듣기 (`)"],
    "Ngôn ngữ": ["Language", "언어"],
    "Ngôn ngữ video": ["Video language", "동영상 언어"],
    "Nhấn Enter hoặc micro để bắt đầu. Nhấn Enter lần nữa để dừng, nghe lại bản ghi và chấm điểm.": ["Press Enter or tap the microphone to start. Press Enter again to stop, hear your recording, and check it.", "Enter 키나 마이크를 눌러 시작하세요. Enter를 다시 누르면 멈추고 녹음을 들은 뒤 채점합니다."],
    "Nhấn để dịch": ["Click to translate", "눌러서 번역"],
    "Nhẹ": ["Light", "약하게"],
    "Nhỏ": ["Small", "작게"],
    "Nói": ["Speak", "말하기"],
    "Nói khá chuẩn rồi!": ["Pretty accurate!", "꽤 정확해요!"],
    "Nói đạt ≥ 70% câu hiện tại để mở khóa ghi chú.": ["Score ≥ 70% speaking the current sentence to unlock these notes.", "현재 문장을 말하기 70% 이상 달성하면 노트가 열립니다."],
    "Nền": ["Background", "배경"],
    "Perfect! Quá đỉnh!": ["Perfect! Outstanding!", "Perfect! 최고예요!"],
    "Phát": ["Play", "재생"],
    "Phát âm của bạn đã khá vững vàng. Tiếp tục duy trì phong độ và chinh phục những câu khó hơn!": ["Your pronunciation is solid. Keep it up and take on harder sentences!", "발음이 꽤 탄탄해요. 이 기세로 더 어려운 문장에 도전해 보세요!"],
    "Phát âm khi dịch": ["Speak translation", "번역 시 음성 재생"],
    "Phát/Tạm dừng": ["Play/Pause", "재생/일시 정지"],
    "Phát/Tạm dừng (Space)": ["Play/Pause (Space)", "재생/일시정지 (Space)"],
    "Phân tích lỗi sai:": ["Error analysis:", "오류 분석:"],
    "Phóng to video": ["Expand video", "영상 확대"],
    "Phông chữ": ["Font", "글꼴"],
    "Phụ đề": ["Subtitles", "자막"],
    "Phụ đề cuộn": ["Scrolling transcript", "스크롤 자막"],
    "Phụ đề video": ["Video subtitles", "동영상 자막"],
    "Quay lại": ["Back", "뒤로"],
    "Rạp ngang · máy tự xoay ngang": ["Landscape theater · the device rotates", "가로 극장 · 기기가 가로로 회전합니다"],
    "Rất tốt, cứ thế nhé!": ["Very good, keep it up!", "아주 좋아요, 계속 이렇게!"],
    "Song ngữ": ["Bilingual", "이중 언어"],
    "Sáng": ["Light", "라이트"],
    "Sắp bắt nhịp rồi!": ["Almost in rhythm!", "곧 리듬을 탈 거예요!"],
    "Số lần phát lại mỗi câu trước khi sang câu tiếp. Chạm nút lặp để bật/tắt, nhấn giữ để chọn.": ["How many times each sentence plays before moving on. Tap the repeat button to toggle, press and hold to choose.", "다음 문장으로 넘어가기 전 각 문장을 재생하는 횟수입니다. 반복 버튼을 눌러 켜고 끄며, 길게 눌러 선택합니다."],
    "Sửa": ["Fix", "수정"],
    "Sửa câu rồi (Enter) Kiểm tra lại · (Esc) Đáp án": ["Fix the sentence, then (Enter) Check again · (Esc) Answer", "문장을 고친 뒤 (Enter) 다시 확인 · (Esc) 정답"],
    "Thanh bên ghi chú Keepit": ["Keepit notes sidebar", "Keepit 메모 사이드바"],
    "Thoát Rạp ngang": ["Exit landscape theater", "가로 극장 종료"],
    "Thoát toàn màn hình": ["Exit fullscreen", "전체 화면 종료"],
    "Thoát toàn màn hình · vẫn ở Rạp (xoay dọc để học)": ["Exited full screen · still in Theater (rotate to portrait to study)", "전체 화면 종료 · 극장 유지(세로로 돌려 학습)"],
    "Thu gọn": ["Collapse", "접기"],
    "Thu gọn phụ đề": ["Collapse subtitles", "자막 접기"],
    "Thu nhỏ video": ["Shrink video", "영상 축소"],
    "Thu nhỏ video thành thanh": ["Shrink video to a bar", "동영상을 막대로 축소"],
    "Thêm": ["More", "더보기"],
    "Thường": ["Normal", "일반"],
    "Thống kê từ sai": ["Wrong-word stats", "오답 단어 통계"],
    "Thời gian": ["Time", "시간"],
    "Thử lại": ["Try again", "다시 시도"],
    "Tiến bộ đáng kể!": ["Great progress!", "눈에 띄게 늘었어요!"],
    "Tiếng Việt": ["Vietnamese", "베트남어"],
    "Toàn màn hình": ["Full screen", "전체 화면"],
    "Trung bình": ["Medium", "보통"],
    "Trên thanh": ["On the bar", "막대에 표시"],
    "Trắng": ["White", "흰색"],
    "Tìm từ sai": ["Search mistakes", "오답 검색"],
    "Tìm từ…": ["Search words…", "단어 검색…"],
    "Tím": ["Purple", "보라색"],
    "Tất cả": ["All", "전체"],
    "Tắt": ["Off", "끄기"],
    "Tắt lặp câu": ["Repeat off", "반복 끄기"],
    "Tắt tiếng": ["Muted", "음소거"],
    "Tắt tự động": ["Auto off", "자동 끄기"],
    "Tốc độ": ["Speed", "재생 속도"],
    "Tối": ["Dark", "다크"],
    "Tổng kết · Chép chính tả": ["Summary · Dictation", "요약 · 받아쓰기"],
    "Tổng kết · Luyện nói": ["Summary · Speaking", "요약 · 말하기"],
    "Từ cần luyện thêm": ["Words to practise", "더 연습할 단어"],
    "Từ cần luyện:": ["Words to practise:", "연습할 단어:"],
    "Tự sang câu khi đạt ≥ 80%": ["Auto-advance at ≥ 80%", "80% 이상이면 자동으로 다음 문장"],
    "Tự động": ["Auto", "자동"],
    "Tự động nhận diện": ["Auto detect", "자동 감지"],
    "Tỷ lệ sửa": ["Fix rate", "수정률"],
    "Viết ghi chú… (tự lưu)": ["Write a note… (autosaved)", "메모 작성… (자동 저장)"],
    "Vuốt bên trái: âm lượng · bên phải: độ sáng": ["Swipe left side: volume · right side: brightness", "왼쪽 스와이프: 볼륨 · 오른쪽: 밝기"],
    "Vuốt ngang: tua · vuốt xuống ở giữa: thoát": ["Swipe sideways: seek · swipe down in the middle: exit", "가로 스와이프: 탐색 · 가운데에서 아래로: 종료"],
    "Vuốt trái/phải trên thẻ để đổi câu": ["Swipe left/right on the card to change sentence", "카드를 좌우로 스와이프해 문장 변경"],
    "Vàng": ["Yellow", "노란색"],
    "Xanh lá": ["Green", "초록색"],
    "Xanh lơ": ["Cyan", "청록"],
    "Xanh: đúng · Cam: gần đúng · Đỏ: thiếu": ["Green: correct · Orange: close · Red: missing", "초록: 정답 · 주황: 비슷함 · 빨강: 누락"],
    "Xem": ["Watch", "보기"],
    "Xoay dọc để học Nói · Chép": ["Rotate to portrait to study Speak · Write", "세로로 돌려 말하기 · 받아쓰기 학습"],
    "Xoá ghi chú": ["Delete note", "메모 삭제"],
    "Xuất phụ đề": ["Include subtitles", "자막 포함"],
    "Xuất sắc!": ["Excellent!", "훌륭해요!"],
    "Xám": ["Gray", "회색"],
    "Yêu thích": ["Favorite", "즐겨찾기"],
    "chạm để tra": ["tap to look up", "눌러서 찾기"],
    "lần": ["times", "회"],
    "mặc định": ["default", "기본값"],
    "thường": ["normal", "보통"],
    "Áp dụng ở toàn màn hình": ["Applies in full screen", "전체 화면에서 적용"],
    "Âm lượng": ["Volume", "볼륨"],
    "Đang nghe…": ["Listening…", "듣는 중…"],
    "Đang phát lại bản ghi của bạn…": ["Playing your recording…", "녹음을 재생하는 중…"],
    "Đang vào guồng!": ["Getting into the groove!", "궤도에 오르고 있어요!"],
    "Điểm TB": ["Avg score", "평균 점수"],
    "Điện thoại ngang chỉ có Rạp": ["Phone landscape is Theater only", "휴대폰 가로 화면은 극장 전용"],
    "Điện thoại ngang chỉ có Rạp — xoay dọc để học": ["Phone landscape is Theater only — rotate to portrait to study", "휴대폰 가로 화면은 극장 전용 — 세로로 돌려 학습"],
    "Đã bắt đầu rồi!": ["You've started!", "시작했어요!"],
    "Đã bỏ yêu thích": ["Removed from favorites", "즐겨찾기에서 삭제했습니다"],
    "Đã luyện": ["Practiced", "연습함"],
    "Đã làm": ["Done", "완료"],
    "Đã lưu": ["Saved", "저장됨"],
    "Đã sửa": ["Fixed", "수정됨"],
    "Đã thêm vào Ghi chú bài học": ["Added to lesson notes", "학습 노트에 추가했습니다"],
    "Đã thêm vào yêu thích": ["Added to favorites", "즐겨찾기에 추가했습니다"],
    "Đã xoá ghi chú": ["Note deleted", "메모를 삭제했습니다"],
    "Đã đặt lại": ["Reset", "초기화했습니다"],
    "Đóng": ["Close", "닫기"],
    "Đóng (Esc)": ["Close (Esc)", "닫기 (Esc)"],
    "Đạt yêu cầu, tiếp tục phát huy!": ["Passed — keep it up!", "기준 통과, 계속 이어가세요!"],
    "Đậm": ["Bold", "굵게"],
    "Đặc": ["Solid", "진하게"],
    "Đặt lại": ["Reset", "초기화"],
    "Đỉnh cao phát âm!": ["Top-notch pronunciation!", "최고의 발음!"],
    "Định dạng": ["Format", "형식"],
    "Đọc": ["Read", "읽기"],
    "Đỏ": ["Red", "빨간색"],
    "Độ sáng": ["Brightness", "밝기"],
    "Độ đậm": ["Weight", "굵기"],
    "Ẩn cột ghi chú": ["Hide notes column", "노트 열 숨기기"],
    "Ẩn danh sách câu": ["Hide sentence list", "문장 목록 숨기기"],
    "Ẩn thanh điều khiển": ["Hide controls", "컨트롤 숨기기"]
  };
  const P = [
    [/^Tới câu (\d+)$/, 'Go to sentence $1', '$1번 문장으로 이동'],
    [/^Ghi chú tại (.+)$/, 'Note at $1', '$1 메모'],
    [/^Ghi chú cho câu (\d+)…$/, 'Note for sentence $1…', '$1번 문장 메모…'],
    [/^Ghi tại (.+)$/, 'Note at $1', '$1에 메모'],
    [/^Câu (\d+)\/(\d+)$/, 'Sentence $1/$2', '문장 $1/$2'],
    [/^Câu (\d+)$/, 'Sentence $1', '문장 $1'],
    [/^Đã làm (\d+)\/(\d+)$/, 'Done $1/$2', '완료 $1/$2'],
    [/^Đã xoá ghi chú (.+)$/, 'Deleted the note at $1', '$1 메모를 삭제했습니다'],
    [/^Lặp mỗi câu (\S+) lần$/, 'Repeat each sentence $1×', '문장마다 $1회 반복'],
    [/^(\S+) lần$/, '$1×', '$1회'],
    [/^Dịch sang (.+)$/, 'Translate to $1', '$1(으)로 번역'],
    [/^Từ cần luyện: (.+)$/, 'Words to practise: $1', '연습할 단어: $1'],
  ];
  const SEPS = [' · ', ' — ', ': '];
  const SKIP = 'textarea, input, script, style, [translate="no"], [data-lhn-primary], [data-lhn-secondary], .sub-en, .sub-vi, .tsub, .en, .en2, .vi, .trans, .target, .diff, .wd, .w, .bsrc, .cinfo, .dtitle span, [data-wk]';
  const ATTRS = ['title', 'aria-label', 'placeholder'];
  const textRec = new WeakMap();
  const attrRec = new WeakMap();
  let root = null, langOf = () => 'vi', mo = null;
  const col = () => { const l = langOf(); return l === 'en' ? 0 : l === 'ko' ? 1 : -1; };
  const VN = /[^\x00-\x7f]|[a-z]/i;

  function one(t, c, depth = 0) {
    const d = D[t];
    if (d) return d[c];
    if (depth > 3) return null;
    for (const [re, ...o] of P) {
      const m = t.match(re);
      if (m) return o[c].replace(/\$(\d)/g, (_, i) => one(m[i], c, depth + 1) ?? m[i]);
    }
    for (const sep of SEPS) {
      if (!t.includes(sep)) continue;
      const parts = t.split(sep), out = parts.map((p) => (p.trim() ? one(p.trim(), c, depth + 1) : null));
      if (out.some((x) => x != null)) return parts.map((p, i) => (out[i] == null ? p : p.replace(p.trim(), out[i]))).join(sep);
    }
    return null;
  }
  function tr(s, c) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    if (!m[2] || !VN.test(m[2])) return s;
    const out = one(m[2], c);
    return out == null ? s : m[1] + out + m[3];
  }
  const skipped = (el) => !el || !!el.closest?.(SKIP);

  function doText(n, c) {
    const rec = textRec.get(n);
    const vi = rec && n.nodeValue === rec.out ? rec.vi : n.nodeValue;
    if (c < 0 || skipped(n.parentElement)) { if (rec) { textRec.delete(n); if (n.nodeValue !== vi) n.nodeValue = vi; } return; }
    const out = tr(vi, c);
    if (out === vi && !rec) return;
    textRec.set(n, { vi, out });
    if (n.nodeValue !== out) n.nodeValue = out;
  }
  function doAttrs(el, c) {
    let recs = attrRec.get(el);
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const cur = el.getAttribute(a), rec = recs?.[a];
      const vi = rec && cur === rec.out ? rec.vi : cur;
      const out = c < 0 ? vi : tr(vi, c);
      if (out === vi && !rec) continue;
      if (!recs) attrRec.set(el, (recs = {}));
      recs[a] = { vi, out };
      if (cur !== out) el.setAttribute(a, out);
    }
  }
  function walk(node, c) {
    if (node.nodeType === 3) { doText(node, c); return; }
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    if (node.nodeType === 1) { doAttrs(node, c); if (node.matches(SKIP)) return; }
    const it = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = it.nextNode(); n; n = it.nextNode()) n.nodeType === 3 ? doText(n, c) : doAttrs(n, c);
  }
  function refresh() { if (root) walk(root, col()); }
  function attach(el, getLang) {
    if (mo) mo.disconnect();
    root = el; langOf = () => { try { return getLang?.() || globalThis.LHN_LANGUAGES?.detectLanguage?.() || 'vi'; } catch (_) { return 'vi'; } };
    mo = new MutationObserver((list) => {
      const c = col();
      if (c < 0) return;
      for (const r of list) {
        if (r.type === 'characterData') doText(r.target, c);
        else if (r.type === 'attributes') doAttrs(r.target, c);
        else r.addedNodes.forEach((n) => walk(n, c));
      }
    });
    mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    refresh();
  }
  // strings built in JS (toasts, live text) can ask directly
  const text = (vi) => { const c = col(); return c < 0 ? vi : tr(vi, c); };
  return Object.freeze({ attach, refresh, text });
})();
