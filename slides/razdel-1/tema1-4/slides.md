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

# Напоминание: что делает `for`

<v-clicks>

- `for x in obj:` по очереди получает элементы объекта `obj` и выполняет тело цикла для каждого
- Так обходят списки, строки, кортежи, словари, множества, диапазоны `range`, строки файла
- Объекты, по которым можно выполнить `for`, называются итерируемыми

</v-clicks>

<v-click>

Столь разные объекты обходятся одним и тем же циклом, потому что за ним
стоит единый протокол. Он и есть тема этого блока.

</v-click>

---
layout: default
---

# Что скрыто за `for`

Цикл `for` работает в два шага. Сначала вызывается `iter(obj)`, который
возвращает итератор — объект, помнящий текущую позицию. Затем снова и
снова вызывается `next()` для этого итератора, пока не будет поднято
исключение `StopIteration`.

```python
for x in [10, 20, 30]:
    print(x)
```

То же самое, записанное вручную:

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
clicks: 4
---

# Итератор по шагам

Каждый вызов `next()` возвращает очередной элемент и сдвигает указатель.

<IteratorStepper :items="[10, 20, 30]" :step="$clicks" />

---
layout: default
---

# `iter()` и `next()` вручную

```py {monaco-run}
it = iter([10, 20, 30])
print(type(it).__name__)
print(next(it))
print(next(it))
print(next(it))
```

<v-click>

`iter()` вернул итератор (тип `list_iterator`), а `next()` берёт из него
элементы по одному. Четвёртый вызов `next(it)` поднял бы `StopIteration`.

</v-click>

---
layout: default
---

# `StopIteration` — сигнал конца

<v-clicks>

- Исключение — способ сообщить об особой ситуации; перехватывается конструкцией `try`/`except`
- `StopIteration` означает «элементов больше нет»
- Цикл `for` перехватывает его сам и завершается без ошибки
- При ручном вызове `next()` на исчерпанном итераторе исключение получает вызывающий код

</v-clicks>

---
layout: default
---

# Ручной обход до `StopIteration`

```py {monaco-run}
it = iter("abc")
while True:
    try:
        ch = next(it)
    except StopIteration:
        print("элементы закончились")
        break
    print(ch)
```

<v-click>

Так работает `for ch in "abc"`: тело цикла выполняется для каждого
элемента, а исключение `StopIteration` служит условием выхода.

</v-click>

---
layout: default
clicks: 5
---

# Итератор одноразовый

Итератор движется только вперёд. Вернуться к началу и пройти повторно он
не может.

<IteratorStepper :items="[1, 2, 3]" :step="$clicks" :extra="['list(it)  →  []   # элементов не осталось']" />

---
layout: default
---

# Второй проход по исчерпанному итератору

```py {monaco-run}
it = iter([1, 2, 3])
print(list(it))
print(list(it))
```

<v-click>

Первый `list(it)` исчерпал итератор, второй получил пустой результат.
Ошибки при этом нет: итератор просто закончился. Такое поведение легко
остаётся незамеченным, поэтому его важно знать заранее.

</v-click>

---
layout: default
---

# Ленивые встроенные функции

<v-clicks>

- `map(f, seq)` — применяет функцию `f` к каждому элементу
- `filter(f, seq)` — оставляет элементы, для которых `f` вернула истину
- `zip(a, b)` — объединяет элементы нескольких последовательностей в кортежи
- `enumerate(seq)` — добавляет номер к каждому элементу
- Все четыре возвращают итераторы: значения вычисляются при обходе

</v-clicks>

---
layout: default
---

# `map` возвращает итератор

```py {monaco-run}
doubled = map(lambda x: x * 2, [1, 2, 3])
print(type(doubled).__name__)
print(next(doubled))
print(list(doubled))
print(list(doubled))
```

<v-click>

Тип результата — `map`, то есть итератор. После `next()` в нём остались
два элемента, их собрал первый `list()`. Второй `list()` вернул пустой
список: итератор исчерпан.

</v-click>

---
layout: default
---

# Свой итератор: `__iter__` и `__next__`

Чтобы класс стал итератором, достаточно двух методов. `__next__` возвращает
следующий элемент или поднимает `StopIteration`. `__iter__` возвращает сам
объект.

```python
class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value
```

---
layout: default
---

# Живой пример

```py {monaco-run}
class Countdown:
    def __init__(self, start):
        self.current = start
    def __iter__(self):
        return self
    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value

for x in Countdown(3):
    print(x)
```

<v-click>

Объект `Countdown(3)` хранит позицию в атрибуте `current`. Цикл `for`
вызывает `__iter__`, затем `__next__` до тех пор, пока не будет поднято
`StopIteration`.

</v-click>

---
layout: default
---

# Найдите ошибку

Класс `Countdown` — тот же, что на предыдущих слайдах.

```python
countdown = Countdown(3)

print("первый обход")
for x in countdown:
    print(x)

print("второй обход")
for x in countdown:
    print(x)
```

Ожидается, что оба цикла напечатают 3, 2, 1. Что выведет код на самом деле?

---
layout: default
---

# Разбор

```py {monaco-run}
class Countdown:
    def __init__(self, start):
        self.current = start
    def __iter__(self):
        return self
    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value

countdown = Countdown(3)
print(list(countdown))
print(list(countdown))
```

<v-click>

Первый проход довёл `current` до нуля, и объект остался в этом состоянии.
`__iter__` возвращает `self`, то есть тот же объект с тем же состоянием:
нового итератора никто не создаёт, и второй проход сразу получает
`StopIteration`.

</v-click>

---
layout: default
---

# Как исправить

Нужно разделить две роли. Итерируемый объект хранит исходные данные и при
каждом `iter()` создаёт новый итератор. Итератор хранит только текущую
позицию.

```py {monaco-run}
class Countdown:
    def __init__(self, start):
        self.start = start

    def __iter__(self):
        return iter(range(self.start, 0, -1))

countdown = Countdown(3)
print(list(countdown))
print(list(countdown))
```

<v-click>

Теперь `__iter__` при каждом обходе возвращает свежий итератор (здесь —
итератор от `range`), и оба прохода дают `[3, 2, 1]`. Так устроены списки
и другие встроенные контейнеры.

</v-click>

---
layout: center
---

# От класса — к генератору

Класс-итератор требует отдельных методов, хранения состояния и ручного
`StopIteration`. Для типовых случаев в Python есть более короткая запись —
генераторы.

---
layout: default
---

# Напоминание: обычная функция

<v-clicks>

- Вызов функции выполняет её тело от начала до `return`
- Локальные переменные создаются при вызове и исчезают при возврате
- Следующий вызов начинается с чистого листа

</v-clicks>

---
layout: default
---

# Какую проблему решают генераторы

Итератор в виде класса состоит из трёх частей: состояние в атрибутах,
метод `__next__` с проверкой конца и ручной `raise StopIteration`. Для
обычной последовательности значений такая запись избыточна.

Генераторная функция выражает то же самое обычным кодом с `yield`.
Протокол итератора Python реализует сам.

---
layout: default
---

# Функция с `yield`

```python
def count_to(n):
    i = 1
    while i <= n:
        yield i
        i += 1
```

Если в теле функции есть `yield`, она становится генераторной. Вызов такой
функции возвращает объект-генератор, а тело ещё не запускается. Код
выполняется порциями при вызовах `next()`. Оператор `yield` отдаёт значение и
приостанавливает функцию, сохраняя все локальные переменные.

---
layout: default
---

# Первый генератор

```py {monaco-run}
def count_to(n):
    i = 1
    while i <= n:
        yield i
        i += 1

g = count_to(3)
print(type(g).__name__)
print(next(g))
print(next(g))
print(list(g))
```

<v-click>

Вызов `count_to(3)` вернул объект типа `generator`, код функции при этом
не выполнялся. Два `next()` взяли значения 1 и 2, а `list(g)` собрал
оставшееся: `[3]`.

</v-click>

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

# Порядок выполнения вживую

```py {monaco-run}
def gen():
    print("старт")
    yield 1
    print("между")
    yield 2
    print("конец")

g = gen()
print("генератор создан")
print(next(g))
print(next(g))
```

<v-click>

Строки «старт» и «между» напечатаны только в момент соответствующих
`next()`. Третий вызов `next(g)` выполнил бы `print("конец")` и поднял
`StopIteration`.

</v-click>

---
layout: default
---

# Генератор — это итератор

Генератор уже содержит `__iter__` и `__next__`, поэтому его принимают
`for`, `list()`, `sum()` и любые другие места, где ждут итерируемый
объект. Как у любого итератора, обход у него один.

```py {monaco-run}
g = (x for x in range(3))
print(iter(g) is g)
print(hasattr(g, "__next__"))
print(list(g))
print(list(g))
```

<v-click>

`iter(g) is g` истинно: как и положено итератору, `__iter__` возвращает
сам объект. Второй `list(g)` пуст, потому что первый исчерпал генератор.

</v-click>

---
layout: default
---

# Генераторное выражение

Для простых случаев генератор записывается как выражение: круглые скобки
вместо квадратных.

```python
squares_list = [x * x for x in range(5)]   # список
squares_gen = (x * x for x in range(5))    # генератор
```

Если генераторное выражение — единственный аргумент функции, внешние
скобки можно опустить: `sum(x * x for x in range(5))`.

---
layout: default
---

# Выражение и включение рядом

```py {monaco-run}
squares_list = [x * x for x in range(5)]
squares_gen = (x * x for x in range(5))
print(type(squares_list).__name__, type(squares_gen).__name__)
print(sum(squares_gen))
print(sum(squares_gen))
```

<v-click>

Типы разные: `list` и `generator`. Первый `sum` вернул 30, второй — 0:
генератор после первого прохода исчерпан.

</v-click>

---
layout: default
---

# Ленивые вычисления

Значение вычисляется в момент запроса. Заранее ничего не считается и не
хранится. Следствия:

<v-clicks>

- В памяти находится только текущее значение
- Первый элемент доступен сразу, без расчёта остальных
- Последовательность может быть бесконечной
- Побочные эффекты внутри генератора (например, `print`) происходят в момент запроса значения

</v-clicks>

---
layout: default
clicks: 6
---

# Память: список и генератор

Список хранит все элементы одновременно. Генератор держит одно текущее
значение.

<LazyVsEager :step="$clicks" />

---
layout: default
---

# Размер объекта: `sys.getsizeof`

```py {monaco-run}
import sys

small_list = [x for x in range(10)]
small_gen = (x for x in range(10))
big_list = [x for x in range(1_000_000)]
big_gen = (x for x in range(1_000_000))

print("10 элементов:", sys.getsizeof(small_list), sys.getsizeof(small_gen))
print("1 000 000 элементов:", sys.getsizeof(big_list), sys.getsizeof(big_gen))
```

<v-click>

Размер списка растёт вместе с числом элементов, размер генератора
остаётся постоянным. На десяти элементах выигрыша нет: сам объект-генератор
занимает порядка сотни байт. Функция `getsizeof` считает только сам
контейнер, без объектов внутри, поэтому реальная разница для списка ещё
больше.

</v-click>

---
layout: default
---

# Измерение через `tracemalloc`

Модуль `tracemalloc` отслеживает память, которую выделяет Python.
`get_traced_memory()` возвращает текущий и пиковый объём с момента вызова
`start()`.

```python
import tracemalloc

tracemalloc.start()
total = sum([x * x for x in range(1_000_000)])   # со списком
_, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()
print(f"пик: {peak / 1024 / 1024:.1f} МБ")
```

Тот же код с `sum(x * x for x in range(1_000_000))` вместо списка. Реальный
результат прогона: список — пик 38.6 МБ, генератор — пик 0.0 МБ.

---
layout: default
---

# Бесконечные последовательности

Генератор может не заканчиваться: пока значения не запрашивают, он ничего
не вычисляет.

```python
def naturals():
    n = 1
    while True:
        yield n
        n += 1
```

Чтобы взять конечную часть, используют `itertools.islice(итератор, n)` —
функцию, которая возвращает первые `n` элементов.

---
layout: default
---

# Бесконечный генератор вживую

```py {monaco-run}
from itertools import islice

def naturals():
    n = 1
    while True:
        yield n
        n += 1

print(list(islice(naturals(), 5)))
```

<v-click>

Цикл `while True` не зависает: код выполняется ровно столько раз,
сколько значений запросили. Вызов `list(naturals())` без `islice` не
завершился бы никогда.

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

```py {monaco-run}
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
---

# Когда генератор не подходит

<v-clicks>

- Нет длины: `len(g)` даёт `TypeError: object of type 'generator' has no len()`
- Нет индексации: `g[0]` даёт `TypeError: 'generator' object is not subscriptable`
- Обход один: для повторного прохода нужен список или новый вызов генераторной функции
- Назад вернуться нельзя: значения, уже выданные генератором, нигде не хранятся

</v-clicks>

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

# `yield from` вживую

```py {monaco-run}
def chain_two():
    yield from [1, 2]
    yield from "ab"

print(list(chain_two()))

def countdown(n):
    while n > 0:
        yield n
        n -= 1

def with_finish(n):
    yield from countdown(n)
    yield "старт"

print(list(with_finish(3)))
```

<v-click>

Первый пример склеивает две последовательности. Второй показывает
делегирование другому генератору: `with_finish` отдаёт все значения
`countdown`, а затем добавляет своё.

</v-click>

---
layout: default
---

# Найдите ошибку

```python
def average(numbers):
    total = sum(numbers)
    count = len(list(numbers))
    return total / count

data = (x for x in [2, 4, 6])
print(average(data))
```

Ожидается 4.0. Что произойдёт при запуске?

---
layout: default
---

# Разбор

```py {monaco-run}
def average(numbers):
    total = sum(numbers)
    count = len(list(numbers))
    return total / count

data = (x for x in [2, 4, 6])
try:
    print(average(data))
except ZeroDivisionError as e:
    print("ZeroDivisionError:", e)
```

<v-click>

`sum(numbers)` прошёл по генератору до конца и исчерпал его. После этого
`list(numbers)` получил пустой результат, `count` стал нулём, а деление на
него дало `ZeroDivisionError`. Исправление: сохранить значения один раз,
`values = list(numbers)`, и работать с этим списком.

</v-click>

---
layout: center
---

# От ручных генераторов — к готовым блокам

Генераторы строятся вручную. Для типовых операций в стандартной
библиотеке уже есть готовые ленивые блоки — модуль `itertools`.

---
layout: default
---

# Зачем `itertools`

Модуль `itertools` — набор функций, которые принимают итерируемые объекты
и возвращают итераторы. Все они ленивые и соединяются в цепочки так же,
как генераторы. Подключение — обычным импортом: `from itertools import ...`.

<v-clicks>

- Бесконечные последовательности: `count`, `cycle`, `repeat`
- Нарезка и склейка: `islice`, `chain`
- Комбинаторика: `product`, `permutations`, `combinations`
- Группировка и накопление: `groupby`, `accumulate`

</v-clicks>

---
layout: default
---

# `count`, `cycle`, `repeat`

- `count(start, step)` — числа с шагом, без конца
- `cycle(seq)` — бесконечное повторение последовательности по кругу
- `repeat(x, n)` — значение `x` ровно `n` раз; без `n` — бесконечно

```py {monaco-run}
from itertools import count, cycle, repeat, islice

print(list(islice(count(10, 5), 4)))
print(list(islice(cycle("AB"), 5)))
print(list(repeat("x", 3)))
```

<v-click>

Первые два вызова бесконечны, поэтому ограничены через `islice`. У
`repeat` число повторений задано явно.

</v-click>

---
layout: default
---

# `islice` и `chain`

- `islice(it, stop)` и `islice(it, start, stop)` — срез итератора; отрицательных индексов нет
- `chain(a, b, ...)` — последовательное соединение нескольких итерируемых

```py {monaco-run}
from itertools import islice, chain

print(list(islice("abcdef", 2, 5)))
print(list(chain([1, 2], (3, 4), "ab")))
```

<v-click>

`islice("abcdef", 2, 5)` берёт элементы с индексами 2, 3 и 4. `chain`
склеивает список, кортеж и строку в одну последовательность без создания
промежуточного списка.

</v-click>

---
layout: default
---

# Комбинаторика

- `product(a, b)` — все пары из элементов двух последовательностей
- `permutations(seq, r)` — упорядоченные выборки по `r` элементов
- `combinations(seq, r)` — неупорядоченные выборки по `r` элементов

```py {monaco-run}
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

`groupby(seq)` объединяет подряд идущие одинаковые элементы. Если
одинаковые элементы разбросаны по последовательности, получится несколько
групп с одним и тем же ключом.

<GroupbyDemo :step="$clicks" />

---
layout: default
---

# `groupby` вживую

```py {monaco-run}
from itertools import groupby

data = "AAABBBAA"
print([(k, len(list(g))) for k, g in groupby(data)])
print([(k, len(list(g))) for k, g in groupby(sorted(data))])
```

<v-click>

Без сортировки получились три группы, ключ `'A'` встретился дважды. После
`sorted()` одинаковые элементы стоят рядом, групп две. Для группировки
по всему набору данных предварительно сортируют по тому же ключу.

</v-click>

---
layout: default
---

# Цепочка целиком

Бесконечный источник, две стадии и ограничитель: вся цепочка остаётся
ленивой.

```py {monaco-run}
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
