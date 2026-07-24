// Netlify Function — runs on Netlify's servers, never in the user's browser.
// Keeps the Gemini API key completely hidden from end users.
//
// Setup: after deploying to Netlify, go to
//   Site settings -> Environment variables -> Add variable
//   Key: GEMINI_API_KEY
//   Value: (your free key from aistudio.google.com/apikey)
// Then redeploy (or "Clear cache and deploy site"). See NETLIFY_DEPLOY_GUIDE.md.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in this deploy context.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY environment variable not set on Netlify.' }),
    };
  }

  let message;
  try {
    ({ message } = JSON.parse(event.body || '{}'));
  } catch (e) {
    console.error('Invalid request body:', event.body);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
  if (!message || typeof message !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing "message" field' }) };
  }

  const systemPrompt =
    'You are a friendly, concise tutor for NIELIT O Level (R5) exam students. ' +
    'The syllabus covers: M1-R5 (IT Tools & Network Basics), M2-R5 (Web Designing & Publishing), ' +
    'M3-R5 (Programming through Python), M4-R5 (Internet of Things & Applications). ' +
    'Answer clearly in simple language, using short examples where helpful. ' +
    'If the question is unrelated to these topics, still try to help briefly.';

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nStudent's question: ${message}` }] }],
        }),
      }
    );

    const rawText = await resp.text();
    let data;
    try { data = JSON.parse(rawText); } catch (e) { data = null; }

    if (!resp.ok) {
      console.error('Gemini API returned an error. Status:', resp.status, 'Body:', rawText);
      return {
        statusCode: 200, // return 200 so the client shows our message instead of a generic network failure
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Gemini API error (${resp.status}): ${rawText.slice(0, 300)}` }),
      };
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, jawab generate nahi ho paya. Thodi der baad try karein.';

    if (!data?.candidates) {
      console.error('Gemini responded 200 but with no candidates. Raw body:', rawText);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('Function threw an exception:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
