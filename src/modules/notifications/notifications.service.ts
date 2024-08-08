import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { EventsGateway } from 'src/modules/events/events.gateway';
import { Status } from 'src/modules/orders/entities/order-status.enum';
import { Order } from 'src/modules/orders/entities/order.entity';
import { User } from 'src/modules/users/user.entity';

import { NotificationResponseDTO } from './dto/notification-response.dto';
import { Type } from './entities/notification-type.enum';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async createNotification(
    type: Type,
    userId: string,
    orderId?: number | null,
    shippingStatus?: Status | null,
  ): Promise<void> {
    const notification = new Notification();

    notification.type = type;
    notification.userId = userId;
    notification.orderId = orderId || null;
    notification.shippingStatus = shippingStatus || null;

    await this.notificationRepository.save(notification);

    const notificationResponse = await this.generateNotification(notification);

    await this.eventsGateway.sendNotificationToUser(
      userId,
      notificationResponse,
    );
  }

  async getNotificationsByUser(
    userId: string,
  ): Promise<NotificationResponseDTO[]> {
    const notifications = await this.notificationRepository.find({
      where: { userId },
    });

    const notificationsPromises = notifications.map((notification) =>
      this.generateNotification(notification),
    );

    return Promise.all(notificationsPromises);
  }

  private async generateNotification(
    notification: Notification,
  ): Promise<NotificationResponseDTO> {
    const { type, orderId, createdAt, shippingStatus, userId } = notification;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    const order = await this.orderRepository.findOne({
      where: { orderId: orderId },
    });

    if (!order) {
      throw new NotFoundException(Errors.ORDER_NOT_FOUND);
    }

    const userName = user.name;

    switch (type) {
      case Type.ORDER_REJECTION:
        return {
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. We regret to inform you that your recent order #${orderId} has been rejected. Please feel free to contact Vendor or Admin via chat. Thank you for your understanding.`,
        };

      case Type.SHIPPING_UPDATES:
        return {
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. We confirm that your order #${orderId} has been ${shippingStatus} for return/returned. Thank you for renting with us!`,
        };

      case Type.RETURNED_REMINDER:
        return {
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. We would like to remind you that your rental order #${orderId} is due for return on ${createdAt.toDateString()}. Please make sure to send it back to avoid any late fees. Thank you for your cooperation and choosing us!`,
        };

      case Type.CHANGED_PASSWORD:
        return {
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. Your password has been changed successfully. If you did not make this change, please contact our support team immediately. Thank you for keeping your account secure!`,
        };

      case Type.CHANGED_EMAIL:
        return {
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. Your email address has been changed successfully. If you did not request this change, please contact support immediately.`,
        };

      default:
        return {
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. You have a new notification.`,
        };
    }
  }
}
