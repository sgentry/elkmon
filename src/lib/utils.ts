export const leftPad = function (str: string, len: number, c: string | number) {
  str = String(str);
  var i = -1;
  if (!c && c !== 0) c = ' ';
  len = len - str.length;
  while (++i < len) {
    str = c + str;
  }
  return str;
}