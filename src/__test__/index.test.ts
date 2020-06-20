import useStateBot from '..';
import { renderHook, act } from '@testing-library/react-hooks';

describe('useStateBot throw Errors on improper configurations', () => {
  console.error = jest.fn(); // mock out the console error
  it('throws ConfigException if no initialState', () => {
    try {
      renderHook(() =>
        // @ts-expect-error
        useStateBot({
          idle: {},
        })
      );
    } catch (error) {
      expect(error.name).toBe('ConfigException');
      expect(error.cause).toBe('initialState');
    }
  });

  it('throws StateException on invalid initialState', () => {
    const badState = 'sleep';
    try {
      renderHook(() =>
        useStateBot({
          initialState: badState,
          idle: {},
        })
      );
    } catch (error) {
      expect(error.name).toBe('StateException');
      expect(error.cause).toBe(badState);
    }
  });

  it('throws StateException if a state property is not an object', () => {
    try {
      renderHook(() =>
        useStateBot({
          initialState: 'idle',
          idle: 123,
        })
      );
    } catch (error) {
      expect(error.name).toBe('StateException');
      expect(error.cause).toBe('idle');
    }
  });

  it("throws ActionException when attempting to reach a target state that shouldn't be reach from current state", () => {
    const { result } = renderHook(() =>
      useStateBot({
        initialState: 'destroyed',
        idle: { to: 'ready' },
        ready: { to: 'destroyed' },
        destroyed: { to: 'idle' },
      })
    );
    // loads the correct initial state
    expect(result.current.getState()).toBe('destroyed');
    try {
      // 'destroyed' only points to 'idle', going to 'ready' should do nothing
      act(() => {
        result.current.to('ready');
      });
    } catch (error) {
      expect(error.name).toBe('ActionException');
      expect(error.cause).toBe('to');
    }
  });
});

describe('stateBot functions', () => {
  it('goes through a linear state path from inital state to last', () => {
    const {
      result,
      // waitForNextUpdate,
    } = renderHook(() =>
      useStateBot({
        initialState: 'idle',
        idle: { to: 'ready' },
        ready: { to: 'destroyed' },
        destroyed: {},
      })
    );
    // loads the correct initial state
    expect(result.current.getState()).toBe('idle');

    act(() => {
      result.current.next();
    });
    // next state after initial state: idle should be 'ready'
    expect(result.current.getState()).toBe('ready');

    // next state after 'ready' should be 'destroyed'
    act(() => {
      result.current.next();
    });
    expect(result.current.getState()).toBe('destroyed');

    // calling next() after reaching last state should do nothing
    expect(() =>
      act(() => {
        result.current.next();
      })
    ).not.toThrow();

    // should also have no change in state; still 'destroyed'
    expect(result.current.getState()).toBe('destroyed');

    act(() => result.current.reset());
    // resetting should put state back to initial state
    expect(result.current.getState()).toBe('idle');

    act(() => {
      result.current.to('ready');
    });
    // going to 'ready' from 'idle' should land on state 'ready'
    expect(result.current.getState()).toBe('ready');

    act(() => {
      result.current.to('destroyed');
    });
    // going to 'destroy' from 'ready' should land on state 'destroyed'
    expect(result.current.getState()).toBe('destroyed');

    // calling to(state) after reaching last state should do nothing
    expect(() =>
      act(() => {
        result.current.to('idle');
      })
    ).not.toThrow();
    expect(result.current.getState()).toBe('destroyed');

    try {
      // calling to() without an argument should throw ActionException
      act(() => {
        // @ts-expect-error
        result.current.to();
      });
    } catch (error) {
      expect(error.name).toBe('ActionException');
      expect(error.cause).toBe('to');
    }

    try {
      // calling to() with empty string should throw ActionException
      act(() => {
        result.current.to('');
      });
    } catch (error) {
      expect(error.name).toBe('ActionException');
      expect(error.cause).toBe('to');
    }
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

    const { result } = renderHook(() =>
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

    act(() => {
      result.current.next();
    });
    // all transition functions from idle to ready are called once
    verifyIdleToReady();
    // all global transition functions from idle to destroyed are called twice
    expect(globalEnter.mock.calls.length).toBe(1);
    expect(globalExit.mock.calls.length).toBe(1);
    expect(globalAction.mock.calls.length).toBe(1);

    act(() => {
      result.current.to('destroyed');
    });
    // all transition functions from idle to destroyed are called once
    verifyReadyToDestroyed();
    // all global transition functions from idle to destroyed are called twice
    expect(globalEnter.mock.calls.length).toBe(2);
    expect(globalExit.mock.calls.length).toBe(2);
    expect(globalAction.mock.calls.length).toBe(2);

    act(() => result.current.reset());
    // all transition functions are still called exactly once
    verifyIdleToReady();
    verifyReadyToDestroyed();
    // all global transition functions are still called exactly twice
    expect(globalEnter.mock.calls.length).toBe(2);
    expect(globalExit.mock.calls.length).toBe(2);
    expect(globalAction.mock.calls.length).toBe(2);
  });
});
