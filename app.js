const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>稟議書AI（対話型）</title>
        <style>
          body {
            font-family: sans-serif;
            margin: 0;
            background: #f5f7fb;
          }
          .wrap {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
          }
          h1 {
            margin-top: 0;
          }
          .notice {
            background: #fff8e1;
            border: 1px solid #f0d98a;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
          }
          .layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
          }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            padding: 16px;
          }
          .chat {
            height: 520px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            background: #fafafa;
            margin-bottom: 12px;
          }
          .msg {
            margin-bottom: 12px;
            padding: 10px 12px;
            border-radius: 10px;
            white-space: pre-wrap;
            line-height: 1.6;
          }
          .ai {
            background: #e8f1ff;
          }
          .user {
            background: #eaf7ea;
          }
          textarea {
            width: 100%;
            min-height: 80px;
            padding: 10px;
            box-sizing: border-box;
            border-radius: 8px;
            border: 1px solid #ccc;
            resize: vertical;
            font-size: 14px;
          }
          .btn-row {
            display: flex;
            gap: 8px;
            margin-top: 10px;
            flex-wrap: wrap;
          }
          button {
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: #1f6feb;
            color: white;
            font-size: 14px;
          }
          button.secondary {
            background: #666;
          }
          button.warn {
            background: #c0392b;
          }
          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .side-title {
            margin-top: 0;
            font-size: 18px;
          }
          .field-box {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 10px;
            background: #fcfcfc;
          }
          .field-label {
            font-weight: bold;
            font-size: 13px;
            color: #333;
            margin-bottom: 6px;
          }
          .field-value {
            font-size: 14px;
            white-space: pre-wrap;
            color: #222;
            min-height: 18px;
          }
          .result-box {
            margin-top: 14px;
            padding: 12px;
            background: #f6f6f6;
            border-radius: 8px;
            white-space: pre-wrap;
            min-height: 120px;
          }
          .small {
            font-size: 12px;
            color: #666;
          }
          @media (max-width: 900px) {
            .layout {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>稟議書AI（対話型）</h1>
          <div class="notice">
            個人情報・機密情報は必要最小限で入力してください。<br>
            文章が苦手でも大丈夫です。短く答えてもAIが整理します。
          </div>

          <div class="layout">
            <div class="card">
              <div id="chat" class="chat"></div>

              <textarea id="input" placeholder="ここに入力してください。短くても大丈夫です。"></textarea>

              <div class="btn-row">
                <button id="sendBtn" onclick="sendMessage()">送信</button>
                <button class="secondary" onclick="goBack()">1つ前に戻る</button>
                <button class="warn" onclick="resetAll()">最初からやり直す</button>
                <button class="secondary" onclick="generateRingi()">稟議書を作成する</button>
              </div>

              <div class="result-box" id="resultBox">ここに生成結果が表示されます</div>
            </div>

            <div class="card">
              <h2 class="side-title">整理された情報</h2>

              <div class="field-box">
                <div class="field-label">件名メモ</div>
                <div id="subject_view" class="field-value"></div>
              </div>

              <div class="field-box">
                <div class="field-label">現状課題</div>
                <div id="issue_view" class="field-value"></div>
              </div>

              <div class="field-box">
                <div class="field-label">影響</div>
                <div id="impact_view" class="field-value"></div>
              </div>

              <div class="field-box">
                <div class="field-label">対策</div>
                <div id="measure_view" class="field-value"></div>
              </div>

              <div class="field-box">
                <div class="field-label">導入理由</div>
                <div id="reason_view" class="field-value"></div>
              </div>

              <div class="field-box">
                <div class="field-label">期待効果</div>
                <div id="effect_view" class="field-value"></div>
              </div>

              <div class="field-box">
                <div class="field-label">補足</div>
                <div id="note_view" class="field-value"></div>
              </div>

              <div class="small">
                「稟議書を作成する」は、情報が揃っていなくても押せます。<br>
                足りない情報は空欄のままでもAIが整理します。
              </div>
            </div>
          </div>
        </div>

        <script>
          const state = {
            currentStep: 'subject',
            history: [],
            data: {
              subject: '',
              issue: '',
              impact: '',
              measure: '',
              reason: '',
              effect: '',
              note: ''
            }
          };

          const steps = [
            {
              key: 'subject',
              question: 'まず、件名の元になる内容を教えてください。\\n例：ホッパー満杯検知用センサー追加導入'
            },
            {
              key: 'issue',
              question: '今どんな問題がありますか。短くで大丈夫です。\\n例：満杯なのに検知できないことがある'
            },
            {
              key: 'impact',
              question: 'その結果、どんな手間やリスクが出ていますか。\\n例：清掃作業が増える、設備停止リスクがある'
            },
            {
              key: 'measure',
              question: '今回、何を導入・改善したいですか。\\n例：追加センサーを取り付けたい'
            },
            {
              key: 'reason',
              question: 'なぜそれが必要ですか。\\n例：既設センサー1つでは故障時に検知できないため'
            },
            {
              key: 'effect',
              question: '導入すると、どんな効果が期待できますか。\\n例：見逃し防止、清掃作業削減、停止リスク低減'
            },
            {
              key: 'note',
              question: '補足があれば教えてください。なければ「なし」で大丈夫です。\\n例：既存設備への後付けを想定'
            }
          ];

          function addMessage(role, text) {
            const chat = document.getElementById('chat');
            const div = document.createElement('div');
            div.className = 'msg ' + role;
            div.textContent = text;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
          }

          function updateViews() {
            document.getElementById('subject_view').textContent = state.data.subject || '';
            document.getElementById('issue_view').textContent = state.data.issue || '';
            document.getElementById('impact_view').textContent = state.data.impact || '';
            document.getElementById('measure_view').textContent = state.data.measure || '';
            document.getElementById('reason_view').textContent = state.data.reason || '';
            document.getElementById('effect_view').textContent = state.data.effect || '';
            document.getElementById('note_view').textContent = state.data.note || '';
          }

          function getCurrentStepIndex() {
            return steps.findIndex(s => s.key === state.currentStep);
          }

          function askCurrentQuestion() {
            const step = steps.find(s => s.key === state.currentStep);
            if (step) {
              addMessage('ai', step.question);
            } else {
              addMessage('ai', '必要事項が揃いました。右下の「稟議書を作成する」を押してください。');
            }
          }

          async function sendMessage() {
            const inputEl = document.getElementById('input');
            const text = inputEl.value.trim();
            if (!text) return;

            addMessage('user', text);

            const currentIndex = getCurrentStepIndex();
            if (currentIndex === -1) return;

            const currentKey = steps[currentIndex].key;

            state.history.push(JSON.parse(JSON.stringify(state.data)));
            state.data[currentKey] = text === 'なし' ? '' : text;

            updateViews();
            inputEl.value = '';

            const nextIndex = currentIndex + 1;
            if (nextIndex < steps.length) {
              state.currentStep = steps[nextIndex].key;
              askCurrentQuestion();
            } else {
              state.currentStep = 'done';
              addMessage('ai', 'ありがとうございます。内容が揃いました。\\n必要なら右側の整理内容を確認して、問題なければ「稟議書を作成する」を押してください。');
            }
          }

          function goBack() {
            if (state.history.length === 0) {
              addMessage('ai', 'まだ戻れる内容がありません。');
              return;
            }

            state.data = state.history.pop();

            const filledCount = Object.values(state.data).filter(v => v && v.trim() !== '').length;

            if (!state.data.subject) state.currentStep = 'subject';
            else if (!state.data.issue) state.currentStep = 'issue';
            else if (!state.data.impact) state.currentStep = 'impact';
            else if (!state.data.measure) state.currentStep = 'measure';
            else if (!state.data.reason) state.currentStep = 'reason';
            else if (!state.data.effect) state.currentStep = 'effect';
            else if (!state.data.note) state.currentStep = 'note';
            else state.currentStep = steps[Math.min(filledCount, steps.length - 1)].key;

            updateViews();
            addMessage('ai', '1つ前の状態に戻しました。必要に応じて入力し直してください。');
            askCurrentQuestion();
          }

          function resetAll() {
            state.currentStep = 'subject';
            state.history = [];
            state.data = {
              subject: '',
              issue: '',
              impact: '',
              measure: '',
              reason: '',
              effect: '',
              note: ''
            };

            document.getElementById('chat').innerHTML = '';
            document.getElementById('input').value = '';
            document.getElementById('resultBox').textContent = 'ここに生成結果が表示されます';
            updateViews();
            addMessage('ai', '最初からやり直します。');
            askCurrentQuestion();
          }

          async function generateRingi() {
            const resultBox = document.getElementById('resultBox');
            resultBox.textContent = '生成中です...';

            try {
              const res = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state.data)
              });

              const text = await res.text();
              resultBox.textContent = text;
              addMessage('ai', '稟議書の下書きを作成しました。必要に応じて内容を確認してください。');
            } catch (error) {
              resultBox.textContent = 'エラーが発生しました: ' + error.message;
            }
          }

          updateViews();
          addMessage('ai', 'こんにちは。稟議書の作成をお手伝いします。短く答えていただければ大丈夫です。');
          askCurrentQuestion();
        </script>
      </body>
    </html>
  `);
});

app.post('/generate', async (req, res) => {
  try {
    const { subject, issue, impact, measure, reason, effect, note } = req.body;

    const prompt = `
以下のヒアリング内容をもとに、社内稟議書の下書きを作成してください。

【出力形式（必ず守る）】
【件名】
【要旨】
【説明】

【ルール】
・決裁者向けに簡潔かつ論理的に記述する
・説明は「現状→問題→対策→効果」の順で構成する
・主観的表現は使わない
・冗長な表現は避ける
・そのまま社内文書に貼れる文体にする
・文章は短めにまとめる

【入力情報】
件名メモ: ${subject || ''}
現状課題: ${issue || ''}
影響: ${impact || ''}
対策: ${measure || ''}
導入理由: ${reason || ''}
期待効果: ${effect || ''}
補足: ${note || ''}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).send(JSON.stringify(data, null, 2));
    }

    res.send(data.choices[0].message.content);
  } catch (error) {
    console.error(error);
    res.status(500).send('エラーが発生しました: ' + error.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
