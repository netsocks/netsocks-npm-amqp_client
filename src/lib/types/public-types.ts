export type RabbitClientConfig = {
  protocol: string;
  host: string;
  port?: number | 5672;
  username: string;
  password: string;
  vhost: string;
  name?: string;
}
