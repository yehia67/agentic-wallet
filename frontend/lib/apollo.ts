// The Graph endpoint for Prompt NFT subgraph
export const GRAPH_ENDPOINT = 'https://api.studio.thegraph.com/query/17436/prompt-nft/version/latest';

// Simple GraphQL client for The Graph
export class GraphQLClient {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }
}

// Create a default client instance
export const graphqlClient = new GraphQLClient(GRAPH_ENDPOINT);

export default graphqlClient;
