import fs from 'fs';
import xml2js from 'xml2js';

import { IPoolClient } from 'arcframework';

import { log, logValue, sleep } from '../../helpers/utils';

const MAX_RESULTS = 10;
const ARXIV_API_URL = 'http://export.arxiv.org/api/query?max_results=' + MAX_RESULTS;

export async function processArXiv(poolClient: IPoolClient) {
	let startIndex = 0;
	let newArticles = [];
	do {
		newArticles = await fetchArticlesData(poolClient.poolConfig.keywords, startIndex);
		// to not get rate limited
		await sleep(1500);

		fs.writeFileSync('articles.json', JSON.stringify(newArticles));

		logValue(`ArXiv Page Count`, newArticles.length.toString(), 0);
		startIndex += newArticles.length;
		for (let i = 0; i < newArticles.length; i++) {
			// if (!sentList.includes(articles[i])) {
			// await processPage(poolClient, articles[i]);
			// fs.appendFileSync('data/wikiarticlessent.txt', articles[i] + '\n');
			// }
		}

		log(`ArXiv Mining Complete`, 0);
	} while (newArticles.length !== 0);

	log(`ArXiv Mining Complete`, 0);
}

/* 
Search Query Filter options
prefix	explanation
ti	Title
au	Author
abs	Abstract
co	Comment
jr	Journal Reference
cat	Subject Category
rn	Report Number
id	Id (use id_list instead)
all	All of the above
*/
async function fetchArticlesData(keywords: string[], start = 0) {
	// let total_results = MAX_RESULTS + 1;
	// for (let start = 0; start < total_results; start++) {
	console.log('Fetching results from:', start);
	const response = await fetch(ARXIV_API_URL + '&search_query=all:' + keywords.join(' ') + '&start=' + start);
	if (response.ok) {
		const xml = await response.text();
		// <opensearch:totalResults xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">29594</opensearch:totalResults>
		// const total_results = parseInt(
		// 	xml.match(
		// 		/<opensearch:totalResults xmlns:opensearch="http:\/\/a9.com\/-\/spec\/opensearch\/1.1\/">(\d+)<\/opensearch:totalResults>/
		// 	)[1]
		// );
		// console.log('Total results:', total_results);
		const newArticles = await parseXML(xml);
		return newArticles;
	} else {
		console.error('Failed to fetch:', response.status, response.statusText);
		if (response.status === 403) {
		}
		if (response.status === 429) {
			console.log('ArXiv API request limit reached');
		}
		return [];
	}
	// }
	// write to file
}

// async function run() {
// 	fetchAllPages(['quantum', 'computing']);
// }
// run();

// convert XML to json
function parseXML(xml: string): Promise<any[]> {
	return new Promise((resolve, reject) => {
		const parser = new xml2js.Parser({
			explicitArray: false,
			mergeAttrs: true,
			explicitRoot: false,
		});

		parser.parseString(xml, (err, result) => {
			if (err) {
				console.error('Failed to parse XML response', err);
				reject([]);
				return;
			}

			const articles = result.entry.map((entry) => {
				const pdfLink = entry.link.find((link) => link.title === 'pdf')?.href || '';

				return {
					id: entry.id,
					title: entry.title.trim(),
					summary: entry.summary.trim(),
					authors: Array.isArray(entry.author)
						? entry.author.map((author) => author.name.trim())
						: [entry.author.name.trim()],
					link: pdfLink,
					published: entry.published,
					updated: entry.updated,
					primary_category: entry['arxiv:primary_category'].term,
					categories: Array.isArray(entry.category) ? entry.category.map((cat) => cat.term) : [entry.category.term],
				};
			});

			resolve(articles);
		});
	});
}
