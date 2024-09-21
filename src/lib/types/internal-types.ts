import { Options } from 'amqp-connection-manager';

import type { RabbitClient } from '@library/classes/RabbitClient';

import { IExchangeChannel, IQueueChannel } from './public-types';

type IQueueBaseConfig = {
  concurrentMessageLimit?: number,
  name: string,
}

export type IQueueAssertConfig = IQueueBaseConfig & {
  options: Options.AssertQueue,
}

export type IQueueBindConfig = IQueueBaseConfig & {
  exchangeName: string,
  pattern: string,
  args?: any
}

export type IMemoryConnections = {
  [key: string]: RabbitClient
}

export type IExchangeAction = 'create' | 'connect'

export type IExchangeConfig = {
  type: 'topic' | 'direct' | 'fanout' | 'headers',
  concurrentMessageLimit?: number
  name: string,
  options?: Options.AssertExchange
}

export type IExchanges = {
  [key: string]: IExchangeChannel
}

export type IQueues = {
  [key: string]: IQueueChannel
}
