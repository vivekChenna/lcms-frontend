import { useEffect, useState } from "react";

/**
 * A text box that tells its page about the value only after the user pauses typing, so a search does
 * not fire a request per keystroke.
 *
 * `committed` is the value the page currently holds (for example from the URL); `commit` is called
 * with the typed text after `delay` ms of quiet. The box follows `committed` when it changes from
 * elsewhere (back button, "Clear filters"). `waiting` is true from the first keystroke until the
 * page has taken the value, which is when a spinner should already show.
 */
export function useDebouncedField(committed: string, commit: (value: string) => void, delay = 300) {
  const [text, setText] = useState(committed);

  useEffect(() => setText(committed), [committed]);

  useEffect(() => {
    if (text === committed) return;
    const id = setTimeout(() => commit(text), delay);
    return () => clearTimeout(id);
    // `commit` is usually a fresh closure each render; only typing should restart the timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return { text, setText, waiting: text !== committed };
}
