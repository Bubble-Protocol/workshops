// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import React, { useEffect, useState } from "react";
import './style.css';
import { useModelStateData } from "../../../state-manager";
import { Vault } from "./components/Vault";
import { VaultList } from "./components/VaultList";
import { CopyTextButton } from "../../components/CopyTextButton/CopyTextButton";
import { UninitialisedVault } from "./components/UninitialisedVault";

export function Dashboard() {

  // Model state data
  const session = useModelStateData('session');
  const { logout } = useModelStateData('wallet-functions');

  // Local state data
  const [localError, setLocalError] = useState(false);
  const [selectedVault, setSelectedVault] = useState();
  let timeout;

  useEffect(() => {
    setSelectedVault(null);
    setLocalError(null);
  }, [session])

  function logoutUser() {
    clearError();
    logout()
    .catch(error => {
      console.warn(error);
      setError(error);
    });
  }

  function selectVault(vault) {
    clearError();
    setSelectedVault({vault, loading: true});
    session.loadVault(vault)
    .then(() => {
      setSelectedVault({vault, loading: false});
      if (vault.state === 'failed') setError(vault.error);
    })
    .catch(error => {
      console.warn(error);
      setError(error);
    });
  }

  function setError(error) {
    clearTimeout(timeout);
    setLocalError(error);
    setTimeout(() => setLocalError(), 8000);
  }

  function clearError() {
    clearTimeout(timeout);
    setLocalError();
  }

  function formatError(error) {
    return error.details || error.message || error;
  }

  return (
    <div className="dashboard">

      {!selectedVault && <VaultList vaults={session.vaults} onSelectVault={selectVault} setError={setError} />}
      {selectedVault && selectedVault.loading && <UninitialisedVault name={selectedVault.vault.name} onBack={() => setSelectedVault()} /> }
      {selectedVault && !selectedVault.loading && <Vault vault={selectedVault.vault} onDeleteVault={session.deleteVault} onForgetVault={session.forgetVault} onBack={() => setSelectedVault()} setError={setError} /> }

      <div className="button-row">
        {!selectedVault && <div className="cta-button-hollow" onClick={logoutUser}>Logout</div>}
      </div>


      <CopyTextButton title="Your Public ID" copyText={session.login.publicKey} copiedTitle="Copied to clipboard!" />

      {/* Error log */}
      {localError && <span className='error-text'>{formatError(localError)}</span>}

    </div>
  );

}
