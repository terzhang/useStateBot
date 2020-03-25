import useStateBot, { ConfigException, StateException } from './';
import { renderHook, act } from '@testing-library/react-hooks';
import { ActionException } from './customErrors';

// mock timer using jest
jest.useFakeTimers();

describe('useStateBot throw Errors on improper configurations', () => {
  it('throws ConfigException if no initialState', () => {
    try {
      renderHook(
        useStateBot({
          idle: {
            onEnter: () => console.log('bot is now idle'),
          },
        })
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigException);
      expect(error.name).toBe('initialState');
    }
  });

  it('throws StateException on invalid initialState', () => {
    const badState = 'sleep';
    try {
      renderHook(
        useStateBot({
          initialState: badState,
          idle: {
            onEnter: () => console.log('bot is now idle'),
          },
        })
      );
    } catch (error) {
      expect(error).toBeInstanceOf(StateException);
      expect(error.name).toBe(badState);
    }
  });

  it('throws StateException if a state property is not an object', () => {
    try {
      renderHook(
        useStateBot({
          initialState: 'idle',
          idle: 123,
        })
      );
    } catch (error) {
      expect(error).toBeInstanceOf(StateException);
      expect(error.name).toBe('idle');
    }
  });
});

describe('stateBot functions', () => {
  it('loads correct initial state', () => {
    const stateBot = renderHook(
      useStateBot({
        initialState: 'idle',
        idle: {
          onEnter: () => console.log('bot is now idle'),
        },
      })
    );
    expect(stateBot.getState()).toBe('idle');
  });

  it('goes through a linear state path from inital state to last', () => {
    const { next, to, getState, reset } = renderHook(
      useStateBot({
        initialState: 'idle',
        idle: { to: 'ready' },
        ready: { to: 'destroyed' },
        destroyed: {},
      })
    );
    // next state after initial state: idle should be 'ready'
    act(next());
    expect(getState()).toBe('ready');

    // next state after 'ready' should be 'destroyed'
    act(next());
    expect(getState()).toBe('destroyed');

    // calling next() after reaching last state should do nothing
    expect(() => act(next())).not.toThrow();

    // should also have no change in state; still 'destroyed'
    expect(getState()).toBe('destroyed');

    act(reset());
    // resetting should put state back to initial state
    expect(getState()).toBe('idle');

    act(to('ready'));
    // going to 'ready' from 'idle' should land on state 'ready'
    expect(getState()).toBe('ready');

    act(to('destroyed'));
    // going to 'destroy' from 'ready' should land on state 'destroyed'
    expect(getState()).toBe('destroyed');

    // calling to(state) after reaching last state should do nothing
    expect(() => act(to('idle'))).not.toThrow();

    // calling to() without an argument should throw ActionException
    expect(() => act(to())).toThrow(ActionException);

    // calling to() with empty string should throw ActionException
    expect(() => act(to(''))).toThrow(ActionException);
  });

  it('side effect, onEnter, onEnter, and globals called only when transitioning', () => {
    // events mocks
    const onExitIdle = jest.fn();
    const onEnterReady = jest.fn();
    const onExitReady = jest.fn();
    const onEnterDestroyed = jest.fn();
    // transition side effects mocks
    const idleAction = jest.fn();
    const readyAction = jest.fn();
    // globals mocks
    const globalEnter = jest.fn();
    const globalExit = jest.fn();
    const globalAction = jest.fn();

    const { next, to, reset } = renderHook(
      useStateBot({
        initialState: 'idle',
        idle: { to: 'ready', onExit: onExitIdle, action: idleAction },
        ready: {
          to: 'destroyed',
          onEnter: onEnterReady,
          onExit: onExitReady,
          action: readyAction,
        },
        destroyed: { onEnter: onEnterDestroyed },
        globalEnter,
        globalExit,
        globalAction,
      })
    );

    function verifyIdleToReady() {
      // 'idle' side effect called once
      expect(idleAction.mock.calls.length).toBe(1);
      // exiting 'idle', idle's onExit should be called once
      expect(onExitIdle.mock.calls.length).toBe(1);
      // entering 'ready', idle's onEnter should be called once
      expect(onEnterReady.mock.calls.length).toBe(1);
    }

    function verifyReadyToDestroyed() {
      // 'idle' side effect called once
      expect(readyAction.mock.calls.length).toBe(1);
      // exiting 'ready', ready's onExit should be called once
      expect(onExitReady.mock.calls.length).toBe(1);
      // entering 'destroyed', destroyed's onEnter should be called once
      expect(onEnterDestroyed.mock.calls.length).toBe(1);
    }

    act(next());
    // all transition functions from idle to ready are called once
    verifyIdleToReady();
    // all global transition functions from idle to destroyed are called twice
    expect(globalEnter.mock.calls.length).toBe(1);
    expect(globalExit.mock.calls.length).toBe(1);
    expect(globalAction.mock.calls.length).toBe(1);

    act(to('destroyed'));
    // all transition functions from idle to destroyed are called once
    verifyReadyToDestroyed();
    // all global transition functions from idle to destroyed are called twice
    expect(globalEnter.mock.calls.length).toBe(2);
    expect(globalExit.mock.calls.length).toBe(2);
    expect(globalAction.mock.calls.length).toBe(2);

    act(reset());
    // all transition functions are still called exactly once
    verifyIdleToReady();
    verifyReadyToDestroyed();
    // all global transition functions are still called exactly twice
    expect(globalEnter.mock.calls.length).toBe(2);
    expect(globalExit.mock.calls.length).toBe(2);
    expect(globalAction.mock.calls.length).toBe(2);
  });
});
