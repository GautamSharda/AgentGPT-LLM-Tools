import { Tool } from "langchain/tools";
import type { ModelSettings } from "../../utils/types";
import { LLMChain } from "langchain/chains";
import { createModel, summarizeSearchSnippets } from "../../utils/prompts";
import dynamic from "next/dynamic";
//@ts-ignore

/**
 * Wrapper around ToolsAI: https://github.com/paaatrrrick/toolsAI.git
 */
export class Request extends Tool {
  // Required values for Tool
  name = "request";
  description =
    "A tool to accomplish a task on the Internet. Input should be a task that requires making a web request.";

  protected modelSettings: ModelSettings;
  protected goal: string;

  constructor(modelSettings: ModelSettings, goal: string) {
    super();

    this.modelSettings = modelSettings;
    this.goal = goal;
  }

  // /** @ignore */
  async _call(input: string) {
    const res = await this.callRequest(input);
    return res;

    // // Link means it is a snippet from a website and should not be viewed as a final answer
    // if (searchResult.answerBox && !searchResult.answerBox.link) {
    //   const answerValues: string[] = [];
    //   if (searchResult.answerBox.title) {
    //     answerValues.push(searchResult.answerBox.title);
    //   }

    //   if (searchResult.answerBox.answer) {
    //     answerValues.push(searchResult.answerBox.answer);
    //   }

    //   if (searchResult.answerBox.snippet) {
    //     answerValues.push(searchResult.answerBox.snippet);
    //   }

    //   return answerValues.join("\n");
    // }

    // if (searchResult.sportsResults?.game_spotlight) {
    //   return searchResult.sportsResults.game_spotlight;
    // }

    // if (searchResult.knowledgeGraph?.description) {
    //   // TODO: use Title description, attributes
    //   return searchResult.knowledgeGraph.description;
    // }

    // if (searchResult.organic?.[0]?.snippet) {
    //   const snippets = searchResult.organic.map((result) => result.snippet);
    //   const summary = await summarizeSnippets(
    //     this.modelSettings,
    //     this.goal,
    //     input,
    //     snippets
    //   );
    //   const resultsToLink = searchResult.organic.slice(0, 3);
    //   const links = resultsToLink.map((result) => result.link);

    //   return `${summary}\n\nLinks:\n${links
    //     .map((link) => `- ${link}`)
    //     .join("\n")}`;
    // }

    // return "No good search result found";
  }

  async callRequest(input: string) {
    console.log("TOOLS");
    console.log(input);
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
        }),
      };
      const response = await fetch('http://localhost:8080/base', requestOptions);
      const responseData = await response.text();
      console.log(responseData);
    //   if (responseData.includes("LLM-TOOLS-OAUTH-BLOGGER")){
    //     // @ts-ignore
    //     const { gapi } = dynamic(() => import("../../../node_modules/gapi-script/index"), {ssr:false});

    //     console.log("trying to open oauth window");
    //     const bloggerScope = 'https://www.googleapis.com/auth/blogger';
    //         // @ts-ignore
    //         gapi.load('client', () => {
    //           console.log('Google API client loaded.');
    //           // Initialize the API client with the credentials
    //           // @ts-ignore
    //           gapi.client.init({
    //             clientId: '704178374790-ifgbedjlnfm7cpgjrdju7n1psbmm88j8.apps.googleusercontent.com',
    //             scope: bloggerScope
    //           }).then(() => {
    //             console.log('API client initialized.');
    //             // Check if the user is already authenticated
    //             // @ts-ignore
    //             const user = gapi.auth2.getAuthInstance().currentUser.get();
    //             console.log('User:', user);
    //             const signedIn = user.hasGrantedScopes(bloggerScope);
    //             console.log('User is signed in:', signedIn);

    //             // If user is signed in, get the access token
    //             if (signedIn) {
    //               const accessToken = user.getAuthResponse().access_token();
    //               const requestOptions = {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({
    //                   prompt: input + "OAUTH Access Token: " + accessToken,
    //                 }),
    //               };
    //               fetch('http://localhost:8080/base', requestOptions).then((response) => {
    //                 res = response.text();
    //                 console.log(res);
    //               }).catch((error) => {
    //                 console.log(error);
    //               });
    //             }
    //           }).catch((error) => {
    //             console.log('API client initialization failed:', error);
    //           });
    //         });
    // }
    // if (res){
    //   console.log("res");
    //   return res;
    // }
      return responseData;
  }
}

interface SearchResult {
  answerBox?: AnswerBox;
  knowledgeGraph?: KnowledgeGraph;
  organic?: OrganicResult[];
  relatedSearches?: RelatedSearch[];
  sportsResults?: SportsResults;
}

interface AnswerBox {
  title?: string;
  answer?: string;
  snippet?: string;
  link?: string;
}

interface SportsResults {
  game_spotlight: string;
}

interface KnowledgeGraph {
  title: string;
  type: string;
  imageUrl: string;
  description: string;
  descriptionLink: string;
  attributes: object;
}

interface OrganicResult {
  title: string;
  link: string;
  snippet: string;
  attributes?: object;
}

interface RelatedSearch {
  query: string;
}

const summarizeSnippets = async (
  modelSettings: ModelSettings,
  goal: string,
  query: string,
  snippets: string[]
) => {
  const completion = await new LLMChain({
    llm: createModel(modelSettings),
    prompt: summarizeSearchSnippets,
  }).call({
    goal,
    query,
    snippets,
  });
  return completion.text as string;
};
