import type { ChannelWrapper } from 'amqp-connection-manager';
import type { Consumer }       from 'amqp-connection-manager/dist/types/ChannelWrapper';

import type ExchangeChannel from '@library/classes/ExchangeChannel';
import type QueueChannel    from '@library/classes/QueueChannel';

export type RabbitClientConfig = {
  protocol: string | 'amqp';
  host: string;
  port?: number | 5672;
  username: string;
  password: string;
  vhost: string;
  name?: string;
}

export type IChannelWrapper = ChannelWrapper;
export type IQueueChannel = QueueChannel;
export type IExchangeChannel = ExchangeChannel;

export type IConsumerFn = Consumer['onMessage']
export type IConsumerMessage = Parameters<IConsumerFn>[0]
