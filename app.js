const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>稟議書AI（京瀧版）</title>
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
            line-height: 1.7;
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
            line-height: 1.7;
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
            line-height: 1.6;
          }
          .result-box {
            margin-top: 14px;
            padding: 12px;
            background: #f6f6f6;
            border-radius: 8px;
            white-space: pre-wrap;
            min-height: 160px;
            line-height: 1.7;
          }
          .small {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
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
          .type-description {
            margin-top: 10px;
            padding: 12px;
            background: #eef6ff;
            border-radius: 8px;
            display: none;
            line-height: 1.7;
            border: 1px solid #d7e7ff;
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
          <h1>稟議書AI（京瀧版）</h1>

          <div class="notice">
            個人情報・機密情報は必要最小限で入力してください。<br>
            文章が苦手でも大丈夫です。短く答えていただければAIが整理します。<br>
            最後に生成された文章は、そのまま使う前に必ず内容確認をしてください。
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
                <button onclick="selectType('equipment')">設備導入・修繕</button>
                <button onclick="selectType('system')">システム・AI導入</button>
                <button onclick="selectType('contract')">契約・外部サービス</button>
                <button onclick="selectType('hr')">人事・採用・退職</button>
                <button onclick="selectType('policy')">規程・制度・手当改定</button>
                <button onclick="selectType('pr')">広報・協賛・対外活動</button>
              </div>

              <div id="typeDescription" class="type-description"></div>

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
              label: '設備導入・修繕',
              description: '設備購入、更新、工事、修理、設置などに関する稟議です。',
              subjectExample: '受け入れホッパー満杯検知用センサー追加導入',
              issueExample: '既設設備では満杯状態を確実に検知できず、清掃作業や設備停止対応に手間がかかっている',
              impactExample: '清掃作業が増える、設備停止リスクがある、安定運用に支障が出る',
              measureExample: '追加センサーの導入、設備更新、修繕工事を実施したい',
              reasonExample: '現行設備のままでは安定稼働の維持が難しく、早期対応が必要である',
              effectExample: '見逃し防止、作業負荷軽減、停止リスク低減、安全性向上',
              noteExample: '既存設備への後付けを想定し、現場運用への影響を最小限に抑える'
            },

            system: {
              label: 'システム・AI導入',
              description: 'RPA、SmartHR、AI、ネット環境、PCサポートなどIT・DX関連の稟議です。',
              subjectExample: '稟議書作成支援AI導入',
              issueExample: '文書作成や転記作業に時間がかかり、担当者ごとに内容や品質にばらつきがある',
              impactExample: '作成時間が長い、確認や修正の手間が増える、属人化しやすい',
              measureExample: 'AIツールや業務支援システムを導入し、作業を効率化したい',
              reasonExample: '業務効率化と品質平準化を進め、担当者負担を軽減する必要がある',
              effectExample: '作成時間短縮、修正回数削減、品質の均一化、業務効率向上',
              noteExample: '既存のkintoneや社内業務フローに合わせ、段階的に運用開始する'
            },

            contract: {
              label: '契約・外部サービス',
              description: '保険、警備、回線、コンサル、人材紹介など外部サービスの契約・更新・停止に関する稟議です。',
              subjectExample: '外部支援サービス契約更新の件',
              issueExample: '現行の契約内容やサービスでは、業務上の課題解決や安定運用に十分対応できていない',
              impactExample: '運用負荷が高い、必要な支援が受けられない、コストに見合う効果が不十分',
              measureExample: '外部サービスの契約締結、更新、見直し、停止を行いたい',
              reasonExample: '業務継続性、品質向上、コスト適正化の観点から契約内容の見直しが必要である',
              effectExample: '運用品質向上、コスト適正化、必要支援の確保、業務安定化',
              noteExample: '契約条件、見積金額、期間、他社比較結果があれば記載する'
            },

            hr: {
              label: '人事・採用・退職',
              description: '採用、社員登用、異動、昇格、退職など人事に関する稟議です。',
              subjectExample: '正社員採用の件',
              issueExample: '現行体制では業務量や役割に対して人員が不足しており、安定した運営が難しい',
              impactExample: '業務負荷の偏り、対応遅れ、属人化、引継ぎ不足が発生している',
              measureExample: '採用、登用、異動、退職受理など人事対応を実施したい',
              reasonExample: '今後の業務継続および組織運営の安定化のため、人員面での対応が必要である',
              effectExample: '体制強化、業務平準化、対応力向上、継続性確保',
              noteExample: '配属先、雇用区分、入社予定日、退職日、特記事項があれば記載する'
            },

            policy: {
              label: '規程・制度・手当改定',
              description: '就業規則、手当、制度変更など社内ルールに関する稟議です。',
              subjectExample: '就業規則改定の件',
              issueExample: '現行の規程や制度が現在の組織体制・運用実態と合っておらず、見直しが必要となっている',
              impactExample: '運用が分かりにくい、事務処理が煩雑、現場との不整合が発生している',
              measureExample: '就業規則、手当、各種制度、運用ルールを改定または新設したい',
              reasonExample: '組織変更や業務実態に合わせて制度面を整備し、適正運用を図る必要がある',
              effectExample: '運用明確化、事務処理効率化、現場理解促進、制度整合性向上',
              noteExample: '施行日、対象部門、改定理由、現行制度との違いがあれば記載する'
            },

            pr: {
              label: '広報・協賛・対外活動',
              description: '協賛、スポンサー、寄付、広報活動など対外的な取り組みに関する稟議です。',
              subjectExample: '地域イベント協賛の件',
              issueExample: '対外的な発信や地域連携の機会が不足しており、企業認知や関係構築の強化が課題となっている',
              impactExample: '認知向上の機会損失、対外発信力不足、地域との接点が限定的',
              measureExample: '協賛、広報施策、対外発信、スポンサー契約等を実施したい',
              reasonExample: '企業価値向上と地域・社会との関係強化のため、対外活動を進める必要がある',
              effectExample: '認知向上、企業価値向上、地域連携強化、採用広報への好影響',
              noteExample: '対象イベント、契約期間、金額、期待する波及効果があれば記載する'
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
            const typeData = ringiTypes[state.data.ringiType] || ringiTypes.system;

            if (stepKey === 'ringiType') {
              return 'まず、どの種類の稟議書ですか。下のボタンから選んでください。';
            }

            if (stepKey === 'subject') {
              return '件名の元になる内容を教えてください。\\n例：' + typeData.subjectExample;
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
              document.getElementById('typeDescription').style.display = 'none';
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

            const desc = document.getElementById('typeDescription');
            desc.style.display = 'block';
            desc.innerText = ringiTypes[typeKey].description;

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

            if (state.data.ringiType) {
              const desc = document.getElementById('typeDescription');
              desc.style.display = 'block';
              desc.innerText = ringiTypes[state.data.ringiType].description;
            } else {
              document.getElementById('typeDescription').style.display = 'none';
            }

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
            document.getElementById('typeDescription').style.display = 'none';
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
      equipment: '設備導入・修繕',
      system: 'システム・AI導入',
      contract: '契約・外部サービス',
      hr: '人事・採用・退職',
      policy: '規程・制度・手当改定',
      pr: '広報・協賛・対外活動'
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
