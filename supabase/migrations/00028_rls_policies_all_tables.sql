-- ============================================================
-- Migration 00028: Add RLS policies to ALL tables missing them
-- 93 tables had RLS enabled but ZERO policies (= locked out)
-- ============================================================

-- Helper: company membership check expression
-- company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')

-- ============================================================
-- GROUP 1: Tables WITH company_id  (60 tables)
-- Pattern: Full CRUD for company members
-- ============================================================

-- Accounting
CREATE POLICY "company_rw" ON advances FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON chart_of_accounts FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON expenses FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON journal_entries FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON invoices FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON tax_settings FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON receipts FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- AI
CREATE POLICY "company_rw" ON ai_agent_actions FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON ai_agent_configs FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON ai_context_snapshots FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON ai_conversations FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON ai_reports FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON ai_usage_logs FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Billing / Subscriptions
CREATE POLICY "company_rw" ON apple_pay_sessions FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON billing_events FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON company_subscriptions FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON marketplace_transactions FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON payment_events FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON subscription_usage_counters FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Chat / Communication
CREATE POLICY "company_rw" ON call_logs FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON chat_channels FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON chats FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON presence_status FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON voice_agent_configs FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- CRM / Sales
CREATE POLICY "company_rw" ON client_portal_users FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON contracts FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON leads FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON opportunities FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON quotes FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Company / HR
CREATE POLICY "company_rw" ON benefits FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON company_integrations FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON company_seed_applications FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON employee_documents FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON insurance_claims FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON job_applications FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON job_posts FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON role_delegations FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON training_assignments FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON training_courses FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON work_logs FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Store / POS
CREATE POLICY "company_rw" ON customer_orders FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON inventory_items FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON inventory_movements FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON orders FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON pos_orders FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON pos_sessions FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON product_categories FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON products FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON store_customers FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON store_settings FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Logistics
CREATE POLICY "company_rw" ON drivers FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON geofences FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON gps_tracks FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON location_pings FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON routes FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON shipments FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON warehouses FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Meetings
CREATE POLICY "company_rw" ON meeting_rooms FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON meetings FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Marketing
CREATE POLICY "company_rw" ON marketing_audience_segments FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON marketing_email_templates FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Projects
CREATE POLICY "company_rw" ON tasks FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));

-- Security / Provisioning
CREATE POLICY "company_rw" ON security_events FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON provisioning_jobs FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "company_rw" ON tenant_health_snapshots FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')) WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'));


-- ============================================================
-- GROUP 2: Child tables WITHOUT company_id (join to parent)
-- ============================================================

-- invoice_items → invoices.company_id
CREATE POLICY "company_rw" ON invoice_items FOR ALL
  USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- journal_lines → journal_entries.company_id
CREATE POLICY "company_rw" ON journal_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM journal_entries je WHERE je.id = journal_lines.journal_entry_id AND je.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM journal_entries je WHERE je.id = journal_lines.journal_entry_id AND je.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- order_items → orders.company_id
CREATE POLICY "company_rw" ON order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- customer_order_items → customer_orders.company_id
CREATE POLICY "company_rw" ON customer_order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM customer_orders co WHERE co.id = customer_order_items.order_id AND co.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM customer_orders co WHERE co.id = customer_order_items.order_id AND co.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- pos_order_items → pos_orders.company_id
CREATE POLICY "company_rw" ON pos_order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM pos_orders po WHERE po.id = pos_order_items.order_id AND po.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM pos_orders po WHERE po.id = pos_order_items.order_id AND po.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- product_variants → products.company_id
CREATE POLICY "company_rw" ON product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- chat_channel_members → chat_channels.company_id
CREATE POLICY "company_rw" ON chat_channel_members FOR ALL
  USING (EXISTS (SELECT 1 FROM chat_channels cc WHERE cc.id = chat_channel_members.channel_id AND cc.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM chat_channels cc WHERE cc.id = chat_channel_members.channel_id AND cc.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- chat_messages → chat_channels.company_id
CREATE POLICY "company_rw" ON chat_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM chat_channels cc WHERE cc.id = chat_messages.channel_id AND cc.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM chat_channels cc WHERE cc.id = chat_messages.channel_id AND cc.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- meeting_participants → meetings.company_id
CREATE POLICY "company_rw" ON meeting_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_participants.meeting_id AND m.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_participants.meeting_id AND m.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- meeting_sessions → meetings.company_id
CREATE POLICY "company_rw" ON meeting_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_sessions.meeting_id AND m.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_sessions.meeting_id AND m.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- meeting_summaries → meetings.company_id
CREATE POLICY "company_rw" ON meeting_summaries FOR ALL
  USING (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_summaries.meeting_id AND m.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_summaries.meeting_id AND m.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- meeting_transcripts → meetings.company_id
CREATE POLICY "company_rw" ON meeting_transcripts FOR ALL
  USING (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_transcripts.meeting_id AND m.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM meetings m WHERE m.id = meeting_transcripts.meeting_id AND m.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- project_members → projects.company_id
CREATE POLICY "company_rw" ON project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- task_comments → tasks.company_id
CREATE POLICY "company_rw" ON task_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_comments.task_id AND t.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_comments.task_id AND t.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- training_attempts → training_assignments.company_id
CREATE POLICY "company_rw" ON training_attempts FOR ALL
  USING (EXISTS (SELECT 1 FROM training_assignments ta WHERE ta.id = training_attempts.assignment_id AND ta.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM training_assignments ta WHERE ta.id = training_attempts.assignment_id AND ta.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- provisioning_job_steps → provisioning_jobs.company_id
CREATE POLICY "company_rw" ON provisioning_job_steps FOR ALL
  USING (EXISTS (SELECT 1 FROM provisioning_jobs pj WHERE pj.id = provisioning_job_steps.job_id AND pj.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')))
  WITH CHECK (EXISTS (SELECT 1 FROM provisioning_jobs pj WHERE pj.id = provisioning_job_steps.job_id AND pj.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active')));

-- marketing_campaigns → created_by = current user (no company_id, use creator check)
CREATE POLICY "creator_rw" ON marketing_campaigns FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- company_onboarding_submissions → viewable by the submitter (gm_email match) or any authenticated
CREATE POLICY "authenticated_read" ON company_onboarding_submissions FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_insert" ON company_onboarding_submissions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- GROUP 3: Platform/system tables (read-only for authenticated)
-- ============================================================

-- Blueprints / templates / pricing (readable by all authenticated users)
CREATE POLICY "authenticated_read" ON blueprints FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON blueprint_modules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON blueprint_seed_packs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON seed_packs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON plan_module_entitlements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON pricing_addons FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON role_permissions FOR SELECT USING (auth.role() = 'authenticated');

-- Integration pricing (readable)
CREATE POLICY "authenticated_read" ON integration_pricing_rules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON integration_billing_map FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read" ON integration_usage_logs FOR SELECT USING (auth.role() = 'authenticated');


-- ============================================================
-- GROUP 4: Internal/system tables (no user access needed)
-- ============================================================

-- Platform incidents (read-only for authenticated, write needs admin via worker)
CREATE POLICY "authenticated_read" ON platform_incidents FOR SELECT USING (auth.role() = 'authenticated');

-- Test / internal tables (allow authenticated for flexibility)
CREATE POLICY "authenticated_all" ON "ZIEN" FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON _zien_test FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_all" ON test_persist FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
