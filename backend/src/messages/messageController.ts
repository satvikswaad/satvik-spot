import { Request, Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { ValidationError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface CreateMessagePayload {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function handleCreateMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, phone, subject, message } = req.body as CreateMessagePayload;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      throw new ValidationError('Name must be between 2 and 100 characters');
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 500) {
      throw new ValidationError('Message body must be between 5 and 500 characters');
    }

    const docData = {
      name: name.trim(),
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      subject: subject ? String(subject).trim() : 'General Inquiry',
      message: message.trim(),
      status: 'new',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('messages').add(docData);
    logger.info('Customer message submitted successfully', { messageId: docRef.id });

    return res.status(201).json({
      success: true,
      data: { messageId: docRef.id, status: 'submitted' }
    });
  } catch (error) {
    return next(error);
  }
}
