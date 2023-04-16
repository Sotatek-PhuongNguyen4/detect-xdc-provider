global.window = global // mock

const test = require('tape')
const sinon = require('sinon')

const detectProvider = require('../dist')

// test mocking utility
const mockGlobalProps = (xdc) => {
  window.addEventListener = sinon.fake()
  window.removeEventListener = sinon.fake()
  console.error = sinon.fake()
  if (xdc) {
    window.xdc = xdc
  } else {
    delete window.xdc
  }
}

// different mock providers
const providerWithMetaMask = {
  isMetaMask: true,
}
const providerNoMetaMask = {}
const noProvider = null

test('detectProvider: defaults with xdc already set', async function (t) {
  mockGlobalProps(providerNoMetaMask)

  const provider = await detectProvider()

  t.deepEquals({}, provider, 'resolve with expected provider')
  t.ok(
    window.addEventListener.notCalled,
    'addEventListener should not have been called',
  )
  t.ok(
    window.removeEventListener.calledOnce,
    'removeEventListener called once',
  )
  t.end()
})

test('detectProvider: mustBeMetamask with xdc already set', async function (t) {
  mockGlobalProps(providerWithMetaMask)

  const provider = await detectProvider()

  t.ok(provider.isMetaMask, 'should have resolved expected provider object')
  t.ok(
    window.addEventListener.notCalled,
    'addEventListener should not have been called',
  )
  t.ok(
    window.removeEventListener.calledOnce,
    'removeEventListener called once',
  )
  t.end()
})

test('detectProvider: mustBeMetamask with non-MetaMask xdc already set', async function (t) {
  mockGlobalProps(providerNoMetaMask)

  const result = await detectProvider({ timeout: 1, mustBeMetaMask: true })
  t.equal(result, null, 'promise should have resolved null')
  t.ok(
    window.addEventListener.notCalled,
    'addEventListener should not have been called',
  )
  t.ok(
    window.removeEventListener.calledOnce,
    'removeEventListener called once',
  )
  t.end()
})

test('detectProvider: xdc set on xdc#initialized', async function (t) {
  mockGlobalProps(noProvider)
  const clock = sinon.useFakeTimers()

  const detectPromise = detectProvider({ timeout: 1 })

  // set xdc and call event handler as though event was dispatched
  window.xdc = providerWithMetaMask
  window.addEventListener.lastCall.args[1]()

  // advance clock to ensure nothing blows up
  clock.tick(1)
  clock.tick(1)

  const provider = await detectPromise

  t.ok(provider.isMetaMask, 'should have resolved expected provider object')
  t.ok(
    window.addEventListener.calledOnce,
    'addEventListener should have been called once',
  )
  t.ok(
    window.removeEventListener.calledOnce,
    'removeEventListener should have been called once',
  )

  clock.restore()
  t.end()
})

test('detectProvider: xdc set at end of timeout', async function (t) {
  mockGlobalProps(noProvider)
  const clock = sinon.useFakeTimers()

  const detectPromise = detectProvider({ timeout: 1 })

  // set xdc
  window.xdc = providerWithMetaMask

  // advance clock to trigger timeout function
  clock.tick(1)

  const provider = await detectPromise

  t.ok(provider.isMetaMask, 'should have resolved expected provider object')
  t.ok(
    window.addEventListener.calledOnce,
    'addEventListener should have been called once',
  )
  t.ok(
    window.removeEventListener.calledOnce,
    'removeEventListener should have been called once',
  )

  clock.restore()
  t.end()
})

test('detectProvider: xdc never set', async function (t) {
  mockGlobalProps(noProvider)

  const result = await detectProvider({ timeout: 1 })
  t.equal(result, null, 'promise should have resolved null')
  t.ok(
    window.addEventListener.calledOnce,
    'addEventListener should have been called once',
  )
  t.ok(
    window.removeEventListener.calledOnce,
    'removeEventListener should have been called once',
  )
  t.ok(console.error.calledOnce, 'console.error should have been called once')
  t.end()
})

test('detectProvider: xdc never set (silent mode)', async function (t) {
  mockGlobalProps(noProvider)

  const result = await detectProvider({ timeout: 1, silent: true })
  t.equal(result, null, 'promise should have resolved null')
  t.ok(
    window.addEventListener.calledOnce,
    'addEventListener should have been called once',
  )
  t.ok(
    window.removeEventListener.calledOnce,
    'removeEventListener should have been called once',
  )
  t.ok(console.error.notCalled, 'console.error should not have been called')
  t.end()
})
