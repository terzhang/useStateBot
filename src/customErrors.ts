import CustomErrorCreator from './helper/CustomErrorCreator';

// Exception for when a config option property is bad
export class ConfigException extends CustomErrorCreator {
  constructor(configNames: string, message?: string) {
    const insert = Array.isArray(configNames)
      ? configNames.join(', ')
      : configNames;
    // super calls the base constructor
    super(
      configNames,
      message ? message : `Missing or invalid "${insert} in configOption"`
    );
  }
}

// Exception for when a state is bad
export class StateException extends CustomErrorCreator {
  constructor(stateNames: string | string[], message?: string) {
    const insert = Array.isArray(stateNames)
      ? stateNames.join(', ')
      : stateNames;
    // super calls the base constructor
    super(
      stateNames,
      message ? message : `Missing or invalid "${insert} in state option"`
    );
  }
}

// Exception for when a bad action is called
export class ActionException extends CustomErrorCreator {
  constructor(actionName: string, message?: string) {
    // super calls the base constructor
    super(actionName, message ? message : `Invalid Action: ${actionName}`);
  }
}
