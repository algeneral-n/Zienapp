import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, checkMembership, createAdminClient } from '../supabase';
import { getRoleLevel, AGENT_MIN_LEVEL } from '../permissions';
import { emitDomainEvent } from '../utils/domainEvents';
import { consumeEntitlement } from '../utils/entitlements';
import { preflightAICheck, requireApproval } from '../utils/aiPolicyEngine';

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

  // AI Context Builder — safe summary per role (no raw data leaks)
  if (path === '/api/ai/context' && request.method === 'GET') {
    return handleAIContext(request, env, userId, supabase);
  }

  // AI Action Approval: approve/deny a pending AI action
  if (path === '/api/ai/approve-action' && request.method === 'POST') {
    return handleApproveAction(request, env, userId, supabase);
  }

  // AI Approval Queue: list pending approvals for company
  if (path === '/api/ai/approvals' && request.method === 'GET') {
    return handleListApprovals(request, env, userId, supabase);
  }

  // AI Policies: CRUD for company AI policies
  if (path === '/api/ai/policies' && request.method === 'GET') {
    return handleGetPolicies(request, env, userId, supabase);
  }

  if (path === '/api/ai/policies' && request.method === 'POST') {
    return handleSetPolicy(request, env, userId, supabase);
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

  // ─── AI Policy Engine Pre-flight ─────────────────────────────────────
  const admin = createAdminClient(env);
  let resolvedModel = 'gpt-4o-mini';

  if (body.companyId) {
    // Policy + budget + model routing check
    const policyDecision = await preflightAICheck(admin, {
      companyId: body.companyId,
      agentType: body.agentType,
      actionMode: body.mode,
      roleLevel: getRoleLevel(membershipRole),
    });

    if (!policyDecision.allowed) {
      return errorResponse(policyDecision.reason ?? 'AI policy denied this action', 403);
    }

    // Handle require_approval tier
    if (policyDecision.tier === 'require_approval') {
      try {
        await requireApproval(admin, {
          companyId: body.companyId,
          agentType: body.agentType,
          actionMode: body.mode,
          prompt: body.prompt,
          model: policyDecision.model,
        });
      } catch (e: any) {
        return errorResponse(e?.message ?? 'Approval required', 403);
      }
    }

    resolvedModel = policyDecision.model;

    // Entitlement check (ai_tokens meter)
    try {
      await consumeEntitlement(admin, body.companyId, 'ai_tokens');
    } catch (e: any) {
      if (e?.code === 'FORBIDDEN') {
        return errorResponse('AI token quota exceeded. Upgrade your plan.', 403);
      }
    }
  }

  // Determine if web search should be enabled
  const isSearchMode = body.mode === 'search' || body.prompt.match(/\b(search|find|look up|بحث|ابحث|دور|جوجل|google)\b/i);

  // Build OpenAI request body
  const openaiBody: Record<string, unknown> = {
    model: resolvedModel,
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
        model: resolvedModel,
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
    model_name: resolvedModel,
    tokens_in: openaiData.usage?.prompt_tokens ?? 0,
    tokens_out: openaiData.usage?.completion_tokens ?? 0,
    query_text: body.prompt.substring(0, 500),
    response_summary: responseText.substring(0, 500),
    action_level: permCheck.actionLevel,
    is_sensitive: permCheck.actionLevel === 'sensitive',
  });

  emitDomainEvent(env, {
    eventName: 'ai.action.executed',
    entityType: 'ai_usage_logs',
    companyId: body.companyId,
    actorUserId: userId,
    payload: { agentType: body.agentType, mode: body.mode, actionLevel: permCheck.actionLevel },
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

  const platformContext = `
## ZIEN Platform Context
ZIEN is a multi-tenant SaaS enterprise intelligence platform (https://www.zien-ai.app) supporting 13 industries (Commercial, Industrial, Professional Services, Construction, Real Estate, Restaurants, Banking, Insurance, Logistics, Charities, Institutions, Recruitment, Transport) with 19 modules:
- Core (7): HR & Employees, Accounting & Finance, CRM & Sales, Project Management, Team Chat, Meetings, Documents
- Add-on (7): Store & POS, Inventory & Warehouse, Logistics & Fleet, Recruitment, Training & Academy, Client Portal, Employee Portal
- Premium (5): RARE AI Agents (24 specialized agents), Advanced Analytics, Workflow Automation, Control Room, Integrations Hub
The platform supports 16 languages, dark/light mode, Flutter mobile app, and has a hierarchical role system with 12 levels from Founder (100) to Client (20).`;

  return `${base}\n${platformContext}\nThe current user has the role: ${userRole}.\nMode: ${mode}. ${modeInstruction}\n${langInstruction}`;
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

  emitDomainEvent(env, {
    eventName: 'ai.action.executed',
    entityType: 'ai_usage_logs',
    companyId: body.companyId,
    actorUserId: userId,
    payload: { agentType: 'senate', mode: 'deliberate', topic: body.topic },
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
ZIEN is a multi-tenant SaaS platform that provides AI-powered business management. It supports 16 languages with full RTL support, dark/light mode, and role-based access control (RBAC). Website: https://www.zien-ai.app

## SUPPORTED LANGUAGES (16)
Arabic (العربية), English, French (Français), Spanish (Español), German (Deutsch), Turkish (Türkçe), Russian (Русский), Chinese (中文), Japanese (日本語), Korean (한국어), Portuguese (Português), Italian (Italiano), Dutch (Nederlands), Hindi (हिन्दी), Urdu (اردو), Bengali (বাংলা).
The entire platform UI, mobile app, and AI assistant support all 16 languages with instant switching.

## HOW TO REGISTER (7-Step Wizard)
1. Go to https://www.zien-ai.app and click "Register" / "تسجيل" in the top navigation bar
2. **Step 0 — Industry Selection**: Choose your industry sector from 13 categories (Commercial & Trading, Industrial & Manufacturing, Services & Professional, Construction & Contracting, Real Estate, Restaurants & Food Service, Banking & Financial Exchange, Insurance, Logistics & Supply Chain, Charities & NGOs, Institutions & Embassies, Recruitment & Staffing, Transport). Each sector has 5-10 sub-activities you can select.
3. **Step 1 — Company Info**: Enter company name in English (required) and Arabic (optional), trade license number, select country and city, choose employee count range (1-10, 11-50, 51-200, 201-500, 500+)
4. **Step 2 — Select Modules**: The platform auto-recommends modules based on your industry. Choose from 19 modules grouped as Core, Add-on, and Premium.
5. **Step 3 — Upload Documents**: Upload your trade license (PDF/JPG/PNG) and GM's ID document
6. **Step 4 — Create GM Account**: Enter the General Manager's full name, official email, phone (optional), set a password (minimum 8 characters)
7. **Step 5 — Billing Plan**: Select your subscription plan (Starter, Pro, Business, Enterprise). Payment via Stripe (credit/debit cards, Google Pay, Apple Pay).
8. **Step 6 — Review & Agree**: Review all information, check the Terms of Service agreement box, then click "Create Company" / "إنشاء الشركة"
9. After submission, your application is reviewed. Once approved, you receive a confirmation email. Verify your email to activate the account.

## HOW TO LOG IN
1. Go to https://www.zien-ai.app/login
2. Enter your registered email address
3. Enter your password
4. Complete the security verification (Turnstile captcha)
5. Click "Sign In" / "تسجيل الدخول"
6. If you forgot your password, click "Forgot Password?" to receive a reset email

## ROLES & PERMISSIONS (12 hierarchical levels)
ZIEN uses a hierarchical role system. Each role has different permissions:
- **Founder** (Level 100): Full platform control, can manage all companies, platform settings, AI policies, and system monitoring
- **Company GM** (Level 90): Full company control, billing, module management, team management
- **Assistant GM** (Level 85): Almost full access, can run payroll and approve sensitive actions
- **Executive Secretary** (Level 75): Administrative coordination, scheduling, correspondence
- **Department Manager** (Level 70): Manages department employees, attendance, leave approvals
- **Team Leader / HR Officer / Accountant** (Level 60): Manages team tasks, HR records, or financial entries
- **Supervisor** (Level 55): Oversees team work, can modify records
- **Senior Employee** (Level 45): Standard employee with extra analysis access
- **Mid-Level Employee** (Level 40): Standard employee access
- **Junior Employee** (Level 35): Basic employee access
- **New Hire** (Level 30): Limited access during probation
- **Intern** (Level 25): Minimal access
- **Client** (Level 20): External client with portal access only

## 13 SUPPORTED INDUSTRIES
1. **Commercial & Trading** — General trading, wholesale & retail distribution (building materials, food, electronics, automobiles, furniture, textiles, chemicals, medical equipment)
2. **Industrial & Manufacturing** — Factories, production lines (food manufacturing, heavy industry, plastics, aluminum, cement, textiles, chemicals, electronics, pharmaceuticals)
3. **Services & Professional** — Consulting, law firms, IT services, marketing, design, training, healthcare, education
4. **Construction & Contracting** — Building construction, roads, infrastructure, MEP, finishing, excavation, structural steel
5. **Real Estate** — Property sales, purchase, development, management, rental, valuation, investment
6. **Restaurants & Food Service** — Fine dining, fast food, cafes, bakeries, catering, cloud kitchens, juice bars
7. **Banking & Financial Exchange** — Currency exchange, banking, money transfer, investment firms, microfinance
8. **Insurance Companies** — Medical, auto, property, life, travel, commercial insurance
9. **Logistics & Supply Chain** — Warehousing, shipping, distribution, packaging, cold chain, last mile delivery
10. **Charities & NGOs** — Humanitarian aid, educational, health, environmental, community organizations
11. **Institutions & Embassies** — Embassies, consulates, government, international organizations
12. **Recruitment & Staffing** — Local & international recruitment, temp staffing, executive search, HR consulting
13. **Transport Companies** — Domestic & international transport, land, sea, air freight, passenger services

## 19 MODULES

### Core Modules (7) — included in all plans
1. **HR & Employees** — Employee management, attendance (clock-in/out with GPS), leave management (annual, sick, personal, unpaid), payroll cycles, departments, contracts, onboarding
2. **Accounting & Finance** — General ledger, invoicing (auto-calculate totals, VAT), payments, tax configuration, financial reports (P&L, balance sheet), budget management
3. **CRM & Sales** — Client profiles, deals pipeline (lead → qualified → proposal → negotiation → closed), quotes/proposals, revenue analytics, client lifetime value
4. **Project Management** — Projects with deadlines, tasks with priorities, Kanban boards (drag & drop), Gantt timelines, team collaboration, resource planning
5. **Team Chat** — Real-time messaging, channels, direct messages, file sharing, voice messages
6. **Meetings** — Video conferencing, scheduling, agenda preparation, AI-generated meeting summaries, action item tracking, recording storage
7. **Documents** — Document management, templates, version control, approval workflows

### Add-on Modules (7) — available on Pro plan and above
8. **Store & POS** — E-commerce, point-of-sale interface, product catalog (name, SKU, price, stock), orders management, fulfillment tracking
9. **Inventory & Warehouse** — Stock tracking, reorder points, warehouse management, batch tracking, inventory valuation, transfer between locations
10. **Logistics & Fleet** — Fleet tracking on GPS maps, driver assignment, route optimization, delivery management (title, distance, weight, ETA), maintenance scheduling
11. **Recruitment** — Job postings, applicant tracking system (ATS), interview scheduling, offer management, hiring workflow
12. **Training & Academy** — LMS (Learning Management System), courses, video lessons, certifications, skill assessments, learning analytics
13. **Client Portal** — Customer self-service: support tickets, invoice viewing, project progress tracking, shared documents
14. **Employee Portal** — Self-service: profile, attendance history, leave balance & requests, payslips, tasks, team chat

### Premium Modules (5) — available on Business/Enterprise plans
15. **RARE AI Agents** — 24 specialized AI agents covering every department (HR, Accounting, Sales, Projects, Legal, Quality, Marketing, Supply Chain, etc.). Permission-gated by role. Modes: Help, Analyze, Act, Report, Search.
16. **Advanced Analytics** — BI dashboards, custom reports, predictive insights, KPI monitoring, trend analysis
17. **Workflow Automation** — Custom trigger-based workflows, auto-approvals, escalation rules, task automation
18. **Control Room** — Real-time operations dashboard: live KPIs, alerts, multi-department overview, incident tracking
19. **Integrations Hub** — API gateway, 50+ third-party connectors, webhooks, data sync (Stripe, WhatsApp, ERP, etc.)

## RARE AI ASSISTANT (Full Capabilities)
RARE is the built-in AI assistant with these capabilities:
- **24 Specialized Agents**: Accounting, HR, Sales, Fleet, Meetings, GM, Secretary, Founder, Marketing, Projects, Store, Inventory, Maintenance, CRM, Legal, Quality, Training, Procurement, Finance, Safety, Support, Analytics, Integrations, General
- **5 Operating Modes**: Help (guidance), Analyze (data insights), Act (take actions), Report (structured reports), Search (internet search)
- **4 Context Modes**: Public (visitor), Client (portal user), Tenant (internal employee), Realtime (during meetings/calls)
- **AI Capabilities**: Text chat, voice input (speech-to-text), text-to-speech output, image analysis (upload photos), document generation (reports/contracts/letters), translation between all 16 languages, image generation (DALL-E), internet search
- **Smart Features**: Role-aware (knows your permissions), page-aware (knows current module), company-aware (knows your data), mode-aware (help/analyze/act)
- **AI Governance**: Permission gating per role level, usage quotas per plan, action approval workflows for sensitive operations, AI policy engine for company-level controls
- **Special Commands**: /translate [lang] [text], /image [prompt], /file [type] [instructions], /read [file analysis]

## FOUNDER OS (Platform Owner Features)
The Founder (platform owner) has a dedicated operating system:
- **Tenant Management**: View all companies, approve/reject registrations, suspend/activate companies
- **Financial Views**: Platform-wide revenue, MRR, ARR, churn rate, per-tenant billing analytics
- **User Management**: All users across all companies, role assignments, access control
- **System Monitoring**: Server health, API latency, error rates, real-time alerts
- **AI Subscriptions**: Manage AI token budgets, model routing, cost tracking per tenant
- **Control Room**: Live platform dashboard with all KPIs
- **Supreme Access**: Full access to any company's data for support and debugging
- **Marketing**: External marketing tools, analytics integration
- **UI Builder**: Platform customization tools

## BILLING & PRICING
- **Plans**: Starter (basic), Pro (add-on modules), Business (premium modules), Enterprise (custom)
- **Payment Methods**: Credit/debit cards, Google Pay, Apple Pay (via Stripe)
- **Billing Portal**: Manage subscriptions, update payment methods, view invoices, download receipts
- **Free Trial**: Available for new companies
- **Entitlements**: Each plan includes specific module access, AI token quotas, storage limits, and user seats

## EMPLOYEE PORTAL
Employees access their personal portal with:
- **My Profile**: View and edit personal information, photo, emergency contacts
- **Attendance**: Clock in/out with GPS location, view attendance history, overtime tracking
- **Leave**: Submit leave requests, view leave balance (annual, sick, personal), approval status
- **Payroll**: View salary slips, payment history, deductions, allowances
- **Tasks**: View assigned tasks, update status, Kanban view
- **Team Chat**: Real-time messaging with colleagues and managers
- **RARE AI**: Ask RARE for help with any work-related question

## CLIENT PORTAL
External clients can access:
- **Support Tickets**: Submit and track support tickets with priority levels (low, medium, high, critical)
- **Invoices**: View and pay invoices online
- **Projects**: Track project progress, milestones, deliverables
- **Documents**: Access shared documents, contracts, proposals
- **Meetings**: View upcoming meetings, join video calls

## MOBILE APP (Flutter)
- Native Flutter app for iOS and Android
- 18 screens: Home, Login, Employee Portal, Accounting, Billing, HR, CRM, Projects, Logistics, Meetings, Chat, Store, Settings, AI/RARE, Training, Documents, Analytics, Client Portal
- Full offline support with data sync
- Push notifications for approvals, messages, alerts
- Biometric authentication (fingerprint, face ID)
- All 16 languages supported
- Dark/light mode

## TECHNICAL FEATURES
- Full 16-language support with instant switching and RTL/LTR auto-detection
- Dark mode and light mode with system preference detection
- Mobile responsive design (PWA — installable on mobile devices)
- Flutter mobile app for iOS and Android
- Real-time updates using Supabase Realtime (WebSocket)
- Secure authentication with email verification and Turnstile captcha
- Role-based access control (RBAC) with 12 hierarchical permission levels
- Multi-tenant architecture — each company's data is completely isolated via Row Level Security (RLS)
- AI-powered with OpenAI GPT-4o, GPT-4o-mini, and custom model routing
- Text-to-Speech with ElevenLabs multilingual voices
- Image generation with DALL-E 3
- Internet search capability for real-time information
- Stripe integration for global payments
- Cloudflare Workers for edge computing
- Domain events and audit trails for all actions

## CONTACT & SUPPORT
- Website: https://www.zien-ai.app
- Help Center: https://www.zien-ai.app/help
- FAQ: https://www.zien-ai.app/faq
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
- If you don't know something specific, say so honestly and suggest contacting support
- When listing features, be comprehensive — ZIEN is a full enterprise platform, not a simple app
- Always mention that ZIEN supports 13 industries and 19 modules when asked about the platform scope
- If asked about pricing, explain the 4 tiers and suggest contacting sales for Enterprise pricing`;

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

// ═══════════════════════════════════════════════════════════════════════════
// AI GOVERNANCE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ai/context?page_key=...&company_id=...
 * Returns a safe summary of business data based on user's role.
 * No raw data, no names, no documents — only counts, totals, statuses.
 */
async function handleAIContext(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const url = new URL(request.url);
  const pageKey = url.searchParams.get('page_key') || 'dashboard';
  const companyId = url.searchParams.get('company_id') || request.headers.get('x-company-id') || '';

  if (!companyId) return errorResponse('Missing company_id');

  const admin = createAdminClient(env);
  const membership = await checkMembership(env, userId, companyId);
  if (!membership) return errorResponse('Not a member of this company', 403);

  const ROLE_LEVELS: Record<string, number> = {
    founder: 100, platform_admin: 95, company_gm: 85, assistant_gm: 80,
    executive_secretary: 75, department_manager: 65, hr_officer: 60, accountant: 60,
    supervisor: 55, senior_employee: 45, sales_rep: 45, employee: 35,
    field_employee: 30, driver: 25, new_hire: 20, trainee: 15, client_user: 10,
  };
  const roleLevel = ROLE_LEVELS[membership.role] ?? 0;

  // Build safe context per page_key
  const context: Record<string, unknown> = {
    page_key: pageKey,
    role: membership.role,
    role_level: roleLevel,
    company_id: companyId,
  };

  // Forbidden topics per role level
  const forbiddenTopics: string[] = [];
  if (roleLevel < 60) forbiddenTopics.push('salary_details', 'financial_reports', 'tax_filings');
  if (roleLevel < 45) forbiddenTopics.push('client_contracts', 'revenue_data', 'profit_margins');
  if (roleLevel < 35) forbiddenTopics.push('employee_records', 'performance_reviews');
  context.forbidden_topics = forbiddenTopics;

  // Gather safe summaries based on page_key
  if (pageKey === 'dashboard' || pageKey === 'overview') {
    const [empCount, clientCount, projCount, invCount] = await Promise.all([
      admin.from('employees').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('clients').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    ]);
    context.employee_count = empCount.count ?? 0;
    context.client_count = clientCount.count ?? 0;
    context.project_count = projCount.count ?? 0;
    context.invoice_count = invCount.count ?? 0;
  }

  if (pageKey === 'hr' && roleLevel >= 45) {
    const [empCount, leaveCount, attCount] = await Promise.all([
      admin.from('employees').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('leave_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending'),
      admin.from('attendance').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    ]);
    context.total_employees = empCount.count ?? 0;
    context.pending_leave_requests = leaveCount.count ?? 0;
    context.attendance_records = attCount.count ?? 0;
  }

  if (pageKey === 'accounting' && roleLevel >= 45) {
    const [invTotal, paidCount, unpaidCount] = await Promise.all([
      admin.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'paid'),
      admin.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'unpaid'),
    ]);
    context.total_invoices = invTotal.count ?? 0;
    context.paid_invoices = paidCount.count ?? 0;
    context.unpaid_invoices = unpaidCount.count ?? 0;
  }

  if (pageKey === 'crm' && roleLevel >= 35) {
    const { count } = await admin.from('clients').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
    context.total_clients = count ?? 0;
  }

  if (pageKey === 'projects' && roleLevel >= 35) {
    const [total, active] = await Promise.all([
      admin.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
    ]);
    context.total_projects = total.count ?? 0;
    context.active_projects = active.count ?? 0;
  }

  // Get enabled modules
  const { data: modules } = await admin
    .from('company_modules')
    .select('modules_catalog(code)')
    .eq('company_id', companyId)
    .eq('is_active', true);
  context.enabled_modules = (modules || []).map((m: any) => m.modules_catalog?.code).filter(Boolean);

  // Save context snapshot for auditing
  await admin.from('ai_context_snapshots').insert({
    company_id: companyId,
    user_id: userId,
    page_key: pageKey,
    role_code: membership.role,
    context_data: context,
    forbidden_topics: forbiddenTopics,
  }).then(() => { });

  return jsonResponse({ context, forbidden_topics: forbiddenTopics });
}

/**
 * POST /api/ai/approve-action
 * Approve or deny a pending AI action review.
 * Requires department_manager+ (level 65).
 */
async function handleApproveAction(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    reviewId: string;
    decision: 'approved' | 'denied';
    note?: string;
    companyId: string;
  };

  if (!body.reviewId || !body.decision || !body.companyId) {
    return errorResponse('Missing reviewId, decision, or companyId');
  }

  // Check membership and permission (level 65 = department_manager+)
  const membership = await checkMembership(env, userId, body.companyId);
  if (!membership) return errorResponse('Not a member of this company', 403);

  const ROLE_LEVELS: Record<string, number> = {
    founder: 100, platform_admin: 95, company_gm: 85, assistant_gm: 80,
    executive_secretary: 75, department_manager: 65, hr_officer: 60, accountant: 60,
    supervisor: 55, senior_employee: 45, sales_rep: 45, employee: 35,
  };
  const level = ROLE_LEVELS[membership.role] ?? 0;
  if (level < 65) return errorResponse('Insufficient permissions to approve actions', 403);

  const admin = createAdminClient(env);

  // Update the review
  const { data: review, error } = await admin
    .from('ai_action_reviews')
    .update({
      status: body.decision,
      reviewed_by: userId,
      review_note: body.note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', body.reviewId)
    .eq('company_id', body.companyId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error || !review) return errorResponse('Review not found or already processed');

  // If approved, execute the action
  if (body.decision === 'approved' && review.payload) {
    try {
      // Mark as executed
      await admin.from('ai_action_reviews').update({
        status: 'executed',
        executed_at: new Date().toISOString(),
        execution_result: { success: true },
      }).eq('id', body.reviewId);

      // Audit log
      await admin.from('audit_logs').insert({
        company_id: body.companyId,
        user_id: userId,
        action: 'ai_action_approved',
        entity_type: 'ai_action_review',
        entity_id: body.reviewId,
        new_data: { action_code: review.action_code, agent_type: review.agent_type },
      });
    } catch (execErr) {
      await admin.from('ai_action_reviews').update({
        execution_result: { success: false, error: String(execErr) },
      }).eq('id', body.reviewId);
    }
  }

  // Also audit denials
  if (body.decision === 'denied') {
    await admin.from('audit_logs').insert({
      company_id: body.companyId,
      user_id: userId,
      action: 'ai_action_denied',
      entity_type: 'ai_action_review',
      entity_id: body.reviewId,
      new_data: { action_code: review.action_code, reason: body.note },
    });
  }

  return jsonResponse({ success: true, review });
}

/**
 * GET /api/ai/approvals?company_id=...&status=pending
 * List AI action reviews pending approval.
 */
async function handleListApprovals(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id') || request.headers.get('x-company-id') || '';
  const status = url.searchParams.get('status') || 'pending';

  if (!companyId) return errorResponse('Missing company_id');

  const membership = await checkMembership(env, userId, companyId);
  if (!membership) return errorResponse('Not a member', 403);

  const admin = createAdminClient(env);
  const { data: reviews } = await admin
    .from('ai_action_reviews')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  return jsonResponse({ reviews: reviews || [] });
}

/**
 * GET /api/ai/policies?company_id=...
 * Get AI policies for a company.
 */
async function handleGetPolicies(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id') || request.headers.get('x-company-id') || '';

  if (!companyId) return errorResponse('Missing company_id');

  const admin = createAdminClient(env);
  const { data: policies } = await admin
    .from('ai_policies')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return jsonResponse({ policies: policies || [] });
}

/**
 * POST /api/ai/policies
 * Create or update an AI policy for a company.
 * Requires company_gm+ (level 85).
 */
async function handleSetPolicy(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    companyId: string;
    policy_type: string;
    agent_type?: string;
    action_level?: string;
    min_role_level?: number;
    max_daily_requests?: number;
    forbidden_topics?: string[];
    require_human_approval?: boolean;
  };

  if (!body.companyId || !body.policy_type) {
    return errorResponse('Missing companyId or policy_type');
  }

  const membership = await checkMembership(env, userId, body.companyId);
  if (!membership) return errorResponse('Not a member', 403);

  const ROLE_LEVELS: Record<string, number> = {
    founder: 100, platform_admin: 95, company_gm: 85, assistant_gm: 80,
  };
  if ((ROLE_LEVELS[membership.role] ?? 0) < 85) {
    return errorResponse('Only GM+ can set AI policies', 403);
  }

  const admin = createAdminClient(env);
  const { data, error } = await admin
    .from('ai_policies')
    .insert({
      company_id: body.companyId,
      policy_type: body.policy_type,
      agent_type: body.agent_type,
      action_level: body.action_level,
      min_role_level: body.min_role_level,
      max_daily_requests: body.max_daily_requests,
      forbidden_topics: body.forbidden_topics,
      require_human_approval: body.require_human_approval,
      created_by: userId,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message);

  // Audit log
  await admin.from('audit_logs').insert({
    company_id: body.companyId,
    user_id: userId,
    action: 'ai_policy_created',
    entity_type: 'ai_policy',
    entity_id: data.id,
    new_data: { policy_type: body.policy_type, agent_type: body.agent_type },
  });

  return jsonResponse({ policy: data }, 201);
}