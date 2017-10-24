import SSR, { SSR_DEPENDENCIES_MOCK } from '../ssr'


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

    let ssr = null 
    beforeEach(() => {
      const currentLocation = 'mock/location'
      ssr = new SSR(currentLocation)
    })

    it('snapshots the SSR.ACTION_TYPES', () => {
      expect(SSR.ACTION_TYPES).toMatchSnapshot()
    })

    it('tests that all class variables are set properly after initialization', () => {
      expect(ssr.pendingActions).toEqual([])
      expect(ssr.store).toEqual(null)
      expect(ssr.initialAction).toMatchSnapshot()
      expect(ssr.loadingComplete).toBe(false)
      expect(ssr.actionCounter).toBe(0)
    })

    it('tests that onLoad sets the inner callback function and returns the class instance for chaining', () => {
      const onloadCallbackMock = 'onloadCallbackMock'
      const instance = ssr.onLoad(onloadCallbackMock)
      expect(ssr.onLoadCallback).toEqual(onloadCallbackMock)
      expect(instance).toBe(ssr)
    })

     it('tests that onRedirect sets the inner callback function and returns the class instance for chaining', () => {
      const onRedirectCallbackMock = 'onRedirectCallbackMock'
      const instance = ssr.onRedirect(onRedirectCallbackMock)
      expect(ssr.onRedirectCallback).toEqual(onRedirectCallbackMock)
      expect(instance).toBe(ssr)
    })

     it('tests that onNotFound sets the inner callback function and returns the class instance for chaining', () => {
      const onNotFoundCallbackMock = 'onNotFoundCallbackMock'
      const instance = ssr.onNotFound(onNotFoundCallbackMock)
      expect(ssr.onNotFoundCallback).toEqual(onNotFoundCallbackMock)
      expect(instance).toBe(ssr)
    })



  })

})
