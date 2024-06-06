import { Bubble, ContentManager, PublicContentManager, bubbleProviders, toFileId } from '@bubble-protocol/client';
import { ContentId } from '@bubble-protocol/core';
import { ecdsa } from '@bubble-protocol/crypto';
import fs from 'fs';
import os from 'os';


const privateKey = fs.readFileSync(`${os.homedir()}/.bubble-tools/wallet/alice`, 'utf-8').trim();
const key = new ecdsa.Key(privateKey);

const bubbleId = new ContentId({
  chain: 137,
  contract: '0x5012AB0c74E016b3D22522FB41bca6384Cb1AfA2',
  provider: 'https://vault.bubbleprotocol.com/v2/polygon'
});

const bubble = new Bubble(
  bubbleId,
  new bubbleProviders.HTTPBubbleProvider(bubbleId.provider),
  key.signFunction
);


/*
 * bubble structure
 */
const CONTENT = {
  ROOT: toFileId(0),
  METADATA_FILE: toFileId(1),
  SHARED_FILE_DIR: toFileId(2),
  MESSAGING_DIR: toFileId(3),
};


// Main

try {

  console.log('>>> Creating bubble...');
  await bubble.create({silent: true});

  console.log('>>> list root directory'); 
  let files = await bubble.list(CONTENT.ROOT);
  console.log(files);

  console.log('>>> Creating shared file directory...');
  await bubble.mkdir(CONTENT.SHARED_FILE_DIR, {silent: true});

  console.log('>>> list shared file directory');
  files = await bubble.list(CONTENT.SHARED_FILE_DIR);
  console.log(files);

  console.log('>>> Writing to shared file directory...');
  await bubble.write(toFileId(CONTENT.SHARED_FILE_DIR, 'f1.txt'), 'Hello');

  console.log('>>> list shared file directory');
  files = await bubble.list(CONTENT.SHARED_FILE_DIR, {long: true});
  console.log(files);

  console.log('>>> Reading from shared file directory...');
  let contents = await bubble.read(toFileId(CONTENT.SHARED_FILE_DIR, 'f1.txt'));
  console.log(contents);

  console.log('>>> Appending to shared file directory...');
  const f1ContentId = await bubble.append(toFileId(CONTENT.SHARED_FILE_DIR, 'f1.txt'), ' World!');

  console.log('>>> Reading from shared file directory...');
  contents = await ContentManager.read(f1ContentId, key.signFunction);
  console.log(contents);

  console.log('>>> Delete file...');
  await bubble.delete(toFileId(CONTENT.SHARED_FILE_DIR, 'f1.txt'));

  console.log('>>> list shared file directory');
  files = await bubble.list(CONTENT.SHARED_FILE_DIR, {long: true});
  console.log(files);

  
  contents = await PublicContentManager.read(new ContentId("eyJjaGFpbiI6MTM3LCJjb250cmFjdCI6IjB4MjdiOUY4M0Q3QjE4YjU2ZjNDYjU5OUFmOTBFZkIxMkQwRGRhNjU2YiIsInByb3ZpZGVyIjoiaHR0cHM6Ly92YXVsdC5idWJibGVwcm90b2NvbC5jb20vdjIvcG9seWdvbiIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ"));
  console.log(contents);
}
catch (error) {
  console.error(error.code ? `(${error.code})` : '', error.message || error);
}