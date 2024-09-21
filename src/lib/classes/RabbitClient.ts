import assert from 'node:assert';

import amqp, { AmqpConnectionManager } from 'amqp-connection-manager';

import type {
  IExchangeAction,
  IExchangeConfig, IExchanges, IMemoryConnections,
  IQueueAssertConfig,
  IQueueBindConfig,
  IQueues
} from '@library/types/internal-types';
import type { RabbitClientConfig } from '@library/types/public-types';
import Log                         from '@library/util/Log';

import ExchangeChannel from './ExchangeChannel';
import QueueChannel    from './QueueChannel';

const inMemoryClients: IMemoryConnections = {};

export class RabbitClient {
  private _connection?: AmqpConnectionManager;

  private _exchanges: IExchanges  = {};

  private config: RabbitClientConfig;

  private _queues: IQueues = {};

  static instance(name = '_def') {
    const client = inMemoryClients[name];

    assert(name, 'name is required');
    assert(
      inMemoryClients[name],
      `Client connection "${name}" does not exist.Available ones are: ${Object.keys(inMemoryClients).join(', ')}`
    );


    return client;
  }

  exchange(name: string) {
    assert(name, 'name is required');
    assert(this._exchanges[name], `Exchange "${name}" does not exist`);

    return this._exchanges[name];
  }

  queue(name: string) {
    assert(name, 'name is required');
    assert(this._queues[name], `Queue "${name}" does not exist`);

    return this._queues[name];
  }

  get connection() {
    if (!this._connection) {
      throw new Error('Connection not established. Did you call .connect()?');
    }

    return this._connection;
  }

  constructor(config: RabbitClientConfig) {
    config.port = config.port || 5672;
    config.name = config.name ?? '_def';
    config.protocol = config.protocol || 'amqp';

    this.config = config;
    inMemoryClients[config.name] = this;
  }

  async connect() {
    this._connection = amqp.connect(this.config, {

    });

    this._connection.on('error', (err) => {
      Log.e('Connection error:', err);
    });

    return this;
  }

  async declareExchange(action: IExchangeAction, config: IExchangeConfig) {
    assert(config.name, 'name is required');

    const exchange = new ExchangeChannel(this, config);

    assert(!this._exchanges[config.name], `Trying to declare exchange "${config.name}": it already exists`);

    if (action === 'create') {
      await exchange.create(config);
      this._exchanges[config.name] = exchange;
    } else {
      await exchange.connect(config);
      this._exchanges[config.name] = exchange;
    }

    return this;
  }


  async bindQueue(config: IQueueBindConfig) {
    assert(config.name, 'name is required');

    const queue = new QueueChannel(this, config);

    assert(!this._queues[config.name], `Trying to declare queue "${config.name}": it already exists`);

    await queue.bindToExchange(config);
    this._queues[config.name] = queue;

    return this;
  }


  async assertQueue(config: IQueueAssertConfig) {
    assert(config.name, 'name is required');

    const queue = new QueueChannel(this, config);

    assert(!this._queues[config.name], `Trying to declare queue "${config.name}": it already exists`);

    await queue.create(config);
    this._queues[config.name] = queue;

    return this;
  }


}
