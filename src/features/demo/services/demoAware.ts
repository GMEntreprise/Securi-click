import { isDemoActive } from '../store/demo.store';

export function demoAware<T extends object>(real: T, demo: T): T {
  return new Proxy(real, {
    get(_target, key) {
      return (...args: unknown[]) => {
        const source = isDemoActive() ? demo : real;
        const method = Reflect.get(source, key) as (
          ...callArgs: unknown[]
        ) => unknown;
        return method.apply(source, args);
      };
    },
  });
}
