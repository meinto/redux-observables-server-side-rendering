# redux-observables-server-side-rendering

[![npm version](https://badge.fury.io/js/redux-observables-server-side-rendering.svg)](https://www.npmjs.com/package/redux-observables-server-side-rendering)
[![travis build](https://travis-ci.org/meinto/redux-observables-server-side-rendering.svg?branch=master)](https://travis-ci.org/meinto/redux-observables-server-side-rendering)

A middleware that works in combination with `react-router`, `react-router-redux` and `redux-observables`.

## Installation

```
npm install --save redux-observables-server-side-rendering
```

## Usage

> FIRST OF ALL  
> This is very customized to an existing project, but it works.  
> If you have suggestions to do this in a better or more common way don't, hesitate to make a pull request or message me.

Once you've configured your application you can use the ssr object created inside the server, handed over to the store and the epic middleware as dependency, in your own epic implementations.

```js
// example epic
const myDataFetchingEpic = (action$, store, ssr) => actions$
  .ofType('SPECIFIC_ACTION_TYPE')
  .switchMap(action => {
    return ssr.observe(action, 
      getSomeDataFetchingObservable()
        .flatMap(response => [
          actionCreator1(response.data1),
          actionCreator2(response.data1),
        ])        
    )
  })

```

**You can find below how to configure your application to get ssr with redux-observables work:**

## Configuration

Let's assume we have have `redux` application with `components`, `containers`, `modules` and `redux-observables` for data fetching. The app runs with `react-router` and `react-router-redux` and has a config folder:

```
// project folder structure
src
| - client
| | - components
| | - config
| | | - store.js
| | | ...
| | - containers
| | - middlewares
| | | - reactRouterDataLoading.js // <-- this file must be written by yourself.
                                  // It is responsible to trigger the epics for the requested page url
                                  // and reacts on react-router-redux action-types which are fired
                                  // by the middleware of this library
| | - modules
| - server
| | - index.js
```

### Server

```js
// express server
...
import { SSR } from 'redux-observables-server-side-rendering'

app.use('*', (req, res) => {

  ...
  const history = createMemoryHistory({
    initialEntries: [req.originalUrl],
  })

  const reduxObservablesSSR = new SSR(req.originalUrl)
    .onLoad(store => {
      processApp(store, history, res, req, cacheName) // helper function to renderToString(YourApp)
    })
    .onRedirect((store, { status = 301, redirectUrl }) => { // react on redirects
      res.redirect(status, redirectUrl)
    })
    .onNotFound((store, { status = 404 }) => {        // react on page notFound
      res.status(status)                              // set response status code
      processApp(store, history, res, req, cacheName) // helper function to renderToString(YourApp)
    })

    const initialState = { ... }
    const store = configureStore(initialState, {
      ... // your store configuration
      middlewares: [reduxObservablesSSR.middleware()],
      epicOptions: {
        dependencies: reduxObservablesSSR,
      },
    })

    /* the SSR module creates an initial action in the following form:
     * 
     * {
     *   type: '@@router/LOCATION_CHANGE', <-- react-router-redux specific action type
     *   payload: {
     *     pathname: 'current/location/on/my/website', <-- req.originalUrl
     *   },
     * }
     * 
     * the initial action will be fired with the following command and could be handled
     * from a middleware which triggers the initial epic action to fetch required data.
     * (this middleware have to be written by yourself and is not included in this library)
     */
    reduxObservablesSSR.dispatchInitialAction(store)

})
```

### Client

To make ssr with `redux-observables` work, we have to configure the store:

```js
// store.js
...
// this mock is needed for the client.js to work
import { SSR_DEPENDENCIES_MOCK } from 'redux-observables-server-side-rendering'

const initalOptions = {
  middlewares: [],
  epicOptions: {
    dependencies: SSR_DEPENDENCIES_MOCK,
  },
  history: null,
}
export const configureStore = (initialState = {}, options = initialOptions) => {
  let middlewares = []
  
  ...
  
  // hand over the instance of the SSR object (namend reduxObservablesSSR in the server implementation) 
  // to the epic middleware as dependency.
  // This will make the object available in all of your epic's as third argument.
  middlewares = [...middlewares, createEpicMiddleware(rootEpic, _options.epicOptions)]
  
  ...
  
  // its important that the ssr middleware stands at the last place of the array
  if (_options.middlewares.length > 0)
    middlewares = [...middlewares, ..._options.middlewares]

  const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(...middlewares)
  )

  return store
}
```

