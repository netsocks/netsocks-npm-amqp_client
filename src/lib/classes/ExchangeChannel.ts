import assert from 'node:assert';

import { Channel, ChannelWrapper, Options } from 'amqp-connection-manager';
import type { Consumer }                    from 'amqp-connection-manager/dist/types/ChannelWrapper';

import type { RabbitClient }    from '@library/classes/RabbitClient';
import type { IExchangeConfig } from '@library/types/internal-types';


class ExchangeChannel {
  client: RabbitClient;

  config: IExchangeConfig;

  #_wrapper?: ChannelWrapper;

  constructor(client: RabbitClient, config: IExchangeConfig) {
    this.client = client;
    this.config = Object.freeze(config);
  }

  get wrapper() {
    assert(this.#_wrapper, `Exchange channel "${this.config.name}" not established. Did you call .declareExchange()?`);

    return this.#_wrapper;
  }

  private _createWrapper(config: IExchangeConfig) {
    const { name, concurrentMessageLimit } = config;

    assert(name, 'name is required');

    const channelWrapper = this.client.connection.createChannel({
      // json: true,
      confirm: false,
      setup(channel: Channel) {
        if (concurrentMessageLimit && concurrentMessageLimit >= 1) {
          return channel.prefetch(concurrentMessageLimit);
        }

        return true;
      }
    });
    return channelWrapper;
  }

  async connect(config: IExchangeConfig) {

    const channel = this._createWrapper(config);

    await channel.waitForConnect();

    const exists = await channel.checkExchange(config.name);

    assert(exists, `Could not connect to exchange "${config.name}": Exchange does not exist or is not reachable`);

    this.#_wrapper = channel;

    return this;
  }

  async create(config: IExchangeConfig) {

    const channel = this._createWrapper(config);

    await channel.waitForConnect();

    const exists = await channel.assertExchange(config.name, config.type, config.options);

    assert(exists, `Could not connect to exchange "${config.name}": Exchange does not exist or is not reachable`);

    this.#_wrapper = channel;

    return this;
  }

  async sendJSONMessage(
    routingKey: string,
    message: Object,
    options: Options.Publish,
    persistent = true
  ) {
    const mergedOptions = options ?? {};
    const defaultOptions = {
      contentEncoding: 'utf-8',
      contentType:     'application/json',
      persistent
    };

    Object.assign(mergedOptions, defaultOptions);

    const buf = Buffer.from(JSON.stringify(message));
    return this.sendMessage(routingKey, buf, mergedOptions);
  }

  async sendMessage(routingKey: string, buf: Buffer, options: Options.Publish = {}) {
    // assert(buf, 'buffer cannot be empty');

    return this.wrapper
      .publish(this.config.name, routingKey, buf, options);
  }

  async consumeMessages(onMessageFn: Consumer['onMessage'], options: Options.Consume) {
    // do we need the concurrentMessageLimit here?
    return this.wrapper.consume(
      this.config.name,
      onMessageFn,
      options
    );
  }

}

export default ExchangeChannel;
