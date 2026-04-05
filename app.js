const express = require('express');

const app = express();

app.get('/', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: '簡単な自己紹介をしてください' }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).send(JSON.stringify(data, null, 2));
    }

    res.send(data.choices[0].message.content);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
