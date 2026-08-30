import type { PlanCode } from '@/config/plans';
import { supabase } from '@/lib/supabase/client';

export type PaymentStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required' | 'canceled';

export type PaymentMethod = {
  id: string;
  channel: 'vodafone_cash' | 'instapay' | 'bank_transfer' | 'cash_deposit' | 'other';
  label_ar: string;
  label_en: string;
  account_reference: string;
  account_holder: string;
  instructions_ar: string;
  instructions_en: string;
  is_active: boolean;
  display_order: number;
};

export type PaymentProof = {
  id: string;
  user_id: string;
  plan_code: Exclude<PlanCode, 'free'>;
  payment_method_id: string;
  amount_egp: number;
  payer_name: string;
  payer_phone: string;
  transfer_reference: string;
  proof_storage_path: string;
  user_note: string;
  status: PaymentStatus;
  revision: number;
  review_note: string;
  reviewed_at: string | null;
  approved_period_end: string | null;
  created_at: string;
  updated_at: string;
};

const acceptedProofTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export function validatePaymentProof(file: File) {
  if (!acceptedProofTypes.has(file.type)) return 'proof_type';
  if (file.size > 8 * 1024 * 1024) return 'proof_size';
  return null;
}

function safeFileName(name: string) {
  const extension = name.includes('.') ? `.${name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
  return `proof-${Date.now()}-${crypto.randomUUID()}${extension}`;
}

export async function listPaymentMethods() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('manual_payment_methods').select('*').eq('is_active', true).order('display_order');
  if (error) throw error;
  return (data || []) as PaymentMethod[];
}

export async function listMyPaymentProofs(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('manual_payment_proofs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as PaymentProof[];
}

export async function submitPaymentProof(input: {
  userId: string;
  planCode: Exclude<PlanCode, 'free'>;
  methodId: string;
  payerName: string;
  payerPhone: string;
  reference: string;
  note: string;
  file: File;
}) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const validation = validatePaymentProof(input.file);
  if (validation) throw new Error(validation);
  const proofId = crypto.randomUUID();
  const storagePath = `${input.userId}/${proofId}/${safeFileName(input.file.name)}`;
  const uploaded = await supabase.storage.from('payment-proofs').upload(storagePath, input.file, { cacheControl: '3600', upsert: false });
  if (uploaded.error) throw uploaded.error;
  const result = await supabase.from('manual_payment_proofs').insert({
    id: proofId,
    user_id: input.userId,
    plan_code: input.planCode,
    payment_method_id: input.methodId,
    amount_egp: 1,
    payer_name: input.payerName.trim(),
    payer_phone: input.payerPhone.replace(/\s/g, ''),
    transfer_reference: input.reference.trim(),
    proof_storage_path: storagePath,
    user_note: input.note.trim(),
  }).select('*').single();
  if (result.error) {
    await supabase.storage.from('payment-proofs').remove([storagePath]);
    throw result.error;
  }
  return result.data as PaymentProof;
}

export async function resubmitPaymentProof(input: { proof: PaymentProof; userId: string; reference: string; note: string; file: File }) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const validation = validatePaymentProof(input.file);
  if (validation) throw new Error(validation);
  const storagePath = `${input.userId}/${input.proof.id}/${safeFileName(input.file.name)}`;
  const uploaded = await supabase.storage.from('payment-proofs').upload(storagePath, input.file, { cacheControl: '3600', upsert: false });
  if (uploaded.error) throw uploaded.error;
  const result = await supabase.rpc('resubmit_manual_payment_v1', {
    target_proof: input.proof.id,
    new_storage_path: storagePath,
    new_reference: input.reference.trim(),
    new_user_note: input.note.trim(),
  });
  if (result.error) {
    await supabase.storage.from('payment-proofs').remove([storagePath]);
    throw result.error;
  }
  return result.data as PaymentProof;
}
