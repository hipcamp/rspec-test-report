import * as core from '@actions/core'
import {RSpecService} from './rspec.service'
import {TestSuite} from './test-suite'

async function run(): Promise<void> {
  try {
    const paths: string[] = core.getInput('paths')
      ? core.getInput('paths').split(' ')
      : ['*.xml']
    const failOnError: boolean = core.getBooleanInput('fail-on-error')

    const rspecService: RSpecService = new RSpecService(paths)
    const report: TestSuite = rspecService.generateReport()

    for (const testcase of report.failures) {
      core.error(
        `FILE: ${testcase.file}
${testcase.failure?.text}`,
        {
          title: testcase.name,
          file: testcase.file
        }
      )
    }

    if ((report.failures || report.errors) && failOnError) {
      core.setFailed(
        `There are ${
          report.failures.length + report.errors
        } failed test(s) in your test report.`
      )
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
