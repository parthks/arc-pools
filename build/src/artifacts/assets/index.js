"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchToBundler = exports.createAsset = exports.generateTweetName = exports.selectTokenHolder = void 0;
const fs_1 = require("fs");
const warp_contracts_1 = require("warp-contracts");
const URL = 'https://gateway.redstone.finance/gateway/contracts/deploy';
let keys;
let bundlr;
let arweave;
let jwk;
// let smartweave: Warp;
let contract;
warp_contracts_1.LoggerFactory.INST.logLevel("fatal");
async function getRandomContributor() {
    const state = await contract.readState();
    return selectTokenHolder(state.state.tokens, state.state.totalSupply);
}
function selectTokenHolder(tokens, totalSupply) {
    const weights = {};
    for (const address of Object.keys(tokens)) {
        weights[address] = tokens[address] / totalSupply;
    }
    let sum = 0;
    const r = Math.random();
    for (const address of Object.keys(weights)) {
        sum += weights[address];
        if (r <= sum && weights[address] > 0) {
            return address;
        }
    }
    throw new Error("Unable to select token holder");
}
exports.selectTokenHolder = selectTokenHolder;
function truncateString(str, num) {
    if (str.length > num) {
        return str.slice(0, num) + "...";
    }
    else {
        return str;
    }
}
const generateTweetName = (tweet) => {
    if (tweet.text) {
        if (tweet.text.length > 30) {
            return 'Username: ' + tweet.user.name + ', Tweet: ' + truncateString(tweet.text, 30);
        }
        else {
            return 'Username: ' + tweet.user.name + ', Tweet: ' + tweet.text;
        }
    }
    else if (tweet.full_text) {
        if (tweet.full_text.length > 30) {
            return 'Username: ' + tweet.user.name + ', Tweet: ' + truncateString(tweet.full_text, 30);
        }
        else {
            return 'Username: ' + tweet.user.name + ', Tweet: ' + tweet.full_text;
        }
    }
    else {
        return 'Username: ' + tweet.user.name + ', Tweet Id: ' + tweet.id;
    }
};
exports.generateTweetName = generateTweetName;
const createAsset = async (bundlrIn, arweaveIn, warpIn, contractIn, content, additionalPaths, poolConfig, contentType, articleTitle) => {
    console.log(warpIn);
    keys = JSON.parse((0, fs_1.readFileSync)(poolConfig.walletPath).toString());
    jwk = keys.arweave;
    bundlr = bundlrIn;
    arweave = arweaveIn;
    // smartweave = warpIn;
    contract = contractIn;
    try {
        const data = contentType === 'application/json' ? JSON.stringify(content) : content;
        const tx = await arweave.createTransaction({
            data: data
        }, jwk);
        tx.addTag('Content-Type', contentType);
        try {
            await arweave.transactions.sign(tx, jwk);
            const assetId = tx.id;
            let uploader = await arweave.transactions.getUploader(tx);
            while (!uploader.isComplete) {
                await uploader.uploadChunk();
                console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
            }
            console.log(assetId);
            await createAtomicAsset(assetId, contentType === 'application/json' ? (0, exports.generateTweetName)(content) : articleTitle, contentType === 'application/json' ? (0, exports.generateTweetName)(content) : articleTitle, contentType === 'application/json' ? 'application/json' : 'web-page', contentType, additionalPaths, poolConfig);
        }
        catch (err) {
            throw new Error(err);
        }
    }
    catch (err) {
        throw new Error(err);
    }
};
exports.createAsset = createAsset;
async function createAtomicAsset(assetId, name, description, assetType, contentType, additionalPaths, poolConfig) {
    try {
        const dataAndTags = await createDataAndTags(assetId, name, description, assetType, contentType, additionalPaths, poolConfig);
        console.log(dataAndTags);
        const atomicId = await dispatchToBundler(dataAndTags, contentType);
        await deployToWarp(atomicId, dataAndTags, contentType);
        return atomicId;
    }
    catch (e) {
        console.log(e);
        throw new Error(e);
    }
}
async function dispatchToBundler(dataAndTags, _contentType) {
    let { data, tags } = dataAndTags;
    const tx = bundlr.createTransaction(data, { tags: tags });
    await tx.sign();
    const id = tx.id;
    const cost = await bundlr.getPrice(tx.size);
    console.log("Upload costs", bundlr.utils.unitConverter(cost).toString());
    try {
        await bundlr.fund(cost.multipliedBy(1.1).integerValue());
    }
    catch (e) {
        console.log(`Error funding bundlr, probably not enough funds in arweave wallet...\n ${e}`);
        throw new Error(e);
    }
    try {
        await tx.upload();
    }
    catch (e) {
        console.log(`Error uploading to bundlr stopping process...\n ${e}`);
        throw new Error(e);
    }
    console.log("BUNDLR ATOMIC ID", id);
    return id;
}
exports.dispatchToBundler = dispatchToBundler;
async function deployToWarp(atomicId, dataAndTags, _contentType) {
    try {
        let { data, tags } = dataAndTags;
        const tx = await arweave.createTransaction({ data });
        tags.map((t) => tx.addTag(t.name, t.value));
        await arweave.transactions.sign(tx, jwk);
        tx.id = atomicId;
        let price = await arweave.transactions.getPrice(parseInt(tx.data_size));
        console.log("Warp price: " + price);
        await fetch(URL, {
            method: 'POST',
            body: JSON.stringify({ contractTx: tx }),
            headers: {
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': "application/json",
                Accept: "application/json"
            }
        });
        console.log("ATOMIC ID", tx.id);
        return { id: atomicId };
    }
    catch (e) {
        console.log(`Error uploading to warp...\n ${e}`);
        throw new Error(e);
    }
}
async function createDataAndTags(assetId, name, description, assetType, contentType, additionalPaths, poolConfig) {
    const tokenHolder = await getRandomContributor();
    const dNow = new Date().getTime();
    let index = contentType === 'application/json' ? { path: "tweet.json" } : { path: "index.html" };
    let paths = contentType === 'application/json' ? { "tweet.json": { id: assetId } } : { "index.html": { id: assetId } };
    let aType = contentType === 'application/json' ? "Alex-Messaging" : "Alex-Webpage";
    return {
        data: JSON.stringify({
            manifest: "arweave/paths",
            version: "0.1.0",
            index: index,
            paths: paths
        }),
        tags: [
            { name: 'App-Name', value: 'SmartWeaveContract' },
            { name: 'App-Version', value: '0.3.0' },
            { name: 'Content-Type', value: "application/x.arweave-manifest+json" },
            { name: 'Contract-Src', value: poolConfig.contracts.nft.src },
            { name: 'Pool-Id', value: poolConfig.contracts.pool.id },
            { name: 'Title', value: name },
            { name: 'Description', value: description },
            { name: 'Type', value: assetType },
            { name: 'Artifact-Series', value: "Alex." },
            { name: 'Artifact-Name', value: name },
            { name: 'Initial-Owner', value: tokenHolder },
            { name: 'Date-Created', value: dNow.toString() },
            { name: 'Artifact-Type', value: aType },
            { name: 'Keywords', value: JSON.stringify(poolConfig.keywords) },
            { name: 'Media-Ids', value: JSON.stringify(additionalPaths) },
            { name: 'Implements', value: "ANS-110" },
            { name: 'Topic', value: "Topic:" + poolConfig.keywords[0] },
            {
                name: 'Init-State', value: JSON.stringify({
                    ticker: "ATOMIC-ASSET-" + assetId,
                    balances: {
                        [tokenHolder]: 1
                    },
                    contentType: contentType,
                    description: `${description}`,
                    lastTransferTimestamp: null,
                    lockTime: 0,
                    maxSupply: 1,
                    title: `Alex Artifact - ${name}`,
                    name: `Artifact - ${name}`,
                    transferable: false,
                    dateCreated: dNow.toString(),
                    owner: tokenHolder
                })
            }
        ]
    };
}
