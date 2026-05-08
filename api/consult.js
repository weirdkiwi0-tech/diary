export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userText } = req.body;
    
    // Vercel 환경변수에서 API 키를 가져옵니다. (클라이언트에 노출되지 않음)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다. Vercel Settings에서 GEMINI_API_KEY를 설정해주세요.' });
    }

    // 시스템 프롬프트 설정
    const systemPrompt = "너는 고등학생 전문 상담사야. 일기를 읽고 감정을 한 단어로 표현해줘. 그 다음 공감과 따뜻한 위로가 담긴 메시지를 2~3문장으로 작성해줘. 답변 형식 예시: [감정: 행복] 오늘 정말 멋진 하루를 보내셨군요! 당신의 노력이 결실을 맺은 것 같아 저도 기뻐요. 내일도 이 행복한 기운이 이어지길 응원할게요.";
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
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
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
}
