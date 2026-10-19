// Реальный вывод запусков pytest, снятый с настоящих прогонов.
export default {
 "first_run": {
  "cmd": "pytest -v",
  "lines": [
   "============================= test session starts ==============================",
   "collecting ... collected 3 items",
   "",
   "test_stats.py::test_average_typical PASSED                               [ 33%]",
   "test_stats.py::test_average_single_value PASSED                          [ 66%]",
   "test_stats.py::test_average_empty_raises PASSED                          [100%]",
   "",
   "============================== 3 passed in 0.02s ==============================="
  ]
 },
 "fail_run": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 3 items",
   "",
   "test_stats.py F..                                                        [100%]",
   "",
   "=================================== FAILURES ===================================",
   "_____________________________ test_average_typical _____________________________",
   "",
   "    def test_average_typical():",
   ">       assert average([1, 2, 3]) == 3",
   "E       assert 2.0 == 3",
   "E        +  where 2.0 = average([1, 2, 3])",
   "",
   "test_stats.py:6: AssertionError",
   "=========================== short test summary info ============================",
   "FAILED test_stats.py::test_average_typical - assert 2.0 == 3",
   "========================= 1 failed, 2 passed in 0.02s =========================="
  ]
 },
 "raises_run": {
  "cmd": "pytest -v",
  "lines": [
   "============================= test session starts ==============================",
   "collecting ... collected 1 item",
   "",
   "test_stats.py::test_average_empty_raises PASSED                          [100%]",
   "",
   "============================== 1 passed in 0.01s ==============================="
  ]
 },
 "shared_state_run": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 2 items",
   "",
   "test_stack.py .F                                                         [100%]",
   "",
   "=================================== FAILURES ===================================",
   "___________________________ test_new_stack_is_empty ____________________________",
   "",
   "    def test_new_stack_is_empty():",
   ">       assert stack.is_empty()",
   "E       assert False",
   "E        +  where False = is_empty()",
   "E        +    where is_empty = <stack.Stack object at 0x7feaf8bfe9c0>.is_empty",
   "",
   "test_stack.py:12: AssertionError",
   "=========================== short test summary info ============================",
   "FAILED test_stack.py::test_new_stack_is_empty - assert False",
   "========================= 1 failed, 1 passed in 0.02s =========================="
  ]
 },
 "fixture_run": {
  "cmd": "pytest -v",
  "lines": [
   "============================= test session starts ==============================",
   "collecting ... collected 2 items",
   "",
   "test_stack.py::test_push PASSED                                          [ 50%]",
   "test_stack.py::test_new_stack_is_empty PASSED                            [100%]",
   "",
   "============================== 2 passed in 0.01s ==============================="
  ]
 },
 "yield_fixture_run": {
  "cmd": "pytest --setup-show",
  "lines": [
   "============================= test session starts ==============================",
   "collected 2 items",
   "",
   "test_conn.py",
   "        SETUP    F connection",
   "        test_conn.py::test_query (fixtures used: connection) .",
   "        TEARDOWN F connection",
   "        SETUP    F connection",
   "        test_conn.py::test_ping (fixtures used: connection) .",
   "        TEARDOWN F connection",
   "",
   "============================== 2 passed in 0.01s ==============================="
  ]
 },
 "scope_module_run": {
  "cmd": "pytest --setup-show",
  "lines": [
   "============================= test session starts ==============================",
   "collected 3 items",
   "",
   "test_conn.py",
   "    SETUP    M connection",
   "        test_conn.py::test_query (fixtures used: connection) .",
   "        test_conn.py::test_ping (fixtures used: connection) .",
   "        test_conn.py::test_close (fixtures used: connection) .",
   "    TEARDOWN M connection",
   "",
   "============================== 3 passed in 0.01s ==============================="
  ]
 },
 "builtin_run": {
  "cmd": "pytest -v",
  "lines": [
   "============================= test session starts ==============================",
   "collecting ... collected 2 items",
   "",
   "test_builtin.py::test_write_file PASSED                                  [ 50%]",
   "test_builtin.py::test_prints PASSED                                      [100%]",
   "",
   "============================== 2 passed in 0.02s ==============================="
  ]
 },
 "param_run": {
  "cmd": "pytest -v",
  "lines": [
   "============================= test session starts ==============================",
   "collecting ... collected 3 items",
   "",
   "test_stats.py::test_average[numbers0-2] PASSED                           [ 33%]",
   "test_stats.py::test_average[numbers1-5] PASSED                           [ 66%]",
   "test_stats.py::test_average[numbers2-0] PASSED                           [100%]",
   "",
   "============================== 3 passed in 0.01s ==============================="
  ]
 },
 "param_ids_run": {
  "cmd": "pytest -v",
  "lines": [
   "============================= test session starts ==============================",
   "collecting ... collected 3 items",
   "",
   "test_stats.py::test_average[typical] PASSED                              [ 33%]",
   "test_stats.py::test_average[single] PASSED                               [ 66%]",
   "test_stats.py::test_average[wrong_expected] FAILED                       [100%]",
   "",
   "=================================== FAILURES ===================================",
   "_________________________ test_average[wrong_expected] _________________________",
   "",
   "numbers = [-1, 1], expected = 1",
   "",
   "    @pytest.mark.parametrize(",
   "        \"numbers, expected\",",
   "        [",
   "            ([1, 2, 3], 2),",
   "            ([5], 5),",
   "            ([-1, 1], 1),",
   "        ],",
   "        ids=[\"typical\", \"single\", \"wrong_expected\"],",
   "    )",
   "    def test_average(numbers, expected):",
   ">       assert average(numbers) == expected",
   "E       assert 0.0 == 1",
   "E        +  where 0.0 = average([-1, 1])",
   "",
   "test_stats.py:15: AssertionError",
   "=========================== short test summary info ============================",
   "FAILED test_stats.py::test_average[wrong_expected] - assert 0.0 == 1",
   "========================= 1 failed, 2 passed in 0.03s =========================="
  ]
 },
 "param_fixture_run": {
  "cmd": "pytest -v",
  "lines": [
   "============================= test session starts ==============================",
   "collecting ... collected 3 items",
   "",
   "test_stack.py::test_push_peek[1] PASSED                                  [ 33%]",
   "test_stack.py::test_push_peek[2] PASSED                                  [ 66%]",
   "test_stack.py::test_push_peek[3] PASSED                                  [100%]",
   "",
   "============================== 3 passed in 0.01s ==============================="
  ]
 },
 "cov_run1": {
  "cmd": "pytest --cov=grade --cov-report=term-missing",
  "lines": [
   "============================= test session starts ==============================",
   "collected 1 item",
   "",
   "test_grade.py .                                                          [100%]",
   "",
   "================================ tests coverage ================================",
   "_______________ coverage: platform linux, python 3.12.3-final-0 ________________",
   "",
   "Name       Stmts   Miss  Cover   Missing",
   "----------------------------------------",
   "grade.py       6      2    67%   3, 6",
   "----------------------------------------",
   "TOTAL          6      2    67%",
   "============================== 1 passed in 0.05s ==============================="
  ]
 },
 "cov_run3": {
  "cmd": "pytest --cov=grade --cov-report=term-missing",
  "lines": [
   "============================= test session starts ==============================",
   "collected 3 items",
   "",
   "test_grade.py ...                                                        [100%]",
   "",
   "================================ tests coverage ================================",
   "_______________ coverage: platform linux, python 3.12.3-final-0 ________________",
   "",
   "Name       Stmts   Miss  Cover   Missing",
   "----------------------------------------",
   "grade.py       6      0   100%",
   "----------------------------------------",
   "TOTAL          6      0   100%",
   "============================== 3 passed in 0.05s ==============================="
  ]
 },
 "cov_branch_run": {
  "cmd": "pytest --cov=label --cov-branch --cov-report=term-missing",
  "lines": [
   "============================= test session starts ==============================",
   "collected 1 item",
   "",
   "test_label.py .                                                          [100%]",
   "",
   "================================ tests coverage ================================",
   "_______________ coverage: platform linux, python 3.12.3-final-0 ________________",
   "",
   "Name       Stmts   Miss Branch BrPart  Cover   Missing",
   "------------------------------------------------------",
   "label.py       5      0      2      1    86%   3->5",
   "------------------------------------------------------",
   "TOTAL          5      0      2      1    86%",
   "============================== 1 passed in 0.04s ==============================="
  ]
 },
 "cov_failunder_run": {
  "cmd": "pytest --cov=grade --cov-fail-under=90",
  "lines": [
   "============================= test session starts ==============================",
   "collected 1 item",
   "",
   "test_grade.py .",
   "ERROR: Coverage failure: total of 67 is less than fail-under=90",
   "                                                                         [100%]",
   "",
   "================================ tests coverage ================================",
   "_______________ coverage: platform linux, python 3.12.3-final-0 ________________",
   "",
   "Name       Stmts   Miss  Cover",
   "------------------------------",
   "grade.py       6      2    67%",
   "------------------------------",
   "TOTAL          6      2    67%",
   "FAIL Required test coverage of 90% not reached. Total coverage: 66.67%",
   "============================== 1 passed in 0.03s ==============================="
  ]
 },
 "noassert_run": {
  "cmd": "pytest --cov=grade --cov-report=term-missing",
  "lines": [
   "============================= test session starts ==============================",
   "collected 1 item",
   "",
   "test_grade.py .                                                          [100%]",
   "",
   "================================ tests coverage ================================",
   "_______________ coverage: platform linux, python 3.12.3-final-0 ________________",
   "",
   "Name       Stmts   Miss  Cover   Missing",
   "----------------------------------------",
   "grade.py       6      0   100%",
   "----------------------------------------",
   "TOTAL          6      0   100%",
   "============================== 1 passed in 0.03s ==============================="
  ]
 },
 "tdd_red1": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 0 items / 1 error",
   "",
   "==================================== ERRORS ====================================",
   "_________________________ ERROR collecting test_age.py _________________________",
   "ImportError while importing test module 'test_age.py'.",
   "Hint: make sure your test modules/packages have valid Python names.",
   "Traceback:",
   "test_age.py:1: in <module>",
   "    from age import is_valid_age",
   "E   ImportError: cannot import name 'is_valid_age' from 'age' (age.py)",
   "=========================== short test summary info ============================",
   "ERROR test_age.py",
   "!!!!!!!!!!!!!!!!!!!! Interrupted: 1 error during collection !!!!!!!!!!!!!!!!!!!!",
   "=============================== 1 error in 0.10s ==============================="
  ]
 },
 "tdd_green1": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 1 item",
   "",
   "test_age.py .                                                            [100%]",
   "",
   "============================== 1 passed in 0.01s ==============================="
  ]
 },
 "tdd_red2": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 2 items",
   "",
   "test_age.py .F                                                           [100%]",
   "",
   "=================================== FAILURES ===================================",
   "__________________________ test_negative_age_invalid ___________________________",
   "",
   "    def test_negative_age_invalid():",
   ">       assert is_valid_age(-1) is False",
   "E       assert True is False",
   "E        +  where True = is_valid_age(-1)",
   "",
   "test_age.py:9: AssertionError",
   "=========================== short test summary info ============================",
   "FAILED test_age.py::test_negative_age_invalid - assert True is False",
   "========================= 1 failed, 1 passed in 0.02s =========================="
  ]
 },
 "tdd_green2": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 2 items",
   "",
   "test_age.py ..                                                           [100%]",
   "",
   "============================== 2 passed in 0.01s ==============================="
  ]
 },
 "tdd_red3": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 3 items",
   "",
   "test_age.py ..F                                                          [100%]",
   "",
   "=================================== FAILURES ===================================",
   "___________________________ test_string_age_invalid ____________________________",
   "",
   "    def test_string_age_invalid():",
   ">       assert is_valid_age(\"25\") is False",
   "               ^^^^^^^^^^^^^^^^^^",
   "",
   "test_age.py:13:",
   "_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _",
   "",
   "age = '25'",
   "",
   "    def is_valid_age(age):",
   ">       return 0 <= age <= 150",
   "               ^^^^^^^^^^^^^^^",
   "E       TypeError: '<=' not supported between instances of 'int' and 'str'",
   "",
   "age.py:2: TypeError",
   "=========================== short test summary info ============================",
   "FAILED test_age.py::test_string_age_invalid - TypeError: '<=' not supported b...",
   "========================= 1 failed, 2 passed in 0.03s =========================="
  ]
 },
 "tdd_green3": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 3 items",
   "",
   "test_age.py ...                                                          [100%]",
   "",
   "============================== 3 passed in 0.01s ==============================="
  ]
 },
 "noassert_fixed_run": {
  "cmd": "pytest",
  "lines": [
   "============================= test session starts ==============================",
   "collected 1 item",
   "",
   "test_grade.py F                                                          [100%]",
   "",
   "=================================== FAILURES ===================================",
   "__________________________________ test_grade __________________________________",
   "",
   "    def test_grade():",
   ">       assert grade(75) == \"зачёт\"",
   "E       AssertionError: assert 'незачёт' == 'зачёт'",
   "E         ",
   "E         - зачёт",
   "E         + незачёт",
   "E         ? ++",
   "",
   "test_grade.py:6: AssertionError",
   "=========================== short test summary info ============================",
   "FAILED test_grade.py::test_grade - AssertionError: assert 'незачёт' == 'зачёт'",
   "============================== 1 failed in 0.02s ==============================="
  ]
 }
}
