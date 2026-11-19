/** Escapes `\`, `%` and `_` for use in `LIKE ... ESCAPE '\'`. */
export function escapeLikePattern(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_')
}
