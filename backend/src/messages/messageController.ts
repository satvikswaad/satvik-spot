import { Request, Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { validateCreateMessagePayload } from '../validation/messageSchema';
import { logger } from '../utils/logger';

export async function handleCreateMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedPayload = validateCreateMessagePayload(req.body);

    const docData = {
      name: validatedPayload.name,
      email: validatedPayload.email || null,
      phone: validatedPayload.phone || null,
      subject: validatedPayload.subject || 'General Inquiry',
      message: validatedPayload.message,
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
