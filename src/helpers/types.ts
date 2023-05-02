import * as tApiV2 from "twitter-api-v2";

import Bundlr from "@bundlr-network/client";
import { Contract } from "warp-contracts";

export enum ANSTopicEnum {
	History = 'History',
	Philosophy = 'Philosophy',
	International = 'International',
	Culture = 'Culture',
	Art = 'Art',
	Music = 'Music',
    News = 'News',
	Faith = 'Faith',
    Science = 'Science',
	Spirituality = 'Spirituality',
	Sports = 'Sports',
	Business = 'Business',
	Technology = 'Technology',
	Politics = 'Politics',
	Other = 'Other',
}

export enum ArtifactEnum {
    Messaging = "Alex-Messaging",
    Webpage = "Alex-Webpage",
    Reddit = "Alex-Reddit-Thread",
    Nostr = "Alex-Nostr-Event",
    Image = "Alex-Image",
    Document = "Alex-Document",
    Ebook = "Alex-Ebook",
    Video = "Alex-Video",
    Audio = "Alex-Audio",
    File = "Alex-File"
}

export type GQLResponseType = {
    cursor: string | null
    node: {
        id: string
        tags: KeyValueType[]
        data: {
            size: string
            type: string
        }
    }
}

export interface IPoolClient {
    arClient: any;
    poolConfig: PoolConfigType;
    walletKey: string | null;
    twitterV2: tApiV2.TwitterApi;
    twitterV2Bearer: tApiV2.TwitterApi;
    bundlr: Bundlr;
    contract: Contract;
    warp: any;
    reddit: any;
}

export interface PoolType {
    id: string
    state: PoolStateType
}

export interface PoolStateType {
    title: string
    image: string
    briefDescription: string
    description: string
    link: string
    owner: string
    ownerInfo: string
    timestamp: string
    contributors: { [key: string]: string }
    tokens: { [key: string]: string }
    totalContributions: string
    totalSupply: string
    balance: string
    canEvolve: boolean
    controlPubkey: NStringType
    contribPercent: number | null
}

export type PoolConfigType = {
    appType: string,
    contracts: {
        nft: {
            id: NStringType
            src: NStringType
        },
        pool: {
            id: NStringType
            src: NStringType
        },
        poolSearchIndex: {
            id: NStringType
            src: NStringType
        }
    },
    state: {
        owner: {
            pubkey: string
            info: string
        },
        controller: {
            pubkey: NStringType
            contribPercent: number | null
        },
        title: string
        description: string
        briefDescription: string
        link: string
        rewards: string
        image: NStringType
        timestamp: NStringType
    },
    walletPath: string,
    bundlrNode: string,
    keywords: string[],
    twitterApiKeys: any,
    clarifaiApiKey: string,
    topics: string[],
    redditApiKeys: any,
    nostr: {
        keys: {
            public: string,
            private: string 
        },
        relays: NostrRelayType[]
    }
}

export type NostrRelayType = { socket: string }

export type TagFilterType = { name: string, values: string[] }

type NStringType = string | null
export type KeyValueType = { [key: string]: string }