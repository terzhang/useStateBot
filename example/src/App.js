import React from 'react';
import './index.css';
import useStateBot from 'usestatebot';

const options = {
  initialState: 'idle',
  idle: {
    to: 'loading',
    onEnter: () => console.log('entering idle state \n=='),
    onExit: () => console.log('exiting idle state'),
    action: () => console.log('running idle transition side effect'),
  },
  loading: {
    to: ['idle', 'ready'],
    onEnter: () => console.log('entering loading state \n=='),
    onExit: () => console.log('leaving loading state'),
    action: () => console.log('running action transition side effect'),
  },
  ready: {
    to: 'destroyed',
    onEnter: () => console.log('entering ready state \n=='),
    onExit: () => console.log('leaving ready state'),
    action: () => console.log('taking action on ready state'),
  },
  destroyed: {
    onEnter: () => console.log('state is now: destroyed \n=='),
  },
};

const App = () => {
  const { getState, next, to, reset, isEndState } = useStateBot(options);

  const displayButtons = () => {
    if (getState() === 'loading') {
      return (
        <div className="buttonGroup">
          <button onClick={() => to('idle')}>Cancel</button>
          <button onClick={() => to('ready')}>Ready!</button>
        </div>
      );
    } else if (isEndState()) {
      return (
        <button
          onClick={() => {
            reset();
            console.log('Bot is reset back to ' + options.initialState);
          }}
        >
          Reset Bot
        </button>
      );
    } else {
      return <button onClick={() => next()}>Next State</button>;
    }
  };

  return (
    <div className="container">
      <p className="stateText">
        {'State: '}
        <span>{getState()}</span>
      </p>
      {displayButtons()}
    </div>
  );
};
export default App;
