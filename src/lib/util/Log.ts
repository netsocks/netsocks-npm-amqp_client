import { LIB_VERSION } from '@build-info';

const TAG = `[AMPQ-RabbitClient v${LIB_VERSION}]`;

export default {
  d: (...args: any[]) => console.log(TAG, ...args),
  e: (...args: any[]) => console.error(TAG, ...args),
  i: (...args: any[]) => console.info(TAG, ...args),
  w: (...args: any[]) => console.warn(TAG, ...args)
};
