/** Shared triggers stay small so using search does not also download the chat UI. */
export const TWIN_ENDPOINT = 'https://shuaiwang-twin.shuaiwang-io.workers.dev';
export const ASK_EVENT = 'twin:ask';

export function askTwin(question: string) {
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: question }));
}
