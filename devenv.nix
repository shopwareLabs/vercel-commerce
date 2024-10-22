{ pkgs, ... }: {
  packages = [ pkgs.nodejs_20 pkgs.pnpm ];

  languages.javascript.pnpm.install.enable = true;
}
