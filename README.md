# @netsocks/amqp_client

AMQP Client/Manager for amqplib, This is a wrapper around "amqp-connection-manager" which provides easy queue/exchange management/creation


# Ideas
- Use multiple "self-managed" channels for exchange/queue instead of a single instance
- Auto reconnect channel if gets broken (by acking the same message for example)

PRs are always welcomed.