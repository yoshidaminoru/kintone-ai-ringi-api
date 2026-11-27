const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const { setTimeout: wait } = require('node:timers/promises');
const express = require('express');
const { mountPolicyChat } = require('./policy-chat');

const target = 'https://kyotaki.cybozu.com/k/573/show#record=27';

async function checkRecord() {
  if (!process.env.OPENAI_API_KEY || !process.env.KINTONE_POLICY_API_TOKEN) {
    throw new Error('OPENAI_API_KEY と KINTONE_POLICY_API_TOKEN を設定してください。');
  }
  process.env.POLICY_OPENAI_MODEL = 'gpt-6-luna';
  process.env.POLICY_PROFILES_JSON = JSON.stringify([{ label: '就業規則の接続確認', records: [27] }]);
  const password = randomBytes(24).toString('hex');
  process.env.POLICY_PILOT_PASSWORD = password;
  const app = express();
  app.use(express.json());
  mountPolicyChat(app);
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const { port } = server.address();
    const request = {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`pilot:${password}`).toString('base64'),
        'Content-Type': 'application/json',
        'X-Policy-Chat': '1'
      },
      body: JSON.stringify({
        profileIndex: 0, question: '年次有給休暇を取得するには、就業規則上どのような届出が必要ですか？'
      }),
      signal: AbortSignal.timeout(45_000)
    };
    for (let attempt = 0; attempt < 20; attempt++) {
      const response = await fetch(`http://127.0.0.1:${port}/policy-chat/ask`, request);
      if (response.status === 202) {
        await wait(8_000);
        request.signal = AbortSignal.timeout(45_000);
        continue;
      }
      if (!response.ok) throw new Error(`規程チャット HTTP ${response.status}`);
      const { answer, sources } = await response.json();
      if (!answer?.trim() || !sources?.length || sources.some(source =>
        source.url !== target || !Number.isInteger(source.page) || source.page < 1)) {
        throw new Error('レコード27を引用する回答を取得できませんでした。');
      }
      const pages = [...new Set(sources.map(source => source.page))].join(', ');
      console.log(`PASS: GPT-6 Luna, record 27, PDF pages ${pages}, ${target}`);
      return;
    }
    throw new Error('PDFの読み取りが確認時間内に完了しませんでした。');
  } finally {
    server.close();
  }
}

checkRecord().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
