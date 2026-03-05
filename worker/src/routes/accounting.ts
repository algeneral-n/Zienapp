/**
 * Accounting Routes — /api/accounting/*
 * Merged from archive: ChartOfAccounts, JournalEngine, LedgerEngine,
 * InvoiceEngine, TaxEngine, FinancialReportsEngine, CostCenterEngine,
 * AIFinancialEngine, ProjectEngine
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createUserClient } from '../supabase';
import { getRoleLevel } from '../permissions';

/** Verify company membership and return role. Read endpoints need level 40+, write need 65+. */
async function verifyAccountingAccess(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  userId: string,
  companyId: string,
  requireWriteLevel = false,
): Promise<{ error?: Response; role?: string; level?: number }> {
  if (!companyId) {
    return { error: errorResponse('X-Company-Id header is required') };
  }
  const { data: membership } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) {
    return { error: errorResponse('Not a member of this company', 403) };
  }

  const level = getRoleLevel(membership.role);
  if (requireWriteLevel && level < 65) {
    return { error: errorResponse('Insufficient permissions for accounting write operations. Requires accountant or higher.', 403) };
  }
  if (level < 40) {
    return { error: errorResponse('Insufficient permissions for accounting access', 403) };
  }
  return { role: membership.role, level };
}

export async function handleAccounting(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  // All accounting routes require authentication
  const { userId, supabase } = await requireAuth(request, env);

  // Extract company ID from header (required for all accounting operations)
  const companyId = request.headers.get('X-Company-Id') ?? '';

  // Determine if this is a write operation
  const isWrite = request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH' || request.method === 'DELETE';
  const access = await verifyAccountingAccess(supabase, userId, companyId, isWrite);
  if (access.error) return access.error;

  // ─── Chart of Accounts ───────────────────────────────────────────────
  if (path === '/api/accounting/chart-of-accounts' && request.method === 'GET') {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', companyId)
      .order('account_code', { ascending: true });

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ accounts: data });
  }

  if (path === '/api/accounting/chart-of-accounts' && request.method === 'POST') {
    const body = await request.json() as {
      account_code: string;
      name_en: string;
      name_ar: string;
      type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
      parent_code?: string;
      is_active?: boolean;
    };

    if (!body.account_code || !body.name_en || !body.type) {
      return errorResponse('account_code, name_en, and type are required');
    }

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_code: body.account_code,
        name_en: body.name_en,
        name_ar: body.name_ar || body.name_en,
        account_type: body.type,
        parent_code: body.parent_code || null,
        is_active: body.is_active !== false,
        created_by: userId,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ account: data }, 201);
  }

  // ─── Journal Entries ─────────────────────────────────────────────────
  if (path === '/api/accounting/journal' && request.method === 'GET') {
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    let query = supabase
      .from('journal_entries')
      .select('*, journal_lines(*)')
      .eq('company_id', companyId)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (from) query = query.gte('entry_date', from);
    if (to) query = query.lte('entry_date', to);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ entries: data });
  }

  if (path === '/api/accounting/journal' && request.method === 'POST') {
    const body = await request.json() as {
      entry_date: string;
      reference?: string;
      description: string;
      lines: { account_code: string; debit: number; credit: number; description?: string }[];
    };

    if (!body.lines || body.lines.length < 2) {
      return errorResponse('Journal entry requires at least 2 lines');
    }

    // Validate debit = credit (double-entry)
    const totalDebit = body.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = body.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return errorResponse(`Debits (${totalDebit}) must equal credits (${totalCredit})`);
    }

    // Insert journal entry
    const { data: entry, error: entryErr } = await supabase
      .from('journal_entries')
      .insert({
        company_id: companyId,
        entry_date: body.entry_date || new Date().toISOString().split('T')[0],
        reference: body.reference || null,
        description: body.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'posted',
        created_by: userId,
      })
      .select()
      .single();

    if (entryErr) return errorResponse(entryErr.message, 500);

    // Insert journal lines
    const lines = body.lines.map(l => ({
      journal_entry_id: entry.id,
      account_code: l.account_code,
      debit: l.debit || 0,
      credit: l.credit || 0,
      description: l.description || '',
    }));

    const { error: linesErr } = await supabase
      .from('journal_lines')
      .insert(lines);

    if (linesErr) return errorResponse(linesErr.message, 500);

    // Post to general ledger
    for (const line of lines) {
      await supabase.from('general_ledger').insert({
        account_code: line.account_code,
        journal_entry_id: entry.id,
        entry_date: entry.entry_date,
        debit: line.debit,
        credit: line.credit,
        balance: 0, // Will be recalculated
        description: line.description,
      });
    }

    return jsonResponse({ entry, lines }, 201);
  }

  // ─── General Ledger ──────────────────────────────────────────────────
  if (path.startsWith('/api/accounting/ledger/') && request.method === 'GET') {
    const accountCode = path.replace('/api/accounting/ledger/', '');
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let query = supabase
      .from('general_ledger')
      .select('*')
      .eq('company_id', companyId)
      .eq('account_code', accountCode)
      .order('entry_date', { ascending: true });

    if (from) query = query.gte('entry_date', from);
    if (to) query = query.lte('entry_date', to);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 500);

    // Calculate running balance
    let balance = 0;
    const entries = (data || []).map(entry => {
      balance += entry.debit - entry.credit;
      return { ...entry, running_balance: balance };
    });

    return jsonResponse({ account_code: accountCode, entries, closing_balance: balance });
  }

  // ─── Invoices ────────────────────────────────────────────────────────
  if (path === '/api/accounting/invoices' && request.method === 'GET') {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'sales' | 'purchase'
    const status = url.searchParams.get('status');

    let query = supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('company_id', companyId)
      .order('invoice_date', { ascending: false });

    if (type) query = query.eq('invoice_type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ invoices: data });
  }

  if (path === '/api/accounting/invoices' && request.method === 'POST') {
    const body = await request.json() as {
      invoice_type: 'sales' | 'purchase';
      customer_or_vendor: string;
      invoice_date: string;
      due_date: string;
      currency?: string;
      items: { description: string; quantity: number; unit_price: number; tax_rate?: number }[];
      notes?: string;
    };

    if (!body.items || body.items.length === 0) {
      return errorResponse('Invoice requires at least 1 item');
    }

    // Calculate totals with VAT
    let subtotal = 0;
    let totalTax = 0;
    const processedItems = body.items.map(item => {
      const amount = item.quantity * item.unit_price;
      const taxRate = item.tax_rate ?? 0.05; // Default 5% UAE VAT
      const taxAmount = amount * taxRate;
      subtotal += amount;
      totalTax += taxAmount;
      return {
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        line_total: amount + taxAmount,
      };
    });

    const total = subtotal + totalTax;

    // Create invoice
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        company_id: companyId,
        invoice_type: body.invoice_type,
        customer_or_vendor: body.customer_or_vendor,
        invoice_date: body.invoice_date,
        due_date: body.due_date,
        currency: body.currency || 'AED',
        subtotal,
        tax_total: totalTax,
        total,
        status: 'draft',
        notes: body.notes || '',
        created_by: userId,
      })
      .select()
      .single();

    if (invErr) return errorResponse(invErr.message, 500);

    // Insert invoice items
    const itemsData = processedItems.map(item => ({
      invoice_id: invoice.id,
      ...item,
    }));

    await supabase.from('invoice_items').insert(itemsData);

    return jsonResponse({ invoice: { ...invoice, items: itemsData } }, 201);
  }

  // ─── Tax Calculation ─────────────────────────────────────────────────
  if (path === '/api/accounting/tax/calculate' && request.method === 'POST') {
    const body = await request.json() as {
      amount: number;
      country?: string; // 'AE' | 'SA' | 'EG' etc.
      tax_type?: string;
    };

    const TAX_RATES: Record<string, number> = {
      AE: 0.05,  // UAE 5%
      SA: 0.15,  // Saudi Arabia 15%
      EG: 0.14,  // Egypt 14%
      BH: 0.10,  // Bahrain 10%
      OM: 0.05,  // Oman 5%
      QA: 0.00,  // Qatar 0%
      KW: 0.00,  // Kuwait 0%
    };

    const country = body.country || 'AE';
    const rate = TAX_RATES[country] ?? 0.05;
    const taxAmount = body.amount * rate;

    return jsonResponse({
      amount: body.amount,
      country,
      tax_rate: rate,
      tax_rate_percent: `${(rate * 100).toFixed(0)}%`,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total_with_tax: Math.round((body.amount + taxAmount) * 100) / 100,
    });
  }

  // ─── Financial Reports ───────────────────────────────────────────────
  if (path === '/api/accounting/reports/trial-balance' && request.method === 'GET') {
    const url = new URL(request.url);
    const asOf = url.searchParams.get('as_of') || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('general_ledger')
      .select('account_code, debit, credit')
      .eq('company_id', companyId)
      .lte('entry_date', asOf);

    if (error) return errorResponse(error.message, 500);

    // Aggregate by account
    const balances: Record<string, { debit: number; credit: number }> = {};
    for (const row of data || []) {
      if (!balances[row.account_code]) {
        balances[row.account_code] = { debit: 0, credit: 0 };
      }
      balances[row.account_code].debit += row.debit || 0;
      balances[row.account_code].credit += row.credit || 0;
    }

    const trialBalance = Object.entries(balances).map(([code, b]) => ({
      account_code: code,
      total_debit: Math.round(b.debit * 100) / 100,
      total_credit: Math.round(b.credit * 100) / 100,
      balance: Math.round((b.debit - b.credit) * 100) / 100,
    }));

    const totalDebit = trialBalance.reduce((s, r) => s + r.total_debit, 0);
    const totalCredit = trialBalance.reduce((s, r) => s + r.total_credit, 0);

    return jsonResponse({
      as_of: asOf,
      accounts: trialBalance,
      total_debit: Math.round(totalDebit * 100) / 100,
      total_credit: Math.round(totalCredit * 100) / 100,
      is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    });
  }

  if (path === '/api/accounting/reports/income-statement' && request.method === 'GET') {
    const url = new URL(request.url);
    const from = url.searchParams.get('from') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const to = url.searchParams.get('to') || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('general_ledger')
      .select('account_code, debit, credit')
      .eq('company_id', companyId)
      .gte('entry_date', from)
      .lte('entry_date', to);

    if (error) return errorResponse(error.message, 500);

    // Get account types from chart of accounts
    const { data: accounts } = await supabase
      .from('chart_of_accounts')
      .select('account_code, name_en, name_ar, account_type')
      .eq('company_id', companyId);

    const accountMap = new Map((accounts || []).map(a => [a.account_code, a]));

    let totalRevenue = 0;
    let totalExpenses = 0;
    const revenueItems: { code: string; name: string; amount: number }[] = [];
    const expenseItems: { code: string; name: string; amount: number }[] = [];

    // Aggregate
    const balances: Record<string, number> = {};
    for (const row of data || []) {
      if (!balances[row.account_code]) balances[row.account_code] = 0;
      balances[row.account_code] += (row.credit || 0) - (row.debit || 0);
    }

    for (const [code, balance] of Object.entries(balances)) {
      const acct = accountMap.get(code);
      if (acct?.account_type === 'revenue') {
        totalRevenue += balance;
        revenueItems.push({ code, name: acct.name_en, amount: Math.round(balance * 100) / 100 });
      } else if (acct?.account_type === 'expense') {
        totalExpenses += Math.abs(balance);
        expenseItems.push({ code, name: acct.name_en, amount: Math.round(Math.abs(balance) * 100) / 100 });
      }
    }

    return jsonResponse({
      period: { from, to },
      revenue: { total: Math.round(totalRevenue * 100) / 100, items: revenueItems },
      expenses: { total: Math.round(totalExpenses * 100) / 100, items: expenseItems },
      net_income: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    });
  }

  if (path === '/api/accounting/reports/balance-sheet' && request.method === 'GET') {
    const url = new URL(request.url);
    const asOf = url.searchParams.get('as_of') || new Date().toISOString().split('T')[0];

    const { data: ledger } = await supabase
      .from('general_ledger')
      .select('account_code, debit, credit')
      .eq('company_id', companyId)
      .lte('entry_date', asOf);

    const { data: accounts } = await supabase
      .from('chart_of_accounts')
      .select('account_code, name_en, name_ar, account_type')
      .eq('company_id', companyId);

    const accountMap = new Map((accounts || []).map(a => [a.account_code, a]));
    const balances: Record<string, number> = {};

    for (const row of ledger || []) {
      if (!balances[row.account_code]) balances[row.account_code] = 0;
      balances[row.account_code] += (row.debit || 0) - (row.credit || 0);
    }

    const assets: { code: string; name: string; balance: number }[] = [];
    const liabilities: { code: string; name: string; balance: number }[] = [];
    const equity: { code: string; name: string; balance: number }[] = [];

    for (const [code, balance] of Object.entries(balances)) {
      const acct = accountMap.get(code);
      const entry = { code, name: acct?.name_en || code, balance: Math.round(balance * 100) / 100 };
      if (acct?.account_type === 'asset') assets.push(entry);
      else if (acct?.account_type === 'liability') liabilities.push({ ...entry, balance: Math.abs(entry.balance) });
      else if (acct?.account_type === 'equity') equity.push({ ...entry, balance: Math.abs(entry.balance) });
    }

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0);

    return jsonResponse({
      as_of: asOf,
      assets: { total: Math.round(totalAssets * 100) / 100, items: assets },
      liabilities: { total: Math.round(totalLiabilities * 100) / 100, items: liabilities },
      equity: { total: Math.round(totalEquity * 100) / 100, items: equity },
      is_balanced: Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01,
    });
  }

  // ─── Cost Centers ────────────────────────────────────────────────────
  if (path === '/api/accounting/cost-centers' && request.method === 'GET') {
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('company_id', companyId)
      .order('name_en');

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ cost_centers: data });
  }

  if (path === '/api/accounting/cost-centers' && request.method === 'POST') {
    const body = await request.json() as {
      code: string;
      name_en: string;
      name_ar?: string;
      type: 'administrative' | 'operational' | 'financial' | 'profit';
      parent_code?: string;
    };

    const { data, error } = await supabase
      .from('cost_centers')
      .insert({
        company_id: companyId,
        code: body.code,
        name_en: body.name_en,
        name_ar: body.name_ar || body.name_en,
        center_type: body.type,
        parent_code: body.parent_code || null,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ cost_center: data }, 201);
  }

  // ─── AI Financial Insights ───────────────────────────────────────────
  if (path === '/api/accounting/ai/forecast' && request.method === 'POST') {
    const body = await request.json() as {
      type: 'cashflow' | 'anomaly' | 'risk';
      months_ahead?: number;
    };

    // Fetch recent financial data for analysis
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: recentLedger } = await supabase
      .from('general_ledger')
      .select('account_code, debit, credit, entry_date')
      .eq('company_id', companyId)
      .gte('entry_date', threeMonthsAgo.toISOString().split('T')[0])
      .order('entry_date');

    const { data: recentInvoices } = await supabase
      .from('invoices')
      .select('invoice_type, total, status, invoice_date, due_date')
      .eq('company_id', companyId)
      .gte('invoice_date', threeMonthsAgo.toISOString().split('T')[0]);

    // Build prompt for Gemini
    const prompt = buildFinancialPrompt(body.type, recentLedger || [], recentInvoices || [], body.months_ahead || 3);

    // Call Gemini via Google API
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      }
    );

    const aiData = await aiResponse.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis available';

    return jsonResponse({
      type: body.type,
      analysis: text,
      data_points: (recentLedger || []).length,
      period_analyzed: `${threeMonthsAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
    });
  }

  return errorResponse('Accounting endpoint not found', 404);
}

// ─── Helper: Build AI financial prompt ─────────────────────────────────────

function buildFinancialPrompt(
  type: string,
  ledger: { account_code: string; debit: number; credit: number; entry_date: string }[],
  invoices: { invoice_type: string; total: number; status: string; invoice_date: string; due_date: string }[],
  monthsAhead: number
): string {
  const summary = {
    total_entries: ledger.length,
    total_debit: ledger.reduce((s, l) => s + (l.debit || 0), 0),
    total_credit: ledger.reduce((s, l) => s + (l.credit || 0), 0),
    sales_invoices: invoices.filter(i => i.invoice_type === 'sales').length,
    purchase_invoices: invoices.filter(i => i.invoice_type === 'purchase').length,
    overdue: invoices.filter(i => i.status !== 'paid' && new Date(i.due_date) < new Date()).length,
    total_receivable: invoices.filter(i => i.invoice_type === 'sales' && i.status !== 'paid').reduce((s, i) => s + i.total, 0),
    total_payable: invoices.filter(i => i.invoice_type === 'purchase' && i.status !== 'paid').reduce((s, i) => s + i.total, 0),
  };

  const prompts: Record<string, string> = {
    cashflow: `You are an expert financial analyst. Analyze the following 3-month financial summary and provide a ${monthsAhead}-month cash flow forecast.
Data: ${JSON.stringify(summary)}
Provide: 1) Monthly projected inflows and outflows, 2) Key risk factors, 3) Recommendations. Respond in JSON format with fields: forecast (array of monthly projections), risks (array), recommendations (array).`,
    anomaly: `You are a forensic accountant. Analyze the following financial data for anomalies, unusual patterns, or potential fraud indicators.
Data: ${JSON.stringify(summary)}
Ledger entries: ${ledger.length} total, date range analysis.
Provide: 1) Detected anomalies with severity, 2) Unusual patterns, 3) Recommended actions. Respond in JSON format.`,
    risk: `You are a financial risk analyst. Assess the business financial health based on the following data.
Data: ${JSON.stringify(summary)}
Provide: 1) Risk score (1-100), 2) Key risk factors, 3) Mitigation strategies, 4) Working capital analysis. Respond in JSON format.`,
  };

  return prompts[type] || prompts.cashflow;
}
