# useStateBot

> A finite state machine React hook

[![NPM](https://img.shields.io/npm/v/usestatebot.svg)](https://www.npmjs.com/package/usestatebot) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Travis-CI](https://travis-ci.com/terzhang/useStateBot.svg?branch=master)](https://travis-ci.com/github/terzhang/useStateBot)

## Install

```bash
npm install --save usestatebot
```

or

```bash
yarn add usestatebot
```

## Usage

```jsx
import React from 'react';

import useStateBot from 'usestatebot';

const App = () => {
  const stateBot = useStateBot({
    initialState: 'idle',
    idle: { to: 'loading' },
    loading: { to: 'ready' },
    ready: {
      onEnter() {
        return console.log('I am ready');
      },
    },
  });

  return (
    <div>
      {stateBot.getState()}
      <button onClick={() => stateBot.next()}>Next State</button>
    </div>
  );
};
```

## License

MIT © [terzhang](https://github.com/terzhang)
