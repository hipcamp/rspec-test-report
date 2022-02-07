/* eslint-disable filenames/match-regex */
import * as core from '@actions/core'
import * as fs from 'fs'
import * as glob from 'glob'
import * as path from 'path'
import {TestCase, TestSuite} from './test-suite'
import {XMLParser} from 'fast-xml-parser'
export class RSpecService {
  private readonly paths: string[]

  constructor(paths: string[]) {
    this.paths = paths
  }

  private decodeHTML(text: string): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entities: any = {
      amp: '&',
      apos: "'",
      lt: '<',
      gt: '>',
      quot: '"',
      nbsp: '\xa0'
    }
    const entityPattern = /&([a-z]+);/gi

    return text.replace(entityPattern, function (match, entity) {
      entity = entity.toLowerCase()
      if (entities.hasOwnProperty(entity)) {
        return entities[entity]
      }
      // return original string if there is no matching entity (no replace)
      return match
    })
  }

  private getRSpecFilePaths(): string[] {
    const filePaths: string[] = []
    for (const pattern of this.paths) {
      const files: string[] = glob.sync(pattern).map(x => path.resolve(x))
      filePaths.push(...files)
    }
    return [...new Set(filePaths)]
  }

  private parseRSpecFile(filepath: string): TestSuite {
    core.info(`Parsing File: ${filepath}`)
    const options = {
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: 'text'
    }
    const parser: XMLParser = new XMLParser(options)
    const response = parser.parse(fs.readFileSync(filepath))
    const data = response['testsuite']
    data.errors = +data.errors
    data.skipped = +data.skipped
    data.tests = +data.tests
    data.time = +data.time

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allTestscases: TestCase[] = data.testcase.map((x: any) => {
      x.time = +x.time
      if (x.failure) {
        x.failure.text = this.decodeHTML(x.failure.text)
      }
      return x
    })
    delete data.testcase

    data.passed = allTestscases.filter(x => !x.failure)
    data.failures = allTestscases.filter(x => x.failure)
    return data
  }

  generateReport(): TestSuite {
    core.debug(`CWD: ${process.cwd()}`)
    const collatedTestSuite: TestSuite = {
      name: 'Collated Test Suite',
      errors: 0,
      skipped: 0,
      tests: 0,
      time: 0,
      passed: [],
      failures: []
    }
    const rspecFilePaths: string[] = this.getRSpecFilePaths()
    for (const filepath of rspecFilePaths) {
      const testSuite: TestSuite = this.parseRSpecFile(filepath)
      collatedTestSuite.errors += testSuite.errors
      collatedTestSuite.skipped += testSuite.skipped
      collatedTestSuite.tests += testSuite.tests
      collatedTestSuite.time += testSuite.time
      collatedTestSuite.passed.push(...testSuite.passed)
      collatedTestSuite.failures.push(...testSuite.failures)
    }
    return collatedTestSuite
  }
}
