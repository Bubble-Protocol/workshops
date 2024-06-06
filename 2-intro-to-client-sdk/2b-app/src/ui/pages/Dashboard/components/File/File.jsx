// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import "./style.css";
import fileIcon from "../../../../images/file-icon.svg";
import downloadIcon from "../../../../images/download-icon.svg";
import binIcon from "../../../../images/bin-icon.svg";
import errorIcon from "../../../../images/error-icon.png";
import { hexToUint8Array } from "@bubble-protocol/crypto/src/utils";
import { BubbleFilename } from "@bubble-protocol/core";

export const File = ({ file, readFile, deleteFile, writePromise }) => {

  const [ url, setUrl ] = useState();
  const [ error, setError ] = useState();
  const [ deleting, setDeleting ] = useState(false);
  const [ reading, setReading ] = useState(false);
  const [ writing, setWriting ] = useState(writePromise !== undefined);


  useEffect(() => {
    const isWriting = !!writePromise;
    setWriting(isWriting);
    if (isWriting) {
      writePromise
      .then(() => {
        setWriting(false);
        if (file.error) setError(file.error);
      });
    }
  }, [writePromise])

  async function del() {
    if (!deleteFile) return;
    if (error) setError(null);
    setDeleting(true);
    deleteFile(file)
    .catch(error => {
      console.trace(error);
      setError(error)
    })
    .finally(() => setDeleting(false));
  }

  async function download() {
    if (!readFile) return;
    if (error) setError(null);
    setReading(true);
    readFile(file)
    .then(content => {
      const blob = new Blob([hexToUint8Array(content)], { type: file.mimetype });
      const url = window.URL.createObjectURL(blob);
      setUrl(url);
      setReading(false);
    })
    .catch(error => {
      console.trace(error);
      setError(error);
      setReading(false);
    })
  }

  function formatError(error) {
    return error.message || error;
  }

  return (
    <div className="file">
      {/* left icon */}
      {!url && !error && !reading && !writing && <img className="icon" src={fileIcon}></img>}
      {url && !error && !reading && !writing && <a href={url} download={file.name}><img className="icon" src={downloadIcon}></img></a>}
      {error && !reading && !writing && 
        <>
          <img className="error-icon" src={errorIcon}></img>
          <div className="tooltip">{formatError(error)}</div>
        </>
      }
      {(reading || writing) && <div className="loader icon"></div>}

      {/* filename */}
      {!url && <div className="name" onClick={download}>{file.name}</div>}
      {url && <a className="name" href={url} download={file.name}>{file.name}</a>}

      {/* right icon */}
      {!deleting && deleteFile && <img className="icon display-on-hover" src={binIcon} onClick={del}></img>}
      {deleting && <div className="loader icon"></div>}
    </div>
  );
};

File.propTypes = {
  file: PropTypes.object.isRequired,
  readFile: PropTypes.func,
  deleteFile: PropTypes.func,
  writePromise: PropTypes.object,
};
