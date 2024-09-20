import { Options } from 'amqp-connection-manager';

import type ExchangeChannel  from '@library/classes/ExchangeChannel';
import QueueChannel          from '@library/classes/QueueChannel';
import type { RabbitClient } from '@library/classes/RabbitClient';

export type IMemoryConnections = {
  [key: string]: RabbitClient
}

export type IQueueConfig = {
  concurrentMessageLimit?: number,
  name: string,
} & ({
      action: 'create',
      options: Options.AssertQueue,
    }
  | {
      action: 'bind',
      exchangeName: string,
      pattern: string,
      args?: any
    })

export type IExchangeConfig = {
  action?: 'create' | 'connect',
  type: 'topic' | 'direct' | 'fanout' | 'headers',
  concurrentMessageLimit?: number
  name: string,
  options?: Options.AssertExchange
}

export type IExchanges = {
  [key: string]: ExchangeChannel
}

export type IQueues = {
  [key: string]: QueueChannel
}
