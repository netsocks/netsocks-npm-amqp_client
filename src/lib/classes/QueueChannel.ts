import assert from 'node:assert';

import { Channel, ChannelWrapper, Options } from 'amqp-connection-manager';

import type { RabbitClient } from '@library/classes/RabbitClient';
import type {
  IQueueAssertConfig,
  IQueueBindConfig
} from '@library/types/internal-types';
import { IConsumerFn } from '@library/types/public-types';


class QueueChannel {
  client: RabbitClient;

  config: Readonly<IQueueBindConfig | IQueueAssertConfig>;

  #_wrapper?: ChannelWrapper;

  constructor(client: RabbitClient, config: typeof QueueChannel.prototype.config) {
    this.client = client;
    this.config = Object.freeze(config);
    assert(this.config.name, 'queue name is required');
  }

  get wrapper() {
    assert(this.#_wrapper, `Queue channel "${this.config.name}" not established. Did you call .declareQueue()?`);

    return this.#_wrapper;
  }

  private _createWrapper(config: typeof QueueChannel.prototype.config) {
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

  async bindToExchange(config: IQueueBindConfig) {
    assert(config.name, 'name is required');
    assert(config.exchangeName, 'exchangeName is required');
    // assert(config.pattern, 'pattern is required');

    const channel = this._createWrapper(config);

    await channel.waitForConnect();

    const {
      name, exchangeName, pattern, args
    } = config;

    await channel.bindQueue(name, exchangeName, pattern, args);

    const exists = await channel.checkQueue(config.name);

    assert(exists, `Could not connect to queue "${config.name}": Queue does not exist or is not reachable`);

    this.#_wrapper = channel;

    return this;
  }

  async create(config: IQueueAssertConfig) {
    assert(config.name, 'name is required');

    const channel = this._createWrapper(config);

    await channel.waitForConnect();

    const exists = await channel.assertQueue(config.name, config.options);

    assert(exists, `Could not create queue "${config.name}": assertQueue failed`);

    this.#_wrapper = channel;

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
    return this.wrapper.sendToQueue(this.config.name, buf, options);
  }

  async consumeMessages(onMessageFn: IConsumerFn, options?: Options.Consume) {
    // do we need the concurrentMessageLimit here?
    return this.wrapper.consume(
      this.config.name,
      onMessageFn,
      options
    );
  }

  // assert(condition: any, message: Parameters<Consumer['onMessage']>[0]) {
  //   if (!condition) {
  //     this.wrapper.ack(message);
  //   }

  //   assert(condition, 'Assertion failed');
  // }


}

export default QueueChannel;
