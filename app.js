const fetch = require('node-fetch');
const express = require('express');

const app = express();

app.get('/', async (req, res) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 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'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: '簡単な自己紹介をしてください' }
      ]
    })
  });

  const data = await response.json();
  res.send(data.choices[0].message.content);
});

app.listen(10000, () => {
  console.log('Server running');
});
