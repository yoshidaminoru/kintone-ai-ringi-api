const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>稟議書AI</title>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; }
          input, textarea { width: 100%; margin-bottom: 12px; padding: 8px; box-sizing: border-box; }
          button { padding: 10px 16px; cursor: pointer; }
          pre { white-space: pre-wrap; background: #f6f6f6; padding: 16px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>稟議書AI</h1>
        <p>必要事項を入力して「生成」を押してください。</p>

        <label>件名メモ</label>
        <input id="subject" />

        <label>現状課題</label>
        <textarea id="issue"></textarea>

        <label>導入理由</label>
        <textarea id="reason"></textarea>

        <label>期待効果</label>
        <textarea id="effect"></textarea>

        <label>補足</label>
        <textarea id="note"></textarea>

        <button onclick="generate()">生成</button>

        <h2>生成結果</h2>
        <pre id="result">ここに結果が表示されます</pre>

        <script>
          async function generate() {
            const payload = {
              subject: document.getElementById('subject').value,
              issue: document.getElementById('issue').value,
              reason: document.getElementById('reason').value,
              effect: document.getElementById('effect').value,
              note: document.getElementById('note').value
            };

            const res = await fetch('/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const text = await res.text();
            document.getElementById('result').textContent = text;
          }
        </script>
      </body>
    </html>
  `);
});

app.post('/generate', async (req, res) => {
  try {
    const { subject, issue, reason, effect, note } = req.body;

    const prompt = `
以下の情報をもとに、社内稟議書の下書きを作成してください。
「件名」「要旨」「説明」の3項目で、簡潔かつ論理的にまとめてください。

件名メモ: ${subject || ''}
現状課題: ${issue || ''}
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
