// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import PropTypes from "prop-types";
import React from "react";

export const UninitialisedVault = ({ name, onBack }) => {

  return (
    <div className="page-width-section centered">
      <span className="page-title">{name}</span>
      <div className="loader"></div>
      <div className="button-row">
        <div className="text-button" onClick={onBack}>⬅ Back to Vaults</div>
      </div>

    </div>
  );
};

UninitialisedVault.propTypes = {
  name: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired
};
