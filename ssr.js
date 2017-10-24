import { LOCATION_CHANGE } from 'react-router-redux'
import { Observable } from 'rxjs'

export const SSR_DEPENDENCIES_MOCK = {
  notFound: () => {},
  redirect: () => {},
  observe: (action, observable) => observable,
}

export default class SSR {

  static ACTION_TYPES = {
    PENDING: 'SSR/PENDING',
    ERROR: 'SSR/ERROR',
    SUCCESS: 'SSR/SUCCESS',
  }

  constructor(currentLocation) {

    this.pendingActions = []
    this.store = null
    this.initialAction = {
      type: LOCATION_CHANGE,
      payload: {
        pathname: currentLocation,
      },
    }
    this.loadingComplete = false

    this.actionCounter = 0
  }

  onLoad = onLoad => {
    this._onLoad = onLoad
    return this
  }

  onRedirect = onRedirect => {
    this._onRedirect = onRedirect
    return this
  }

  onNotFound = onNotFound => {
    this._onNotFound = onNotFound
    return this
  }

  onLoadingComplete = () => {
    this.loadingComplete = true
    Object.keys(SSR_DEPENDENCIES_MOCK).forEach(mockKey => {
      this[mockKey] = SSR_DEPENDENCIES_MOCK[mockKey]
    })
  }
  
  observe = (action, reduxObservable) => {

    const time = new Date().getTime()
    this._addPendingAction({
      actionType: action.type,
      time,
    })

    const obs = Observable.zip(
      reduxObservable,
      Observable.of({
        type: SSR.ACTION_TYPES.SUCCESS,
        actionType: action.type,
        time,
      })
    )
    return obs
      .flatMap(actions => actions)
  }

  // must be called after initialization!!!
  _setStore = store => {
    this.store = store
  }

  _hasValidStore = () => {
    if (!this.store) throw new Error('SSR: store must be set after initialization!!!')
    return true
  }

  dispatchInitialAction = store => {
    this._setStore(store)
    if (this._hasValidStore()) {
      this.store.dispatch(this.initialAction)
    }
  }

  _addPendingAction = ssrAction => {
    this.pendingActions.push(ssrAction)
    this.store.dispatch(Object.assign({}, ssrAction, {
      type: SSR.ACTION_TYPES.PENDING,
    }))
  }

  _onUpdate = action => {
    // console.log('update', this.pendingActions.length)
    switch (action.type) {
      case SSR.ACTION_TYPES.SUCCESS: {
        // console.log('------------------ success')
        this.pendingActions = this.pendingActions.filter(pendingAction => {
          return action.time !== pendingAction.time && action.actionType !== pendingAction.actionType
        })
        break
      }
      case SSR.ACTION_TYPES.PENDING: {
        // console.log('------------------ pending')
        break
      }
      case SSR.ACTION_TYPES.ERROR: {
        // console.log('------------------ error')
        break
      }
    }
    // console.log('update', this.pendingActions.length)
    if (this.pendingActions.length === 0 && !this.loadingComplete) {
      this.onLoadingComplete()
      this._onLoad(this.store)
    }
  }

  middleware = () => {
    return store => next => action => { // eslint-disable-line

      // console.log('ssr middleware', action)
      if (action.type.indexOf('SSR/') === 0 && !this.loadingComplete)
        this._onUpdate(action)

      next(action)
    }
  }

  redirect = redirectUrl => {
    this.onLoadingComplete()
    this._onRedirect(this.store, {
      status: 301,
      redirectUrl,
    })
  }

  notFound = () => {
    this.onLoadingComplete()
    this._onNotFound(this.store, {
      status: 404,
    })
  }

}
