import { Observable } from 'rxjs'
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

    it('tests that "onLoad" sets the inner callback function and returns the class instance for chaining', () => {
      const onloadCallbackMock = 'onloadCallbackMock'
      const instance = ssr.onLoad(onloadCallbackMock)
      expect(ssr.onLoadCallback).toEqual(onloadCallbackMock)
      expect(instance).toBe(ssr)
    })

     it('tests that "onRedirect" sets the inner callback function and returns the class instance for chaining', () => {
      const onRedirectCallbackMock = 'onRedirectCallbackMock'
      const instance = ssr.onRedirect(onRedirectCallbackMock)
      expect(ssr.onRedirectCallback).toEqual(onRedirectCallbackMock)
      expect(instance).toBe(ssr)
    })

     it('tests that "onNotFound" sets the inner callback function and returns the class instance for chaining', () => {
      const onNotFoundCallbackMock = 'onNotFoundCallbackMock'
      const instance = ssr.onNotFound(onNotFoundCallbackMock)
      expect(ssr.onNotFoundCallback).toEqual(onNotFoundCallbackMock)
      expect(instance).toBe(ssr)
    })

    it('tests that "dispatchInitialAction" sets the store and dispatches the initial action', () => {
      const store = { dispatch: jest.fn() }
      ssr._setStore = jest.fn(() => ssr.store = store)
      ssr._hasValidStore = jest.fn(() => true)

      ssr.dispatchInitialAction(store)
      expect(ssr._setStore).toHaveBeenCalledWith(store)
      expect(ssr._hasValidStore).toHaveBeenCalled()
      expect(ssr.store.dispatch).toHaveBeenCalledWith(ssr.initialAction)
    })

    describe('middleware tests', () => {

      let middleware = null
      const store = 'store'
      let next  = jest.fn()
      const action = { type: 'SSR/MOCK_ACTION' }
      beforeEach(() => {
        ssr._onUpdate = jest.fn()
        next = jest.fn()

        middleware = ssr.middleware()
      })

      it('tests that the redux middleware reacts on actions starting with "SSR/" and updates pending actions in the stack', () => {
        middleware(store)(next)(action)
        expect(ssr._onUpdate).toHaveBeenCalledWith(action)
        expect(next).toHaveBeenCalledWith(action)
      })

      it('tests that the redux middleware doesn`t updates pending actions when loading is complete', () => {
        ssr.loadingComplete = true
        middleware(store)(next)(action)
        expect(ssr._onUpdate).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(action)
      })

    })

    it('test that "_onLoadingComplete" sets the inner loading flag to <true> and make the "epic functions" unusable', () => {
      SSR_DEPENDENCIES_MOCK.notFound = jest.fn()
      SSR_DEPENDENCIES_MOCK.redirect = jest.fn()
      SSR_DEPENDENCIES_MOCK.observe = jest.fn()

      expect(ssr.loadingComplete).toBe(false)   
      ssr._onLoadingComplete()
      expect(ssr.loadingComplete).toBe(true)
      
      ssr.notFound()
      expect(SSR_DEPENDENCIES_MOCK.notFound).toHaveBeenCalled()

      ssr.redirect()
      expect(SSR_DEPENDENCIES_MOCK.redirect).toHaveBeenCalled()

      ssr.observe()
      expect(SSR_DEPENDENCIES_MOCK.observe).toHaveBeenCalled()
    })

    describe('observable method tests', () => {

      let action, observable = null
      beforeEach(() => {
        action = { type: 'mockType' }
        observable = Observable.of(action)
        global.Date = jest.fn(() => ({
          getTime: jest.fn(() => '123456789')
        }))
      })

      it('tests that the "observe" method takes an action and a observable and adds an action object to pending actions', () => {
        ssr._addPendingAction = jest.fn()

        ssr.observe(action, observable)
        expect(ssr._addPendingAction).toHaveBeenCalledWith({
          actionType: action.type,
          time: '123456789',
        })
      })

      it('tests that the "observe" method zips the handed over observable and adds a custom observable to detect finish', done => {
        const store = { dispatch: jest.fn() }
        ssr._setStore(store)
        const zippedObservable = ssr.observe(action, observable)

        // expect.assertions(1)
        zippedObservable
          .subscribe(
            mappedAction => {
              if (mappedAction.time)
                expect(mappedAction).toEqual({ 
                  type: SSR.ACTION_TYPES.SUCCESS,
                  actionType: 'mockType',
                  time: '123456789' 
                })
              else 
                expect(mappedAction).toEqual(action)
            },
            () => {},
            () => { done() },
        )
      })
    
    })

  })

})
