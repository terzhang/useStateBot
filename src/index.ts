import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ConfigException,
  StateException,
  ActionException,
} from './customErrors';
import { StateBot } from './types';

interface stateConfig {
  to?: string | string[];
  onEnter?: undefined | (() => any);
  onExit?: undefined | (() => any);
  action?: undefined | (() => any);
}

interface Option {
  initialState: string;
  globalEnter?: undefined | (() => any);
  globalExit?: undefined | (() => any);
  globalAction?: undefined | (() => any);
}

// Given a generic type N, exclude all keys from N that's from initialOption
type notOptions<N> = Exclude<keyof N, keyof Option>;

// Given a generic type S, generate a State type that...
// covers all keys in S that is:
// not of Option type and is of stateConfig type.
type State<S> = Record<notOptions<S>, stateConfig>;

// The initial option is the Option type intersecting the State type
type initialOption<O> = Option & State<O>;

// create a function with generic type T, that takes a initialOption and...
// create the appropriate type that covers the Option type and the States type from T
export default function useStateBot<T extends initialOption<T>>(
  initialOption: T
): StateBot {
  const [state, setState] = useState(initialOption.initialState);
  const options = useRef(initialOption);

  const checkInitialState = useCallback(() => {
    // throw error if initialState is missing
    if (!initialOption.initialState) {
      throw new ConfigException('initialState');
      // the specified initialState is not configured
    } else if (!initialOption.hasOwnProperty(initialOption.initialState)) {
      throw new StateException(
        initialOption.initialState,
        `${initialOption.initialState} is specified as initialState, but is not configured`
      );
    }
  }, []);

  const checkBadStates = useCallback(() => {
    // check for inaccessible state (meaning 0 "to" statement points to it)
    // get all the given option properties
    let keys = Object.keys(initialOption);
    // strip out the global events
    const states = keys.filter(
      (prop) =>
        !['initialState', 'globalEnter', 'globalExit', 'globalAction'].includes(
          prop
        )
    );
    const goodStates = [] as string[];

    const checkPath = (path: string, stateName: string) => {
      if (!states.includes(path)) {
        // points to a valid state?
        throw new StateException(
          path,
          `${stateName} points to ${path}, but ${path} is not configured`
        );
      } else {
        // append each accessible state to goodStates
        // if isn't already in there
        if (!goodStates.includes(path)) {
          goodStates.push(path);
        }
      }
    };

    // check each states property
    for (var i = 0, len = states.length; i < len; ++i) {
      const stateName = states[i];
      let stateObj = initialOption[stateName];

      // verify state is a valid object
      if (
        !Boolean(stateObj) ||
        !(stateObj instanceof Object) ||
        stateObj.constructor !== Object
      ) {
        throw new StateException(
          stateName,
          `Invalid state property. "${stateName}" must be a valid object`
        );
      }

      const path = stateObj.to;
      // if it leads to another state, check if its "to" property...
      if (path && (typeof path === 'string' || <any>path instanceof String)) {
        checkPath(path as string, stateName);
        // if it's an array
      } else if (path && Array.isArray(path)) {
        // check each element inside path array
        // ! warning don't use the same (ie i & len) in a child for loop, they override parent's
        for (var index = 0, length = path.length; index < length; ++index) {
          checkPath(path[index], stateName);
        }
        // if it's not null or undefine it's not the right type
      } else if (path) {
        throw new ConfigException(
          'to',
          `The "to" property for "${stateName}" must be a String or an Array`
        );
      }
    }

    // bad states is states stripped of good states
    // make sure to not include initial state since it's allowed to be inaccessible
    const badStates = states.filter(
      (state) =>
        !goodStates.includes(state) && state !== options.current.initialState
    );

    // throw error when there are bad state(s)
    if (badStates.length > 0) {
      throw new StateException(
        badStates,
        `One or many isolated states found: "${badStates.join(', ')}".`
      );
    }
  }, []);

  // run checks on configOptions on mount
  useEffect(() => {
    checkInitialState();
    checkBadStates();
  }, []);

  return {
    isEndState() {
      return !options.current[state]!.hasOwnProperty('to');
    },
    getPath(givenState: string) {
      // check if given state exist
      if (!givenState) {
        throw new ActionException(
          'getPath',
          `Missing stateName as argument for getPath`
        );
      } else if (givenState && !options.current.hasOwnProperty(givenState)) {
        throw new ActionException('getPath', `The given stateName is invalid`);
      }
      // check it has a path property
      const stateObj = options.current[givenState];
      if (!stateObj.hasOwnProperty('to')) {
        return [];
      }
      // always return an array otherwise
      return Array.isArray(stateObj.to) ? stateObj.to : [stateObj.to];
    },
    getState() {
      return state;
    },
    reset() {
      setState(initialOption.initialState);
    },
    // define method for going to another state
    to(targetState) {
      // make sure targetState is given and valid
      if (!targetState || !options.current.hasOwnProperty(targetState)) {
        throw new ActionException(
          'to',
          `Missing or invalid argument for "to" method`
        );
      }

      // get current state obj
      // it holds where to, onExit and transition actions
      const { to, onExit, action } = options.current[state];

      // return not going anywhere (or if it's final state)
      if (!to) {
        return;
        // check if targetState can be reached from current state
      } else if (Array.isArray(to) && !to.includes(targetState)) {
        // can't reach if target state is not one of the entry in the to array
        throw new ActionException(
          'to',
          `${targetState} is unreachable from ${state}`
        );
      } else if (typeof to === 'string' && to !== targetState) {
        // can't reach if reachable state is a string and not target state
        throw new ActionException(
          'to',
          `${targetState} is unreachable from ${state}`
        );
      }

      // get the target state obj
      const targetStateDef = options.current[targetState];

      // perform transitioning side effect
      // when switching, current state is exited (run current state's onExit),
      // and target state is entered (run to target state's onEnter)
      options.current.globalAction && options.current.globalAction();
      action && action();
      options.current.globalExit && options.current.globalExit();
      onExit && onExit();
      options.current.globalEnter && options.current.globalEnter();
      if (targetStateDef) {
        targetStateDef.onEnter && targetStateDef.onEnter();
      }

      // switch bot to to state and return new state
      setState(targetState);
      return targetState;
    },
    next() {
      // get current state obj
      const currentStateDef = options.current[state];
      // it holds where to, onExit and transition actions
      const { to, onExit, action } = currentStateDef;

      // it's possible to have no path to go (end state)
      if (!to) {
        return;
      }

      // otherwise, it cannot be an array of more than 1 element
      let targetState;
      if (Array.isArray(to)) {
        if (to.length >= 2 && to.length !== 0) {
          throw new ActionException(
            'next',
            `Multiple path from current state, ${state}. Cannot determined next state.`
          );
        } else {
          // get target state
          targetState = to[0];
        }
      } else {
        targetState = to;
      }

      const targetStateDef = options.current[targetState];

      options.current.globalAction && options.current.globalAction();
      action && action();
      options.current.globalExit && options.current.globalExit();
      onExit && onExit();
      options.current.globalEnter && options.current.globalEnter();
      targetStateDef.onEnter && targetStateDef.onEnter();

      // switch bot to to state and return new state
      setState(targetState);
      return targetState;
    },
    hasManyPaths() {
      // get current state obj
      const currentStateDef = options.current[state];
      const { to } = currentStateDef;
      return Array.isArray(to) && to.length > 1;
    },
    setGlobalEnter(onEnter: () => any): void {
      options.current.globalEnter = onEnter();
    },
    setGlobalExit(onExit: () => any): void {
      options.current.globalExit = onExit();
    },
    setGlobalAction(action: () => any): void {
      options.current.globalAction = action();
    },
    clearAllGlobals() {
      options.current.globalEnter = undefined;
      options.current.globalExit = undefined;
      options.current.globalAction = undefined;
    },
  };
}
