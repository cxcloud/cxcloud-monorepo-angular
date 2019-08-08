import { ActionMapCondition, Message } from '@cxcloud/process-engine';
import { sendEmail } from '@cxcloud/mailer';
import R from 'ramda';
import config from 'config';
import { Order } from '@cxcloud/ct-types/orders';
import { logger } from './utils/logger';
import { getOrder } from './commercetools/api';
import { getPriceText } from './utils/price';

enum PossibleTypes {
  OrderCreated = 'OrderCreated'
}

const getOrderFromEvent = async (data: any): Promise<Order> => {
  const orderId = R.path<string>(['body', 'resource', 'id'], data);

  if (orderId) {
    return getOrder(orderId);
  }

  throw new Error('No order found in this event.');
};

const sendOrderCompleteEmail = (order: Order) => {
  const lineItems = order.lineItems.map(item => ({
    name: item.name,
    quantity: item.quantity,
    totalPrice: getPriceText(item.totalPrice)
  }));

  const templateParams = {
    orderNumber: order.orderNumber || order.id,
    firstName: order.shippingAddress.firstName || '',
    lastName: order.shippingAddress.lastName || '',
    totalPrice: getPriceText({
      centAmount: order.taxedPrice.totalGross.centAmount,
      currencyCode: order.taxedPrice.totalGross.currencyCode
    }),
    shippingAddress: order.shippingAddress,
    lineItems
  };
  return sendEmail({
    emailAddress: order.customerEmail,
    senderEmail: config.get<string>('senderEmail'),
    templateFile: `${__dirname}/email-templates/.ejs`,
    subject: 'Order completed',
    templateParams
  });
};

export const conditions: ActionMapCondition[] = [
  {
    path: 'type',
    value: '@cxcloud-monorepo-angular/email'
  },
  {
    path: 'body.resource.typeId',
    value: 'email'
  }
];

export const action = async (message: Message) => {
  logger.info('Handling incoming order data', { data: message.data });
  try {
    const { data } = message;
    const messageType = R.path<string>(['body', 'type'], data);

    if (messageType && Object.keys(PossibleTypes).includes(messageType)) {
      const order = await getOrderFromEvent(data);
      sendOrderCompleteEmail(order);
    }

    await message.deleteMessage();
  } catch (error) {
    logger.error('Handling sending email event has failed', {
      error,
      data: message.data
    });
  }
  await message.next();
};
