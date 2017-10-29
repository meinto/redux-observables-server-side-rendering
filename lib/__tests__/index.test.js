import * as indexExports from '../index'

describe('index file tests', () => {
  it('snapshots exports', () => {
    expect(indexExports).toMatchSnapshot()
  })
})