import * as fcl from "@onflow/fcl";

fcl.config({
  "app.detail.title": "FlowPilot",
  "app.detail.description": "Tell your wallet what you want. It handles the rest.",
  "app.detail.icon": "https://flowpilot.app/icon.png",
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "walletconnect.projectId": process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "e4eae52ad95da2fb47c3e1e0aa5b218c",
  "flow.network": process.env.NEXT_PUBLIC_FLOW_NETWORK ?? "testnet",
});

export { fcl };
