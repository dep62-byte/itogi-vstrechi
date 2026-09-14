# Переносимый скилл «Итоги встречи» — Implementation Plan

Goal: продавец устанавливает один пакет, прикладывает транскрипт и получает редактируемый Google Slides; повторная правка сохраняет тот же ID.
Architecture: агент отвечает за смысл и визуальную проверку; версионный каталог — за допустимые claims и кейсы; Node scripts — за PPTX, Google authentication/account checks, upload/export и conflict protection. Google credentials никогда не входят в репозиторий. Рабочий аккаунт dep6.2, фиксированная существующая папка презентаций.
Tech Stack: Node >=20, pptxgenjs 4.0.1, Google Drive REST, workspace-mcp OAuth или Google Cloud CLI, LibreOffice/Poppler для локального просмотра (при отсутствии — Drive export).

- [x] Упаковка: отдельный public repo, root README/installer; self-contained skill folder. Проверка: установка в пустой временный каталог, ZIP совпадает с исходниками.
- [x] Каталог: перенести утверждённые продуктовые правила, выбрать оригиналы кейсов без личных данных, дать source pointers и SHA256. Проверка: visual inspection каждого включённого изображения, hashes.
- [x] Сборка: schema/renderer для title, bullets, case, table, steps; source requirement, source identity, case evidence boundaries. Проверка: malformed input/unknown case/oversized text rejected; synthetic sample editable PPTX.
- [x] Cloud: portable auth, live identity, exact folder, stable identity, ambiguous match rejection, optimistic modifiedTime protection, cloud export prior to update. Проверка: unit scenarios + live create/export/update same ID с синтетикой, refusal stale revision.
- [x] Skill: preflight, фактологический ledger, claim rules, cloud manual-edit preservation, full visual QA and honest states. Проверка: pressure scenario unavailable proof/conflicting offer/no render.
- [x] Delivery package: installer, reproducible ZIP, CI workflows, user guide; separate reviewer.
- [x] Publish: пользователь явно разрешил указанный состав пакета; открытая публикация явно разрешена пользователем; репозиторий dep62-byte/itogi-vstrechi. Выпуск ZIP запускается тегом v2.0.1; результаты проверки выпуска доступны в GitHub Actions. GitHub identities продавцов для скачивания не нужны.

User authorization: 2026-09-14 — самостоятельно доукомплектовать, автоматизировать и выложить на GitHub; получить только необходимую авторизацию. Исходный meeting-deck-bot checkout не менять.

Пакет публикуется открыто; продавцы передают ссылку Codex для установки. Результаты — ACCEPTANCE.md.
