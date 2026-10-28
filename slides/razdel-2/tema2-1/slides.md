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

Веб-сервер почти не считает. Получив запрос, он обращается к базе данных
и к внешнему сервису, а потом ждёт их ответа.

<AsyncTimeline :modes="['io']" />

<v-click>

Пока запрос ждёт сеть, процессор свободен. Если завести по потоку на
каждого клиента, тысяча клиентов превратится в тысячу потоков со своими
стеками. Асинхронная программа обслуживает их в одном потоке и
переключается между запросами на время ожидания.

</v-click>

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

- Поток выполняет код внутри процесса, потоки одного процесса делят общую память
- GIL (Global Interpreter Lock) разрешает выполнять байт-код Python только одному потоку за раз
- Поэтому вычисления (CPU-bound) потоки не ускоряют, для них берут процессы
- Ожидание сети или диска (I/O-bound) потоки ускоряют: на время ожидания поток отпускает GIL
- asyncio ускоряет ту же работу с ожиданием, оставаясь в одном потоке

</v-clicks>

---
layout: default
---

# Две модели многозадачности

<div class="grid grid-cols-2 gap-8">
<div>

**Вытесняющая: потоки**

<v-clicks>

- Переключает операционная система
- Прервать могут посреди `x += 1`
- Общие данные защищают замками
- У каждого потока свой стек

</v-clicks>

</div>
<div>

**Кооперативная: asyncio**

<v-clicks>

- Переключает событийный цикл
- Задача сама отдаёт управление на `await`
- Между двумя `await` переключений нет
- Задача без `await` держит остальных

</v-clicks>

</div>
</div>

---
layout: default
clicks: 2
---

# Одновременность и параллелизм

Одновременность (concurrency): несколько задач продвигаются в одном
промежутке времени, сменяя друг друга. Параллелизм (parallelism): задачи
выполняются в один и тот же момент на разных ядрах.

<AsyncTimeline :modes="['interleave', 'parallel']" compact :step="$clicks" />

<v-click at="2">

asyncio даёт одновременность без параллелизма. Задачам ввода-вывода этого
хватает, потому что большую часть времени они ждут.

</v-click>

---
layout: default
---

# Событийный цикл

Событийный цикл (event loop) по очереди выполняет задачи и следит за
событиями: срабатыванием таймеров и приходом данных в сокеты.

```python
while есть_задачи:
    for задача in готовые:
        выполнить_до_следующего_await(задача)
    ждать_событий(до_ближайшего_таймера)      # сон без нагрузки на процессор
    перенести_в_готовые(дождавшиеся)
```

<v-click>

Схема упрощена, но цикл в модуле `asyncio` устроен так же: очередь готовых
задач, набор ожидающих и один системный вызов, который ждёт событий.

</v-click>

---
layout: default
---

# От генераторов к корутинам

Генератор из темы 1.4 останавливается на `yield` и помнит свои локальные
переменные. Корутина устроена так же, только останавливается на `await`,
пока ждёт результат.

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

# Ключевые слова asyncio

| Запись | Что делает |
|---|---|
| `async def f():` | Объявляет корутину: функцию, которая может приостанавливаться |
| `await x` | Приостанавливает корутину, пока `x` не готов; пишется только внутри `async def` |
| `asyncio.sleep(s)` | Асинхронная пауза: задача ждёт, цикл выполняет другие задачи |
| `asyncio.run(main())` | Запускает цикл и выполняет корутину `main` до конца |
| `asyncio.create_task(c)` | Ставит корутину в очередь цикла отдельной задачей |
| `asyncio.gather(c1, c2)` | Запускает несколько корутин и ждёт результаты всех |

---
layout: default
---

# Корутинная функция: `async def`

Вызов функции, объявленной через `async def`, возвращает объект-корутину.
Тело при этом не выполняется.

```py {monaco-run} {autorun:false}
async def hello():
    print("тело выполняется")
    return 42

c = hello()
print(type(c).__name__)
result = await c
print(result)
```

<v-click>

Строка «тело выполняется» появилась только после `await c`. Вызов
`hello()` лишь создал объект, так же как вызов генераторной функции.

</v-click>

---
layout: default
clicks: 6
---

# Куда уходит управление при `await`

<AwaitChain :step="$clicks" />

---
layout: default
---

# Точка входа: `asyncio.run`

Скрипт запускает асинхронный код одной строкой:

```python
import asyncio

async def main():
    ...

asyncio.run(main())
```

<v-clicks>

- `asyncio.run` создаёт цикл, выполняет `main()` до конца и закрывает цикл
- В Jupyter и в `python -m asyncio` цикл уже запущен, поэтому `await` пишут прямо на верхнем уровне
- Живые примеры лекции устроены так же: `await` без `asyncio.run`

</v-clicks>

---
layout: default
---

# Три `await` подряд

```py {monaco-run} {autorun:false}
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

Три паузы по секунде заняли 3 секунды. Каждый `await brew(...)` ждёт, пока
корутина закончится, и только потом программа переходит к следующей строке.

</v-click>

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

Вызов `save()` создал объект-корутину, которого никто не дождался. Тело не
выполнилось, а предупреждение легко пропустить.

</v-click>

---
layout: default
---

# Задачи: `asyncio.create_task`

Чтобы корутины выполнялись одновременно, их оборачивают в задачи.

```python
task = asyncio.create_task(brew("чай", 1))
```

<v-clicks>

- Задача сразу встаёт в очередь готовых и начнёт работу, когда текущий код дойдёт до `await`
- `await task` дожидается её результата
- Пока одна задача ждёт, цикл выполняет другие
- Ссылку на задачу нужно хранить, иначе её может удалить сборщик мусора

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

# Две задачи по очереди

```py {monaco-run} {autorun:false}
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

Первой напечаталась строка «задачи созданы»: `create_task` только ставит
задачи в очередь. Дальше вывод чередуется, потому что на каждом `await`
цикл переключается на другую задачу.

</v-click>

---
layout: default
---

# Ждать всех сразу: `asyncio.gather`

`gather` оборачивает корутины в задачи, ждёт все и возвращает результаты в
том порядке, в каком корутины были переданы.

```py {monaco-run} {autorun:false}
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

Три паузы по секунде уложились в одну секунду: задачи ждали одновременно.

</v-click>

---
layout: default
clicks: 2
---

# Последовательно, `gather`, потоки

<AsyncTimeline :modes="['sequential', 'gather', 'threads']" shared compact :step="$clicks" />

---
layout: default
clicks: 8
---

# Внутри `gather`: таймеры

<EventLoopSim preset="timers" :step="$clicks" />

---
layout: default
clicks: 8
---

# Внутри `gather`: сеть

`client.get(url)` отправляет HTTP-запрос и ждёт ответа. Сокеты, которые
ждут данных, цикл передаёт операционной системе: `epoll` в Linux, `kqueue`
в macOS, IOCP в Windows.

<EventLoopSim preset="network" :step="$clicks" />

---
layout: default
---

# Чего стоят потоки и задачи

| | Потоки | asyncio |
|---|---|---|
| Память на 10 000 штук | +158 МБ | +14 МБ |
| Где возможна гонка | В любой строке | Только вокруг `await` |
| Блокирующий вызов | Останавливает свой поток | Останавливает все задачи |
| Библиотеки | Любые | Нужны асинхронные версии |

Память: реальный замер на Linux, прирост RSS процесса.

---
layout: default
---

# `async with` и `async for`

<v-clicks>

- `async with`: вход в блок и выход из него тоже ждут (соединение, замок)
- `async for`: каждый следующий элемент приходит через `await`
- Асинхронный генератор: `async def` с `yield` внутри

</v-clicks>

```py {monaco-run} {autorun:false}
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

# Группа задач: `TaskGroup`

`TaskGroup` (Python 3.11+) запускает задачи внутри блока `async with` и
выпускает из блока только после того, как все они завершились. Если одна
задача падает с ошибкой, остальные отменяются.

```py {monaco-run} {autorun:false}
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

```py {monaco-run} {autorun:false}
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
await asyncio.sleep(0.1)
print("task.cancelled():", task.cancelled())
```

<v-click>

`cancel()` поднимает `CancelledError` на том `await`, где стоит задача.
Задача освобождает ресурсы и передаёт исключение дальше через `raise`.

</v-click>

---
layout: default
---

# Блокирующий вызов: `time.sleep`

```python
async def brew(name):
    print(f"{name}: начало")
    time.sleep(1)                 # блокирующий вызов
    print(f"{name}: готово")

await asyncio.gather(brew("чай"), brew("кофе"), brew("какао"))
```

`time.sleep` останавливает весь поток, и цикл не получает управления.
Реальный прогон: 3.0 с вместо 1.0 с.

<AsyncTimeline :modes="['blocking']" compact />

---
layout: default
---

# Блокирующая функция в потоке: `to_thread`

Если у функции нет асинхронной версии, её выполняют в отдельном потоке.
Корутина ждёт результат, а цикл тем временем работает.

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

---
layout: default
---

# Синхронизация в одном потоке

<v-clicks>

- Задачи переключаются только на `await`, поэтому код между двумя `await` никто не прерывает
- Гонка появляется, когда чтение общих данных и запись результата разделены `await`
- Типичный случай: прочитать значение, дождаться ответа сервера, записать новое значение
- Для таких участков в `asyncio` есть свои примитивы: `Lock`, `Semaphore`, `Event`, `Queue`
- Примитивы из `threading` в корутинах не подходят: они блокируют поток целиком

</v-clicks>

---
layout: default
clicks: 6
---

# Гонка за общий счётчик

<RaceInterleave :step="$clicks" />

---
layout: default
---

# Сто задач, один счётчик

```py {monaco-run} {autorun:false}
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

Все сто задач прочитали `counter = 0` раньше, чем хоть одна записала
результат, и каждая записала 1. `asyncio.sleep(0)` здесь стоит на месте
настоящего ожидания: запроса к серверу или к базе данных.

</v-click>

---
layout: default
clicks: 6
---

# Тот же счётчик под `asyncio.Lock`

<RaceInterleave locked :step="$clicks" />

---
layout: default
---

# Сто задач под замком

```py {monaco-run} {autorun:false}
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

Внутри `async with lock` в каждый момент находится одна задача, остальные
ждут у входа в блок.

</v-click>

---
layout: default
clicks: 4
---

# Ограничение: `asyncio.Semaphore`

Семафор пропускает в блок не больше N задач одновременно. Так ограничивают
число одновременных запросов к одному серверу.

<SemaphoreGate :step="$clicks" />

---
layout: default
---

# Пять загрузок, два места

```py {monaco-run} {autorun:false}
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

Загрузки стартуют парами, на 0, 1 и 2 секунде. Пять загрузок по секунде
при двух местах заняли 3 секунды.

</v-click>

---
layout: default
clicks: 5
---

# Очередь: `asyncio.Queue`

Очередь передаёт данные от задач-производителей задачам-потребителям,
`await queue.get()` ждёт, пока в ней появится элемент. Так устроены очереди
фоновых задач: отправка писем, обработка загруженных файлов.

<QueueFlow :step="$clicks" />

---
layout: default
---

# Производитель и два потребителя

```py {monaco-run} {autorun:false}
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


---
layout: default
---

# Примитивы синхронизации

| Примитив | Что делает | Типичное применение |
|---|---|---|
| `Lock` | Пускает в блок одну задачу | Чтение и запись общих данных через `await` |
| `Semaphore(n)` | Пускает не больше `n` задач | Ограничение одновременных запросов |
| `Event` | Флаг, которого задачи ждут | Сигнал «данные готовы», «сервер запущен» |
| `Queue` | Передаёт элементы между задачами | Производители и потребители, фоновые работы |

---
layout: default
clicks: 2
---

# Таймауты

Сервер может не ответить вовсе, и задача без ограничения времени будет
ждать вечно.

<TimeoutCancel :step="$clicks" />

---
layout: default
---

# `wait_for` и `asyncio.timeout`

```py {monaco-run} {autorun:false}
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

`wait_for` ограничивает одно ожидание, `asyncio.timeout` (3.11+) весь блок.

</v-click>

---
layout: default
---

# HTTP-запросы: `httpx`

Тестовый сервер отвечает на каждый запрос через 1 секунду. Пять запросов
асинхронным клиентом:

```python
urls = [f"http://localhost:8000/item/{i}" for i in range(1, 6)]

async def main():
    async with httpx.AsyncClient() as client:
        responses = await asyncio.gather(*(client.get(u) for u in urls))
```

| Вариант | Реальное время |
|---|---|
| `httpx.Client`, запросы по одному в цикле | 5.1 с |
| `httpx.AsyncClient` и `gather` | 1.1 с |

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
```

Реальный прогон: одна задача заняла 0.6 с, три через `gather` заняли 1.9 с.
В вычислениях нет `await`, и цикл не может переключиться. Ускорить такую
работу помогают только процессы.

<AsyncTimeline :modes="['cpu']" compact />

---
layout: default
---

# Что выбрать

| Задача | Подход |
|---|---|
| Много сетевых запросов, тысячи соединений | asyncio |
| Ввод-вывод через библиотеки без асинхронной версии | Потоки или `asyncio.to_thread` |
| Вычисления: обработка изображений, математика | Процессы |
| Сервер, который ждёт сеть и иногда считает | asyncio, а вычисления в процессах |

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

# Обработчик веб-сервера

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
сервиса, тот же поток принимает и обрабатывает запросы других клиентов.

</v-click>

---
layout: default
---

# Попробовать самому: REPL и Jupyter

Команда `python -m asyncio` открывает интерактивную оболочку, в которой
цикл уже запущен. Реальный сеанс (приветствие сокращено):

```text
$ python -m asyncio
asyncio REPL 3.12.3
Use "await" directly instead of "asyncio.run()".
>>> import asyncio
>>> await asyncio.sleep(0.1, result="готово")
'готово'
```

<v-click>

В Jupyter Notebook цикл тоже работает постоянно, и в ячейке можно сразу
писать `await`.

</v-click>

---
layout: default
---

# Попробовать самому: режим отладки

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
- Rust: `async fn` и `.await`, цикл даёт библиотека, например Tokio
- Kotlin: корутины и функции `suspend`
- Аналог `asyncio.gather` в JavaScript называется `Promise.all`: запущенные через него запросы во вкладке «Сеть» инструментов разработчика идут одновременно

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

Реальный вывод состоит из одной строки: `все уведомления отправлены`.

<v-click>

`main` не дождалась задач, и `asyncio.run` их отменил. Исправление:

```py {monaco-run} {autorun:false}
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
