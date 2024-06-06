// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { EventManager } from "./EventManager";

/**
 * Basic app state management similar to React Redux.
 */
export class StateManager {

  listeners = new EventManager();
  state = {}

  register(name, initialValue) {
    this.state[name] = initialValue;
    this.listeners.addEvents([name]);
  }

  dispatch(name, newValue) {
    if (!this.listeners.hasEvent(name)) throw new Error('non-existent state data: '+name);
    this.state[name] = newValue;
    this.listeners.notifyListeners(name, newValue);
  }

  getState(name) {
    if (!this.listeners.hasEvent(name)) throw new Error('non-existent state data: '+name);
    return this.state[name]
  }

  hasState(name) {
    return this.listeners.hasEvent(name);
  }

  subscribe(name, callback) {
    this.listeners.on(name, callback);
  }

  unsubscribe(name, callback) {
    this.listeners.off(name, callback);
  }

}

