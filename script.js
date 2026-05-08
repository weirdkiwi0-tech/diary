/**
 * 감정일기 앱 '오늘 하루 어땠나요?' 로직
 * 
 * 1. 음성 인식 (STT) 기능
 * 2. AI 상담사 답변 생성 로직
 * 3. UI 인터랙션 제어
 */

document.addEventListener('DOMContentLoaded', () => {
    const diaryInput = document.getElementById('diary-input');
    const voiceBtn = document.getElementById('voice-input-btn');
    const aiBtn = document.getElementById('ai-consultant-btn');
    const responseSection = document.getElementById('ai-response-section');
    const responseText = document.getElementById('ai-response-text');

    // --- [1. 음성 인식 기능 설정] ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let isRecording = false;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isRecording = true;
            voiceBtn.innerHTML = '<span class="icon">🛑</span> 중지하기';
            voiceBtn.classList.add('recording');
            diaryInput.placeholder = "말씀해 주세요... 듣고 있어요.";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            diaryInput.value += (diaryInput.value ? ' ' : '') + transcript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopRecording();
        };

        recognition.onend = () => {
            stopRecording();
        };

        const stopRecording = () => {
            isRecording = false;
            voiceBtn.innerHTML = '<span class="icon">🎤</span> 음성 입력';
            voiceBtn.classList.remove('recording');
            diaryInput.placeholder = "여기에 당신의 이야기를 들려주세요...";
        };

        voiceBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        voiceBtn.style.display = 'none'; // 브라우저가 지원하지 않을 경우 숨김
        console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
    }

    // --- [2. AI 상담사 답변 로직 (보안 강화 버전)] ---
    
    /**
     * [보안 업데이트]
     * API 키를 프론트엔드 코드에서 완전히 제거했습니다.
     * 이제 모든 요청은 /api/consult 서버리스 함수를 통해 안전하게 전달됩니다.
     * API 키는 Vercel 대시보드의 Environment Variables에서 관리됩니다.
     */
    const generateAIResponse = async (userText) => {
        if (!userText.trim()) return "먼저 당신의 이야기를 조금만 들려주시겠어요? 어떤 사소한 이야기라도 좋아요.";

        try {
            // 외부 API가 아닌, 우리가 만든 내부 API(/api/consult)를 호출합니다.
            const response = await fetch('/api/consult', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userText })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('서버 응답 에러:', data);
                // 에러 메시지 추출 로직 개선 ([object Object] 방지)
                const errorMessage = data.error?.message || data.error || '상담사와 연결하는 중에 문제가 생겼어요.';
                throw new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
            }

            // 응답 구조 확인 및 텍스트 추출
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const aiText = data.candidates[0].content.parts[0].text;
                return aiText;
            } else {
                console.error('예상치 못한 응답 구조:', data);
                return "마음을 분석하는 중에 조금 복잡한 일이 생겼나 봐요. 잠시 후 다시 시도해 주시겠어요?";
            }

        } catch (error) {
            console.error('디버깅 정보:', error);
            return `죄송해요, 연결에 문제가 발생했어요. (${error.message})`;
        }
    };

    aiBtn.addEventListener('click', async () => {
        const text = diaryInput.value;
        if (!text.trim()) {
            alert("일기를 먼저 작성해 주세요!");
            return;
        }
        
        // 버튼 로딩 상태 표시
        aiBtn.disabled = true;
        aiBtn.innerHTML = '<span class="icon">⏳</span> 분석 중...';

        // AI 답변 생성 (비동기 호출)
        const answer = await generateAIResponse(text);
        
        // 결과 표시
        responseText.textContent = answer;
        responseSection.classList.remove('hidden');
        
        // 답변 위치로 부드럽게 스크롤
        responseSection.scrollIntoView({ behavior: 'smooth' });

        // 버튼 복구
        aiBtn.disabled = false;
        aiBtn.innerHTML = '<span class="icon">✨</span> AI 상담사';
    });

    // --- [3. 엔터 키 이벤트 추가] ---
    // 엔터 키를 누르면 버튼을 클릭한 것과 동일하게 작동하도록 함
    diaryInput.addEventListener('keydown', (event) => {
        // Shift + Enter는 줄바꿈으로 허용하고, Enter만 눌렀을 때 실행
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // 기본 줄바꿈 방지
            aiBtn.click(); // AI 상담사 버튼 클릭 이벤트 트리거
        }
    });
});
