const DEFAULT_MODEL = 'gpt-6-luna';

async function requestPolicyModel({ instructions, input, format, maxOutputTokens = 850 }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY が設定されていません。');

  const model = process.env.POLICY_OPENAI_MODEL || DEFAULT_MODEL;
  const body = {
    model,
    instructions,
    input,
    store: false,
    max_output_tokens: maxOutputTokens,
    reasoning: { effort: 'none' }
  };
  if (format) body.text = { format };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
    redirect: 'error'
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const code = details?.error?.code;
    const safeCode = typeof code === 'string' && /^[a-z0-9_]{1,60}$/.test(code) ? ` / ${code}` : '';
    throw new Error(`OpenAI API HTTP ${response.status}${safeCode}`);
  }
  const result = await response.json();
  const text = (result.output || [])
    .filter(item => item.type === 'message' && item.role === 'assistant')
    .flatMap(item => item.content || [])
    .filter(item => item.type === 'output_text')
    .map(item => item.text)
    .join('');
  if (result.status !== 'completed' || !text.trim()) {
    throw new Error('OpenAI API の回答を受け取れませんでした。');
  }
  return { model: result.model || model, text };
}

if (require.main === module) {
  requestPolicyModel({ input: 'Reply with OK.', maxOutputTokens: 64 })
    .then(({ model }) => console.log(`Responses API での生成に成功しました（${model}）。`))
    .catch(error => {
      console.error(`接続確認に失敗しました。${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { requestPolicyModel };
