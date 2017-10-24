import ssr, { SSR_DEPENDENCIES_MOCK } from '../ssr'


describe('ssr tests', () => {

  describe('mock tests', () => {

    it('snapshots the mock object', () => {
      expect(SSR_DEPENDENCIES_MOCK).toMatchSnapshot()
    })

    it('tests that the "observe" mock function retruns the secend argument (the observable)', () => {
      const mockAction = 'mockAction'
      const mockObservable = 'mockObservable'
      expect(SSR_DEPENDENCIES_MOCK.observe(mockAction, mockObservable)).toEqual(mockObservable)
    })

  })

  describe('SSR class tests', () => {
    
  })

})
