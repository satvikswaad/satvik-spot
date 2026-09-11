import { validateCreateOrderPayload, CreateOrderPayload } from '../validation/orderSchema';
import { ValidationError } from '../errors/AppError';

export interface PayUCreateOrderInput extends CreateOrderPayload {
  email?: string;
  note?: string;
}

export function validatePayUCreateOrderPayload(payload: any): PayUCreateOrderInput {
  const validated = validateCreateOrderPayload(payload);
  
  if (payload.email !== undefined && payload.email !== null && typeof payload.email === 'string') {
    const trimmed = payload.email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new ValidationError('Invalid email address format');
    }
    (validated as any).email = trimmed;
  }

  return validated as PayUCreateOrderInput;
}

export function validatePayUResponsePayload(body: any) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid PayU response payload: expected body object');
  }

  const txnid = body.txnid ? String(body.txnid).trim() : '';
  const status = body.status ? String(body.status).trim().toLowerCase() : '';
  const hash = body.hash ? String(body.hash).trim() : '';
  const amount = body.amount ? String(body.amount).trim() : '';

  if (!txnid) {
    throw new ValidationError('Missing required txnid in PayU response');
  }
  if (!status) {
    throw new ValidationError('Missing required status in PayU response');
  }
  if (!hash) {
    throw new ValidationError('Missing required hash in PayU response');
  }
  if (!amount) {
    throw new ValidationError('Missing required amount in PayU response');
  }

  return {
    txnid,
    status,
    hash,
    amount,
    productinfo: body.productinfo ? String(body.productinfo).trim() : '',
    firstname: body.firstname ? String(body.firstname).trim() : '',
    email: body.email ? String(body.email).trim() : '',
    phone: body.phone ? String(body.phone).trim() : '',
    key: body.key ? String(body.key).trim() : '',
    udf1: body.udf1 ? String(body.udf1).trim() : '',
    udf2: body.udf2 ? String(body.udf2).trim() : '',
    udf3: body.udf3 ? String(body.udf3).trim() : '',
    udf4: body.udf4 ? String(body.udf4).trim() : '',
    udf5: body.udf5 ? String(body.udf5).trim() : '',
    additionalCharges: body.additionalCharges ? String(body.additionalCharges).trim() : undefined,
    bank_ref_num: body.bank_ref_num ? String(body.bank_ref_num).trim() : undefined,
    payuMoneyId: body.payuMoneyId ? String(body.payuMoneyId).trim() : undefined,
    mode: body.mode ? String(body.mode).trim() : undefined,
    error_Message: body.error_Message ? String(body.error_Message).trim() : undefined
  };
}
