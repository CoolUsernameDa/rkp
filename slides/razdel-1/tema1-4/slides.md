---
theme: default
title: 1.4 Итерация, генераторы, тестирование
info: |
  Тема 1.4. Итерирование, ленивые вычисления, автотестирование:
  фикстуры, покрытие кода.
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

# 1.4. Итерация, генераторы, тестирование

Итераторы и генераторы, модуль itertools. Автоматизированное тестирование:
pytest, фикстуры, покрытие кода, TDD

---
layout: default
---

# Зачем это знать

```python
squares = [x * x for x in range(10_000_000)]
squares = (x * x for x in range(10_000_000))
```

Две строки отличаются парой скобок. Первая строит список из десяти
миллионов чисел и хранит его целиком. Вторая создаёт объект, который
вычисляет значения по одному, когда их запрашивают. Так Python позволяет
обрабатывать данные частями.

Вторая половина лекции отвечает на вопрос, как убедиться, что такой код и
любой другой работает правильно: автоматизированное тестирование.

---
layout: default
---

# План на сегодня

<v-clicks>

- Итераторы — что происходит внутри цикла `for`
- Генераторы и ленивые вычисления — как получать значения по мере необходимости
- Модуль `itertools` — готовые блоки для цепочек обработки данных
- Автотесты на pytest — структура теста, фикстуры, параметризация
- Покрытие кода и разработка через тестирование (TDD)

</v-clicks>

---
layout: default
---

# Что скрыто за `for`

Цикл `for` одинаково обходит списки, строки, словари, `range`. Такие
объекты называются итерируемыми. Цикл работает в два шага: `iter(obj)`
возвращает итератор — объект, помнящий текущую позицию. Затем для него
снова и снова вызывается `next()`, пока не будет поднято исключение
`StopIteration`.

Цикл `for x in [10, 20, 30]: print(x)`, записанный вручную:

```python
it = iter([10, 20, 30])
while True:
    try:
        x = next(it)
    except StopIteration:
        break
    print(x)
```

---
layout: default
---

# Итерируемый объект и итератор

Методы с двойным подчёркиванием Python вызывает сам: `iter(obj)` вызывает
`obj.__iter__()`, а `next(it)` вызывает `it.__next__()`.

| | Итерируемый объект | Итератор |
|---|---|---|
| Что это | Объект, по которому можно пройти циклом | Объект, выдающий элементы по одному и помнящий позицию |
| Методы | `__iter__()` возвращает итератор | `__next__()` возвращает элемент, `__iter__()` возвращает сам объект |
| Примеры | `list`, `str`, `dict`, `range` | результат `iter(...)`, `map(...)`, генератор |
| Обход | Сколько угодно раз | Один раз |

<style>
.slidev-layout table { font-size: 0.88em; }
</style>

---
layout: default
clicks: 5
---

# Итератор по шагам

Каждый вызов `next()` возвращает очередной элемент и сдвигает указатель.
Итератор движется только вперёд: после исчерпания повторный обход пуст.

<IteratorStepper :items="[10, 20, 30]" :step="$clicks" :extra="['list(it)  →  []   # элементов не осталось']" />

---
layout: default
---

# `iter()`, `next()` и `StopIteration` вживую

```py {monaco-run} {autorun:false}
it = iter([10, 20, 30])
print(type(it).__name__, next(it), next(it))
print(list(it))
print(list(it))

doubled = map(lambda x: x * 2, [1, 2, 3])
print(type(doubled).__name__, list(doubled), list(doubled))
```

<v-click>

Первый `list(it)` собрал остаток `[30]`, второй получил пустой список:
итератор исчерпан, ошибки при этом нет. `map`, `filter`, `zip` и
`enumerate` тоже возвращают итераторы. Цикл `for` перехватывает
`StopIteration` сам, при ручном `next()` исключение получает вызывающий код.

</v-click>

---
layout: default
---

# Свой итератор: `__iter__` и `__next__`

```py {monaco-run} {autorun:false}
class Countdown:
    def __init__(self, start):
        self.current = start
    def __iter__(self):
        return self
    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1

c = Countdown(3)
print(list(c), list(c))
```

<v-click>

`__next__` возвращает следующий элемент или поднимает `StopIteration`,
`__iter__` возвращает сам объект. Поэтому второй обход того же объекта пуст.
Для многократного обхода `__iter__` создаёт новый итератор при каждом
вызове, например `return iter(range(self.start, 0, -1))`. Так устроены списки.

</v-click>

---
layout: default
---

# Генераторная функция

Обычная функция выполняет тело до `return` и теряет локальные переменные.
Итератор-класс требует атрибутов состояния и ручного `StopIteration`.
Генераторная функция записывает то же обычным кодом:

```python
def count_to(n):
    i = 1
    while i <= n:
        yield i
        i += 1
```

<v-clicks>

- Вызов функции с `yield` возвращает объект-генератор, тело не запускается
- Каждый `next()` выполняет код до очередного `yield`
- `yield` отдаёт значение и приостанавливает функцию, переменные сохраняются

</v-clicks>

---
layout: default
clicks: 3
---

# Приостановка и возобновление

<GeneratorFlow preset="count" :step="$clicks" />

---
layout: default
clicks: 3
---

# Порядок выполнения

<GeneratorFlow preset="prints" :step="$clicks" />

---
layout: default
---

# Первый генератор вживую

```py {monaco-run} {autorun:false}
def count_to(n):
    i = 1
    while i <= n:
        yield i
        i += 1

g = count_to(3)
print(type(g).__name__, next(g), next(g))
print(list(g), list(g))
print(iter(g) is g)
```

<v-click>

Вызов `count_to(3)` вернул объект типа `generator`. Генератор — это
итератор: `__iter__` возвращает сам объект, обход у него один. Поэтому
генератор принимают `for`, `list()`, `sum()` и любые другие места, где ждут
итерируемый объект.

</v-click>

---
layout: default
---

# Генераторное выражение

Простой генератор записывается выражением: круглые скобки вместо
квадратных. Если выражение — единственный аргумент функции, вторые скобки
не нужны: `sum(x * x for x in range(5))`.

```py {monaco-run} {autorun:false}
squares_list = [x * x for x in range(5)]
squares_gen = (x * x for x in range(5))
print(type(squares_list).__name__, type(squares_gen).__name__)
print(sum(squares_gen), sum(squares_gen))
```

<v-click>

Первый `sum` вернул 30, второй — 0: генератор исчерпан первым проходом.

</v-click>

---
layout: default
clicks: 6
---

# Память: список и генератор

Генератор вычисляет значение в момент запроса. В памяти находится только
текущее значение, первый элемент доступен сразу, а последовательность может
быть бесконечной.

<LazyVsEager :step="$clicks" />

---
layout: default
---

# Измерение памяти: `tracemalloc`

Модуль `tracemalloc` отслеживает память, которую выделяет Python.

```python
import tracemalloc

tracemalloc.start()
total = sum([x * x for x in range(1_000_000)])
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()
print(f"пик: {peak / 2**20:.1f} МБ")
```

Реальный прогон: со списком пик 38.6 МБ, с генератором
`sum(x * x for x in range(1_000_000))` — 0.0 МБ.

<v-click>

`sys.getsizeof` показывает размер самого объекта без содержимого: список
из миллиона элементов — 8448728 байт, генератор — 192 байта при любой длине.

</v-click>

---
layout: default
---

# Бесконечный генератор

Пока значения не запрашивают, генератор ничего не вычисляет, поэтому он
может не заканчиваться. Конечную часть берёт `itertools.islice(итератор, n)`.

```py {monaco-run} {autorun:false}
from itertools import islice

def naturals():
    n = 1
    while True:
        yield n
        n += 1

print(list(islice(naturals(), 5)))
```

<v-click>

Цикл `while True` выполнился ровно столько раз, сколько значений запросили.
Вызов `list(naturals())` без `islice` не завершился бы никогда.

</v-click>

---
layout: default
clicks: 4
---

# Конвейер: элементы идут по одному

Генераторы можно соединять: выход одного служит входом следующего. Каждая
стадия — небольшая функция, промежуточные списки не создаются.

<PipelineFlow :step="$clicks" />

---
layout: default
---

# Конвейер вживую

```py {monaco-run} {autorun:false}
def numbers():
    for n in range(1, 5):
        print("источник:", n)
        yield n

def evens(src):
    for n in src:
        if n % 2 == 0:
            yield n

def times_ten(src):
    for n in src:
        yield n * 10

for result in times_ten(evens(numbers())):
    print("результат:", result)
```

<v-click>

Строки «источник» и «результат» чередуются: элемент 2 проходит все стадии
до того, как источник создаст элемент 3. Весь список чисел нигде не
хранится.

</v-click>

---
layout: default
clicks: 5
---

# `yield from`

Выражение `yield from X` передаёт наружу все значения итерируемого `X` по
одному. Это короткая запись цикла `for v in X: yield v`.

<GeneratorFlow preset="delegate" :step="$clicks" />

---
layout: default
---

# Когда генератор не подходит

<v-clicks>

- Нет длины: `len(g)` даёт `TypeError`
- Нет индексации: `g[0]` даёт `TypeError`
- Обход один, вернуться назад нельзя

</v-clicks>

<v-click>

```python
def average(numbers):
    total = sum(numbers)            # генератор исчерпан здесь
    count = len(list(numbers))      # пустой список, count = 0
    return total / count

average(x for x in [2, 4, 6])      # ZeroDivisionError
```

`values = list(numbers)` сохраняет значения один раз для повторных проходов.

</v-click>

---
layout: default
---

# `itertools`: готовые ленивые блоки

Для типовых операций с итераторами в стандартной библиотеке есть модуль
`itertools`. Его функции принимают итерируемые объекты, возвращают
итераторы и соединяются в цепочки так же, как генераторы.

<v-clicks>

- Бесконечные последовательности: `count`, `cycle`, `repeat`
- Нарезка и склейка: `islice`, `chain`
- Комбинаторика: `product`, `permutations`, `combinations`
- Группировка и накопление: `groupby`, `accumulate`

</v-clicks>

---
layout: default
---

# Источники, срез и склейка

```py {monaco-run} {autorun:false}
from itertools import count, cycle, repeat, islice, chain

print(list(islice(count(10, 5), 4)))      # 10, 15, 20, ... без конца
print(list(islice(cycle("AB"), 5)))       # по кругу без конца
print(list(repeat("x", 3)))               # значение ровно 3 раза
print(list(islice("abcdef", 2, 5)))       # срез итератора
print(list(chain([1, 2], (3, 4), "ab")))  # склейка подряд
```

<v-click>

Бесконечные `count` и `cycle` ограничены через `islice`. У `islice` нет
отрицательных индексов. `chain` соединяет список, кортеж и строку без
промежуточного списка.

</v-click>

---
layout: default
---

# Комбинаторика

- `product(a, b)` — все пары из элементов двух последовательностей
- `permutations(seq, r)` — упорядоченные выборки по `r` элементов
- `combinations(seq, r)` — неупорядоченные выборки по `r` элементов

```py {monaco-run} {autorun:false}
from itertools import product, permutations, combinations

print(list(product([1, 2], "ab")))
print(list(permutations([1, 2, 3], 2)))
print(list(combinations([1, 2, 3], 2)))
```

<v-click>

В `permutations` порядок важен: `(1, 2)` и `(2, 1)` — разные выборки. В
`combinations` каждая пара встречается один раз.

</v-click>

---
layout: default
clicks: 2
---

# `groupby`: группируются соседи

`groupby(seq)` объединяет подряд идущие одинаковые элементы. Для группировки
по всему набору данных его предварительно сортируют по тому же ключу:
`groupby(sorted(data))`.

<GroupbyDemo :step="$clicks" />

---
layout: default
---

# Цепочка целиком

Бесконечный источник, две стадии и ограничитель: вся цепочка остаётся
ленивой.

```py {monaco-run} {autorun:false}
from itertools import count, islice, accumulate, takewhile

evens = (n for n in count(1) if n % 2 == 0)
squares = (n * n for n in evens)
print(list(islice(squares, 5)))
print(list(accumulate([1, 2, 3, 4])))
print(list(takewhile(lambda x: x < 3, [1, 2, 5, 1])))
```

<v-click>

Первая строка вывода — квадраты первых пяти чётных чисел. `accumulate`
выдаёт нарастающие суммы, `takewhile` берёт элементы, пока условие
истинно, и останавливается на первом ложном.

</v-click>

---
layout: center
---

# От обработки данных — к проверке

Код с генераторами и цепочками работает правильно только тогда, когда это
проверено. Вручную проверять каждое изменение долго и ненадёжно: для этого
пишут автоматические тесты.

---
layout: default
---

# Зачем автотесты

<v-clicks>

- Ручную проверку приходится повторять после каждого изменения кода
- Человек пропускает случаи, которые автоматический тест проверит каждый раз одинаково
- Тест фиксирует ожидаемое поведение: если код случайно сломан, тест падает
- Набор тестов позволяет менять код (рефакторинг) без страха что-то сломать

</v-clicks>

---
layout: default
---

# Что такое автотест

Автотест — код, который вызывает проверяемый код и сравнивает результат с
ожидаемым. Основа любой проверки — оператор `assert`: если условие ложно,
поднимается исключение `AssertionError`.

```python
assert 2 + 2 == 4   # условие истинно, ничего не происходит
assert 2 + 2 == 5   # условие ложно: AssertionError
```

---
layout: default
---

# Структура теста

<v-clicks>

- Подготовка — данные и объекты, нужные для проверки
- Действие — вызов проверяемого кода
- Проверка — сравнение результата с ожидаемым

</v-clicks>

```python
def test_average_typical():
    numbers = [1, 2, 3]            # подготовка
    result = average(numbers)      # действие
    assert result == 2             # проверка
```

---
layout: default
---

# Первый тест: что проверяем

Проверяемая функция лежит в модуле `stats.py`:

```python
def average(numbers):
    if not numbers:
        raise ValueError("пустая последовательность")
    return sum(numbers) / len(numbers)
```

Правила pytest: файл с тестами называется `test_*.py`, функции внутри —
`test_*`. Проверки записываются обычным `assert`, специальных методов не
требуется.

---
layout: default
---

# Файл с тестами

```python
import pytest
from stats import average


def test_average_typical():
    assert average([1, 2, 3]) == 2


def test_average_single_value():
    assert average([5]) == 5


def test_average_empty_raises():
    with pytest.raises(ValueError):
        average([])
```

---
layout: default
---

# Запуск pytest

Команда `pytest` находит файлы `test_*.py`, выполняет функции `test_*` и
печатает отчёт. Ключ `-v` выводит отдельную строку на каждый тест.

<Terminal name="first_run" />

---
layout: default
---

# Если тест падает

В первом тесте ожидаемое значение заменено на `3`. Строка со стрелкой
`>` указывает на проваленную проверку, строки `E` показывают
вычисленные значения.

<Terminal name="fail_run" compact />

---
layout: default
---

# Что проверять

<v-clicks>

- Типичный случай — обычные входные данные (`test_average_typical`)
- Граничные случаи — один элемент, минимальное и максимальное значение, пустой ввод (`test_average_single_value`)
- Негативные случаи — некорректный ввод, на который код обязан ответить ошибкой (`test_average_empty_raises`)

</v-clicks>

---
layout: default
---

# `pytest.raises`

```python
def test_average_empty_raises():
    with pytest.raises(ValueError, match="пустая"):
        average([])
```

Блок `with pytest.raises(...)` проверяет, что внутри поднято нужное
исключение. Параметр `match` сверяет текст сообщения. Если исключения нет,
тест падает.

<Terminal name="raises_run" compact />

---
layout: default
---

# Объект для следующих примеров

Для примеров с фикстурами используется простой стек:

```python
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def peek(self):
        return self._items[-1]

    def is_empty(self):
        return not self._items
```

---
layout: default
---

# Проблема: общее состояние

Если нескольким тестам нужен один объект, есть два пути. Создавать его в
каждом тесте — дублирование. Создать один раз на уровне модуля — тогда
тесты влияют друг на друга, и результат зависит от порядка запуска.

```python
stack = Stack()

def test_push():
    stack.push(1)
    assert not stack.is_empty()

def test_new_stack_is_empty():
    assert stack.is_empty()
```

---
layout: default
---

# Результат

Первый тест добавил элемент в общий стек. Второй ожидал пустой стек и
упал, хотя сам по себе написан верно.

<Terminal name="shared_state_run" compact />

---
layout: default
---

# Фикстура `@pytest.fixture`

Фикстура — функция, которая готовит объект для теста. Это декоратор, уже
знакомый по теме про декораторы. pytest сам вызывает фикстуру и передаёт
результат в тест через параметр с тем же именем.

```python
@pytest.fixture
def stack():
    return Stack()

def test_push(stack):
    stack.push(1)
    assert not stack.is_empty()

def test_new_stack_is_empty(stack):
    assert stack.is_empty()
```

---
layout: default
---

# Фикстура с очисткой

Если в фикстуре есть `yield`, код до него выполняется перед тестом, а код
после — после теста. Устройство то же, что у генераторов и контекстных
менеджеров.

```python
@pytest.fixture
def connection():
    conn = {"open": True}      # подготовка
    yield conn                  # значение для теста
    conn["open"] = False        # очистка
```

<Terminal name="yield_fixture_run" compact />

---
layout: default
---

# Области видимости фикстур

| Область | Когда выполняется подготовка |
|---|---|
| `function` (по умолчанию) | Перед каждым тестом |
| `class` | Один раз для каждого класса с тестами |
| `module` | Один раз для каждого файла с тестами |
| `session` | Один раз за весь запуск pytest |

Область задаётся параметром: `@pytest.fixture(scope="module")`.

---
layout: default
clicks: 3
---

# Область видимости на схеме

<FixtureScopes :step="$clicks" />

---
layout: default
---

# Как выбирать область

<v-clicks>

- Чем шире область, тем реже выполняется подготовка: это выгодно для дорогих операций (соединение с базой, чтение большого файла)
- Чем шире область, тем выше риск, что тесты начнут влиять друг на друга через общий объект
- Изменяемые объекты обычно создают заново для каждого теста (`function`)
- Дорогие и неизменяемые ресурсы выносят в `module` или `session`

</v-clicks>

---
layout: default
---

# Область `module` в действии

```python
@pytest.fixture(scope="module")
def connection():
    ...
```

В отчёте буква `M` у `SETUP` и `TEARDOWN` означает область `module`.
Подготовка выполнена один раз на три теста.

<Terminal name="scope_module_run" compact />

---
layout: default
---

# `conftest.py`

Файл `conftest.py` в каталоге с тестами pytest читает автоматически.
Фикстуры из него доступны во всех тестах каталога без импорта.

```python
# conftest.py
import pytest
from stack import Stack

@pytest.fixture
def stack():
    return Stack()
```

---
layout: default
---

# Встроенные фикстуры

<v-clicks>

- `tmp_path` — временный каталог, который удаляется после теста
- `capsys` — перехват того, что тест выводит через `print`
- `monkeypatch` — временная подмена значений, переменных окружения, функций

</v-clicks>

---
layout: default
---

# `tmp_path` и `capsys`

```python
def test_write_file(tmp_path):
    path = tmp_path / "data.txt"
    path.write_text("привет")
    assert path.read_text() == "привет"

def test_prints(capsys):
    print("вывод")
    out = capsys.readouterr().out
    assert out == "вывод\n"
```

<Terminal name="builtin_run" compact />

---
layout: default
---

# Проблема: одинаковые тесты

Когда логика теста одна, а данные разные, копирование функций избыточно:

```python
def test_average_1():
    assert average([1, 2, 3]) == 2

def test_average_2():
    assert average([5]) == 5

def test_average_3():
    assert average([-1, 1]) == 0
```

---
layout: default
---

# Параметризация

```python
@pytest.mark.parametrize("numbers, expected", [
    ([1, 2, 3], 2),
    ([5], 5),
    ([-1, 1], 0),
])
def test_average(numbers, expected):
    assert average(numbers) == expected
```

<Terminal name="param_run" compact />

---
layout: default
---

# Несколько параметров и `ids`

```python
@pytest.mark.parametrize(
    "numbers, expected",
    [
        ([1, 2, 3], 2),
        ([5], 5),
        ([-1, 1], 1),
    ],
    ids=["typical", "single", "wrong_expected"],
)
def test_average(numbers, expected):
    assert average(numbers) == expected
```

Параметр `ids` задаёт читаемые имена наборов. В третьем наборе ожидаемое
значение намеренно неверное.

---
layout: default
---

# Один набор падает, остальные идут

Каждый набор — отдельный тест, падение одного не останавливает остальные.

<Terminal name="param_ids_run" compact />

---
layout: default
---

# Параметризация вместе с фикстурами

```python
@pytest.fixture
def stack():
    return Stack()

@pytest.mark.parametrize("value", [1, 2, 3])
def test_push_peek(stack, value):
    stack.push(value)
    assert stack.peek() == value
```

Тест выполняется три раза, и каждый раз фикстура создаёт новый стек.
Параметры и фикстуры сочетаются свободно.

---
layout: default
---

# Покрытие кода

Покрытие — доля кода, выполненного во время тестов. Основные виды:

<v-clicks>

- Покрытие строк — какие строки были выполнены хотя бы раз
- Покрытие ветвей — какие варианты каждого условия были пройдены
- Инструмент: пакет `pytest-cov` (`pip install pytest-cov`), обёртка над `coverage`

</v-clicks>

---
layout: default
---

# Запуск с отчётом о покрытии

Модуль `grade.py` и один тест с `grade(75)`:

```python
def grade(score):
    if score < 0:
        raise ValueError("отрицательный балл")
    if score >= 60:
        return "зачёт"
    return "незачёт"
```

<Terminal name="cov_run1" compact />

---
layout: default
clicks: 3
---

# Как растёт покрытие

Столбец `Missing` в отчёте перечисляет невыполненные строки. Каждый новый
тест закрывает часть из них.

<CoverageView preset="grade" :step="$clicks" />

---
layout: default
---

# Покрытие ветвей

```python
def label(x):
    result = "ноль"
    if x > 0:
        result = "плюс"
    return result
```

Один тест `label(5)` выполняет все строки. Ключ `--cov-branch` показывает,
что ветка, где условие ложно, не пройдена.

<Terminal name="cov_branch_run" compact />

---
layout: default
---

# HTML-отчёт

<v-clicks>

- Ключ `--cov-report=html` создаёт каталог `htmlcov`
- Файл `htmlcov/index.html` — таблица по файлам с процентом покрытия
- Щелчок по файлу открывает исходный код с подсветкой
- Зелёные строки выполнялись, красные — нет, жёлтые — ветвь пройдена частично

</v-clicks>

---
layout: default
---

# Чего покрытие не гарантирует

<v-clicks>

- Покрытие показывает, какие строки выполнялись, но не проверяет, что результат верный
- Тест без `assert` даёт то же покрытие, что и тест с проверками
- Высокий процент не заменяет осмысленных проверок
- Низкий процент указывает на код, который заведомо ничем не проверяется

</v-clicks>

---
layout: default
---

# Порог покрытия

Ключ `--cov-fail-under=N` завершает запуск с ошибкой, если покрытие ниже
`N` процентов. Это удобно для автоматических проверок перед сдачей или
слиянием кода.

<Terminal name="cov_failunder_run" compact />

---
layout: default
clicks: 3
---

# TDD: разработка через тестирование

Тест пишется раньше кода. Работа идёт короткими циклами из трёх шагов.

<TddCycle :step="$clicks" />

---
layout: default
---

# TDD: тест первым

Требование: функция `is_valid_age(age)` проверяет возраст. Тест написан,
модуль `age.py` пока пуст.

```python
from age import is_valid_age
def test_valid_age():
    assert is_valid_age(25) is True
```

<Terminal name="tdd_red1" compact />

---
layout: default
---

# TDD: минимальный код

Для прохождения теста достаточно самой простой реализации.

```python
def is_valid_age(age):
    return True
```

<Terminal name="tdd_green1" compact />

---
layout: default
---

# TDD: следующий тест

Новое требование — отрицательный возраст недопустим. Тест добавлен
раньше кода и падает.

```python
def test_negative_age_invalid():
    assert is_valid_age(-1) is False
```

<Terminal name="tdd_red2" compact />

---
layout: default
---

# TDD: реализация

```python
def is_valid_age(age):
    return 0 <= age <= 150
```

Теперь проходят оба теста.

<Terminal name="tdd_green2" compact />

---
layout: default
---

# TDD: ещё одно требование

Возраст, переданный строкой, должен считаться недопустимым.

```python
def test_string_age_invalid():
    assert is_valid_age("25") is False
```

<Terminal name="tdd_red3" compact />

---
layout: default
---

# TDD: реализация и рефакторинг

Проверка типа добавлена, а числа 0 и 150 вынесены в константы. Тесты
остаются зелёными: рефакторинг не изменил поведение.

```python
MIN_AGE = 0
MAX_AGE = 150

def is_valid_age(age):
    return isinstance(age, int) and MIN_AGE <= age <= MAX_AGE
```

<Terminal name="tdd_green3" compact />


---
layout: default
---

# Найдите ошибку

```python
def grade(score):
    if score < 0:
        raise ValueError("отрицательный балл")
    if score >= 60:
        return "незачёт"
    return "зачёт"

def test_grade():
    grade(75)
    grade(30)
    with pytest.raises(ValueError):
        grade(-1)
```

Функция `grade` из файла `grade.py` и тест из `test_grade.py`, импорты
опущены. Функция должна возвращать «зачёт» от 60 баллов и «незачёт» ниже 60.
Тест проходит, покрытие 100%. Можно ли считать функцию проверенной?

---
layout: default
---

# Реальный прогон

<Terminal name="noassert_run" compact />

Тест пройден, отчёт показывает покрытие 100%, а столбец `Missing` пуст.

---
layout: default
clicks: 3
---

# Разбор

Каждый вызов в тесте выполняет часть строк функции. Три вызова вместе
закрашивают все шесть.

<CoverageView preset="noassert" :reveal="$clicks >= 3" :step="$clicks" />

<v-click at="3">

Счётчик проверок остаётся нулевым: тест ничего не сравнивает с ожидаемым
значением. Перепутанные результаты `"незачёт"` и `"зачёт"` остались
незамеченными, хотя покрытие достигло 100%.

</v-click>

---
layout: default
---

# Тот же тест с проверками

```python
def test_grade():
    assert grade(75) == "зачёт"
    assert grade(30) == "незачёт"
    with pytest.raises(ValueError):
        grade(-1)
```

<Terminal name="noassert_fixed_run" compact small />

<v-click>

Покрытие считает выполненные строки, `assert` проверяет результат.

</v-click>

---
layout: default
---

# Конспект: итерация и генераторы

| Тема | Суть | Когда важно |
|---|---|---|
| Итератор | `iter()`, `next()`, `StopIteration` | Одноразовый: повторный обход пуст |
| Свой итератор | Класс с `__iter__` и `__next__` | Состояние обхода хранится в объекте |
| Генератор | Функция с `yield` | Ленивые вычисления, бесконечные потоки |
| Генераторное выражение | `(x * x for x in data)` | Экономия памяти по сравнению со списком |
| `itertools` | `islice`, `chain`, `groupby`, `product` | Цепочки без списков, `groupby` группирует соседей |

<style>
.slidev-layout table { font-size: 0.78em; }
.slidev-layout td, .slidev-layout th { padding-top: 0.3em; padding-bottom: 0.3em; }
</style>

---
layout: default
---

# Конспект: тестирование

| Тема | Суть | Когда важно |
|---|---|---|
| pytest | Функции `test_*` с проверками `assert` | `pytest.raises` ловит ожидаемые исключения |
| Фикстуры | `@pytest.fixture`, области `function` … `session` | Свежий объект для каждого теста по умолчанию |
| Параметризация | `@pytest.mark.parametrize` | Один тест на много наборов данных |
| Покрытие | `pytest-cov`, `--cov-branch` | Не заменяет `assert` в тестах |
| TDD | Красный тест, минимальный код, рефакторинг | Требование записывается как тест до кода |

<style>
.slidev-layout table { font-size: 0.78em; }
.slidev-layout td, .slidev-layout th { padding-top: 0.3em; padding-bottom: 0.3em; }
</style>

---
layout: center
---

# Дальше — лабораторные №2 и №5

- Лабораторная №2 — сравнение потребления памяти при обработке данных списком и генератором, измерение через `tracemalloc`
- Лабораторная №5 — автотесты на pytest: фикстуры, параметризация и отчёт о покрытии кода

---
layout: center
---

<script setup>
import VueQrcode from 'vue-qrcode'
</script>

# Самостоятельно

[LeetCode 284. Peeking Iterator](https://leetcode.com/problems/peeking-iterator/)

Итератор с дополнительной операцией `peek`, которая показывает следующее
значение без перехода к нему. Итератор одноразовый, поэтому значение,
полученное через `next`, придётся где-то сохранить.

<VueQrcode value="https://leetcode.com/problems/peeking-iterator/" :options="{ width: 250 }" class="mx-auto my-6 rounded-lg" />

---
layout: end
---

# Вопросы