import assert from 'node:assert';

import amqp, { AmqpConnectionManager } from 'amqp-connection-manager';

import type {
  IExchangeAction,
  IExchangeConfig, IExchanges, IMemoryConnections,
  IQueueAssertConfig,
  IQueueBindConfig,
  IQueues
} from '@library/types/internal-types';
import { IConnectOptions, IConnectUri } from '@library/types/public-types';
import Log                              from '@library/util/Log';

import ExchangeChannel from './ExchangeChannel';
import QueueChannel    from './QueueChannel';

const inMemoryClients: IMemoryConnections = {};

export class RabbitClient {
  private _connection?: AmqpConnectionManager;

  private name: string;

  private _exchanges: IExchanges  = {};

  private _queues: IQueues = {};

  connectionUri: IConnectUri;

  static instance(name = '_def') {
    assert(name, 'name is required');

    const client = inMemoryClients[name];

    assert(
      inMemoryClients[name],
      `Client connection "${name}" does not exist. Available ones are: ${Object.keys(inMemoryClients).join(', ')}`
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

  constructor(connectionUri:  IConnectUri, name?: string) {
    this.name = name ?? '_def';
    inMemoryClients[this.name] = this;
    this.connectionUri = connectionUri;
  }

  async connect(connectionOptions?: IConnectOptions) {
    this._connection = amqp.connect(this.connectionUri, connectionOptions);

    this._connection.on('connectFailed', (err) => {
      Log.e('Broker Connection error:', err);
    });

    this._connection.on('disconnect', (err) => {
      Log.e('Disconnected from broker:', err);
    });

    this._connection.on('blocked', (reason) => {
      Log.e('Blocked from broker:', reason);
    });

    this._connection.on('unblocked', () => {
      Log.e('Unblocked from broker');
    });


    return this;
  }

  async declareExchange(action: IExchangeAction, config: IExchangeConfig) {
    assert(config.name, 'name is required');

    const exchange = new ExchangeChannel(this, config);

    if (this._exchanges[config.name]) {
      console.warn(`Trying to declare exchange "${config.name}": it already exists, existing exchange will be used`);
      return this._exchanges[config.name];
    }

    if (action === 'create') {
      await exchange.create(config);
      this._exchanges[config.name] = exchange;
    } else {
      await exchange.connect(config);
      this._exchanges[config.name] = exchange;
    }

    exchange.on('error', (err) => {
      Log.e(`Exchange "${config.name}" error:`, err);
    });

    return this._exchanges[config.name];
  }


  async bindQueue(config: IQueueBindConfig) {
    assert(config.name, 'name is required');

    const queue = new QueueChannel(this, config);

    queue.on('error', (err) => {
      Log.e(`Queue "${config.name}" error:`, err);
    });

    if (this._queues[config.name]) {
      console.warn(`Trying to bind queue "${config.name}": it already exists, existing queue will be used`);
      return this._queues[config.name];
    }

    await queue.bindToExchange();
    this._queues[config.name] = queue;

    return queue;
  }


  async declareQueue(config: IQueueAssertConfig) {
    assert(config.name, 'name is required');

    const queue = new QueueChannel(this, config);

    if (this._queues[config.name]) {
      console.warn(`Trying to bind queue "${config.name}": it already exists, existing queue will be used`);
      return this._queues[config.name];
    }

    await queue.create();
    this._queues[config.name] = queue;

    return this._queues[config.name];
  }


}
