export interface TestSuite {
  name: string
  tests: number
  skipped: number
  errors: number
  time: number
  passed: TestCase[]
  failures: TestCase[]
}

export interface TestCase {
  classname: string
  name: string
  file: string
  time: number
  failure?: TestFailure
}

export interface TestFailure {
  text: string
  message: string
  type: string
}
