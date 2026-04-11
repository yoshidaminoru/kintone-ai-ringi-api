const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>稟議書AI（種類選択つき）</title>
        <style>
          body {
            font-family: sans-serif;
            margin: 0;
            background: #f5f7fb;
          }
          .wrap {
            max-width: 1280px;
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
            height: 560px;
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
            min-height: 90px;
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
            min-height: 140px;
          }
          .small {
            font-size: 12px;
            color: #666;
          }
          .type-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
          }
          .type-buttons button {
            background: #2d7d46;
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
          <h1>稟議書AI（種類選択つき）</h1>
          <div class="notice">
            個人情報・機密情報は必要最小限で入力してください。<br>
            文章が苦手でも大丈夫です。短く答えていただければAIが整理します。
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

              <div class="type-buttons" id="typeButtons" style="display:none;">
                <button onclick="selectType('equipment')">購入・設備導入</button>
                <button onclick="selectType('repair')">修繕・更新</button>
                <button onclick="selectType('improvement')">業務改善</button>
                <button onclick="selectType('system')">システム導入</button>
                <button onclick="selectType('organization')">人員・体制</button>
                <button onclick="selectType('other')">その他</button>
              </div>

              <div class="result-box" id="resultBox">ここに生成結果が表示されます</div>
            </div>

            <div class="card">
              <h2 class="side-title">整理された情報</h2>

              <div class="field-box">
                <div class="field-label">稟議書の種類</div>
                <div id="ringiType_view" class="field-value"></div>
              </div>

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
          const ringiTypes = {
            equipment: {
              label: '購入・設備導入',
              issueExample: '満杯状態を検知できず、清掃作業や設備停止の手間が発生している',
              impactExample: '清掃作業が増える、設備停止リスクがある',
              measureExample: '追加センサーを導入したい',
              reasonExample: '既設設備だけでは安定運用が難しく、追加導入が必要である',
              effectExample: '作業負荷軽減、停止リスク低減、安全性向上',
              noteExample: '既存設備への後付けを想定'
            },
            repair: {
              label: '修繕・更新',
              issueExample: '老朽化により故障が増え、安定稼働に支障が出ている',
              impactExample: '停止時間が増える、保全対応の負荷が高い',
              measureExample: '老朽設備を修繕または更新したい',
              reasonExample: '継続使用では安定稼働の確保が難しいため',
              effectExample: '故障減少、安定稼働、保全負荷軽減',
              noteExample: '現行設備との互換性を考慮'
            },
            improvement: {
              label: '業務改善',
              issueExample: '作業手順が非効率で、手間や待ち時間が発生している',
              impactExample: '処理時間が長い、担当者負担が大きい',
              measureExample: '作業フローや運用方法を見直したい',
              reasonExample: '現行のやり方では効率化に限界があるため',
              effectExample: '作業時間短縮、負荷軽減、品質安定',
              noteExample: '現場運用への影響は限定的'
            },
            system: {
              label: 'システム導入',
              issueExample: '手作業での転記が多く、入力ミスや確認漏れが発生している',
              impactExample: '作業時間がかかる、属人化している',
              measureExample: '業務管理システムや自動化ツールを導入したい',
              reasonExample: '業務効率化と属人化防止のため、システム化が必要である',
              effectExample: '処理時間短縮、ミス削減、進捗の見える化',
              noteExample: '既存システムとの連携も考慮'
            },
            organization: {
              label: '人員・体制',
              issueExample: '現行体制では業務量に対応しきれず、負荷が偏っている',
              impactExample: '対応遅れ、属人化、引継ぎ不足が発生している',
              measureExample: '人員配置や担当体制を見直したい',
              reasonExample: '安定運営のためには現行体制の見直しが必要である',
              effectExample: '業務平準化、対応力向上、属人化解消',
              noteExample: '関係部門との調整を前提とする'
            },
            other: {
              label: 'その他',
              issueExample: '現在の運用では支障があり、改善が必要となっている',
              impactExample: '手間やリスク、非効率が発生している',
              measureExample: '必要な対策を実施したい',
              reasonExample: '現状維持では課題解決が難しいため',
              effectExample: '効率化、安定化、リスク低減',
              noteExample: '必要に応じて補足'
            }
          };

          const state = {
            currentStep: 'ringiType',
            history: [],
            data: {
              ringiType: '',
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
            { key: 'ringiType' },
            { key: 'subject' },
            { key: 'issue' },
            { key: 'impact' },
            { key: 'measure' },
            { key: 'reason' },
            { key: 'effect' },
            { key: 'note' }
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
            document.getElementById('ringiType_view').textContent =
              state.data.ringiType ? ringiTypes[state.data.ringiType].label : '';
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

          function getQuestion(stepKey) {
            const typeData = ringiTypes[state.data.ringiType] || ringiTypes.other;

            if (stepKey === 'ringiType') {
              return 'まず、どの種類の稟議書ですか。下のボタンから選んでください。';
            }

            if (stepKey === 'subject') {
              return '件名の元になる内容を教えてください。\\n例：ホッパー満杯検知用センサー追加導入';
            }

            if (stepKey === 'issue') {
              return '今どんな問題がありますか。短くで大丈夫です。\\n例：' + typeData.issueExample;
            }

            if (stepKey === 'impact') {
              return 'その結果、どんな手間やリスクが出ていますか。\\n例：' + typeData.impactExample;
            }

            if (stepKey === 'measure') {
              return '今回、何を導入・改善したいですか。\\n例：' + typeData.measureExample;
            }

            if (stepKey === 'reason') {
              return 'なぜそれが必要ですか。\\n例：' + typeData.reasonExample;
            }

            if (stepKey === 'effect') {
              return '導入すると、どんな効果が期待できますか。\\n例：' + typeData.effectExample;
            }

            if (stepKey === 'note') {
              return '補足があれば教えてください。なければ「なし」で大丈夫です。\\n例：' + typeData.noteExample;
            }

            return '';
          }

          function askCurrentQuestion() {
            const question = getQuestion(state.currentStep);
            if (question) {
              addMessage('ai', question);
            }

            if (state.currentStep === 'ringiType') {
              document.getElementById('typeButtons').style.display = 'flex';
              document.getElementById('input').style.display = 'none';
              document.getElementById('sendBtn').style.display = 'none';
            } else {
              document.getElementById('typeButtons').style.display = 'none';
              document.getElementById('input').style.display = 'block';
              document.getElementById('sendBtn').style.display = 'inline-block';
            }
          }

          function selectType(typeKey) {
            state.history.push(JSON.parse(JSON.stringify(state.data)));
            state.data.ringiType = typeKey;
            updateViews();

            addMessage('user', ringiTypes[typeKey].label);

            state.currentStep = 'subject';
            askCurrentQuestion();
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
              addMessage('ai', 'ありがとうございます。内容が揃いました。必要なら右側の整理内容を確認して、問題なければ「稟議書を作成する」を押してください。');
            }
          }

          function goBack() {
            if (state.history.length === 0) {
              addMessage('ai', 'まだ戻れる内容がありません。');
              return;
            }

            state.data = state.history.pop();

            if (!state.data.ringiType) state.currentStep = 'ringiType';
            else if (!state.data.subject) state.currentStep = 'subject';
            else if (!state.data.issue) state.currentStep = 'issue';
            else if (!state.data.impact) state.currentStep = 'impact';
            else if (!state.data.measure) state.currentStep = 'measure';
            else if (!state.data.reason) state.currentStep = 'reason';
            else if (!state.data.effect) state.currentStep = 'effect';
            else if (!state.data.note) state.currentStep = 'note';
            else state.currentStep = 'done';

            updateViews();
            addMessage('ai', '1つ前の状態に戻しました。必要に応じて入力し直してください。');
            askCurrentQuestion();
          }

          function resetAll() {
            state.currentStep = 'ringiType';
            state.history = [];
            state.data = {
              ringiType: '',
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
    const { ringiType, subject, issue, impact, measure, reason, effect, note } = req.body;

    const typeLabel = {
      equipment: '購入・設備導入',
      repair: '修繕・更新',
      improvement: '業務改善',
      system: 'システム導入',
      organization: '人員・体制',
      other: 'その他'
    }[ringiType] || 'その他';

    const prompt = `
以下のヒアリング内容をもとに、社内稟議書の下書きを作成してください。

【稟議書の種類】
${typeLabel}

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
・稟議書の種類に合った自然な表現にする

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
