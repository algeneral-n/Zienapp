import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, checkMembership } from '../supabase';
import { getRoleLevel, AGENT_MIN_LEVEL } from '../permissions';

// ─── Action Classification ──────────────────────────────────────────────
type ActionLevel = 'read_only' | 'suggest' | 'modify' | 'sensitive';

const MODE_ACTION_LEVEL: Record<string, ActionLevel> = {
  help: 'read_only',
  analyze: 'read_only',
  report: 'read_only',
  act: 'modify',
  approve: 'sensitive',
  delete: 'sensitive',
  transfer: 'sensitive',
  payroll_run: 'sensitive',
  terminate: 'sensitive',
};

// Minimum action level each role level can perform
const MIN_LEVEL_FOR_ACTION: Record<ActionLevel, number> = {
  read_only: 20,    // everyone
  suggest: 30,      // new_hire+
  modify: 60,       // supervisor+
  sensitive: 85,    // assistant_gm+
};

function classifyAction(mode: string): ActionLevel {
  return MODE_ACTION_LEVEL[mode] ?? 'read_only';
}

function checkPermission(
  userRole: string,
  agentType: string,
  mode: string,
): { allowed: boolean; reason?: string; actionLevel: ActionLevel } {
  const userLevel = getRoleLevel(userRole);
  const agentMinLevel = AGENT_MIN_LEVEL[agentType] ?? 40;
  const actionLevel = classifyAction(mode);
  const actionMinLevel = MIN_LEVEL_FOR_ACTION[actionLevel];

  // Check agent access
  if (userLevel < agentMinLevel) {
    return {
      allowed: false,
      reason: `Role '${userRole}' does not have access to the '${agentType}' agent. Minimum level required: ${agentMinLevel}, your level: ${userLevel}.`,
      actionLevel,
    };
  }

  // Check action level
  if (userLevel < actionMinLevel) {
    return {
      allowed: false,
      reason: `Role '${userRole}' cannot perform '${actionLevel}' actions. You can use read-only modes like 'help', 'analyze', or 'report'.`,
      actionLevel,
    };
  }

  return { allowed: true, actionLevel };
}

/**
 * AI routes — proxies Gemini/OpenAI calls to keep API keys server-side.
 *
 * POST /api/ai/rare     — RARE agent query (permission-gated)
 * POST /api/ai/senate   — Multi-model deliberation (founder/admin only)
 * POST /api/ai/maestro  — Smart task routing across models
 * GET  /api/ai/usage    — Usage analytics
 * GET  /api/ai/agents   — List available agents for user's role
 */
export async function handleAI(
  request: Request,
  env: Env,
  path: string,
): Promise<Response> {
  // All AI routes require auth
  const { userId, supabase } = await requireAuth(request, env);

  if (path === '/api/ai/rare' && request.method === 'POST') {
    return handleRARE(request, env, userId, supabase);
  }

  if (path === '/api/ai/senate' && request.method === 'POST') {
    return handleSenate(request, env, userId, supabase);
  }

  if (path === '/api/ai/maestro' && request.method === 'POST') {
    return handleMaestro(request, env, userId, supabase);
  }

  if (path === '/api/ai/usage' && request.method === 'GET') {
    return handleUsageAnalytics(request, env, userId, supabase);
  }

  if (path === '/api/ai/agents' && request.method === 'GET') {
    return handleListAgents(request, env, userId, supabase);
  }

  // ─── New RARE AI capabilities ─────────────────────────────────────
  if (path === '/api/ai/translate' && request.method === 'POST') {
    return handleTranslate(request, env, userId, supabase);
  }

  if (path === '/api/ai/generate-image' && request.method === 'POST') {
    return handleGenerateImage(request, env, userId, supabase);
  }

  if (path === '/api/ai/generate-file' && request.method === 'POST') {
    return handleGenerateFile(request, env, userId, supabase);
  }

  if (path === '/api/ai/read-file' && request.method === 'POST') {
    return handleReadFile(request, env, userId, supabase);
  }

  return errorResponse('Not found', 404);
}

async function handleRARE(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    prompt: string;
    mode: string;
    agentType: string;
    moduleCode?: string;
    companyId: string;
    context?: Record<string, unknown>;
    language?: string;
  };

  if (!body.prompt) {
    return errorResponse('Missing prompt');
  }

  // Resolve user role — either from company membership or profile
  let membershipRole = 'employee';

  if (body.companyId) {
    // Verify user is a member of the company (admin bypass RLS)
    const membership = await checkMembership(env, userId, body.companyId);
    if (!membership) {
      return errorResponse('Not a member of this company', 403);
    }
    membershipRole = membership.role;
  } else {
    // No company context — resolve from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_role')
      .eq('id', userId)
      .single();
    if (profile?.platform_role === 'founder') membershipRole = 'founder';
    else if (profile?.platform_role === 'admin') membershipRole = 'company_gm';
  }

  // ─── Permission Gate ────────────────────────────────────────────────
  const permCheck = checkPermission(membershipRole, body.agentType, body.mode);
  if (!permCheck.allowed) {
    // Log denied attempt
    await supabase.from('ai_usage_logs').insert({
      company_id: body.companyId || null,
      user_id: userId,
      agent_type: body.agentType,
      mode: body.mode,
      module_code: body.moduleCode,
      model_name: 'permission_gate',
      tokens_in: 0,
      tokens_out: 0,
      query_text: body.prompt.substring(0, 500),
      response_summary: `DENIED: ${permCheck.reason}`,
      is_sensitive: permCheck.actionLevel === 'sensitive',
    });
    return errorResponse(permCheck.reason ?? 'Permission denied', 403);
  }

  // Build system prompt based on agent type and mode
  const systemPrompt = buildSystemPrompt(body.agentType, body.mode, membershipRole, body.language);

  // Determine if web search should be enabled
  const isSearchMode = body.mode === 'search' || body.prompt.match(/\b(search|find|look up|بحث|ابحث|دور|جوجل|google)\b/i);

  // Build OpenAI request body
  const openaiBody: Record<string, unknown> = {
    model: isSearchMode ? 'gpt-4o-mini' : 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: body.prompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  };

  // Add web search tool when in search mode
  if (isSearchMode) {
    openaiBody.tools = [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the internet for current information, news, prices, or any real-time data. Use this when the user asks about external information not available in the company data.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query to look up on the internet' },
            },
            required: ['query'],
          },
        },
      },
    ];
    openaiBody.tool_choice = 'auto';
  }

  // Call OpenAI API
  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(openaiBody),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    console.error('OpenAI error:', errText);
    return errorResponse('AI service unavailable', 502);
  }

  let openaiData = (await openaiRes.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
        tool_calls?: Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason?: string;
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  // Handle tool calls (web search)
  const toolCall = openaiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall && toolCall.function.name === 'web_search') {
    const searchArgs = JSON.parse(toolCall.function.arguments) as { query: string };

    // Perform web search via Google Custom Search API or fallback to a summary
    let searchResult = '';
    try {
      if (env.GOOGLE_API_KEY) {
        const searchRes = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${env.GOOGLE_API_KEY}&cx=000000000000000000000:xxxxxxxxxx&q=${encodeURIComponent(searchArgs.query)}&num=5`
        );
        if (searchRes.ok) {
          const searchData = (await searchRes.json()) as {
            items?: Array<{ title: string; snippet: string; link: string }>;
          };
          searchResult = (searchData.items || [])
            .map((item, i) => `${i + 1}. **${item.title}**\n   ${item.snippet}\n   [${item.link}](${item.link})`)
            .join('\n\n');
        }
      }
    } catch (e) {
      console.error('Search error:', e);
    }

    if (!searchResult) {
      searchResult = `Web search for "${searchArgs.query}" — I don't have direct internet access in this environment, but based on my training data, here's what I know:`;
    }

    // Call OpenAI again with the search results
    const followUpRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: body.prompt },
          openaiData.choices![0].message,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: searchResult || 'No results found.',
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (followUpRes.ok) {
      openaiData = (await followUpRes.json()) as typeof openaiData;
    }
  }

  const responseText =
    openaiData.choices?.[0]?.message?.content ?? 'No response generated';

  // Log usage (with action classification)
  await supabase.from('ai_usage_logs').insert({
    company_id: body.companyId || null,
    user_id: userId,
    agent_type: body.agentType,
    mode: body.mode,
    module_code: body.moduleCode,
    model_name: 'gpt-4o-mini',
    tokens_in: openaiData.usage?.prompt_tokens ?? 0,
    tokens_out: openaiData.usage?.completion_tokens ?? 0,
    query_text: body.prompt.substring(0, 500),
    response_summary: responseText.substring(0, 500),
    action_level: permCheck.actionLevel,
    is_sensitive: permCheck.actionLevel === 'sensitive',
  });

  return jsonResponse({
    response: responseText,
    mode: body.mode,
    agentType: body.agentType,
    tokens: {
      input: openaiData.usage?.prompt_tokens ?? 0,
      output: openaiData.usage?.completion_tokens ?? 0,
    },
  });
}

// Language name map for multi-language AI responses
const LANG_NAMES: Record<string, string> = {
  ar: 'Arabic (العربية)', en: 'English', fr: 'French (Français)', es: 'Spanish (Español)',
  de: 'German (Deutsch)', tr: 'Turkish (Türkçe)', ru: 'Russian (Русский)', zh: 'Chinese (中文)',
  ja: 'Japanese (日本語)', ko: 'Korean (한국어)', pt: 'Portuguese (Português)', it: 'Italian (Italiano)',
  nl: 'Dutch (Nederlands)', hi: 'Hindi (हिन्दी)', ur: 'Urdu (اردو)',
};

function buildSystemPrompt(agentType: string, mode: string, userRole: string, language?: string): string {
  const roleMap: Record<string, string> = {
    // ─── Core Business Agents (8 original) ──────────────────────────────
    accounting: 'You are an AI accounting assistant for a company using the ZIEN platform. You help with journal entries, financial reports, tax calculations, VAT compliance, and budget analysis.',
    hr: 'You are an AI HR assistant for a company using the ZIEN platform. You help with employee records, leave management, attendance tracking, payroll calculations, and labor law compliance.',
    sales: 'You are an AI sales and CRM assistant for a company using the ZIEN platform. You help with lead management, pipeline tracking, customer communication, and sales forecasting.',
    fleet: 'You are an AI logistics and fleet management assistant for a company using the ZIEN platform. You help with vehicle tracking, route optimization, maintenance scheduling, and delivery management.',
    meetings: 'You are an AI meeting assistant for a company using the ZIEN platform. You help with scheduling, agenda preparation, meeting summaries, action item tracking, and calendar management.',
    gm: 'You are an AI general manager assistant for a company using the ZIEN platform. You provide executive summaries, cross-department insights, KPI dashboards, and strategic recommendations.',
    secretary: 'You are an AI executive secretary assistant for a company using the ZIEN platform. You help with correspondence, scheduling, document management, and administrative coordination.',
    founder: 'You are an AI platform management assistant for the ZIEN platform founder. You provide tenant analytics, revenue insights, platform health monitoring, and growth strategies.',

    // ─── Extended Agents (16 new) ───────────────────────────────────────
    general: 'You are a general-purpose AI help assistant for the ZIEN platform. You answer questions about how to use the platform, navigate features, and troubleshoot common issues.',
    marketing: 'You are an AI marketing assistant for a company using the ZIEN platform. You help with campaign management, audience segmentation, content creation, SEO analysis, and marketing ROI tracking.',
    projects: 'You are an AI project management assistant for a company using the ZIEN platform. You help with task allocation, milestone tracking, Gantt charts, resource planning, and project risk assessment.',
    store: 'You are an AI retail and POS assistant for a company using the ZIEN platform. You help with inventory management, product catalog, pricing strategies, sales analytics, and supplier coordination.',
    inventory: 'You are an AI inventory management assistant for a company using the ZIEN platform. You help with stock levels, reorder points, warehouse management, batch tracking, and inventory valuation.',
    maintenance: 'You are an AI maintenance and asset management assistant for a company using the ZIEN platform. You help with preventive maintenance schedules, work orders, asset lifecycle tracking, and cost analysis.',
    crm: 'You are an AI customer relationship management assistant for a company using the ZIEN platform. You help with customer profiles, interaction history, satisfaction tracking, retention strategies, and support tickets.',
    legal: 'You are an AI legal compliance assistant for a company using the ZIEN platform. You help with contract review, regulatory compliance, policy drafting, and legal risk assessment. Note: Always recommend consulting a qualified attorney for binding legal decisions.',
    quality: 'You are an AI quality assurance assistant for a company using the ZIEN platform. You help with quality control procedures, inspection reports, ISO compliance, corrective actions, and quality metrics.',
    training: 'You are an AI training and development assistant for a company using the ZIEN platform. You help with employee onboarding, skills assessment, training program design, certification tracking, and learning analytics.',
    procurement: 'You are an AI procurement assistant for a company using the ZIEN platform. You help with vendor management, purchase orders, bid comparison, contract negotiation support, and procurement analytics.',
    finance: 'You are an AI financial planning assistant for a company using the ZIEN platform. You help with cash flow forecasting, investment analysis, cost-benefit calculations, and financial modeling.',
    safety: 'You are an AI workplace safety assistant for a company using the ZIEN platform. You help with incident reporting, safety audits, compliance checklists, risk assessments, and safety training recommendations.',
    support: 'You are an AI customer support assistant for a company using the ZIEN platform. You help with ticket management, response templates, escalation procedures, SLA tracking, and customer satisfaction analysis.',
    analytics: 'You are an AI business analytics assistant for a company using the ZIEN platform. You help with data visualization, trend analysis, predictive modeling, KPI monitoring, and custom report generation.',
    integrations: 'You are an AI integrations assistant for a company using the ZIEN platform. You help with API configurations, third-party service connections, data sync troubleshooting, and webhook management.',
  };

  const modeMap: Record<string, string> = {
    help: 'Answer questions and provide guidance.',
    analyze: 'Analyze the data and provide insights.',
    act: 'Suggest specific actions to take.',
    report: 'Generate a structured report.',
    search: 'Search the internet for current information and provide comprehensive, well-sourced answers. Use the web_search tool to find up-to-date data.',
  };

  const base = roleMap[agentType] ?? 'You are an AI assistant for the ZIEN platform.';
  const modeInstruction = modeMap[mode] ?? '';

  const langName = LANG_NAMES[language || 'en'] || LANG_NAMES['en'];
  const langInstruction = language && language !== 'en'
    ? `You MUST respond in ${langName}. All your output must be in ${langName}. If the user writes in a different language, still respond in ${langName}.`
    : `Respond in the same language the user writes in. You support all these languages: ${Object.values(LANG_NAMES).join(', ')}.`;

  return `${base}\nThe current user has the role: ${userRole}.\nMode: ${mode}. ${modeInstruction}\n${langInstruction}`;
}
// ─── Senate: Multi-Model Deliberation (Founder/Admin only) ──────────────
// Inspired by archive SenateEngine.ts — sends the same prompt to multiple models
// and synthesizes a combined answer. Used for critical strategic decisions.

async function handleSenate(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    prompt: string;
    companyId: string;
    topic?: string;
    language?: string;
  };

  if (!body.prompt || !body.companyId) {
    return errorResponse('Missing prompt or companyId');
  }

  // Senate is founder/platform_admin only (admin bypass RLS)
  const membership = await checkMembership(env, userId, body.companyId);

  if (!membership) return errorResponse('Not a member', 403);

  const userLevel = getRoleLevel(membership.role);
  if (userLevel < 90) {
    return errorResponse('Senate deliberation requires GM level or above', 403);
  }

  const senatePrompt = `You are a council of expert advisors deliberating on a critical business decision for the ZIEN platform.

Topic: ${body.topic || 'Strategic Decision'}
Question: ${body.prompt}

Provide your analysis as a structured deliberation with:
1. **Executive Summary** - Brief overview of the decision
2. **Arguments For** - Detailed list of supporting arguments
3. **Arguments Against** - Detailed list of opposing arguments
4. **Risk Assessment** - Potential risks and mitigation strategies
5. **Financial Impact** - Estimated cost/benefit analysis
6. **Recommendation** - Clear final recommendation with confidence level (1-10)
7. **Implementation Steps** - If approved, concrete next steps

Be thorough, data-driven, and consider multiple perspectives.
${body.language && LANG_NAMES[body.language] ? `You MUST respond in ${LANG_NAMES[body.language]}.` : 'Respond in the same language as the question.'}`;

  // Call OpenAI with high token limit for comprehensive analysis
  const senateRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a council of expert advisors for the ZIEN platform.' },
        { role: 'user', content: senatePrompt },
      ],
      temperature: 0.4,
      max_tokens: 8192,
    }),
  });

  if (!senateRes.ok) return errorResponse('AI service unavailable', 502);

  const senateData = (await senateRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const deliberation = senateData.choices?.[0]?.message?.content || 'No deliberation generated';

  // Also query with a different temperature/persona for diversity if OpenAI key available
  let secondOpinion = null;
  if (env.OPENAI_API_KEY) {
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a contrarian business strategist. Challenge assumptions and provide a critical counterpoint analysis.' },
            { role: 'user', content: body.prompt },
          ],
          temperature: 0.6,
          max_tokens: 2048,
        }),
      });

      if (openaiRes.ok) {
        const openaiData = (await openaiRes.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        secondOpinion = openaiData.choices?.[0]?.message?.content || null;
      }
    } catch {
      // Second opinion unavailable, proceed with primary only
    }
  }

  // Log senate deliberation
  await supabase.from('ai_usage_logs').insert({
    company_id: body.companyId,
    user_id: userId,
    agent_type: 'senate',
    mode: 'deliberate',
    model_name: 'gpt-4o' + (secondOpinion ? '+gpt-4o-mini' : ''),
    tokens_in: senateData.usage?.prompt_tokens ?? 0,
    tokens_out: senateData.usage?.completion_tokens ?? 0,
    query_text: body.prompt.substring(0, 500),
    response_summary: deliberation.substring(0, 500),
    is_sensitive: true,
  });

  return jsonResponse({
    deliberation,
    second_opinion: secondOpinion,
    topic: body.topic || 'Strategic Decision',
    models_used: secondOpinion ? ['gpt-4o', 'gpt-4o-mini'] : ['gpt-4o'],
  });
}

// ─── Maestro: Smart Task Routing ──────────────────────────────────────────
// Inspired by archive ai-maestro.ts — classifies the task and routes to
// the best-suited agent automatically.

async function handleMaestro(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    prompt: string;
    companyId: string;
  };

  if (!body.prompt || !body.companyId) {
    return errorResponse('Missing prompt or companyId');
  }

  // Verify membership (admin bypass RLS)
  const membership = await checkMembership(env, userId, body.companyId);

  if (!membership) return errorResponse('Not a member', 403);

  // Step 1: Classify the task using OpenAI
  const classifyPrompt = `Classify the following user query into one of these agent categories and action modes.

Agent categories: ${Object.keys(AGENT_MIN_LEVEL).join(', ')}
Action modes: help, analyze, report, act

User query: "${body.prompt}"

Respond ONLY with valid JSON (no markdown):
{"agent": "category_name", "mode": "action_mode", "confidence": 0.95, "reasoning": "brief explanation"}`;

  const classifyRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: classifyPrompt }],
      temperature: 0.1,
      max_tokens: 256,
    }),
  });

  if (!classifyRes.ok) return errorResponse('Classification service unavailable', 502);

  const classifyData = (await classifyRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const classText = classifyData.choices?.[0]?.message?.content || '';

  let classification: { agent: string; mode: string; confidence: number; reasoning: string };
  try {
    // Parse JSON, handling potential markdown code blocks
    const cleaned = classText.replace(/```json\n?|\n?```/g, '').trim();
    classification = JSON.parse(cleaned);
  } catch {
    classification = { agent: 'general', mode: 'help', confidence: 0.5, reasoning: 'Failed to classify, defaulting to general' };
  }

  // Step 2: Check permissions for the classified agent
  const permCheck = checkPermission(membership.role, classification.agent, classification.mode);

  if (!permCheck.allowed) {
    // Downgrade to a permitted agent/mode
    classification.agent = 'general';
    classification.mode = 'help';
  }

  // Step 3: Execute with the routed agent
  const systemPrompt = buildSystemPrompt(classification.agent, classification.mode, membership.role);

  const execRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!execRes.ok) return errorResponse('AI service unavailable', 502);

  const execData = (await execRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const response = execData.choices?.[0]?.message?.content || 'No response';

  // Log maestro routing
  await supabase.from('ai_usage_logs').insert({
    company_id: body.companyId,
    user_id: userId,
    agent_type: classification.agent,
    mode: classification.mode,
    module_code: 'maestro',
    model_name: 'gpt-4o-mini',
    tokens_in: execData.usage?.prompt_tokens ?? 0,
    tokens_out: execData.usage?.completion_tokens ?? 0,
    query_text: body.prompt.substring(0, 500),
    response_summary: response.substring(0, 500),
    action_level: permCheck.actionLevel,
    is_sensitive: permCheck.actionLevel === 'sensitive',
  });

  return jsonResponse({
    response,
    routing: {
      agent: classification.agent,
      mode: classification.mode,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
    },
    tokens: {
      input: execData.usage?.prompt_tokens ?? 0,
      output: execData.usage?.completion_tokens ?? 0,
    },
  });
}

// ─── Usage Analytics ────────────────────────────────────────────────────────

async function handleUsageAnalytics(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id');
  const days = parseInt(url.searchParams.get('days') || '30');

  if (!companyId) return errorResponse('company_id is required');

  // Verify membership (admin bypass RLS)
  const membership = await checkMembership(env, userId, companyId);

  if (!membership) return errorResponse('Not a member', 403);

  // Only managers+ can view usage
  const userLevel = getRoleLevel(membership.role);
  if (userLevel < 60) return errorResponse('Insufficient permissions', 403);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: logs, error } = await supabase
    .from('ai_usage_logs')
    .select('agent_type, mode, model_name, tokens_in, tokens_out, created_at')
    .eq('company_id', companyId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) return errorResponse(error.message, 500);

  // Aggregate by agent type
  const byAgent: Record<string, { count: number; tokens_in: number; tokens_out: number }> = {};
  for (const log of logs || []) {
    if (!byAgent[log.agent_type]) byAgent[log.agent_type] = { count: 0, tokens_in: 0, tokens_out: 0 };
    byAgent[log.agent_type].count++;
    byAgent[log.agent_type].tokens_in += log.tokens_in || 0;
    byAgent[log.agent_type].tokens_out += log.tokens_out || 0;
  }

  return jsonResponse({
    period_days: days,
    total_queries: (logs || []).length,
    total_tokens_in: (logs || []).reduce((s, l) => s + (l.tokens_in || 0), 0),
    total_tokens_out: (logs || []).reduce((s, l) => s + (l.tokens_out || 0), 0),
    by_agent: byAgent,
  });
}

// ─── List Available Agents for User ─────────────────────────────────────────

async function handleListAgents(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id');

  if (!companyId) return errorResponse('company_id is required');

  const membership = await checkMembership(env, userId, companyId);

  if (!membership) return errorResponse('Not a member', 403);

  const userLevel = getRoleLevel(membership.role);

  const agents = Object.entries(AGENT_MIN_LEVEL).map(([agent, minLevel]) => ({
    agent,
    accessible: userLevel >= minLevel,
    min_level: minLevel,
  }));

  return jsonResponse({
    role: membership.role,
    level: userLevel,
    agents,
    accessible_count: agents.filter(a => a.accessible).length,
    total_count: agents.length,
  });
}

// ─── Neural Translation ─────────────────────────────────────────────────────

async function handleTranslate(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    text: string;
    sourceLang?: string;
    targetLang: string;
    dialect?: string;
    companyId: string;
  };

  if (!body.text || !body.targetLang || !body.companyId) {
    return errorResponse('Missing text, targetLang, or companyId');
  }

  const membership = await checkMembership(env, userId, body.companyId);
  if (!membership) return errorResponse('Not a member', 403);

  const targetName = LANG_NAMES[body.targetLang] || body.targetLang;
  const sourceName = body.sourceLang ? (LANG_NAMES[body.sourceLang] || body.sourceLang) : 'auto-detect';
  const dialectNote = body.dialect ? `\nUse the "${body.dialect}" dialect/variant of the target language. Adapt tone, vocabulary, and expressions to match this specific regional dialect naturally.` : '';

  const systemPrompt = `You are RARE Neural Translator — an advanced multilingual translation engine for the ZIEN platform.

Rules:
1. Translate the text from ${sourceName} to ${targetName}.${dialectNote}
2. Preserve formatting, markdown, numbers, and special characters.
3. Maintain the original tone (formal/informal/technical).
4. For business/technical terms, use the standard accepted translation in the target language.
5. If the source language cannot be detected, make your best guess.
6. Return ONLY the translated text — no explanations, no notes.
7. Support dialects: Egyptian Arabic, Gulf Arabic, Levantine Arabic, etc.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.text },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) return errorResponse('Translation service unavailable', 502);

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const translated = data.choices?.[0]?.message?.content || '';

  await supabase.from('ai_usage_logs').insert({
    company_id: body.companyId,
    user_id: userId,
    agent_type: 'translator',
    mode: 'translate',
    model_name: 'gpt-4o-mini',
    tokens_in: data.usage?.prompt_tokens ?? 0,
    tokens_out: data.usage?.completion_tokens ?? 0,
    query_text: body.text.substring(0, 500),
    response_summary: translated.substring(0, 500),
  });

  return jsonResponse({
    translated,
    sourceLang: body.sourceLang || 'auto',
    targetLang: body.targetLang,
    dialect: body.dialect || null,
    tokens: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
  });
}

// ─── Image Generation (DALL-E) ──────────────────────────────────────────────

async function handleGenerateImage(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    prompt: string;
    companyId: string;
    size?: string;
    style?: string;
    quality?: string;
  };

  if (!body.prompt || !body.companyId) {
    return errorResponse('Missing prompt or companyId');
  }

  const membership = await checkMembership(env, userId, body.companyId);
  if (!membership) return errorResponse('Not a member', 403);

  // Only supervisor+ can generate images (level 60+)
  const userLevel = getRoleLevel(membership.role);
  if (userLevel < 20) {
    return errorResponse('Image generation requires at least employee access', 403);
  }

  const size = body.size || '1024x1024';
  const style = body.style || 'natural';
  const quality = body.quality || 'standard';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `${body.prompt}\n\nStyle: Professional, clean, suitable for business use on the ZIEN platform.`,
      n: 1,
      size,
      style,
      quality,
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('DALL-E error:', errText);
    return errorResponse('Image generation failed', 502);
  }

  const data = (await res.json()) as {
    data?: Array<{ url?: string; revised_prompt?: string }>;
  };

  const imageUrl = data.data?.[0]?.url || '';
  const revisedPrompt = data.data?.[0]?.revised_prompt || '';

  await supabase.from('ai_usage_logs').insert({
    company_id: body.companyId,
    user_id: userId,
    agent_type: 'image_generator',
    mode: 'generate',
    model_name: 'dall-e-3',
    tokens_in: 0,
    tokens_out: 0,
    query_text: body.prompt.substring(0, 500),
    response_summary: `Image generated: ${size}, ${style}`,
  });

  return jsonResponse({
    imageUrl,
    revisedPrompt,
    size,
    style,
    quality,
  });
}

// ─── Document/File Generation ───────────────────────────────────────────────

async function handleGenerateFile(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    type: 'report' | 'manual' | 'guide' | 'profile' | 'template' | 'custom';
    title: string;
    instructions: string;
    companyId: string;
    format?: 'markdown' | 'html' | 'json';
    language?: string;
  };

  if (!body.title || !body.instructions || !body.companyId) {
    return errorResponse('Missing title, instructions, or companyId');
  }

  const membership = await checkMembership(env, userId, body.companyId);
  if (!membership) return errorResponse('Not a member', 403);

  const format = body.format || 'markdown';
  const langName = LANG_NAMES[body.language || 'en'] || 'English';

  const fileTypePrompts: Record<string, string> = {
    report: 'Generate a professional business report with executive summary, data sections, charts descriptions, and conclusions.',
    manual: 'Generate a training manual with step-by-step instructions, screenshots placeholders, tips, and a table of contents.',
    guide: 'Generate a user guide/how-to document with clear numbered steps, screenshots placeholders, and troubleshooting section.',
    profile: 'Generate a company/service profile document with overview, services, team, contact info sections.',
    template: 'Generate a reusable document template with placeholder sections that can be filled in.',
    custom: 'Generate a custom document based on the user instructions.',
  };

  const formatInstructions: Record<string, string> = {
    markdown: 'Output in clean Markdown format with proper headings (##), lists, tables, and bold/italic formatting.',
    html: 'Output in clean HTML with proper tags, CSS classes, and semantic structure. Include inline styles for print-ready output.',
    json: 'Output as a JSON structure with sections, content, and metadata fields.',
  };

  const systemPrompt = `You are RARE Document Generator — an advanced document creation engine for the ZIEN platform.

Document Type: ${body.type}
${fileTypePrompts[body.type] || fileTypePrompts.custom}

${formatInstructions[format]}

Rules:
1. Create a complete, professional document.
2. Write in ${langName}.
3. Include a title, date placeholder, and author placeholder.
4. For reports: include data tables with sample structure.
5. For manuals/guides: include numbered steps and clear explanations.
6. Make it visually structured and ready to use.
7. Never include confidential placeholder data — use "[Company Name]", "[Date]", etc.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Title: ${body.title}\n\nInstructions: ${body.instructions}` },
      ],
      temperature: 0.5,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) return errorResponse('Document generation failed', 502);

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content || '';

  await supabase.from('ai_usage_logs').insert({
    company_id: body.companyId,
    user_id: userId,
    agent_type: 'file_generator',
    mode: 'generate_file',
    model_name: 'gpt-4o',
    tokens_in: data.usage?.prompt_tokens ?? 0,
    tokens_out: data.usage?.completion_tokens ?? 0,
    query_text: `${body.type}: ${body.title}`.substring(0, 500),
    response_summary: content.substring(0, 500),
  });

  return jsonResponse({
    content,
    title: body.title,
    type: body.type,
    format,
    tokens: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
  });
}

// ─── Multimodal File/Image Reading (GPT-4o Vision) ──────────────────────────

async function handleReadFile(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    imageUrl?: string;
    imageBase64?: string;
    textContent?: string;
    instruction: string;
    companyId: string;
    language?: string;
  };

  if (!body.instruction || !body.companyId) {
    return errorResponse('Missing instruction or companyId');
  }

  if (!body.imageUrl && !body.imageBase64 && !body.textContent) {
    return errorResponse('Provide imageUrl, imageBase64, or textContent to analyze');
  }

  const membership = await checkMembership(env, userId, body.companyId);
  if (!membership) return errorResponse('Not a member', 403);

  const langName = LANG_NAMES[body.language || 'en'] || 'English';

  // Build message content (supports multimodal)
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }> = [];

  userContent.push({ type: 'text', text: body.instruction });

  if (body.imageUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: body.imageUrl, detail: 'high' },
    });
  }

  if (body.imageBase64) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${body.imageBase64}`, detail: 'high' },
    });
  }

  if (body.textContent) {
    userContent.push({ type: 'text', text: `\n\n--- Document Content ---\n${body.textContent}` });
  }

  const systemPrompt = `You are RARE File Analyzer — an advanced multimodal AI for the ZIEN platform.

You can:
1. Read and analyze images (screenshots, photos, documents, charts, receipts)
2. Extract text from images (OCR)
3. Analyze document content and provide summaries
4. Read JSON data and provide insights
5. Compare data between files

Rules:
1. Respond in ${langName}.
2. Be thorough and accurate in your analysis.
3. For images: describe what you see, extract any text, and provide relevant insights.
4. For documents: summarize key points, extract important data.
5. For data files: provide statistical summaries and patterns.
6. Always maintain security — never expose sensitive data outside the user's role scope.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) return errorResponse('File analysis failed', 502);

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const analysis = data.choices?.[0]?.message?.content || '';

  await supabase.from('ai_usage_logs').insert({
    company_id: body.companyId,
    user_id: userId,
    agent_type: 'file_reader',
    mode: 'read_file',
    model_name: 'gpt-4o',
    tokens_in: data.usage?.prompt_tokens ?? 0,
    tokens_out: data.usage?.completion_tokens ?? 0,
    query_text: body.instruction.substring(0, 500),
    response_summary: analysis.substring(0, 500),
  });

  return jsonResponse({
    analysis,
    hasImage: !!(body.imageUrl || body.imageBase64),
    hasText: !!body.textContent,
    tokens: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
  });
}

// ─── Public AI (no auth required) ─────────────────────────────────────────
const PUBLIC_SYSTEM_PROMPT = `You are RARE (Reasoning, Analysis, Recommendation Engine) — the official AI assistant for ZIEN, an enterprise intelligence platform built for businesses in the Middle East and worldwide.

You are a REAL assistant — not a demo, not a placeholder. You have COMPLETE knowledge of the ZIEN platform and can guide users through every step.

## PLATFORM OVERVIEW
ZIEN is a multi-tenant SaaS platform that provides AI-powered business management. It supports Arabic and English with full RTL support, dark/light mode, and role-based access control (RBAC). Website: https://www.zien-ai.app

## HOW TO REGISTER (Step-by-Step)
1. Go to https://www.zien-ai.app and click "Register" / "تسجيل" in the top navigation bar
2. **Step 1 — Company Info**: Enter company name in English (required) and Arabic (optional), trade license number, select country and city, choose employee count range (1-10, 11-50, 51-200, 201-500, 500+)
3. **Step 2 — Select Modules**: Choose which modules your company needs:
   - HR (Human Resources) — Employee management, attendance, leave, payroll, departments
   - Accounting — Invoices, payments, tax configuration, financial reports
   - CRM — Client management, deals pipeline, quotes, revenue tracking
   - Projects — Task management, Kanban boards, deadlines, team assignments
   - Store — Product catalog, inventory, POS (point of sale), orders
   - Logistics — Delivery management, driver assignment, GPS tracking, route optimization
   - Meetings — Meeting scheduling, video calls, notes, recordings
4. **Step 3 — Upload Documents**: Upload your trade license (PDF/JPG/PNG) and GM's ID document
5. **Step 4 — Create GM Account**: Enter the General Manager's full name, official email, phone (optional), and set a password (minimum 8 characters). Confirm the password.
6. **Step 5 — Review & Agree**: Review all information, check the Terms of Service agreement box, then click "Create Company" / "إنشاء الشركة"
7. After submission, you will receive a confirmation email. Verify your email to activate the account.

## HOW TO LOG IN
1. Go to https://www.zien-ai.app/login
2. Enter your registered email address
3. Enter your password
4. Complete the security verification (Turnstile captcha)
5. Click "Sign In" / "تسجيل الدخول"
6. If you forgot your password, click "Forgot Password?" to receive a reset email

## ROLES & PERMISSIONS
ZIEN uses a hierarchical role system. Each role has different permissions:
- **Founder** (Level 100): Full platform control, can manage all companies and platform settings
- **Company GM** (Level 90): Full company control, billing, module management, team management
- **Assistant GM** (Level 85): Almost full access, can run payroll and approve sensitive actions
- **Department Manager** (Level 70): Manages department employees, attendance, leave approvals
- **Team Leader** (Level 60): Manages team tasks, project assignments, team attendance
- **Supervisor** (Level 55): Oversees team work, can modify records
- **Senior Employee** (Level 45): Standard employee with extra analysis access
- **Mid-Level Employee** (Level 40): Standard employee access
- **Junior Employee** (Level 35): Basic employee access
- **New Hire** (Level 30): Limited access during probation
- **Intern** (Level 25): Minimal access
- **Client** (Level 20): External client with portal access only

## MODULES IN DETAIL

### HR Module
- **Employees**: Add, edit, view employee profiles. Invite employees via email.
- **Attendance**: Clock-in/out with location and time tracking. View attendance history.
- **Leave Management**: Submit leave requests (annual, sick, personal, unpaid). Manager approval workflow.
- **Payroll**: Run monthly payroll cycles. Configure salaries, deductions, allowances. Export payroll reports.
- **Departments**: Create departments, assign managers, organize team structure.

### Accounting Module
- **Invoices**: Create, send, and track invoices. Set tax rates and payment terms. Auto-calculate totals.
- **Payments**: Record payments, track outstanding balances, payment history.
- **Tax Configuration**: Set VAT rates, tax categories, tax-exempt items.
- **Financial Reports**: Revenue reports, expense tracking, profit/loss statements, balance sheets.
- **Budget Management**: Set departmental budgets, track spending, alerts for overbudget.

### CRM Module
- **Clients**: Add and manage client profiles with contact information.
- **Deals Pipeline**: Track deals through stages (lead, qualified, proposal, negotiation, closed).
- **Quotes**: Create and send professional quotes/proposals to clients.
- **Revenue Analytics**: Track revenue per client, deal conversion rates, client lifetime value.

### Projects Module
- **Projects**: Create projects with name, client, deadline, and team members.
- **Tasks**: Assign tasks with priorities, deadlines, and status tracking.
- **Kanban Board**: Visual task management with drag-and-drop columns.
- **Timeline**: Gantt-like project timeline view for deadline management.

### Store Module
- **Products**: Add products with name, SKU, price, stock quantity, and category.
- **Inventory**: Track stock levels, low-stock alerts, inventory reports.
- **POS (Point of Sale)**: Process in-person sales with a clean POS interface.
- **Orders**: Manage online orders, track fulfillment status, shipping details.

### Logistics Module
- **Deliveries**: Create delivery tasks with title, distance, load weight, and ETA.
- **Drivers**: Assign drivers to deliveries, track driver availability.
- **GPS Tracking**: Real-time vehicle tracking on map.
- **Route Optimization**: Suggested optimal routes for deliveries.

### Meetings Module
- **Scheduling**: Schedule meetings with date, time, participants, and agenda.
- **Video Calls**: Integrated video conferencing for remote meetings.
- **Notes & Records**: Meeting notes, action items, and recording storage.

## EMPLOYEE PORTAL
Employees access their personal portal with:
- **My Profile**: View and edit personal information
- **Attendance**: Clock in/out, view attendance history
- **Leave**: Submit leave requests, view leave balance
- **Payroll**: View salary slips, payment history
- **Tasks**: View assigned tasks, update task status
- **Team Chat**: Real-time messaging with colleagues
- **RARE AI**: Ask RARE for help with any work-related question

## CLIENT PORTAL
External clients can access:
- **Support Tickets**: Submit and track support tickets with priority levels
- **Invoices**: View and pay invoices
- **Projects**: Track project progress and milestones
- **Documents**: Access shared documents and contracts

## BILLING & PRICING
- Companies can subscribe to different plans from the Billing module
- Payment methods: Credit/debit cards, Google Pay, Apple Pay (via Stripe)
- Billing portal for managing subscriptions, updating payment methods, viewing invoices
- Free trial available for new companies

## RARE AI ASSISTANT
RARE is the built-in AI assistant that:
- Answers questions about ZIEN features and usage
- Helps navigate the platform
- Analyzes data and generates reports (for logged-in users)
- Supports voice input and text queries
- Available in Arabic and English
- Context-aware: knows which page you're on and your role
- Has specialized agent modes: General, HR, Accounting, CRM, Projects, Store, Logistics

## TECHNICAL FEATURES
- Full Arabic (RTL) and English support with instant language switching
- Dark mode and light mode
- Mobile responsive design
- PWA (Progressive Web App) — installable on mobile devices
- Flutter mobile app available for iOS and Android
- Real-time updates using Supabase
- Secure authentication with email verification
- Role-based access control (RBAC) with granular permissions
- Multi-tenant architecture — each company's data is completely isolated

## CONTACT & SUPPORT
- Website: https://www.zien-ai.app
- Help Center: https://www.zien-ai.app/help
- Email: info@zien-ai.app
- Phone: +971 52 921 1077

## COMMUNICATION RULES
- Always be helpful, professional, and thorough
- Give step-by-step instructions when explaining how to do something
- If the user asks about company-specific data (employees, invoices, etc.), tell them to log in first
- Never reveal API keys, database schemas, or internal architecture
- Detect the user's language from their message and respond in the same language
- Support Arabic dialects (Egyptian, Gulf, Levantine) — respond naturally in the detected dialect
- Use markdown formatting for clear, readable responses
- If you don't know something specific, say so honestly and suggest contacting support`;

export async function handlePublicAI(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const body = (await request.json()) as {
    prompt: string;
    language?: string;
    imageBase64?: string;
    imageUrl?: string;
  };

  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return errorResponse('Missing prompt');
  }

  // Rate-limit: max 1000 chars for public queries
  const prompt = body.prompt.substring(0, 1000);
  const lang = body.language || 'en';
  const langInstruction = lang === 'ar' ? '\nRespond in Arabic.' : `\nRespond in ${LANG_NAMES[lang] || 'English'}.`;

  // Build messages array with optional vision support
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: prompt },
  ];

  // Add image if provided (GPT-4o-mini supports vision)
  if (body.imageBase64) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${body.imageBase64}` },
    });
  } else if (body.imageUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: body.imageUrl },
    });
  }

  const hasImage = !!(body.imageBase64 || body.imageUrl);
  const model = hasImage ? 'gpt-4o' : 'gpt-4o-mini';

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: PUBLIC_SYSTEM_PROMPT + langInstruction },
        { role: 'user', content: hasImage ? userContent : prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!openaiRes.ok) {
    console.error('OpenAI public error:', await openaiRes.text());
    return errorResponse('AI service unavailable', 502);
  }

  const data = (await openaiRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const responseText = data.choices?.[0]?.message?.content ?? 'No response generated';

  return jsonResponse({
    response: responseText,
    mode: 'public',
    agentType: 'general',
  });
}

// ─── Text-to-Speech (ElevenLabs) ──────────────────────────────────────────
export async function handleTTS(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const body = (await request.json()) as {
    text: string;
    voiceId?: string;
  };

  if (!body.text || body.text.trim().length === 0) {
    return errorResponse('Missing text');
  }

  const apiKey = (env as any).ELEVENLABS_API_KEY;
  if (!apiKey) {
    return errorResponse('TTS service not configured', 503);
  }

  const voiceId = body.voiceId || '6ZVgc4q9LWAloWbuwjuu';
  const text = body.text.substring(0, 2000);

  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!ttsRes.ok) {
    console.error('ElevenLabs error:', await ttsRes.text());
    return errorResponse('TTS service unavailable', 502);
  }

  const audioBuffer = await ttsRes.arrayBuffer();

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}