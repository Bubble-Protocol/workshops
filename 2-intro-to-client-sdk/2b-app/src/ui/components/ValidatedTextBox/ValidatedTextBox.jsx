import PropTypes from "prop-types";
import React, { useState } from "react";
import xIcon from "../../images/x-icon.svg";
import checkIcon from "../../images/check-icon.svg";
import "./style.css";

export const ValidatedTextBox = ({ isValid, onSubmit, onCancel, placeholder="" }) => {

  // Local state data
  const [text, setText] = useState("");

  function handleKeyPress(event) {
    if (event.key === "Enter" && isValid(text)) onSubmit(text);
  };

  return (
    <div className="add-member">
      <input autoFocus key="add-textbox" type="text" onChange={e => setText(e.target.value)} onKeyDown={handleKeyPress} placeholder={placeholder} ></input>
      {isValid(text) ? <img src={checkIcon} onClick={() => onSubmit(text)} alt="Submit"></img> : <img src={xIcon} onClick={onCancel} alt="Cancel"></img>}
    </div>
  );
};

ValidatedTextBox.propTypes = {
  isValid: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};
