# РКП — лекционные слайды

Монорепозиторий на slidev-workspace: каждая лекция — свой Slidev-проект в
`slides/<папка>/`, общий портал собирается автоматически.

## Установка

    pnpm install

Если pnpm ругается на `ERR_PNPM_IGNORED_BUILDS` — один раз выполнить:

    pnpm approve-builds --all

## Разработка

    pnpm --filter 00-vvedenie dev      # открыть конкретную лекцию в dev-режиме
    pnpm preview                       # открыть весь портал (slidev-workspace preview)

## Сборка

    pnpm build     # соберёт все лекции + портал в ./dist

## Добавить новую лекцию

1. `mkdir -p slides/<раздел>-<тема>`
2. Скопировать `slides/00-vvedenie/package.json` в новую папку (имя `name` — поменять)
3. Написать `slides.md` (не забыть `routerMode: hash` в frontmatter — нужно для GitHub Pages)
4. `pnpm install` из корня — новый пакет подхватится автоматически (glob `slides/**` в pnpm-workspace.yaml)

## Перед первым деплоем

В `slidev-workspace.yaml` поменять `baseUrl` на реальное имя GitHub-репозитория
(например `/rkp-slides`, если репозиторий `username/rkp-slides`).

## Деплой

GitHub Actions workflow уже лежит в `.github/workflows/deploy.yml`.
В настройках репозитория: `Settings → Pages → Build and deployment → Source → GitHub Actions`.
После этого пуш в `main` сам соберёт и выложит `dist` на GitHub Pages.
