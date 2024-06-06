// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import PropTypes from "prop-types";
import React from "react";
import xIcon from "../../../../images/x-icon.svg";
import minusIcon from "../../../../images/minus-icon.svg";
import checkIcon from "../../../../images/check-icon.svg";
import "./style.css";

export const Member = ({ member, adding, busy, selected, selectMember }) => {

  return (
    <div className="member" onClick={() => selectMember(member)}>
      <div className="name">{member.account}</div>
      <div className="icon-frame">
        {!busy && !adding && !selected && <img src={minusIcon}></img>}
        {!busy && !adding && selected && <img src={xIcon}></img>}
        {!busy && adding && <img src={checkIcon}></img>}
        {busy && <div className="loader icon"></div>}
      </div>
    </div>
  );
};

Member.propTypes = {
  member: PropTypes.object.isRequired,
  adding: PropTypes.bool,
  busy: PropTypes.bool,
  selected: PropTypes.bool,
  selectMember: PropTypes.func.isRequired
};
