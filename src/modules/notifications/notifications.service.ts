import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

const configService = new ConfigService();

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
  ): Promise<NotificationResponseDTO> {
    const notification = new Notification();

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    notification.type = type;
    notification.user = user;
    notification.userId = userId;
    notification.orderId = orderId || null;
    notification.shippingStatus = shippingStatus || null;

    await this.notificationRepository.save(notification);

    const notificationResponse = await this.generateNotification(notification);

    await this.eventsGateway.sendNotificationToUser(
      userId,
      notificationResponse,
    );

    return notificationResponse;
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

  async generateNotification(
    notification: Notification,
  ): Promise<NotificationResponseDTO> {
    const HOURS = 24;
    const SECONDS_MINUTES = 60;
    const MILLISECONDS = 1000;
    const { id, type, orderId, createdAt, shippingStatus, userId } =
      notification;

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

    let orderLink = '';

    if (orderId) {
      const APP_LINK = configService.get<string>('SITE_HOST');

      if (user.role === 'buyer') {
        orderLink = `<a href="${APP_LINK}profile/orders/${orderId}">#${orderId}</a>`;
      }
      if (user.role === 'vendor') {
        orderLink = `<a href="${APP_LINK}vendor/orders/${orderId}">#${orderId}</a>`;
      }
    }

    let returnAt = 0;

    if (order.receivedAt && order.duration) {
      returnAt =
        order.receivedAt.getTime() +
        order.duration *
          HOURS *
          SECONDS_MINUTES *
          SECONDS_MINUTES *
          MILLISECONDS;
    }

    const returnDate = new Date(returnAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const userName = user.name;

    switch (type) {
      case Type.ORDER_REJECTION:
        return {
          id: id,
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. We regret to inform you that your recent order ${orderLink} has been rejected. Please feel free to contact Vendor or Admin via chat. Thank you for your understanding.`,
        };

      case Type.SHIPPING_UPDATES:
        return {
          id: id,
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. We confirm that your order ${orderLink} status has been changed to '${shippingStatus}'. Thank you for renting with us!`,
        };

      case Type.RETURNED_REMINDER:
        return {
          id: id,
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. We would like to remind you that your rental order ${orderLink} is due for return on ${returnDate}. Please make sure to send it back to avoid any late fees. Thank you for your cooperation and choosing us!`,
        };

      case Type.CHANGED_PASSWORD:
        return {
          id: id,
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. Your password has been changed successfully. If you did not make this change, please contact our support team immediately. Thank you for keeping your account secure!`,
        };

      case Type.CHANGED_EMAIL:
        return {
          id: id,
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. Your email address has been changed successfully. If you did not request this change, please contact support immediately.`,
        };

      default:
        return {
          id: id,
          type: type,
          createdAt: createdAt,
          text: `Hi ${userName}. You have a new notification.`,
        };
    }
  }
}
