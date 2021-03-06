import fetch from "node-fetch";
import Web3 from "web3";

// Txns
export const REQUEST_TRANSACTION = "REQUEST_TRANSACTION";
export const RECEIVE_TRANSACTION = "RECEIVE_TRANSACTION";
export const REQUEST_TRANSACTIONS_FOR_BLOCK = "REQUEST_TRANSACTIONS_FOR_BLOCK";
export const RECEIVE_TRANSACTIONS_FOR_BLOCK = "RECEIVE_TRANSACTIONS_FOR_BLOCK";

// Blocks
export const REQUEST_BLOCK = "REQUEST_BLOCK";
export const RECEIVE_BLOCK = "RECEIVE_BLOCK";
export const REQUEST_PAGE_OF_BLOCKS = "REQUEST_PAGE_OF_BLOCKS";
export const RECEIVE_PAGE_OF_BLOCKS = "RECEIVE_PAGE_OF_BLOCKS";
export const RECEIVE_BLOCK_IN_PAGE = "RECEIVE_BLOCK_IN_PAGE";

// Addresses
export const REQUEST_ADDRESS = "REQUEST_ADDRESS";
export const RECEIVE_ADDRESS = "RECEIVE_ADDRESS";
export const REQUEST_PAGE_OF_ADDRESS_TRANSACTIONS =
  "REQUEST_PAGE_OF_ADDRESS_TRANSACTIONS";
export const RECEIVE_PAGE_OF_ADDRESS_TRANSACTIONS =
  "RECEIVE_PAGE_OF_ADDRESS_TRANSACTIONS";
export const REQUEST_PAGE_OF_ADDRESSES = "REQUEST_PAGE_OF_ADDRESSES";
export const REQUEST_ADDRESS_TRACES = "REQUEST_ADDRESS_TRACES";
export const RECEIVE_ADDRESS_TRACES = "RECEIVE_ADDRESS_TRACES";
export const RECEIVE_PAGE_OF_ADDRESSES = "RECEIVE_PAGE_OF_ADDRESSES";
export const RECEIVE_ADDRESS_IN_PAGE = "RECEIVE_ADDRESS_IN_PAGE";

// Search
export const CLEAR_SEARCH_QUERY = "CLEAR_SEARCH_QUERY";
export const UPDATE_SEARCH_QUERY = "UPDATE_SEARCH_QUERY";
export const INVALID_SEARCH_QUERY = "INVALID_SEARCH_QUERY";

// Nodes
export const UPDATE_CURRENT_NODE = "UPDATE_CURRENT_NODE";

export function requestTransaction(id) {
  return {
    type: REQUEST_TRANSACTION,
    id
  };
}

export function receiveTransaction(
  id,
  transaction,
  transactionReceipt,
  transactionTrace
) {
  return {
    type: RECEIVE_TRANSACTION,
    id,
    transaction,
    transactionReceipt,
    transactionTrace
  };
}

export function fetchTransaction(id) {
  return function(dispatch, getState) {
    const { nodes } = getState();
    const web3 = new Web3(new Web3.providers.HttpProvider(nodes.current));
    dispatch(requestTransaction(id));
    return Promise.all([
      web3.eth.getTransaction(id),
      web3.eth.getTransactionReceipt(id),
      fetch(
        nodes.current,
        {
          method: "POST",
          body: JSON.stringify({
            "method":"trace_transaction",
            "params": [id],
            "id": 1,
            "jsonrpc": "2.0"
          }),
          headers: { "Content-Type": "application/json" }
        }
      ).then(res => res.json()).then(body => body.result)
    ]).then(([tx, txReceipt, txTrace]) => {
      dispatch(receiveTransaction(id, tx, txReceipt, txTrace));
    });
  };
}

export function requestTransactionsForBlock(id = "latest") {
  return {
    type: REQUEST_TRANSACTIONS_FOR_BLOCK,
    id
  };
}

export function receiveTransactionsForBlock(id, transactions) {
  return {
    type: RECEIVE_TRANSACTIONS_FOR_BLOCK,
    id,
    transactions
  };
}

export function fetchTransactionsForBlock(id = "latest") {
  return function(dispatch, getState) {
    const { nodes } = getState();
    const web3 = new Web3(new Web3.providers.HttpProvider(nodes.current));
    dispatch(requestTransactionsForBlock(id));
    return web3.eth.getBlock(id, true).then(block => {
      dispatch(receiveTransactionsForBlock(id, block.transactions));
    });
  };
}

export function fetchBlock(blockNumber) {
  return function (dispatch, getState) {
    const { nodes } = getState();
    const web3 = new Web3(new Web3.providers.HttpProvider(nodes.current));
    dispatch(requestBlock(blockNumber));
    return web3.eth.getBlock(blockNumber, true).then(block => {
      dispatch(receiveBlock(blockNumber, block));
    });
  };
}

export function requestBlock(blockNumber) {
  return {
    type: REQUEST_BLOCK,
    blockNumber
  };
}

export function receiveBlock(blockNumber, block) {
  return {
    type: RECEIVE_BLOCK,
    blockNumber,
    block
  };
}

export function fetchPageOfBlocks(pageNumber) {
  return function (dispatch, getState) {
    const { nodes } = getState();
    const web3 = new Web3(new Web3.providers.HttpProvider(nodes.current));
    return web3.eth.getBlock("latest", false).then(block => {
      const PAGE_SIZE = 5;
      const highBlockNumber = block.number - pageNumber * PAGE_SIZE;

      const pageOfBlockNumbers = Array(PAGE_SIZE)
        .fill(null)
        .map((_, i) => highBlockNumber - i);
      dispatch(requestPageOfBlocks(pageOfBlockNumbers));

      return Promise.all(
        pageOfBlockNumbers.map(blockNumber => {
          return web3.eth
            .getBlock(String(blockNumber), true)
            .then(blockInPage => {
              dispatch(receiveBlockInPage(blockNumber, blockInPage));
            });
        })
      ).then(pageOfBlocks => {
        dispatch(receivePageOfBlocks());
      });
    });
  };
}

export function requestPageOfBlocks(blockNumbers) {
  return {
    type: REQUEST_PAGE_OF_BLOCKS,
    blockNumbers
  };
}

export function receivePageOfBlocks() {
  return {
    type: RECEIVE_PAGE_OF_BLOCKS
  };
}

export function receiveBlockInPage(blockNumber, block) {
  return {
    type: RECEIVE_BLOCK_IN_PAGE,
    blockNumber,
    block
  };
}

export function fetchAddress(addressId) {
  return function (dispatch, getState) {
    const { nodes } = getState();
    const web3 = new Web3(new Web3.providers.HttpProvider(nodes.current));
    dispatch(requestAddress());
    return Promise.all([
      web3.eth.getBalance(addressId, "latest"),
      web3.eth.getCode(addressId, "latest")
    ]).then(([balance, code]) => {
      dispatch(
        receiveAddress({
          addressId,
          balance,
          code
        })
      );
    });
  };
}

export function requestAddress() {
  return {
    type: REQUEST_ADDRESS
  };
}

export function receiveAddress(address) {
  return {
    type: RECEIVE_ADDRESS,
    address
  };
}

export function requestAddressTraces() {
  return {
    type: REQUEST_ADDRESS_TRACES
  };
}

export function fetchAddressTraces(address, fromBlock, toBlock) {
  return function(dispatch, getState) {
    const { nodes } = getState();
    dispatch(requestAddressTraces());
    return fetch(nodes.current, {
      method: "POST",
      body: JSON.stringify({
        method: "trace_filter",
        params: [
          { toAddress: [address], fromBlock: "earliest", toBlock: "latest" }
        ],
        id: 1,
        jsonrpc: "2.0"
      }),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => res.json())
      .then(traces => console.log(traces));
  };
}

export function receiveAddressTraces(addressTraces) {
  return {
    type: RECEIVE_ADDRESS_TRACES,
    addressTraces
  };
}

export function fetchPageOfAddressTransactions(addressId, pageNumber) {
  const PAGE_SIZE = 5;

  return function (dispatch, getState) {
    const { nodes } = getState();
    const web3 = new Web3(new Web3.providers.HttpProvider(nodes.current));
    dispatch(requestPageOfAddressTransactions());

    return web3.eth.getBlock("latest", false).then(block => {
      let highBlockNumber = block.number - pageNumber * PAGE_SIZE;
      highBlockNumber = highBlockNumber > 0 ? highBlockNumber : PAGE_SIZE;
      let lowBlockNumber =
        highBlockNumber > PAGE_SIZE ? highBlockNumber - PAGE_SIZE : 0;

      return web3.eth
        .getPastLogs({
          fromBlock: String(lowBlockNumber),
          toBlock: String(highBlockNumber),
          address: addressId
        })
        .then(addressTransactions => {
          dispatch(receivePageOfAddressTransactions(addressTransactions));
        });
    });
  };
}

export function requestPageOfAddressTransactions() {
  return {
    type: REQUEST_PAGE_OF_ADDRESS_TRANSACTIONS
  };
}

export function receivePageOfAddressTransactions(addressTransactions) {
  return {
    type: RECEIVE_PAGE_OF_ADDRESS_TRANSACTIONS,
    addressTransactions
  };
}

export function fetchPageOfAddresses(lastAddressId, pageSize=10) {
  return function (dispatch, getState) {
    const { nodes } = getState();
    const web3 = new Web3(new Web3.providers.HttpProvider(nodes.current));

    return fetch(
      nodes.current,
      {
        method: "POST",
        body: JSON.stringify({
          "method":"parity_listAccounts",
          "params": [pageSize, lastAddressId],
          "id": 1,
          "jsonrpc": "2.0"
        }),
        headers: { "Content-Type": "application/json" }
      }
    )
    .then(res => res.json())
    .then(body => body.result)
    .then((addressIds) => {
      dispatch(requestPageOfAddresses(addressIds));
      return Promise.all(addressIds.map((addressId) => {
        return Promise.all([
          web3.eth.getBalance(addressId, "latest"),
          web3.eth.getCode(addressId, "latest"),
          web3.eth.getTransactionCount(addressId, "latest") // XXX: probably not actually ALL txs
        ]).then(([balance, code, transactionCount]) => {
          dispatch(receiveAddressInPage(addressId, {
            addressId,
            balance,
            code,
            transactionCount
          }));
        });
      }));
    }).then(() => {
      dispatch(receivePageOfAddresses());
    });
  }
}

export function requestPageOfAddresses(addressIds) {
  return {
    type: REQUEST_PAGE_OF_ADDRESSES,
    addressIds
  };
}

export function receivePageOfAddresses() {
  return {
    type: RECEIVE_PAGE_OF_ADDRESSES
  };
}

export function receiveAddressInPage(addressId, address) {
  return {
    type: RECEIVE_ADDRESS_IN_PAGE,
    addressId,
    address
  };
}

export function clearSearchQuery() {
  return {
    type: CLEAR_SEARCH_QUERY
  };
}

export function updateSearchQuery(query) {
  return {
    type: UPDATE_SEARCH_QUERY,
    query
  };
}

export function invalidSearchQuery() {
  return {
    type: INVALID_SEARCH_QUERY
  };
}

export function updateCurrentNode(nextNode) {
  return {
    type: UPDATE_CURRENT_NODE,
    nextNode
  }
}
