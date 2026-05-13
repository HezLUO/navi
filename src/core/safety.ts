const sensitiveMatchers = [
  /^\.env($|\.)/,
  /(^|\/)id_rsa$/,
  /(^|\/)id_ed25519$/,
  /(^|\/).*private.*key/i,
  /(^|\/).*token.*/i,
  /(^|\/)credentials($|\/|\.)/i,
  /(^|\/)node_modules($|\/)/,
  /(^|\/)dist($|\/)/,
  /(^|\/)build($|\/)/,
];

export function isSensitivePath(relativePath: string): boolean {
  const normalized = relativePath.replaceAll("\\", "/");
  return sensitiveMatchers.some((matcher) => matcher.test(normalized));
}

export function isAllowedInspectionCommand(command: string[]): boolean {
  const joined = command.join(" ");
  const allowed = [
    /^git status( --short)?$/,
    /^git log --oneline -\d+$/,
    /^git rev-parse --show-toplevel$/,
    /^git branch --show-current$/,
  ];
  return allowed.some((matcher) => matcher.test(joined));
}
