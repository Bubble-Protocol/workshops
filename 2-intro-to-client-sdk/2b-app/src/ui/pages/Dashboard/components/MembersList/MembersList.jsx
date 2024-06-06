// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import PropTypes from "prop-types";
import React, { useState } from "react";
import "./style.css";
import { Member } from "../Member/Member";
import { ecdsa } from "@bubble-protocol/crypto";
import { assert } from "@bubble-protocol/crypto/src/ecdsa";
import { ValidatedTextBox } from "../../../../components/ValidatedTextBox";

export const MembersList = ({ vault, setError }) => {

  // Local state data
  const [deletingMembers, setDeletingMembers] = useState([]);
  const [addingMembers, setAddingMembers] = useState([]);
  const [busyAddingMembers, setBusyAddingMembers] = useState(false);
  const [busyDeletingMembers, setBusyDeletingMembers] = useState(false);
  const [addMember, setAddMember] = useState(false);

  function setDeletingMember(member, deleting) {
    let newMembers = deletingMembers.filter(m => m !== member);
    if (deleting) newMembers.push(member);
    setDeletingMembers(newMembers);
  }

  function pushAddMembers(publicKeysAsText) {
    const publicKeys = publicKeysAsText.split(/\s+/);
    const membersToAdd = publicKeys.map(k => { return {account: ecdsa.publicKeyToAddress(k), publicKey: k} });
    const newAddingMembers = addingMembers.filter(m => !publicKeys.includes(m.publicKey));
    newAddingMembers.push(...membersToAdd);
    setAddingMembers(newAddingMembers);
    setAddMember(false);
  }

  function addMembers() {
    const membersToAdd = [...addingMembers];
    setError();
    setBusyAddingMembers(true);
    vault.addMembers(membersToAdd.map(m => m.publicKey))
    .then(() => {
      setAddingMembers(addingMembers.filter(m => !membersToAdd.includes(m)));
    })
    .catch(setError)
    .finally(() => {
      setBusyAddingMembers(false);
    })
  }

  function deleteMembers() {
    const membersToDelete = [...deletingMembers];
    setError();
    setBusyDeletingMembers(true);
    vault.removeMembers(membersToDelete)
    .then(() => {
      setDeletingMembers(deletingMembers.filter(m => !membersToDelete.includes(m)));
    })
    .catch(setError)
    .finally(() => {
      setBusyDeletingMembers(false);
    })
  }

  function validatePublicKey(text) {
    if (typeof text !== "string") return false;
    const keys = text.split(/\s+/);
    return keys.reduce((result, k) => result && (assert.isCompressedPublicKey(k) || assert.isUncompressedPublicKey(k)), true);
  }

  return (
    <>
      <span className="page-summary">Members</span>
      <div className="member-list">
        {vault.members.map(m => {
          const deleting = deletingMembers.includes(m);
          return <Member key={m} member={{account: m}} selected={deleting} selectMember={() => setDeletingMember(m, !deleting)} busy={busyDeletingMembers && deleting} adding={false} />
        })}
        {addingMembers.map(m => {
          return <Member key={m.account} member={m} selected={false} selectMember={() => setAddingMembers(addingMembers.filter(a => a !== m))} adding={true} busy={busyAddingMembers} />
        })}
        {!addMember && vault.isAdmin && <div key="add-button" className="add-member-button" onClick={() => setAddMember(true)}>+</div>}
        {addMember && <ValidatedTextBox key="add-member-textbox" isValid={validatePublicKey} onSubmit={pushAddMembers} onCancel={() => setAddMember(false)} placeholder="Enter member id (or multiple ids separated by whitespace)" />}
      </div>
      {vault.isAdmin &&
        <div className="button-row">
          <div className={"cta-button-hollow" + (addMember || addingMembers.length === 0 ? ' disabled' : '')} onClick={() => !addMember && addingMembers.length > 0 && addMembers()}>Add</div>
          <div className={"cta-button-hollow" + (deletingMembers.length === 0 ? ' disabled' : '')} onClick={() => deletingMembers.length > 0 && deleteMembers()}>Remove</div>
        </div>
      }
    </>
  );
};

MembersList.propTypes = {
  vault: PropTypes.object.isRequired,
  setError: PropTypes.func.isRequired,
};
