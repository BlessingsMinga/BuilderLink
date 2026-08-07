export type AdminAction = 'approve_builder' | 'reject_document' | 'suspend_user' | 'resolve_report';
// This contract must be implemented by an authenticated Edge Function; never expose service_role in Expo.
export const adminService = { async execute(action: AdminAction, targetId: string) { return { action, targetId, status: 'queued' as const }; } };
