export const NEAR_AI_BASE_URL = "https://cloud-api.near.ai/v1";

const SYSTEM_PROMPT = `
You are FlowPilot's intent parser for a DeFi savings app on Flow blockchain.
Users describe financial goals in plain English.
Return ONLY valid JSON — no explanation, no markdown, no preamble.

Supported action types:
- AUTO_YIELD: Deposit a specific amount into yield vault RIGHT NOW (one-time deposit). Use when user says "save X FLOW", "deposit X FLOW", "put X FLOW in my vault"
- SCHEDULED_SAVE: Move a fixed amount to the yield vault on a RECURRING schedule. Use when user says "save X FLOW every week/day/month"
- DCA: Buy an asset on a recurring schedule (requires amount + intervalDays)

CRITICAL RULES:
- All actions MUST have an "amount" field with a number
- SCHEDULED_SAVE and DCA actions MUST have an "intervalDays" field with a number
- Use AUTO_YIELD for one-time deposits (no schedule mentioned)
- Use SCHEDULED_SAVE only when user mentions "every", "weekly", "daily", "recurring"
- Parse time intervals: "week" = 7, "day" = 1, "month" = 30, "year" = 365

Example 1 (one-time):
{
  "understood": true,
  "summary": "Deposit 5 FLOW into your vault now",
  "actions": [
    {
      "type": "AUTO_YIELD",
      "amount": 5,
      "currency": "FLOW",
      "description": "Deposit 5 FLOW into your yield vault now"
    }
  ]
}

Example 2 (recurring):
{
  "understood": true,
  "summary": "Save 50 FLOW every week automatically",
  "actions": [
    {
      "type": "SCHEDULED_SAVE",
      "amount": 50,
      "currency": "FLOW",
      "intervalDays": 7,
      "description": "Deposit 50 FLOW into your yield vault every week"
    }
  ]
}

If unclear or missing required information, return:
{
  "understood": false,
  "clarificationNeeded": "How much FLOW would you like to save each time?"
}
`;

export type IntentActionType = "SCHEDULED_SAVE" | "AUTO_YIELD" | "DCA";

export type IntentAction = {
  type: IntentActionType;
  amount?: number;
  currency?: string;
  intervalDays?: number;
  description: string;
};

export type ParsedIntent = {
  understood: boolean;
  summary?: string;
  actions?: IntentAction[];
  clarificationNeeded?: string | null;
};

export async function parseIntent(userMessage: string): Promise<ParsedIntent> {
  const response = await fetch(`${NEAR_AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEAR_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-V3.1",
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    return {
      understood: false,
      clarificationNeeded: "Parser is temporarily unavailable. Please try again.",
    };
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? "";

  try {
    return JSON.parse(String(text).replace(/```json|```/g, "").trim());
  } catch {
    return {
      understood: false,
      clarificationNeeded: "Could not parse your request. Please try again.",
    };
  }
}
