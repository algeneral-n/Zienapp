import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Invitation {
    id: string;
    companyId: string;
    email: string;
    role: string;
    invitedName?: string;
    token: string;
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
    expiresAt: string;
    createdAt: string;
}

// ─── Invitation Service ──────────────────────────────────────────────────────

export const invitationService = {
    /**
     * Invite a user to a company. This generates a unique token and
     * stores the invitation. The invited user must use this token to
     * accept and join the company.
     */
    async invite(params: {
        companyId: string;
        email: string;
        role: string;
        invitedName?: string;
        invitedBy: string;
    }): Promise<{ token: string; error?: string }> {
        // Generate a secure-ish token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        const { error } = await supabase.from('company_invitations').insert({
            company_id: params.companyId,
            email: params.email.trim().toLowerCase(),
            role: params.role,
            invited_name: params.invitedName || null,
            token,
            status: 'pending',
            expires_at: expiresAt,
            invited_by: params.invitedBy,
        });

        if (error) {
            console.error('[invitationService] invite failed:', error.message);
            return { token: '', error: error.message };
        }

        return { token };
    },

    /**
     * Validate an invitation token. Returns the invitation if valid.
     */
    async validate(token: string): Promise<Invitation | null> {
        const { data, error } = await supabase
            .from('company_invitations')
            .select('*')
            .eq('token', token)
            .eq('status', 'pending')
            .single();

        if (error || !data) return null;

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
            await supabase
                .from('company_invitations')
                .update({ status: 'expired' })
                .eq('id', data.id);
            return null;
        }

        return {
            id: data.id,
            companyId: data.company_id,
            email: data.email,
            role: data.role,
            invitedName: data.invited_name,
            token: data.token,
            status: data.status,
            expiresAt: data.expires_at,
            createdAt: data.created_at,
        };
    },

    /**
     * Accept an invitation: create the user account (if needed),
     * add them to company_members, mark invitation as accepted.
     */
    async accept(params: {
        token: string;
        userId: string;
    }): Promise<{ companyId: string; error?: string }> {
        // Get invitation
        const invitation = await this.validate(params.token);
        if (!invitation) {
            return { companyId: '', error: 'Invalid or expired invitation' };
        }

        // Add user to company_members
        const { error: memberError } = await supabase.from('company_members').insert({
            company_id: invitation.companyId,
            user_id: params.userId,
            role: invitation.role,
            status: 'active',
            is_primary: false,
        });

        if (memberError) {
            // Already a member?
            if (memberError.code === '23505') {
                // Unique violation - already exists
                await supabase
                    .from('company_invitations')
                    .update({ status: 'accepted' })
                    .eq('id', invitation.id);
                return { companyId: invitation.companyId };
            }
            return { companyId: '', error: memberError.message };
        }

        // Mark invitation as accepted
        await supabase
            .from('company_invitations')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('id', invitation.id);

        return { companyId: invitation.companyId };
    },

    /**
     * List all pending invitations for a company.
     */
    async listForCompany(companyId: string): Promise<Invitation[]> {
        const { data } = await supabase
            .from('company_invitations')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        return (data ?? []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            companyId: r.company_id as string,
            email: r.email as string,
            role: r.role as string,
            invitedName: r.invited_name as string | undefined,
            token: r.token as string,
            status: r.status as Invitation['status'],
            expiresAt: r.expires_at as string,
            createdAt: r.created_at as string,
        }));
    },

    /**
     * Revoke a pending invitation.
     */
    async revoke(invitationId: string): Promise<void> {
        await supabase
            .from('company_invitations')
            .update({ status: 'revoked' })
            .eq('id', invitationId)
            .eq('status', 'pending');
    },
};
