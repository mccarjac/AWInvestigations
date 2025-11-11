import { Buffer as BufferType } from 'buffer';

declare global {
  var Buffer: typeof BufferType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var process: any;

  // React Native ErrorUtils global
  var ErrorUtils:
    | {
        setGlobalHandler: (
          handler: (error: Error, isFatal?: boolean) => void
        ) => void;
        getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
      }
    | undefined;
}

export {};
