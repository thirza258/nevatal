/** Counts words the same way everywhere so pages do not each roll their own. */
export const countWords = (text: string): number => {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};
