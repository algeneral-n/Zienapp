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
  };

  if (!body.prompt || !body.companyId) {
    return errorResponse('Missing prompt or companyId');
  }

  // Verify user is a member of the company (admin bypass RLS)
  const membership = await checkMembership(env, userId, body.companyId);

  if (!membership) {
    return errorResponse('Not a member of this company', 403);
  }

  // ─── Permission Gate ────────────────────────────────────────────────
  const permCheck = checkPermission(membership.role, body.agentType, body.mode);
  if (!permCheck.allowed) {
    // Log denied attempt
    await supabase.from('ai_usage_logs').insert({
      company_id: body.companyId,
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
  const systemPrompt = buildSystemPrompt(body.agentType, body.mode, membership.role);

  // Call OpenAI API
  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
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

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    console.error('OpenAI error:', errText);
    return errorResponse('AI service unavailable', 502);
  }

  const openaiData = (await openaiRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const responseText =
    openaiData.choices?.[0]?.message?.content ?? 'No response generated';

  // Log usage (with action classification)
  await supabase.from('ai_usage_logs').insert({
    company_id: body.companyId,
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

function buildSystemPrompt(agentType: string, mode: string, userRole: string): string {
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
  };

  const base = roleMap[agentType] ?? 'You are an AI assistant for the ZIEN platform.';
  const modeInstruction = modeMap[mode] ?? '';

  return `${base}\nThe current user has the role: ${userRole}.\nMode: ${mode}. ${modeInstruction}\nRespond in the same language the user writes in. Support Arabic and English.`;
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

Be thorough, data-driven, and consider multiple perspectives. Respond in the same language as the question.`;

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