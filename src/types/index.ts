export interface StateBot {
  isEndState: () => boolean;
  getPath: (givenState: string) => string | string[];
  getState: () => string;
  reset: () => void;
  to: (targetState: string) => string | undefined;
  next: () => string;
  hasManyPaths: () => boolean;
  setGlobalEnter: (onEnter: () => any) => void;
  setGlobalExit: (onExit: () => any) => void;
  setGlobalAction: (action: () => any) => void;
  clearAllGlobals: () => void;
}
