import assert from 'node:assert';

import { Channel, ChannelWrapper, Options } from 'amqp-connection-manager';
import type { Consumer }                    from 'amqp-connection-manager/dist/types/ChannelWrapper';

import type { RabbitClient } from '@library/classes/RabbitClient';
import type { IQueueConfig } from '@library/types/internal-types';


class QueueChannel {
  client: RabbitClient;

  config: IQueueConfig;

  private _channel?: ChannelWrapper;

  constructor(client: RabbitClient, config: IQueueConfig) {
    this.client = client;
    this.config = Object.freeze(config);
    assert(this.config.name, 'queue name is required');
  }

  get channel() {
    assert(this._channel, `Queue channel "${this.config.name}" not established. Did you call .declareQueue()?`);

    return this._channel;
  }

  private _createWrapper(config: IQueueConfig) {
    const { name, concurrentMessageLimit } = config;

    assert(name, 'name is required');

    const channelWrapper = this.client.connection.createChannel({
      // json: true,
      confirm: false,
      setup(channel: Channel) {
        if (concurrentMessageLimit && concurrentMessageLimit >= 1) {
          return channel.prefetch(concurrentMessageLimit); // does this require global: true?
        }
        return true;
      }
    });
    return channelWrapper;
  }

  async bindToExchange(config: IQueueConfig) {
    assert(config.name, 'name is required');
    assert(config.action === 'bind', 'action must be "bind"');
    assert(config.exchangeName, 'exchangeName is required');
    // assert(config.pattern, 'pattern is required');

    const channel = this._createWrapper(config);

    await channel.waitForConnect();

    const {
      name, exchangeName, pattern, args
    } = config;

    await channel.bindQueue(name, exchangeName, pattern, args);

    const exists = await channel.checkExchange(config.name);

    assert(exists, `Could not connect to exchange "${config.name}": Exchange does not exist or is not reachable`);

    this._channel = channel;

    return this;
  }

  async create(config: IQueueConfig) {
    assert(config.name, 'name is required');
    assert(config.action === 'create', 'action must be "create"');

    const channel = this._createWrapper(config);

    await channel.waitForConnect();

    const exists = await channel.assertQueue(config.name, config.options);

    assert(exists, `Could not create queue "${config.name}": assertQueue failed`);

    this._channel = channel;

    return this;
  }

  async sendJSONMessage(message: Object, options?: Options.Publish, persistent = true) {

    const mergedOptions = options ?? {};
    const defaultOptions = {
      contentEncoding: 'utf-8',
      contentType:     'application/json',
      persistent
    };

    Object.assign(mergedOptions, defaultOptions);

    const buf = Buffer.from(JSON.stringify(message));
    return this.sendMessage(buf, mergedOptions);
  }

  async sendMessage(buf: Buffer, options: Options.Publish = {}) {
    return this.channel.sendToQueue(this.config.name, buf, options);
  }

  async consumeMessages(onMessageFn: Consumer['onMessage'], options: Options.Consume) {
    return this.channel.consume(
      this.config.name,
      onMessageFn,
      options
    );
  }


}

export default QueueChannel;
