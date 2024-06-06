// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { DEFAULT_BUBBLE_PROVIDER } from '../config';
import { stateManager } from '../state-manager';
import { Vault } from './Vault';
import { LoginSession } from './utils/LoginSession';

/**
 * A Session is an instance of the app with a locally saved state. The local device can support
 * multiple sessions allowing the user to have different accounts for different wallet accounts.
 * 
 * The `LoginSession` base class provides the basic session management functions, including
 * loading and saving the session state to local storage and providing login and logout functions.
 * 
 * Implement this class to manage any app-specific session data and functions.
 */
export class Session extends LoginSession {

  vaults = [];

  /**
   * Returns an object containing the public data for this session
   */
  getSessionData() {
    return {
      ...super.getSessionData(),
      vaults: this.vaults,
      createVault: this.createVault.bind(this),
      loadVault: this.loadVault.bind(this),
      joinVault: this.joinVault.bind(this),
      forgetVault: this.forgetVault.bind(this),
      deleteVault: this.deleteVault.bind(this)
    }
  }
  
  /**
   * Closes the session
   */
  async close() {
    // TODO: Add any app-specific session close tasks here
  }
  
  /**
   * Called after a successful login.
   */ 
  async _onLogin() {
    // TODO: Add any app-specific login tasks here
  }

  /**
   * Called when logging out and before saving the session state to localStorage.
   */ 
  async _onLogout() {
    // TODO: Add any app-specific logout tasks here, such as clearing state data
  }

  /**
   * Handle state data loaded from localStorage. Override this method to handle any app-specific
   * session data.
   * 
   * @param {Object} stateData 
   */
  _parseLoadedStateData(stateData) {
    if (stateData.vaults) {
      const dummySignFunction = async () => {};
      this.vaults = stateData.vaults.map(v => new Vault(v, this.wallet, dummySignFunction));
    }
  }
  
  /**
   * Called when saving the session state to localStorage. Override this method to return any
   * app-specific session data to be saved.
   * 
   * @returns {Object} Any app-specific state data to be saved to localStorage. Empty by default.
   */
  _getStateDataForSaving() {
    return {
      vaults: this.vaults.map(v => v.getSessionMetadata())
    };
  }


  //
  // Vault management
  //

  async createVault(name) {
    const vault = new Vault({name}, this.wallet, this.loginKey.signFunction);
    vault.setBubbleProvider(DEFAULT_BUBBLE_PROVIDER);
    await vault.initialise(this.loginKey.address, this.loginKey.signFunction);
    if (vault.isContractDeployed()) {
      this.vaults.push(vault);
      this._saveState();
      this._dispatchUIData();
    }
    if (vault.isFailed()) throw vault.error;
  }

  async loadVault(vault) {
    if (vault.isInitialised()) return;
    await vault.initialise(this.loginKey.address, this.loginKey.signFunction);
    this._saveState();
  }
  
  async joinVault(vaultId) {
    const vault = new Vault({name: '<temp>', bubbleId: vaultId, constructionState: 'constructed'}, this.wallet, this.loginKey.signFunction);
    await vault.initialise(this.loginKey.address, this.loginKey.signFunction);
    if (vault.isFailed()) throw vault.error;
    this.vaults.push(vault);
    this._saveState();
    this._dispatchUIData();
  }

  async forgetVault(vault) {
    this.vaults = this.vaults.filter(v => v !== vault);
    this._saveState();
    this._dispatchUIData();
  }

  async deleteVault(vault) {
    await vault.deleteVault();
    this.forgetVault(vault);
  }

  _dispatchUIData() {
    stateManager.dispatch('session', this.getSessionData());
  }

}