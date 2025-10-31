import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function queryLLM(request: string): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: request }],
    });

    return response.choices[0]?.message?.content ?? '';
  } catch (err) {
    console.error('LLM query failed:', err);
    return 'Error retrieving response.';
  }
}