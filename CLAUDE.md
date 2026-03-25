# CLAUDE.md

## Supply Chain Security — Reglas de Instalación de Paquetes

> **NON-NEGOTIABLE. Aplica a CADA comando de install/add/remove.**

- **NUNCA ejecutar `yarn`, `yarn install`, `npm install`, o `pnpm install` sin `--ignore-scripts`**
  - Los archivos `.yarnrc` / `.npmrc` de este repo ya configuran `ignore-scripts=true` por defecto
  - Si falta el archivo de config, SIEMPRE pasar `--ignore-scripts` explícitamente
- **NUNCA remover ni modificar la configuración `ignore-scripts`** en `.yarnrc`, `.npmrc`, o `.yarnrc.yml`
- **NUNCA ejecutar `--ignore-scripts false`** excepto en deploy scripts de producción en VPS
- **Después de `yarn`**: si el proyecto tiene script `setup`, ejecutar `yarn setup` para tareas post-install confiables (Husky, Prisma, patch-package)
- **Al agregar dependencia nueva**: `yarn add <paquete>` respeta `.yarnrc`, los scripts del paquete NO se ejecutan
- **Si un paquete genuinamente necesita postinstall**: documentar en este CLAUDE.md y agregar el rebuild explícito al script `setup`
