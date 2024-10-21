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

  realName?: string;

  constructor(client: RabbitClient, config: typeof QueueChannel.prototype.config) {
    this.client = client;
    this.config = Object.freeze(config);
    assert(this.config.name, 'queue name is required');

    if ((typeof this.config.realName === 'string')) {
      this.realName = this.config.realName;
    }
  }

  get realQueueName() {
    if (typeof this.realName !== 'string') return this.config.name;
    return this.realName.trim();
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

  async bindToExchange() {
    const config = this.config as IQueueBindConfig;

    assert(config.name, 'name is required');
    assert(config.exchangeName, 'exchangeName is required');
    // assert(config.pattern, 'pattern is required');

    const channel = this._createWrapper(config);

    await channel.waitForConnect();

    const {
      exchangeName, pattern, args
    } = config;

    if (typeof this.realName !== 'string') {
      const exists = await channel.checkQueue(this.realQueueName);

      assert(exists, `Could not connect to queue "${this.realQueueName}": Queue does not exist or is not reachable`);
    } else {
      const exists = await channel.assertQueue(this.realQueueName, {
        autoDelete: true,
        durable:    false
      });

      this.realName = exists.queue;
    }


    if (Array.isArray(pattern)) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const p of pattern) {
        await channel.bindQueue(this.realQueueName, exchangeName, p, args);
      }
    } else {
      await channel.bindQueue(this.realQueueName, exchangeName, pattern, args);
    }


    this.#_wrapper = channel;

    return this;
  }

  async create() {
    const config = this.config as IQueueAssertConfig;

    assert(config.name, 'name is required');

    const channel = this._createWrapper(config);

    await channel.waitForConnect();


    const exists = await channel.assertQueue(this.realQueueName, config.options);

    assert(exists, `Could not create queue "${this.realQueueName}": assertQueue failed`);

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

    return this.wrapper.sendToQueue(this.realQueueName, buf, options);
  }

  async consumeMessages(onMessageFn: IConsumerFn, options?: Options.Consume) {
    // do we need the concurrentMessageLimit here?

    return this.wrapper.consume(
      this.realQueueName,
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
