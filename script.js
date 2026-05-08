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

    // --- [2. Gemini API 설정 및 AI 상담사 답변 로직] ---
    
    /**
     * [보안 주의사항]
     * 아래 API 키는 클라이언트 측 코드(JavaScript)에 직접 노출되어 있습니다.
     * 실제 서비스 배포 시에는 반드시 백엔드 서버를 거쳐서 호출하거나, 
     * 환경 변수 및 보안 프록시를 사용하여 키가 외부에 노출되지 않도록 해야 합니다.
     * 현재는 교육용 목적으로 직접 포함하였습니다.
     */
    const GEMINI_API_KEY = "AIzaSyBGCrhHoHWqp8ToJY_CBUm6m-MlCpJBAuY";
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const generateAIResponse = async (userText) => {
        if (!userText.trim()) return "먼저 당신의 이야기를 조금만 들려주시겠어요? 어떤 사소한 이야기라도 좋아요.";

        // 시스템 프롬프트 설정
        const systemPrompt = "너는 고등학생 전문 상담사야. 일기를 읽고 감정을 한 단어로 표현해줘. 그 다음 공감과 따뜻한 위로가 담긴 메시지를 2~3문장으로 작성해줘. 답변 형식 예시: [감정: 행복] 오늘 정말 멋진 하루를 보내셨군요! 당신의 노력이 결실을 맺은 것 같아 저도 기뻐요. 내일도 이 행복한 기운이 이어지길 응원할게요.";

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\n사용자 일기: ${userText}`
                        }]
                    }]
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('API 응답 에러:', data);
                throw new Error(data.error?.message || 'API 호출에 실패했습니다.');
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
            console.error('Gemini API 상세 에러:', error);
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
