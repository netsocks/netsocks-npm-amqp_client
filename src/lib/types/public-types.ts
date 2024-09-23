import type { ChannelWrapper } from 'amqp-connection-manager';
import amqp                    from 'amqp-connection-manager';
import type { Consumer }       from 'amqp-connection-manager/dist/types/ChannelWrapper';

import type ExchangeChannel from '@library/classes/ExchangeChannel';
import type QueueChannel    from '@library/classes/QueueChannel';

export type IConnectUri = Parameters<typeof amqp.connect>[0]
export type IConnectOptions = Parameters<typeof amqp.connect>[1]
export type IChannelWrapper = ChannelWrapper;
export type IQueueChannel = QueueChannel;
export type IExchangeChannel = ExchangeChannel;

export type IConsumerFn = Consumer['onMessage']
export type IConsumerMessage = Parameters<IConsumerFn>[0]
