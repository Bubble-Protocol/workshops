import { stateManager } from '../state-manager.js';
import { DeployableBubble, toFileId } from '@bubble-protocol/client';
import { ecdsa } from '@bubble-protocol/crypto';
import { BubbleFilename } from '@bubble-protocol/core';
import contractSourceCode from '../contracts/SharedVault.json';
import * as assert from './utils/assertions.js';
import { FilenameWithMimetype } from './utils/FilenameWithMimetype.js';

/*
 * bubble structure
 */
const CONTENT = {
  ROOT: toFileId(0),
  METADATA_FILE: toFileId(1),
  SHARED_FILE_DIR: toFileId(2),
  MESSAGING_DIR: toFileId(3),
};

export class Vault extends DeployableBubble {

  name;
  files = [];
  members = [];
  isAdmin = false;

  constructor(metadata, wallet, signFunction) {
    super(metadata, wallet, contractSourceCode, signFunction);
    this.setContentConstructor(this._constructBubbleContents.bind(this));
    this.setContentInitialiser(this._initialiseBubbleContents.bind(this));
    assert.isString(metadata.name, 'metadata.name');
    this.name = metadata.name;
    this.uuid = "" + Date.now() + Math.random();
    stateManager.register(this.uuid, this._getStateDataForUI());
  }

  async _constructBubbleContents() {
    this.members = [this.loginAddress];
    this._writeVaultMetadata();
    await this.bubble.mkdir(CONTENT.SHARED_FILE_DIR, {silent: true})
  }

  async _initialiseBubbleContents() {
    await this._readVaultMetadata();
    await this._readVaultFiles();
  }

  async initialise(loginAddress, signFunction) {
    this.loginAddress = loginAddress;
    this.signFunction = signFunction;
    await super.initialise([loginAddress]);
    if (this.isContractDeployed()) await this._getAdminStatus();
    this._dispatchUIData();
  }

  getSessionMetadata() {
    return { 
      ...super.getMetadata(), 
      name: this.name
    };
  }


  //
  // Vault management
  //

  async readFile(file) {
    console.log('Reading file', file.name);
    const filename = FilenameWithMimetype.construct(file.name, file.type);
    return await this.read(toFileId(CONTENT.SHARED_FILE_DIR, filename));
  }

  async writeFile(file, contents) {
    console.log('Writing file', file.name);
    const filename = FilenameWithMimetype.construct(file.name, file.type);
    await this.write(toFileId(CONTENT.SHARED_FILE_DIR, filename), contents);
    await this._readVaultFiles();
  }
  
  async deleteFile(file) {  
    console.log('Deleting file', file.name);
    const filename = FilenameWithMimetype.construct(file.name, file.type);
    await this.delete(toFileId(CONTENT.SHARED_FILE_DIR, filename));
    await this._readVaultFiles();
  }

  async addMembers(publicKeys) {
    const addresses = publicKeys.map(pk => ecdsa.publicKeyToAddress(pk));
    await this.contract.send('setMembers', [addresses, true]);
    this.members.push(...addresses);
    this.members = [...new Set(this.members)];
    this._writeVaultMetadata();
    this._dispatchUIData();
  }

  async removeMembers(addresses) {
    await this.contract.send('setMembers', [addresses, false]);
    this.members = this.members.filter(m => !addresses.includes(m));
    this._writeVaultMetadata();
    this._dispatchUIData();
  }

  async deleteVault() {
    await this.deleteBubble();
  }


  //
  // Internal methods
  //

  async _writeVaultMetadata() {
    console.trace('Writing metadata');
    const metadata = {name: this.name, members: this.members};
    await this.bubble.write(CONTENT.METADATA_FILE, JSON.stringify(metadata))
  }

  async _readVaultMetadata() {
    console.trace('Reading metadata');
    const json = await this.read(CONTENT.METADATA_FILE);
    const metadata = JSON.parse(json);
    this.name = metadata.name;
    this.members = metadata.members;
    this._dispatchUIData();
  }

  async _readVaultFiles() {
    console.trace('Reading files');
    const files = await this.list(CONTENT.SHARED_FILE_DIR, {long: true});
    this.files = files.map(f => {
      const bName = new BubbleFilename(f.name);
      const {name, type} = FilenameWithMimetype.deconstruct(bName.getFilePart());
      return {...f, name, type};
    });
    this._dispatchUIData();
  }

  async _getAdminStatus() {
    console.trace('Getting admin status');
    this.isAdmin = await this.contract.call('isAdmin', [this.loginAddress]);
  }


  //
  // UI methods
  //

  _getStateDataForUI() {
    return {
      constructionState: this.constructionState,
      initState: this.initState,
      bubbleId: this.bubbleId,
      vaultId: this.bubbleId.toString(),
      name: this.name,
      files: this.files,
      members: this.members,
      isAdmin: this.isAdmin
    }
  }

  _dispatchUIData() {
    stateManager.dispatch(this.uuid, this._getStateDataForUI());
  }

}

