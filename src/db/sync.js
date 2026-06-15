let _onChange = null;

export function registerOnChange(fn) {
  _onChange = fn;
}

export function notifyChange() {
  _onChange?.();
}
