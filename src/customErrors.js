import CustomErrorCreator from './helper/CustomErrorCreator';

// Exception for when a config option property is bad
export function ConfigException(configNames, message) {
  const insert = Array.isArray(configNames)
    ? configNames.join(', ')
    : configNames;
  if (!message) {
    this.message = `Missing or invalid "${insert} in configOption"`;
  } else {
    this.message = message;
  }
  const Err = new CustomErrorCreator(
    'ConfigException',
    configNames,
    this.message
  );
  // Err.configName = configNames;
  // Err.name = 'ConfigException';
  return Err;
}

// Exception for when a state is bad
export function StateException(stateNames, message) {
  const insert = Array.isArray(stateNames) ? stateNames.join(', ') : stateNames;
  if (!message) {
    this.message = `Missing or invalid "${insert}" in configOption`;
  } else {
    this.message = message;
  }
  const Err = new CustomErrorCreator(
    'StateException',
    stateNames,
    this.message
  );
  // Err.stateNames = stateNames;
  // Err.name = 'StateException';
  return Err;
}

// Exception for when a bad action is called
export function ActionException(actionName, message) {
  if (!message) {
    this.message = `Invalid Action: ${actionName}`;
  } else {
    this.message = `Invalid Action: ${actionName} \n${message}`;
  }
  const Err = new CustomErrorCreator(
    'ActionException',
    actionName,
    this.message
  );
  // Err.actionName = actionName;
  // Err.name = 'ActionException';
  return Err;
}
