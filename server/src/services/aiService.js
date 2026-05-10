import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

const systemPrompt =
  'You are a code review and security assistant. Return JSON only as {"issues":[...]}. Each issue must include: file, line, column, endLine, endColumn, issue, errorType, severity, fixSuggestion. The fixSuggestion must be a concrete solution, not a vague instruction. Allowed severity values: Low, Medium, High, Critical.';

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
                'Analyze the supplied code snippets. Focus on syntax-adjacent correctness, runtime bugs, security, bad practices, and maintainability. For each issue include the exact line/column when possible and a practical fix in fixSuggestion. Respond with {"issues":[...]} only.',
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
      line: Number(issue.line) || 1,
      column: Number(issue.column) || 1,
      endLine: Number(issue.endLine) || Number(issue.line) || 1,
      endColumn: Number(issue.endColumn) || Number(issue.column) + 1 || 120,
      errorType: issue.errorType || 'AI code review finding',
      severity: ['Low', 'Medium', 'High', 'Critical'].includes(issue.severity) ? issue.severity : 'Medium',
      fixSuggestion:
        issue.fixSuggestion || 'Refactor the highlighted code to remove the risky pattern and rerun the analyzer.',
      source: 'ai',
      ruleId: 'ai-review'
    }));
  } catch (error) {
    console.error('AI analysis failed:', error.message);
    return []; // Return empty array on failure, so analysis can continue
  }
};
