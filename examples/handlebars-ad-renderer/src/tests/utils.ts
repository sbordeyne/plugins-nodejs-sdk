// Sourced from Handlebars

export const escape: any = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;",
  "=": "&#x3D;"
};

export const badChars = /[&<>"'`=]/g;

export function escapeChar(chr: string): string {
  return escape[chr] as string;
}
