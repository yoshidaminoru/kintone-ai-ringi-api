const express = require('express');
const { mountPolicyChat } = require('./policy-chat');

const buildIndex = mountPolicyChat(express(), { buildingIndex: true });
buildIndex()
  .then(count => console.log(`準備した規程PDF: ${count}件`))
  .catch(error => {
    console.error('規程の事前読み取りに失敗しました。', error.message.split('\n')[0]);
    process.exitCode = 1;
  });
