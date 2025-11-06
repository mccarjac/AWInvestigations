import { Buffer as BufferType } from 'buffer';

declare global {
  var Buffer: typeof BufferType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var process: any;
}

export {};
