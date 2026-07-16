export type TextBatchScheduler = {
  cancel: (handle: ReturnType<typeof setTimeout>) => void;
  schedule: (
    callback: () => void,
    delay: number,
  ) => ReturnType<typeof setTimeout>;
};

const defaultScheduler: TextBatchScheduler = {
  cancel: (handle) => clearTimeout(handle),
  schedule: (callback, delay) => setTimeout(callback, delay),
};

export function createTextBatcher(
  onBatch: (text: string) => void,
  interval = 40,
  scheduler = defaultScheduler,
) {
  let bufferedText = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  const commit = () => {
    timer = null;
    if (!bufferedText) {
      return;
    }

    const text = bufferedText;
    bufferedText = '';
    onBatch(text);
  };

  return {
    flush: () => {
      if (timer !== null) {
        scheduler.cancel(timer);
      }
      commit();
    },
    push: (text: string) => {
      bufferedText += text;
      if (timer === null) {
        timer = scheduler.schedule(commit, interval);
      }
    },
  };
}
