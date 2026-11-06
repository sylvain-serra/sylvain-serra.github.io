/**
 * LICENCE[[
 * Version: MPL 2.0/GPL 3.0/LGPL 3.0/CeCILL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 2.0 (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is kelis.fr code.
 *
 * The Initial Developer of the Original Code is
 * thibaut.arribe@kelis.fr
 *
 * Portions created by the Initial Developer are Copyright (C) 2024
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * samuel.monsarrat@kelis.fr
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 3.0 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 3.0 or later (the "LGPL"),
 * or the CeCILL Licence Version 2.1 (http://www.cecill.info),
 * in which case the provisions of the GPL, the LGPL or the CeCILL are
 * applicable instead of those above. If you wish to allow use of your version
 * of this file only under the terms of either the GPL, the LGPL or the CeCILL,
 * and not to allow others to use your version of this file under the terms of
 * the MPL, indicate your decision by deleting the provisions above and replace
 * them with the notice and other provisions required by the GPL, the LGPL or
 * the CeCILL. If you do not delete the provisions above, a recipient may use
 * your version of this file under the terms of any one of the MPL, the GPL,
 * the LGPL or the CeCILL.
 * ]]LICENCE
 */

/* =============== SCENARI ElasticSearch service ===============================
   Client-side service that is a drop-in replacement for the SCENARI-generated
   search service.
 */
scServices.scSearch = {
	config : {
		url:"", // URL of the ElasticSearch server
		path:"", // Path of de SCENARI publication
		view:"", // Processing view code
		referer:"",  // valeurs "/path/view/" ou "/path/view/index.html" ok.
		highlightTokenStart:"[ø#{",
		highlightTokenEnd:"}#ø]",
		rankScale:5
	},

	configure : (config)=>{
		scServices.scSearch.config = {
			...scServices.scSearch.config,
			...config
		};
	},

	// Not implemented
	propose : ()=>{},

	query: async (searchOpt)=>{
		const resp = await fetch(scServices.scSearch.config.url,{
			method:"POST",
			headers:{"Content-Type": "application/json"},
			body: JSON.stringify({text:searchOpt.str, path:scServices.scSearch.config.path, view:scServices.scSearch.config.view, referer:scServices.scSearch.config.referer})
		});
		const esResp = (await resp.json()).hits;
		const results = {ctrl:{}, list:[]}
		const words = {};
		const tokens = [];
		if(esResp.hits.length>0){
			const max = esResp.max_score;
			const min = esResp.hits[esResp.hits.length-1]._score;
			const step = (max-min)/scServices.scSearch.config.rankScale;
			esResp.hits.forEach(hit =>{
				const score =  step === 0 ? scServices.scSearch.config.rankScale : (hit._score-min)/step;
				let normalizedScore = Math.trunc(score)+(score-Math.trunc(score)!==0?1:0); //Si décimal arrondi up
				if(normalizedScore === 0) normalizedScore++;
				const subPath = hit._source.pgSubPath.startsWith(scServices.scSearch.config.view+"/") ? hit._source.pgSubPath.substring(scServices.scSearch.config.view.length+1) : hit._source.pgSubPath;
				if (results.ctrl[subPath]) console.warn(`Path ${subPath} already processed.`);
				results.ctrl[subPath] = normalizedScore
				results.list.push({"url":subPath, "cat":String(normalizedScore)});
				const sTokenize = function (list){
					list.forEach(hl=>{
						const token = hl.split(scServices.scSearch.config.highlightTokenStart);
						token.shift();
						for (let i = 0; i < token.length; i++) {
							const word = token[i].split(scServices.scSearch.config.highlightTokenEnd).shift();
							if (!words[word]) {
								words[word] = true;
								tokens.push({wrd: word, exact: true});
							}
						}
					});
				}
				if(hit?.highlight?.pgBody) sTokenize(hit.highlight.pgBody);
				if(hit?.highlight["pgBody.exact"]) sTokenize(hit.highlight["pgBody.exact"]);
			});
		}
		scServices.scSearch.xWriteStorage("query", searchOpt);
		scServices.scSearch.xWriteStorage("results", results);
		scServices.scSearch.xWriteStorage("tokens", tokens);
	},

	getCategories:()=>{return ["1"]},

	normalizeString:(id, str)=>{return str;},

	resetLastQuery:()=>{
		scServices.scSearch.xWriteStorage("query");
		scServices.scSearch.xWriteStorage("results");
		scServices.scSearch.xWriteStorage("tokens");
	},

	getLastQueryResults : ()=>{return scServices.scSearch.xReadStorage("results");},

	getLastSearch:()=>{return scServices.scSearch.xReadStorage("query").str;},

	buildTokens:()=>{return scServices.scSearch.xReadStorage("tokens");},

	xWriteStorage:(key, obj)=>{
		this.sessionStorage.setItem(`${scServices.scLoad.getRootUrl()}:${key}`, obj ? JSON.stringify(obj) : "");
	},

	xReadStorage:(key)=>{
		const obj = this.sessionStorage.getItem(`${scServices.scLoad.getRootUrl()}:${key}`);
		return obj ? JSON.parse(obj): null;
	}
}