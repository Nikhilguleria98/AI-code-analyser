import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

const systemPrompt =
  'You are a code review and security assistant. Return JSON only as an array of objects with keys: file, line, issue, severity, fixSuggestion. Allowed severity values: Low, Medium, High, Critical.';

export const runAiAnalysis = async (snippets) => {
  if (!client || !snippets.length) {
    return [];
  }

  try {
    const response = await Promise.race([
      client.chat.completions.create({
        model: env.openAiModel,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: JSON.stringify({
              instruction:
                'Analyze the supplied code snippets, focus on correctness and security, and respond with {"issues":[...]} only.',
              snippets
            })
          }
        ]
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI analysis timeout')), 30000)) // 30 second timeout
    ]);

    const content = response.choices?.[0]?.message?.content || '{"issues":[]}';
    const parsed = JSON.parse(content);

    return (parsed.issues || []).map((issue) => ({
      ...issue,
      severity: ['Low', 'Medium', 'High', 'Critical'].includes(issue.severity) ? issue.severity : 'Medium',
      source: 'ai',
      ruleId: 'ai-review'
    }));
  } catch (error) {
    console.error('AI analysis failed:', error.message);
    return []; // Return empty array on failure, so analysis can continue
  }
};
