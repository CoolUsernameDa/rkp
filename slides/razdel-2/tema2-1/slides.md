---
theme: default
title: 2.1 Асинхронное программирование
info: |
  Тема 2.1. Асинхронное программирование: event loop, корутины,
  синхронизация.
transition: fade
mdc: true
routerMode: hash
addons:
  - slidev-addon-python-runner
python:
  installs: []
  loadPackagesFromImports: true
  suppressDeprecationWarnings: true
layout: cover
---

# 2.1. Асинхронное программирование

Событийный цикл, корутины и задачи, примитивы синхронизации, типичные
применения asyncio

---
layout: default
---

# Зачем это знать

Веб-сервер обслуживает тысячу клиентов одновременно. Каждый запрос
требует обращения к базе данных и к внешнему сервису. Почти всё время
обработки запроса программа ждёт ответа по сети, а процессор простаивает.

<v-clicks>

- Один поток на каждого клиента — тысяча потоков, каждый со своим стеком в памяти
- Асинхронный подход — один поток, который переключается между запросами, пока они ждут
- На этой модели построены современные веб-фреймворки, боты, сетевые клиенты и клиенты языковых моделей

</v-clicks>

---
layout: default
---

# План на сегодня

<v-clicks>

- Модель выполнения: событийный цикл, одновременность и параллелизм
- Корутины: `async def`, `await`, `asyncio.run`
- Задачи: `create_task`, `gather`, `TaskGroup`, отмена, блокирующие вызовы
- Синхронизация: `Lock`, `Semaphore`, `Event`, `Queue`
- Применения: таймауты, сетевые запросы, ограничение нагрузки
- Где asyncio встречается на практике

</v-clicks>

---
layout: default
---

# Напоминание: потоки и GIL

<v-clicks>

- Поток — последовательность выполнения внутри процесса; потоки процесса делят общую память
- GIL (Global Interpreter Lock) позволяет в каждый момент выполнять байт-код Python только одному потоку
- Задачи с упором в процессор (CPU-bound) потоки не ускоряют, для них нужны процессы
- Задачи с упором в ввод-вывод (I/O-bound) потоки ускоряют: во время ожидания сети или диска GIL освобождается
- Асинхронное программирование — ещё один способ ускорить задачи ввода-вывода, на этот раз в одном потоке

</v-clicks>

---
layout: default
---

# Сколько программа ждёт

Сетевой запрос состоит из короткой подготовки, долгого ожидания ответа и
короткой обработки результата.

<AsyncTimeline :modes="['io']" />

<v-click>

Пока одна задача ждёт ответа, процессор свободен. Асинхронная модель
отдаёт это время другим задачам.

</v-click>

---
layout: default
---

# Вытесняющая многозадачность

Так работают потоки.

<v-clicks>

- Переключением управляет операционная система
- Поток могут прервать в любой момент, даже посреди выражения `counter += 1`
- Код не знает, где произойдёт переключение, поэтому общие данные защищают замками
- Каждый поток получает собственный стек: это память и время на создание

</v-clicks>

---
layout: default
---

# Кооперативная многозадачность

Так работают корутины asyncio.

<v-clicks>

- Задача сама отдаёт управление в явно отмеченных местах — на `await`
- Между двумя `await` код выполняется без переключений
- Все задачи работают в одном потоке, переключает их событийный цикл
- Задача, которая долго не доходит до `await`, задерживает все остальные

</v-clicks>

---
layout: default
---

# Одновременность

Одновременность (concurrency) — несколько задач находятся в процессе
выполнения в один и тот же промежуток времени.

<AsyncTimeline :modes="['interleave']" />

---
layout: default
---

# Параллелизм

Параллелизм (parallelism) — несколько задач выполняются в один и тот же
момент на разных ядрах.

<AsyncTimeline :modes="['parallel']" />

<v-click>

asyncio обеспечивает одновременность без параллелизма: один поток, одно
ядро, много задач. Для задач ввода-вывода этого достаточно, потому что
большую часть времени они ждут.

</v-click>

---
layout: default
---

# Событийный цикл

Событийный цикл (event loop) — диспетчер, который по очереди выполняет
задачи и следит за событиями: срабатыванием таймеров и готовностью сокетов.

```python
while есть_задачи:
    for задача in готовые:
        выполнить_до_следующего_await(задача)
    ждать_событий(до_ближайшего_таймера)      # сон без нагрузки на процессор
    перенести_в_готовые(дождавшиеся)
```

<v-click>

Это упрощённая схема. Реальный цикл в модуле `asyncio` устроен так же:
очередь готовых задач, набор ожидающих и один вызов ожидания событий.

</v-click>

---
layout: default
clicks: 8
---

# Цикл по шагам: таймеры

<EventLoopSim preset="timers" :step="$clicks" />

---
layout: default
---

# Как цикл узнаёт о готовности сети

<v-clicks>

- Сетевое соединение в программе представлено сокетом
- Цикл переводит сокеты в неблокирующий режим: операция возвращается сразу, даже если данных ещё нет
- Список ожидаемых сокетов передаётся операционной системе одним системным вызовом
- Linux предоставляет для этого `epoll`, macOS — `kqueue`, Windows — порты завершения ввода-вывода (IOCP)
- Один такой вызов отслеживает тысячи соединений и возвращает те, в которые пришли данные

</v-clicks>

---
layout: default
clicks: 8
---

# Цикл по шагам: сеть

<EventLoopSim preset="network" :step="$clicks" />

---
layout: default
---

# Потоки и asyncio

| | Потоки | asyncio |
|---|---|---|
| Кто переключает | Операционная система | Событийный цикл, в точках `await` |
| Где возможно переключение | В любом месте кода | Только на `await` |
| Память на 10 000 единиц | +158 МБ | +14 МБ |
| Блокирующий вызов | Блокирует только свой поток | Останавливает все задачи |
| Библиотеки | Любые | Нужны асинхронные версии |

<style>
.slidev-layout table { font-size: 0.85em; }
</style>

---
layout: default
---

# Замер памяти

```python
# 10 000 задач asyncio, каждая ждёт asyncio.sleep(1)
tasks = [asyncio.create_task(coro()) for _ in range(10_000)]

# 10 000 потоков, каждый ждёт события
threads = [threading.Thread(target=stop.wait) for _ in range(10_000)]
```

Прирост памяти процесса (максимальный RSS) в реальном прогоне на Linux:

```text
10 000 задач asyncio: +14 МБ
10 000 потоков: +158 МБ
```

<v-click>

Задача asyncio хранит только состояние своей корутины. Потоку нужен
собственный стек и структура в ядре операционной системы.

</v-click>

---
layout: default
---

# От генераторов к корутинам

Генератор из темы 1.4 приостанавливается на `yield` и сохраняет локальные
переменные. Корутина использует ту же идею: она приостанавливается на
`await`, пока ждёт результат.

```python
def count_to(n):                  # генератор
    for i in range(1, n + 1):
        yield i                   # отдать значение, приостановиться

async def fetch_data():           # корутина
    data = await read_socket()    # ждать результата, приостановиться
    return data
```

---
layout: default
---

# `async def`

Функция, объявленная через `async def`, — корутинная функция. Её вызов
возвращает объект-корутину и не выполняет тело.

```py {monaco-run}
async def hello():
    print("тело выполняется")
    return 42

c = hello()
print(type(c).__name__)
result = await c
print(result)
```

<v-click>

Строка «тело выполняется» напечаталась только после `await c`. Сам вызов
`hello()` лишь создал объект, как вызов генераторной функции.

</v-click>

---
layout: default
---

# Что можно ждать через `await`

<v-clicks>

- Корутину — объект, возвращённый вызовом `async def`-функции
- Задачу (`asyncio.Task`) — корутину, которую цикл выполняет самостоятельно
- `Future` — объект-обещание результата, который появится позже
- Такие объекты называются awaitable
- `await` разрешён только внутри `async def`
- Обычные функции, в том числе `time.sleep`, не являются awaitable

</v-clicks>

---
layout: default
clicks: 6
---

# Куда уходит управление при `await`

<AwaitChain :step="$clicks" />

---
layout: default
---

# Запуск: `asyncio.run`

Программа-скрипт запускает асинхронный код одной точкой входа:

```python
import asyncio

async def main():
    ...

asyncio.run(main())
```

<v-clicks>

- `asyncio.run` создаёт событийный цикл, выполняет `main()` до конца и закрывает цикл
- Интерактивные среды (Jupyter, `python -m asyncio`) держат цикл запущенным, в них `await` пишут прямо на верхнем уровне
- Живые примеры этой лекции работают так же: `await` на верхнем уровне без `asyncio.run`

</v-clicks>

---
layout: default
---

# Первая корутина вживую

```py {monaco-run}
import asyncio, time

async def brew(name, seconds):
    print(f"{name}: начало")
    await asyncio.sleep(seconds)
    print(f"{name}: готово")

start = time.perf_counter()
await brew("чай", 1)
await brew("кофе", 1)
await brew("какао", 1)
print(f"прошло {time.perf_counter() - start:.1f} с")
```

<v-click>

Три ожидания по секунде заняли 3 секунды. `await` дожидается завершения
корутины и только потом переходит к следующей строке.

</v-click>

---
layout: default
---

# Почему 3 секунды

`await brew(...)` выполняет корутину внутри текущей задачи. Пока она ждёт,
других задач в цикле нет, и следующее ожидание начинается только после
предыдущего.

<AsyncTimeline :modes="['sequential']" />

---
layout: default
---

# Забытый `await`

```python
async def save():
    print("сохранено")

async def main():
    save()                        # забыли await
    print("конец")

asyncio.run(main())
```

Реальный вывод (сокращён):

```text
main.py:7: RuntimeWarning: coroutine 'save' was never awaited
  save()                        # забыли await
конец
```

<v-click>

Вызов `save()` создал объект-корутину и выбросил его, тело не выполнилось.
Ошибки нет, есть только предупреждение, поэтому такую ошибку легко
пропустить.

</v-click>

---
layout: default
---

# Задача: `asyncio.create_task`

Чтобы корутины выполнялись одновременно, их оборачивают в задачи.

```python
task = asyncio.create_task(brew("чай", 1))
```

<v-clicks>

- Задача сразу ставится в очередь готовых: цикл выполнит её, как только текущий код дойдёт до `await`
- `await task` дожидается результата задачи
- Пока одна задача ждёт, цикл выполняет другие
- На созданную задачу нужно хранить ссылку, иначе её может удалить сборщик мусора

</v-clicks>

---
layout: default
clicks: 6
---

# Жизненный цикл задачи

<TaskStates :step="$clicks" />

---
layout: default
---

# Задачи вживую

```py {monaco-run}
import asyncio

async def worker(name, n):
    for i in range(n):
        print(name, i)
        await asyncio.sleep(0.1)

t1 = asyncio.create_task(worker("A", 3))
t2 = asyncio.create_task(worker("B", 3))
print("задачи созданы")
await t1
await t2
```

<v-click>

Строка «задачи созданы» напечаталась первой: задачи только поставлены в
очередь. Дальше вывод чередуется — на каждом `await` цикл переключается на
другую задачу.

</v-click>

---
layout: default
---

# `asyncio.gather`

`gather` принимает несколько корутин, оборачивает их в задачи, ждёт все и
возвращает список результатов в исходном порядке.

```py {monaco-run}
import asyncio, time

async def brew(name, seconds):
    await asyncio.sleep(seconds)
    return name

start = time.perf_counter()
results = await asyncio.gather(brew("чай", 1), brew("кофе", 1), brew("какао", 1))
print(results)
print(f"прошло {time.perf_counter() - start:.1f} с")
```

<v-click>

Три ожидания по секунде заняли одну секунду: все задачи ждали
одновременно.

</v-click>

---
layout: default
clicks: 2
---

# Три способа на одной шкале

<AsyncTimeline :modes="['sequential', 'gather', 'threads']" shared compact :step="$clicks" />

---
layout: default
---

# Исключения в `gather`

```py {monaco-run}
import asyncio

async def ok(x):
    await asyncio.sleep(0.1)
    return x

async def fail():
    await asyncio.sleep(0.1)
    raise ValueError("сбой")

print(await asyncio.gather(ok(1), fail(), ok(3), return_exceptions=True))
try:
    await asyncio.gather(ok(1), fail(), ok(3))
except ValueError as e:
    print("исключение:", e)
```

<v-click>

С `return_exceptions=True` исключение попадает в список результатов. Без
него первое исключение поднимается в вызывающем коде, а остальные задачи
продолжают работать в фоне.

</v-click>

---
layout: default
---

# `TaskGroup`

Группа задач (Python 3.11+) — запуск задач в блоке `async with`. Выход из
блока происходит, когда завершены все задачи группы. Если одна задача
падает, остальные отменяются.

```py {monaco-run}
import asyncio

async def brew(name, seconds):
    await asyncio.sleep(seconds)
    return name

async with asyncio.TaskGroup() as tg:
    t1 = tg.create_task(brew("чай", 1))
    t2 = tg.create_task(brew("кофе", 0.5))

print(t1.result(), t2.result())
```

---
layout: default
---

# Отмена задачи

```py {monaco-run}
import asyncio

async def long_job():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("отмена: освобождаем ресурсы")
        raise

task = asyncio.create_task(long_job())
await asyncio.sleep(0.5)
task.cancel()
try:
    await task
except asyncio.CancelledError:
    print("task.cancelled():", task.cancelled())
```

<v-click>

`cancel()` поднимает `CancelledError` внутри задачи на том `await`, где она
стоит. Задача может освободить ресурсы, но исключение нужно передать
дальше через `raise`.

</v-click>

---
layout: default
---

# Блокирующий вызов

```python
async def brew(name):
    print(f"{name}: начало")
    time.sleep(1)                 # блокирующий вызов
    print(f"{name}: готово")

async def main():
    start = time.perf_counter()
    await asyncio.gather(brew("чай"), brew("кофе"), brew("какао"))
    print(f"прошло {time.perf_counter() - start:.1f} с")
```

Реальный вывод:

```text
чай: начало
чай: готово
кофе: начало
кофе: готово
какао: начало
какао: готово
прошло 3.0 с
```

---
layout: default
---

# Что произошло

`time.sleep` останавливает весь поток и не отдаёт управление циклу. Пока
одна корутина спит, остальные стоят в очереди готовых.

<AsyncTimeline :modes="['blocking']" />

---
layout: default
---

# `asyncio.to_thread`

Блокирующую функцию, у которой нет асинхронной версии, выполняют в
отдельном потоке. Корутина ждёт результат, а цикл продолжает работу.

```python
def legacy_download(name):        # обычная блокирующая функция
    time.sleep(1)
    return name

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(
        asyncio.to_thread(legacy_download, "a.csv"),
        asyncio.to_thread(legacy_download, "b.csv"),
        asyncio.to_thread(legacy_download, "c.csv"),
    )
    print(results, f"{time.perf_counter() - start:.1f} с")
```

```text
['a.csv', 'b.csv', 'c.csv'] 1.0 с
```

---
layout: default
---

# Что блокирует цикл

| Блокирует | Асинхронная замена |
|---|---|
| `time.sleep(1)` | `await asyncio.sleep(1)` |
| `requests.get(url)` | `await client.get(url)` в `httpx.AsyncClient` или `aiohttp` |
| Синхронный драйвер базы данных | Асинхронный драйвер, например `asyncpg` |
| Обычная функция без асинхронной версии | `await asyncio.to_thread(f, ...)` |
| Долгие вычисления | Отдельный процесс |

<style>
.slidev-layout table { font-size: 0.85em; }
</style>

---
layout: default
---

# Синхронизация в одном потоке

<v-clicks>

- Переключение происходит только на `await`, поэтому код между двумя `await` выполняется без вмешательства других задач
- Гонка возможна, если чтение общих данных и запись результата разделены `await`
- Типичный случай: прочитать значение, дождаться ответа сервера, записать новое значение
- Для таких участков в `asyncio` есть свои примитивы синхронизации: `Lock`, `Semaphore`, `Event`, `Queue`
- Примитивы из модуля `threading` в корутинах не используют: они блокируют поток

</v-clicks>

---
layout: default
clicks: 6
---

# Гонка по шагам

<RaceInterleave :step="$clicks" />

---
layout: default
---

# Гонка вживую

```py {monaco-run}
import asyncio

counter = 0

async def increment():
    global counter
    value = counter
    await asyncio.sleep(0)      # точка переключения
    counter = value + 1

await asyncio.gather(*(increment() for _ in range(100)))
print(counter)
```

<v-click>

Сто задач прочитали `counter = 0` до того, как хоть одна успела записать
результат. Все записали 1. `asyncio.sleep(0)` здесь заменяет любое
настоящее ожидание: запрос к серверу или базе данных.

</v-click>

---
layout: default
clicks: 6
---

# `asyncio.Lock` по шагам

<RaceInterleave locked :step="$clicks" />

---
layout: default
---

# `Lock` вживую

```py {monaco-run}
import asyncio

counter = 0
lock = asyncio.Lock()

async def increment():
    global counter
    async with lock:
        value = counter
        await asyncio.sleep(0)
        counter = value + 1

await asyncio.gather(*(increment() for _ in range(100)))
print(counter)
```

<v-click>

Внутри `async with lock` находится только одна задача. Остальные ждут на
входе в блок, не мешая циклу выполнять другие задачи.

</v-click>

---
layout: default
clicks: 4
---

# `asyncio.Semaphore`

Семафор пропускает внутрь блока не больше N задач одновременно. Так
ограничивают число одновременных запросов к серверу.

<SemaphoreGate :step="$clicks" />

---
layout: default
---

# `Semaphore` вживую

```py {monaco-run}
import asyncio, time

sem = asyncio.Semaphore(2)
start = time.perf_counter()

async def download(i):
    async with sem:
        print(f"{time.perf_counter() - start:.1f} с: загрузка {i}")
        await asyncio.sleep(1)

await asyncio.gather(*(download(i) for i in range(5)))
print(f"всего {time.perf_counter() - start:.1f} с")
```

<v-click>

Загрузки стартуют парами: в моменты 0, 1 и 2 секунды. Пять загрузок по
секунде при лимите 2 заняли 3 секунды.

</v-click>

---
layout: default
---

# `asyncio.Event`

Событие — флаг, которого задачи ждут через `await event.wait()`. Вызов
`event.set()` будит всех ожидающих сразу.

```py {monaco-run}
import asyncio

ready = asyncio.Event()

async def waiter(name):
    print(name, "ждёт сигнала")
    await ready.wait()
    print(name, "продолжил")

async def setter():
    await asyncio.sleep(1)
    print("сигнал")
    ready.set()

await asyncio.gather(waiter("A"), waiter("B"), setter())
```

---
layout: default
clicks: 5
---

# `asyncio.Queue`

Очередь передаёт данные от задач-производителей задачам-потребителям.
`await queue.get()` ждёт, пока в очереди появится элемент.

<QueueFlow :step="$clicks" />

---
layout: default
---

# `Queue` вживую

```py {monaco-run}
import asyncio

queue = asyncio.Queue()

async def producer():
    for i in range(6):
        await queue.put(i)
    for _ in range(2):
        await queue.put(None)      # сигнал «работы больше нет»

async def consumer(name):
    while (item := await queue.get()) is not None:
        print(name, "обработал", item)
        await asyncio.sleep(0.3)

await asyncio.gather(producer(), consumer("A"), consumer("B"))
```

<v-click>

Потребители делят работу сами: свободный забирает следующий элемент. Так
устроены очереди фоновых задач — отправка писем, обработка загруженных
файлов.

</v-click>

---
layout: default
---

# Примитивы синхронизации

| Примитив | Что делает | Типичное применение |
|---|---|---|
| `Lock` | Один участник внутри блока | Чтение и запись общих данных через `await` |
| `Semaphore(n)` | Не больше `n` участников | Ограничение одновременных запросов |
| `Event` | Флаг, которого ждут | Сигнал «данные готовы», «сервер запущен» |
| `Queue` | Передача элементов между задачами | Производители и потребители, фоновые работы |

---
layout: default
clicks: 2
---

# Таймауты

Сервер может не ответить никогда. Ожидание без ограничения времени
подвесит задачу навсегда.

<TimeoutCancel :step="$clicks" />

---
layout: default
---

# Таймауты вживую

```py {monaco-run}
import asyncio

async def slow():
    await asyncio.sleep(2)
    return "ответ"

try:
    answer = await asyncio.wait_for(slow(), timeout=0.5)
except TimeoutError:
    print("wait_for: нет ответа за 0.5 с")

try:
    async with asyncio.timeout(0.5):
        await slow()
except TimeoutError:
    print("timeout: нет ответа за 0.5 с")
```

<v-click>

`wait_for` ограничивает одно ожидание. `asyncio.timeout` (Python 3.11+)
ограничивает весь блок кода целиком, сколько бы `await` в нём ни было.

</v-click>

---
layout: default
---

# `async with` и `async for`

<v-clicks>

- `async with` — контекстный менеджер, вход и выход которого тоже ждут: открыть соединение, захватить замок
- `async for` — обход асинхронного итератора, каждый следующий элемент получается через `await`
- Асинхронный генератор — `async def` с `yield` внутри

</v-clicks>

```py {monaco-run}
import asyncio

async def ticker(n):
    for i in range(n):
        await asyncio.sleep(0.3)
        yield i

async for t in ticker(3):
    print("тик", t)
```

---
layout: default
---

# HTTP-запросы: последовательно

Тестовый сервер отвечает на каждый запрос через 1 секунду. Пять запросов
обычным клиентом `httpx`:

```python
import httpx, time

urls = [f"http://localhost:8000/item/{i}" for i in range(1, 6)]

start = time.perf_counter()
with httpx.Client() as client:
    for url in urls:
        r = client.get(url)
        print(r.status_code, r.json())
print(f"прошло {time.perf_counter() - start:.1f} с")
```

```text
200 {'path': '/item/1'}
...
200 {'path': '/item/5'}
прошло 5.1 с
```

---
layout: default
---

# HTTP-запросы: асинхронно

```python
import asyncio, httpx, time

urls = [f"http://localhost:8000/item/{i}" for i in range(1, 6)]

async def main():
    start = time.perf_counter()
    async with httpx.AsyncClient() as client:
        responses = await asyncio.gather(*(client.get(u) for u in urls))
    for r in responses:
        print(r.status_code, r.json())
    print(f"прошло {time.perf_counter() - start:.1f} с")

asyncio.run(main())
```

```text
200 {'path': '/item/1'}
...
200 {'path': '/item/5'}
прошло 1.1 с
```

---
layout: default
---

# Загрузчик с ограничением

```python
urls = [f"http://localhost:8000/item/{i}" for i in range(1, 10)]
limit = asyncio.Semaphore(3)            # не больше 3 запросов одновременно

async def fetch(client, url):
    async with limit:
        r = await client.get(url, timeout=5)
        return r.status_code

async def main():
    start = time.perf_counter()
    async with httpx.AsyncClient() as client:
        codes = await asyncio.gather(*(fetch(client, u) for u in urls))
    print(codes)
    print(f"9 запросов, лимит 3: {time.perf_counter() - start:.1f} с")
```

```text
[200, 200, 200, 200, 200, 200, 200, 200, 200]
9 запросов, лимит 3: 3.2 с
```

---
layout: default
---

# Когда asyncio не поможет

```python
async def heavy(n):
    return sum(i * i for i in range(n))     # вычисления без await

async def main():
    start = time.perf_counter()
    await heavy(10_000_000)
    one = time.perf_counter() - start

    start = time.perf_counter()
    await asyncio.gather(heavy(10_000_000), heavy(10_000_000), heavy(10_000_000))
    three = time.perf_counter() - start
    print(f"одна задача: {one:.1f} с, три через gather: {three:.1f} с")
```

```text
одна задача: 0.6 с, три через gather: 1.9 с
```

---
layout: default
---

# Вычисления на шкале времени

В вычислениях нет `await`, ждать нечего, и цикл не может переключиться.
Ускорить такие задачи помогают только процессы
(`multiprocessing`, `ProcessPoolExecutor`).

<AsyncTimeline :modes="['cpu']" />

---
layout: default
---

# Что выбрать

| Задача | Подход |
|---|---|
| Много сетевых запросов, тысячи соединений | asyncio |
| Ввод-вывод через библиотеки без асинхронной версии | Потоки или `asyncio.to_thread` |
| Вычисления: обработка изображений, математика | Процессы |
| Сервер, который ждёт сеть и иногда считает | asyncio, вычисления — в процессы |

---
layout: default
---

# Где используется asyncio

<v-clicks>

- Веб-фреймворки и серверы: FastAPI, Starlette, aiohttp, Uvicorn
- Боты: aiogram для Telegram, discord.py для Discord
- HTTP-клиенты: `httpx.AsyncClient`, `aiohttp.ClientSession`
- Клиенты языковых моделей: асинхронные версии клиентов, например `AsyncOpenAI`
- Базы данных: асинхронные драйверы, например `asyncpg` для PostgreSQL
- Автоматизация браузера: асинхронный интерфейс Playwright
- Умный дом: платформа Home Assistant построена на asyncio

</v-clicks>

---
layout: default
---

# Пример: обработчик веб-сервера

```python
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.get("/weather/{city}")
async def weather(city: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"https://api.example.com/weather/{city}")
    return r.json()
```

<v-click>

Обработчик объявлен через `async def`. Пока он ждёт ответа внешнего
сервиса, сервер в том же потоке принимает и обрабатывает запросы других
клиентов. Сотни одновременных запросов обслуживает один процесс.

</v-click>

---
layout: default
---

# Где увидеть самому: REPL и Jupyter

Команда `python -m asyncio` запускает интерактивную оболочку с работающим
событийным циклом. Реальный сеанс (приветствие сокращено):

```text
$ python -m asyncio
asyncio REPL 3.12.3
Use "await" directly instead of "asyncio.run()".
>>> import asyncio
>>> await asyncio.sleep(0.1, result="готово")
'готово'
```

<v-click>

Jupyter Notebook тоже держит цикл запущенным: в ячейке можно сразу писать
`await`, без `asyncio.run`.

</v-click>

---
layout: default
---

# Где увидеть самому: режим отладки

`asyncio.run(main(), debug=True)` включает проверки цикла. Одна из них
сообщает о задачах, которые держали цикл дольше 100 мс.

```python
async def handler():
    time.sleep(0.3)               # блокирует цикл
    await asyncio.sleep(0)

asyncio.run(handler(), debug=True)
```

Реальный вывод (сокращён):

```text
Executing <Task pending name='Task-1' coro=<handler() running at
main.py:5> ...> took 0.301 seconds
```

---
layout: default
---

# Та же модель в других языках

<v-clicks>

- JavaScript: `async function` и `await`, событийный цикл в браузере и в Node.js
- C#: `async Task` и `await`
- Rust: `async fn` и `.await`, цикл предоставляет библиотека, например Tokio
- Kotlin: корутины и функции `suspend`
- Во вкладке «Сеть» инструментов разработчика браузера видно, как страница загружает десятки файлов одновременно: это работа событийного цикла JavaScript

</v-clicks>

---
layout: default
---

# Найдите ошибку

```python
import asyncio

async def notify(user):
    await asyncio.sleep(0.5)
    print("уведомление для", user)

async def main():
    for user in ["anna", "boris", "vera"]:
        asyncio.create_task(notify(user))
    print("все уведомления отправлены")

asyncio.run(main())
```

Ожидается три строки «уведомление для ...». Что выведет программа?

---
layout: default
---

# Разбор

Реальный вывод — одна строка: `все уведомления отправлены`.

<v-click>

`main` создала задачи, но не дождалась их и завершилась сразу. `asyncio.run`
после завершения `main` отменяет оставшиеся задачи и закрывает цикл.
Исправление — дождаться задач, например через `TaskGroup`:

```py {monaco-run}
import asyncio

async def notify(user):
    await asyncio.sleep(0.5)
    print("уведомление для", user)

async def main():
    async with asyncio.TaskGroup() as tg:
        for user in ["anna", "boris", "vera"]:
            tg.create_task(notify(user))
    print("все уведомления отправлены")

await main()
```

</v-click>

---
layout: default
---

# Конспект

| Тема | Суть | Когда важно |
|---|---|---|
| Событийный цикл | Один поток, переключение на `await` | Ввод-вывод, тысячи соединений |
| Корутина | `async def`, вызов создаёт объект | Без `await` тело не выполнится |
| Задачи | `create_task`, `gather`, `TaskGroup` | Одновременное ожидание |
| Блокировка | `time.sleep` и синхронные библиотеки | `to_thread` или процессы |
| Синхронизация | `Lock`, `Semaphore`, `Event`, `Queue` | Общие данные между `await` |
| Таймауты | `wait_for`, `asyncio.timeout` | Любое сетевое ожидание |

<style>
.slidev-layout table { font-size: 0.78em; }
.slidev-layout td, .slidev-layout th { padding-top: 0.3em; padding-bottom: 0.3em; }
</style>

---
layout: center
---

<script setup>
import VueQrcode from 'vue-qrcode'
</script>

# Самостоятельно

[LeetCode 1115. Print FooBar Alternately](https://leetcode.com/problems/print-foobar-alternately/)

Два исполнителя должны печатать «foo» и «bar» строго по очереди. Задача
решается примитивами синхронизации: замками, семафорами или событиями.

<VueQrcode value="https://leetcode.com/problems/print-foobar-alternately/" :options="{ width: 250 }" class="mx-auto my-6 rounded-lg" />

---
layout: end
---

# Вопросы
