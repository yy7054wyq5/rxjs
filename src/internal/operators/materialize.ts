import { Operation, FOType, Sink, SinkArg, Notification } from '../types';
import { Observable } from '../Observable';
import { Subscription } from '../Subscription';
import { lift } from '../util/lift';

export function materialize<T>(includeSubscriptionNotifications = false): Operation<T, Notification<T>> {
  return lift((source: Observable<T>, dest: Sink<Notification<T>>, subs: Subscription) => {
    if (includeSubscriptionNotifications) {
      subs.add(() => dest(FOType.NEXT, { kind: 'U' }, subs));
      dest(FOType.NEXT, { kind: 'S' }, subs);
    }
    source(FOType.SUBSCRIBE, (t: FOType, v: SinkArg<T>, subs: Subscription) => {
      switch (t) {
        case FOType.NEXT:
          dest(FOType.NEXT, { kind: 'N', value: v }, subs);
          break;
        case FOType.ERROR:
          dest(FOType.NEXT, { kind: 'E', error: v }, subs);
          dest(FOType.COMPLETE, undefined, subs);
          break;
        case FOType.COMPLETE:
          dest(FOType.NEXT, { kind: 'C' }, subs);
          dest(FOType.COMPLETE, undefined, subs);
          break;
        default:
          break;
      }
    }, subs);
  });
}
