// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import PropTypes from "prop-types";
import React, { useState } from "react";
import "./style.css";
import { ValidatedTextBox } from "../../../../components/ValidatedTextBox";
import { useModelStateData } from "../../../../../state-manager";
import { ContentId } from "@bubble-protocol/core";

export const VaultList = ({ vaults, onSelectVault, setError }) => {

  // Model state data
  const { createVault, joinVault } = useModelStateData('session');

  // Local state data
  const [addVault, setAddVault] = useState(false);
  const [creatingVault, setCreatingVault] = useState();

  function validateVaultName(text) {
    return typeof text === 'string' && text.trim().length > 0;
  }

  function create(name) {
    setAddVault(false);
    setCreatingVault(true);
    let isVaultId = false;
    try {
      new ContentId(name);
      isVaultId = true;
    }
    catch(_){}
    const promise = isVaultId ? joinVault(name) : createVault(name);
    promise
    .catch(setError)
    .finally(() => setCreatingVault(false));
  }

  return (
    <div className="vault-list page-width-section">
      <span className="page-title">
        Your Vaults
      </span>
      <p className="page-summary">
        Select a vault or create a new one.<br/>
        To join a friend's vault, click '+' and paste the vault id.
      </p>
      <div className="table">
        {vaults.map((v, i) => <div key={i} className="vault-selector" onClick={() => onSelectVault(v)}>{v.name}</div>)}
        {!addVault && !creatingVault && <div key="add-vault-button" className="vault-selector add-vault" onClick={() => setAddVault(true)}>+</div>}
        {creatingVault && <div className="loader small-loader"></div>}
        {addVault && <ValidatedTextBox key="add-vault-textbox" isValid={validateVaultName} onSubmit={create} onCancel={() => setAddVault(false)} placeholder="Enter new vault name or paste an existing vault id" />}
        </div>
    </div>
  );
};

VaultList.propTypes = {
  vaults: PropTypes.array.isRequired,
  onSelectVault: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};
