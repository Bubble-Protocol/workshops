// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import PropTypes from "prop-types";
import React, { useState } from "react";
import "./style.css";
import { File } from "../File";
import { MembersList } from "../MembersList";
import { uint8ArrayToHex } from "@bubble-protocol/crypto/src/utils";
import { useModelStateData } from "../../../../../state-manager";
import { CopyTextButton } from "../../../../components/CopyTextButton/CopyTextButton";

export const Vault = ({ vault, onDeleteVault, onForgetVault, onBack, setError }) => {

  // Model state data
  const vaultData = useModelStateData(vault.uuid);

  // Local state data
  const [view, setView] = useState('content');
  const [ addingFiles, setAddingFiles ] = useState([]);
  const [ deletingVault, setDeletingVault ] = useState(false);
  const [ detailsVisible, setDetailsVisible ] = useState(false);
  const inputFile = React.createRef();

  async function openFileChooser() {
    setAddingFiles(addingFiles.filter(f => f.error === undefined));
    inputFile.current.click();
  }

  async function delVault() {
    setError(null);
    if (deletingVault) return;
    setDeletingVault(true);
    onDeleteVault(vault)
    .then(() => onBack())
    .catch(error => setError(error))
    .finally(() => setDeletingVault(false));
  }

  async function forgetVault() {
    setError(null);
    onForgetVault(vault)
    .then(() => onBack())
    .catch(error => setError(error));
  }

  function addFiles(e) {
    setError(null);
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const addedFiles = [...addingFiles];
      for(let i=0; i<fileList.length; i++) {
        const file = fileList.item(i);
        const index = addedFiles.findIndex(f => f.name === file.name);
        if (index >= 0) addedFiles[index] = file;
        else addedFiles.push(file);
      }
      addedFiles.forEach(file => {
        if (!file.writePromise) {
          const overwrites = vaultData.files.find(f => f.name === file.name);
          file.overwrites = overwrites;
          file.writePromise = write(file);
        }
      });
      setAddingFiles(addedFiles);
    }
  }

  async function write(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(vault.writeFile(file, uint8ArrayToHex(new Uint8Array(reader.result))));
      reader.onerror = () => reject(new Error('failed to read '+file.name));
      reader.readAsArrayBuffer(file);
    })
    .then(() => setAddingFiles(addingFiles.filter(f => f.name !== file.name)))
    .catch(error => {
      console.warn(error);
      file.error = error;
    });
  }

  const deleted = vaultData.constructionState === 'deleted';
  const failed = vaultData.initState === 'failed';
  const initialising = vaultData.initState === 'initialising';
  const initialised = vaultData.initState === 'initialised';

  return (
    <div className="page-width-section centered">
      <span className="page-title">
        {vaultData.name}
      </span>

      {view === 'content' && !deletingVault &&
        <>          
          <div className="file-list">
            {failed && <div className="error-text">{vaultData.error.message || vaultData.error}</div>}
            {initialising && <div className="loader"></div>}
            {initialised && vaultData.files.sort((a,b) => a.name.localeCompare(b.name)).map(f => <File key={f.name} file={f} readFile={vault.readFile.bind(vault)} deleteFile={vault.deleteFile.bind(vault)}></File>)}
            {initialised && addingFiles.map(f => <File key={f.name} file={f} writePromise={f.writePromise}></File>)}
            {initialised && <div key="add-button" className="file-selector add-file" onClick={openFileChooser}>+</div>}
          </div>
          <div className="button-row">
            {initialised && <div className="cta-button-hollow" onClick={() => setView('members')}>Members</div>}
            {(deleted || (!initialising && !vaultData.isAdmin)) && <div className="cta-button-hollow" onClick={forgetVault}>Forget Vault</div>}
            {!deleted && !initialising && vaultData.isAdmin && <div className="cta-button-hollow" onClick={delVault}>Delete Vault</div>}
          </div>
          <input id='file' ref={inputFile} type="file" multiple accept='*' hidden={true} onChange={addFiles} />
        </>
      }

      {view === 'content' && deletingVault &&
        <>
          <div className="page-summary">Deleting...</div>
          <div className="loader small-loader"></div>
        </>
      }

      {view === 'members' && <MembersList vault={vault} setError={setError} /> }

      <div className="bubble-details-container">
        <span className="text-button" onClick={() => setDetailsVisible(!detailsVisible)}>
          {detailsVisible ? 'Hide' : 'Show'} Vault Details
        </span>
        {vaultData.bubbleId && detailsVisible &&
          <>
            <table className="bubble-details">
              <tbody>
                <tr>
                  <td>Chain ID:</td>
                  <td>{vaultData.bubbleId.chain}</td>
                </tr>
                <tr>
                  <td>Contract:</td>
                  <td><a href={"https://polygonscan.com/address/"+vaultData.bubbleId.contract} target="_blank"><code>{vaultData.bubbleId.contract}</code></a></td>
                </tr>
                <tr>
                  <td>Provider:</td>
                  <td>{vaultData.bubbleId.provider}</td>
                </tr>
              </tbody>
            </table>
            <CopyTextButton title="copy vault id" copyText={vaultData.bubbleId.toString()} />
          </>
        }
      </div>

      <div className="button-row">
        {view === 'content' && <div className="text-button" onClick={onBack}>⬅ Back to Vaults</div>}
        {view === 'members' && <div className="text-button" onClick={() => setView('content')}>⬅ Back</div>}
      </div>

    </div>
  );
};

Vault.propTypes = {
  vault: PropTypes.object.isRequired,
  onDeleteVault: PropTypes.func.isRequired,
  onForgetVault: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired
};
